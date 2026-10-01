import array
import json
import math
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills/motion-designer"
SCRIPTS = SKILL / "scripts"
TMP = Path(tempfile.mkdtemp(prefix="motion-designer-tests-"))


def run(*args, ok=True, timeout=600):
    p = subprocess.run([str(a) for a in args], capture_output=True, text=True, timeout=timeout)
    if ok and p.returncode:
        raise AssertionError(f"{' '.join(map(str, args))} exited {p.returncode}\n{p.stdout}\n{p.stderr}")
    return p


def node_eval(code):
    return run("node", "--input-type=module", "-e", code)


def find_chrome():
    if not shutil.which("node"):
        return ""
    return node_eval(f"import {{ CHROME }} from {json.dumps(str(SCRIPTS / 'cdp.mjs'))}; console.log(CHROME || '')").stdout.strip()


CHROME = find_chrome()
HAVE_FFMPEG = bool(shutil.which("ffmpeg") and shutil.which("ffprobe"))
HAVE_BROWSER = bool(CHROME) and HAVE_FFMPEG
try:
    from PIL import Image, ImageChops, ImageStat
except ImportError:
    Image = None


def new_film(name, kind="mobile"):
    folder = TMP / name
    run("bash", SCRIPTS / "new_film.sh", folder, kind)
    return folder


def check(page, *extra):
    return run("node", SCRIPTS / "check.mjs", page, *extra, ok=False)


def page_eval(page, expression):
    code = f"""
import {{ openFilm }} from {json.dumps(str(SCRIPTS / 'cdp.mjs'))};
const {{ page }} = await openFilm({json.dumps(str(page))});
try {{ console.log(JSON.stringify(await page.evaluate({json.dumps(expression)}))); }} finally {{ await page.close(); }}
"""
    return json.loads(node_eval(code).stdout.strip().splitlines()[-1])


def probe(path):
    out = run("ffprobe", "-v", "error", "-count_frames", "-show_entries",
              "stream=codec_type,codec_name,width,height,pix_fmt,nb_read_frames,duration", "-of", "json", path).stdout
    return {s["codec_type"]: s for s in json.loads(out)["streams"]}


def mean_diff(a, b):
    with Image.open(a) as x, Image.open(b) as y:
        return sum(ImageStat.Stat(ImageChops.difference(x.convert("RGB"), y.convert("RGB"))).mean) / 3


def tone(path, seconds):
    run("ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"sine=frequency=220:duration={seconds}", "-c:a", "aac", path)


BPM, OFFSET, SR, BARS = 124.0, 0.37, 22050, 24
LEVEL = {**dict.fromkeys(range(1, 9), 0.22), **dict.fromkeys(range(9, 17), 1.0),
         **dict.fromkeys(range(17, 21), 0.2), **dict.fromkeys(range(21, 25), 1.0)}


def synth_track(path, bpm=BPM):
    beat = 60 / bpm
    x = [0.0] * int((OFFSET + BARS * 4 * beat + 1.0) * SR)
    rnd = random.Random(7)

    def add(t, seconds, fn, gain):
        i0 = int(round(t * SR))
        for i in range(min(int(seconds * SR), len(x) - i0)):
            x[i0 + i] += gain * fn(i / SR)

    kick = lambda s: math.sin(2 * math.pi * (50 * s + 2 * (1 - math.exp(-30 * s)))) * math.exp(-18 * s)
    snare = lambda s: rnd.uniform(-1, 1) * math.exp(-25 * s)
    hat = lambda s: rnd.uniform(-1, 1) * math.exp(-90 * s)
    bass = lambda s: math.sin(2 * math.pi * 55 * s) * min(1.0, s * 40)
    for bar in range(1, BARS + 1):
        g = LEVEL[bar]
        for k in range(4):
            t = OFFSET + ((bar - 1) * 4 + k) * beat
            add(t, 0.25, kick, g)
            add(t, beat * 0.9, bass, 0.35 * g)
            if k in (1, 3):
                add(t, 0.2, snare, 0.5 * g)
            add(t, 0.05, hat, 0.25 * g)
            add(t + beat / 2, 0.05, hat, 0.25 * g)
    peak = max(abs(v) for v in x)
    pcm = array.array("h", (int(v / peak * 26000) for v in x))
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def wav_frames(path):
    with wave.open(str(path)) as w:
        return w.getnframes(), w.getframerate()


class Skills(unittest.TestCase):

    @staticmethod
    def frontmatter(path):
        text = path.read_text()
        head, body = text.split("---\n", 2)[1:]
        meta = {}
        for line in head.splitlines():
            key, _, value = line.partition(":")
            meta[key.strip()] = value.strip().strip('"')
        return meta, body

    def test_every_skill_has_a_name_and_a_description_within_limits(self):
        skills = sorted((ROOT / "skills").glob("*/SKILL.md"))
        self.assertEqual([p.parent.name for p in skills], ["motion-designer"])
        for path in skills:
            meta, body = self.frontmatter(path)
            self.assertEqual(meta["name"], path.parent.name)
            self.assertGreater(len(meta["description"]), 200, path)
            self.assertLessEqual(len(meta["description"]) + len(meta.get("when_to_use", "")), 1536, path)
            self.assertLess(len(body.splitlines()), 500, path)

    def test_links_between_documents_resolve(self):
        slug = lambda heading: re.sub(r"[^a-z0-9 -]", "", heading.lower()).replace(" ", "-")
        for md in [*ROOT.glob("skills/**/*.md"), ROOT / "README.md"]:
            for target, anchor in re.findall(r"\]\(([^)#\s]+)(?:#([^)]*))?\)", md.read_text()):
                if "://" in target:
                    continue
                path = md.parent / target
                self.assertTrue(path.exists(), f"{md.relative_to(ROOT)} links to missing {target}")
                if anchor:
                    headings = {slug(h) for h in re.findall(r"^#+ (.+)$", path.read_text(), re.M)}
                    self.assertIn(anchor, headings, f"{md.relative_to(ROOT)} links to missing #{anchor} in {target}")

    def test_scripts_the_skills_call_exist(self):
        named = set()
        for md in ROOT.glob("skills/**/*.md"):
            named |= set(re.findall(r"SKILL_DIR/scripts/([\w.]+)", md.read_text()))
        self.assertGreaterEqual(len(named), 10)
        for name in named:
            self.assertTrue((SCRIPTS / name).is_file(), name)

    @unittest.skipUnless(shutil.which("claude"), "needs the claude CLI")
    def test_manifest_validates(self):
        self.assertIn("Validation passed", run("claude", "plugin", "validate", ROOT, "--strict").stdout)


@unittest.skipUnless(HAVE_BROWSER, "needs Node 22+, Chrome and ffmpeg")
class Film(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.dir = new_film("film")
        cls.page = cls.dir / "src/index.html"
        tone(cls.dir / "audio/edit.m4a", 12)

    def test_new_film_lays_out_a_project(self):
        for name in ["index.html", "film.css", "assets.js", "core.js", "device.js", "scenes.js", "main.js"]:
            self.assertTrue((self.dir / "src" / name).is_file(), name)
        for name in ["audio", "out", "dist"]:
            self.assertTrue((self.dir / name).is_dir(), name)
        self.assertEqual((self.dir / ".gitignore").read_text().split(), ["out/", "audio/source/"])

    def test_new_film_never_overwrites_a_film(self):
        p = run("bash", SCRIPTS / "new_film.sh", self.dir, ok=False)
        self.assertEqual(p.returncode, 1)
        self.assertIn("not overwriting", p.stderr)

    def test_template_passes_every_check(self):
        p = check(self.page)
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertEqual(p.stdout.count("PASS"), 4, p.stdout)

    def test_video_has_every_frame_the_sound_and_the_same_picture_as_a_still(self):
        out = self.dir / "out/second.mp4"
        run("node", SCRIPTS / "render.mjs", "video", self.page, out, "--audio", self.dir / "audio/edit.m4a", "--from", 0, "--to", 1)
        s = probe(out)
        self.assertEqual((s["video"]["codec_name"], s["video"]["pix_fmt"]), ("h264", "yuv420p"))
        self.assertEqual((s["video"]["width"], s["video"]["height"], int(s["video"]["nb_read_frames"])), (1440, 1440, 60))
        self.assertAlmostEqual(float(s["audio"]["duration"]), 1.0, delta=0.05)
        if Image is None:
            self.skipTest("the picture comparison needs Pillow")
        frame = self.dir / "out/frame30.png"
        run("ffmpeg", "-v", "error", "-y", "-i", out, "-vf", r"select=eq(n\,30)", "-frames:v", 1, frame)
        run("node", SCRIPTS / "render.mjs", "stills", self.page, self.dir / "out/stills", "0.5")
        self.assertLess(mean_diff(frame, self.dir / "out/stills/t0.500.png"), 2.0)

    def test_verify_compares_a_render_with_the_film(self):
        out = self.dir / "out/part.mp4"
        run("node", SCRIPTS / "render.mjs", "video", self.page, out, "--audio", self.dir / "audio/edit.m4a", "--to", 1)
        p = run("node", SCRIPTS / "render.mjs", "verify", self.page, out, ok=False)
        self.assertEqual(p.returncode, 1, p.stdout + p.stderr)
        self.assertRegex(p.stdout, r"FAIL  frames 60 \(film \d+\)")
        self.assertIn("PASS  size 1440x1440", p.stdout)
        self.assertRegex(p.stdout, r"PASS  frame 30 matches a still of 0\.500s")
        self.assertIn("info  with audio", p.stdout)

    def test_supersampled_video_keeps_the_film_size(self):
        out = self.dir / "out/scaled.mp4"
        run("node", SCRIPTS / "render.mjs", "video", self.page, out, "--scale", 2, "--from", 0.5, "--to", 0.7)
        v = probe(out)["video"]
        self.assertEqual((v["width"], v["height"], int(v["nb_read_frames"])), (1440, 1440, 12))

    def test_a_chrome_slow_to_quit_does_not_fail_the_render(self):
        fake = TMP / "slow-chrome" / Path(CHROME).name
        fake.parent.mkdir()
        fake.write_text("""#!/bin/bash
for a; do case $a in --user-data-dir=*) profile=${a#*=};; esac; done
echo "$profile" >> "${0%/*}/profiles"
mkdir "$profile/held" && touch "$profile/held/file" && chmod 500 "$profile/held"
trap 'kill -KILL $chrome; sleep 1; chmod 700 "$profile/held"; exit' TERM
"$REAL_CHROME" "$@" & chrome=$!
wait $chrome
""")
        fake.chmod(0o755)
        p = subprocess.run(["node", str(SCRIPTS / "render.mjs"), "stills", str(self.page), str(self.dir / "out/slow"), "0.5"],
                           capture_output=True, text=True, timeout=120, env={**os.environ, "CHROME": str(fake), "REAL_CHROME": CHROME})
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertTrue((self.dir / "out/slow/t0.500.png").is_file())
        profiles = (fake.parent / "profiles").read_text().splitlines()
        self.assertTrue(profiles)
        for profile in profiles:
            self.assertFalse(Path(profile).exists(), f"left behind: {profile}")

    @unittest.skipUnless(Image, "needs Pillow")
    def test_contact_sheet(self):
        out = self.dir / "out/sheet.png"
        run("node", SCRIPTS / "render.mjs", "sheet", self.page, out, 0, 1, 0.5)
        self.assertEqual(len(list((self.dir / "out/sheet").glob("t*.png"))), 3)
        with Image.open(out) as sheet:
            self.assertEqual(sheet.size, (6 * 308, 326))

    def test_phone_sheet_shows_frames_at_phone_width_on_one_readable_page(self):
        out = self.dir / "out/phone.png"
        run("node", SCRIPTS / "render.mjs", "sheet", self.page, out, 0, 1, 0.5, "--phone")
        with Image.open(out) as sheet:
            self.assertEqual(sheet.size, (4 * 368, 360 + 26))

    def test_motion_blur_averages_subframes_the_same_in_video_and_stills(self):
        out = self.dir / "out/blur.mp4"
        run("node", SCRIPTS / "render.mjs", "video", self.page, out, "--from", 0, "--to", 0.2, "--blur", 4)
        v = probe(out)["video"]
        self.assertEqual((v["width"], v["height"], int(v["nb_read_frames"])), (1440, 1440, 12))
        frame = self.dir / "out/blur6.png"
        run("ffmpeg", "-v", "error", "-y", "-i", out, "-vf", r"select=eq(n\,6)", "-frames:v", 1, frame)
        run("node", SCRIPTS / "render.mjs", "stills", self.page, self.dir / "out/blurred", "0.1", "--blur", 4)
        self.assertLess(mean_diff(frame, self.dir / "out/blurred/t0.100.png"), 2.0)

    def test_long_contact_sheet_comes_in_pages(self):
        out = self.dir / "out/long.png"
        printed = run("node", SCRIPTS / "render.mjs", "sheet", self.page, out, 0, 2.5, 0.1).stdout.split()
        self.assertEqual([p.rsplit("/", 1)[1] for p in printed], ["long-1.png", "long-2.png"])
        with Image.open(self.dir / "out/long-1.png") as page:
            self.assertEqual(page.size, (6 * 308, 4 * 326))

    def test_single_file_is_self_contained_and_identical(self):
        dist = self.dir / "dist/film.html"
        run(sys.executable, SCRIPTS / "build_single.py", self.page, dist)
        html = dist.read_text()
        self.assertIn('src="data:audio/mp4;base64,', html)
        self.assertNotRegex(html, r'<script src=|<link rel="stylesheet"')
        p = check(self.page, "--dist", dist)
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertIn("matches the sources pixel for pixel", p.stdout)
        silent = self.dir / "dist/film-silent.html"
        run(sys.executable, SCRIPTS / "build_single.py", self.page, silent, "--no-audio")
        self.assertNotIn("data:audio", silent.read_text())
        self.assertIn('<audio id="music" src=""', silent.read_text())


@unittest.skipUnless(HAVE_BROWSER, "needs Node 22+, Chrome and ffmpeg")
class DesktopFilm(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.dir = new_film("desktop", "desktop")
        cls.page = cls.dir / "src/index.html"

    def test_passes_every_check(self):
        p = check(self.page)
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertEqual(p.stdout.count("PASS"), 4, p.stdout)

    def test_renders_a_second(self):
        out = self.dir / "out/second.mp4"
        run("node", SCRIPTS / "render.mjs", "video", self.page, out, "--from", 9.5, "--to", 10.5, "--deband")
        v = probe(out)["video"]
        self.assertEqual((v["width"], v["height"], int(v["nb_read_frames"])), (1440, 1440, 60))

    def test_the_story_reaches_every_scene(self):
        got = page_eval(self.page, """(async () => {
            const at = async (t) => { await seek(t); return [$.world.style.visibility !== "hidden", $.palette.style.visibility !== "hidden",
              $.pointer.style.visibility !== "hidden", $.desk.style.visibility !== "hidden", $.lid.style.transform]; };
            return [await at(0), await at(K.palette + 0.4), await at(K.check), await at(K.laptop + 0.8), await at(K.close + 0.2)];
        })()""")
        opening, palette, check_, laptop, closing = got
        self.assertFalse(opening[0], "the world is hidden behind the wordmark at the start")
        self.assertTrue(palette[1], "the palette is up after ⌘K")
        self.assertTrue(check_[2], "the pointer is there to tick the task")
        self.assertTrue(laptop[3], "the desktop shows on the pull-back")
        self.assertIn("rotateX", closing[4], "the lid turns while it closes")
        self.assertEqual(laptop[4], "none", "the open lid has no transform, so it stays crisp")


@unittest.skipUnless(HAVE_BROWSER, "needs Node 22+, Chrome and ffmpeg")
class AnyVideo(unittest.TestCase):

    def test_blank_template_with_every_join_and_effect_passes_every_check(self):
        p = check(new_film("blank", "blank") / "src/index.html")
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertEqual(p.stdout.count("PASS"), 4, p.stdout)

    def test_overlay_is_drawn_over_the_footage(self):
        folder = new_film("overlay", "overlay")
        page = folder / "src/index.html"
        self.assertEqual(check(page).returncode, 0)
        footage = folder / "footage.mp4"
        run("ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0x2060c0:s=640x360:r=30:d=3", "-f", "lavfi",
            "-i", "sine=f=330:d=3", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", footage)
        out = folder / "out/over.mp4"
        run("node", SCRIPTS / "render.mjs", "video", page, out, "--under", footage, "--from", 2, "--to", 2.5)
        s = probe(out)
        self.assertEqual((s["video"]["width"], s["video"]["height"], int(s["video"]["nb_read_frames"])), (1920, 1080, 30))
        self.assertIn("audio", s)
        run("node", SCRIPTS / "render.mjs", "stills", page, folder / "out/st", "2.2", "--under", footage)
        if Image is None:
            self.skipTest("the colour check needs Pillow")
        with Image.open(folder / "out/st/t2.200.png") as im:
            r, g, b = im.convert("RGB").getpixel((1800, 60))
            self.assertLess(abs(r - 32) + abs(g - 96) + abs(b - 192), 24, (r, g, b))


@unittest.skipUnless(HAVE_BROWSER, "needs Node 22+, Chrome and ffmpeg")
class StoryFilm(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.page = new_film("story", "story") / "src/index.html"

    def test_passes_the_checks(self):
        p = check(self.page)
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertEqual(p.stdout.count("PASS"), 4, p.stdout)

    def test_the_story_plays_its_parts(self):
        got = page_eval(self.page, """(async () => {
            const typed = (k) => [...Array(KIT[k].letters).keys()].filter((j) => $[k + "a" + j].style.visibility !== "hidden").length;
            await seek(0); const start = typed("h3");
            await seek(K.h3 + 1.2); const hook = [typed("h3"), KIT.h3.letters];
            await seek(B(17) + 0.4); const ticked = [0, 1, 2, 3].map((i) => $["chk" + i].style.background);
            await seek(K.out - 0.3); const end = [$.cta.style.transform, [...APP.url].every((_, i) => $["url" + i].style.visibility !== "hidden")];
            return { start, hook, ticked, end };
        })()""")
        self.assertEqual(got["start"], 0, "the first frame is empty")
        self.assertEqual(got["hook"][0], got["hook"][1], "the accent word has typed in full")
        self.assertEqual(got["ticked"][:3], ["var(--accent)"] * 3, "three tasks ticked on their beats")
        self.assertNotEqual(got["ticked"][3], "var(--accent)", "the fourth task stays open")
        self.assertIn("scale(1", got["end"][0], "the call to action is up on the end card")
        self.assertTrue(got["end"][1], "the address is typed out on the end card")

    def test_the_story_says_where_its_sounds_go(self):
        out = TMP / "story-cues.json"
        run("node", SCRIPTS / "render.mjs", "cues", self.page, out)
        film = json.loads(out.read_text())
        times = [c["t"] for c in film["cues"]]
        self.assertEqual(times, sorted(times))
        self.assertTrue(all(0 <= t < film["frames"] / film["fps"] for t in times), times)
        beat = 60 / film["bpm"]
        pops = [c["t"] for c in film["cues"] if c["sound"] == "pop"]
        for b in (15, 16, 17):
            self.assertTrue(any(abs(t - (b - 1) * beat) < 1e-3 for t in pops), f"a pop on beat {b}")
        self.assertGreaterEqual(sum(c["sound"] == "whoosh" for c in film["cues"]), 4, "a whoosh on every scene")


@unittest.skipUnless(HAVE_BROWSER, "needs Node 22+, Chrome and ffmpeg")
class BrokenFilms(unittest.TestCase):

    def broken(self, name, line, function="apply"):
        folder = new_film(name)
        scenes = folder / "src/scenes.js"
        text, n = re.subn(rf"(function {function}\([^)]*\) {{\n)", lambda m: m[1] + "  " + line + "\n", scenes.read_text(), count=1)
        self.assertEqual(n, 1)
        scenes.write_text(text)
        return check(folder / "src/index.html")

    def test_randomness(self):
        p = self.broken("random", "$.wm.style.color = `rgb(${Math.floor(Math.random() * 200)},0,0)`;")
        self.assertEqual(p.returncode, 1)
        self.assertIn("FAIL  frames are the same whatever order", p.stdout)

    def test_a_loop_seam(self):
        p = self.broken("seam", '$.wm.style.color = t > FILM.DURATION - 0.1 ? "red" : "";')
        self.assertEqual(p.returncode, 1)
        self.assertIn("FAIL  the loop closes", p.stdout)
        self.assertIn("PASS  frames are the same whatever order", p.stdout)

    def test_a_frame_that_throws(self):
        p = self.broken("throws", "if (t > 3) null.boom;")
        self.assertEqual(p.returncode, 1)
        self.assertRegex(p.stdout, r"FAIL  every 0\.05s .* first: 3\.0\ds TypeError")

    def test_a_frame_that_never_finishes_fails_instead_of_hanging(self):
        folder = new_film("endless")
        scenes = folder / "src/scenes.js"
        scenes.write_text(scenes.read_text().replace("function apply(t) {\n", "function apply(t) {\n  if (t > 0.3) for (;;) {}\n", 1))
        env = {**os.environ, "MOTION_DESIGNER_CDP_TIMEOUT": "3"}
        p = subprocess.run(["node", str(SCRIPTS / "render.mjs"), "video", str(folder / "src/index.html"), str(folder / "out/x.mp4"),
                            "--from", "0", "--to", "0.5"], capture_output=True, text=True, timeout=120, env=env)
        self.assertNotEqual(p.returncode, 0)
        self.assertIn("restarting Chrome", p.stderr)
        self.assertIn("did not answer", p.stderr)

    def test_a_css_transition(self):
        folder = new_film("transition")
        css = folder / "src/film.css"
        css.write_text(css.read_text() + "\n.card { transition: transform .3s ease; }\n")
        p = check(folder / "src/index.html")
        self.assertEqual(p.returncode, 1)
        self.assertRegex(p.stdout, r"FAIL  no clock, timer, randomness or CSS animation .*film\.css:\d+ a CSS transition")

    def test_a_film_that_cannot_build(self):
        p = self.broken("nobuild", 'stage.innerHTML = sym("gearshape@medium", 20, "red");', "build")
        self.assertEqual(p.returncode, 1)
        self.assertRegex(p.stdout, r"FAIL  .*index\.html loads and seeks: Error: no symbol gearshape@medium")


@unittest.skipUnless(HAVE_BROWSER and shutil.which("swift"), "needs macOS Swift, Chrome and ffmpeg")
class Assets(unittest.TestCase):

    def test_symbols_font_and_image_load(self):
        film = new_film("assets")
        sym = film / "assets/sym"
        run("swift", SCRIPTS / "symbols.swift", sym, "plus@semibold", "creditcard.fill@medium")
        manifest = json.loads((sym / "manifest.json").read_text())
        self.assertEqual(sorted(manifest), ["creditcard.fill@medium", "plus@semibold"])
        self.assertTrue(all(v["w"] > 0.5 and v["h"] > 0.5 for v in manifest.values()))

        fonts = sorted(Path("/System/Library/Fonts/Supplemental").glob("*.ttf")) + sorted(Path("/Library/Fonts").glob("*.ttf"))
        font_args = ["--font", f"Test Face:400={fonts[0]}"] if fonts else []
        run(sys.executable, SCRIPTS / "assets.py", film / "src/assets.js", *font_args,
            "--img", f"icon={sym / 'plus__semibold.png'}", "--sym", sym)
        got = page_eval(film / "src/index.html", """[
            [...document.fonts].some((f) => f.family.replace(/"/g, "") === "Test Face" && f.status === "loaded"),
            sym("plus@semibold", 20, "red").includes("mask:url(data:image/png;base64,"),
            Object.keys(ASSETS.sym).sort().join(),
            ASSETS.img.icon.startsWith("data:image/png;base64,"),
            (() => { try { sym("nope@bold", 20, "red"); return ""; } catch (e) { return e.message; } })(),
        ]""")
        self.assertEqual(got[1:4], [True, "creditcard.fill@medium,plus@semibold", True])
        self.assertIn("no symbol nope@bold", got[4])
        if fonts:
            self.assertTrue(got[0], "the packed font was not loaded before the first frame")
        self.assertEqual(check(film / "src/index.html").returncode, 0)

    def test_unknown_symbol_fails(self):
        p = run("swift", SCRIPTS / "symbols.swift", TMP / "nosym", "no.such.symbol@bold", ok=False)
        self.assertEqual(p.returncode, 1)
        self.assertIn("not found: no.such.symbol@bold", p.stderr)

    def test_assets_rejects_a_bad_argument(self):
        p = run(sys.executable, SCRIPTS / "assets.py", TMP / "x.js", "--img", "icon", ok=False)
        self.assertEqual(p.returncode, 2)
        self.assertIn("expected name=file", p.stderr)


class Setup(unittest.TestCase):

    def test_doctor_reports_every_tool(self):
        p = run("bash", SCRIPTS / "doctor.sh", "--json", ok=False)
        tools = {t["name"]: t for t in json.loads(p.stdout)}
        self.assertLessEqual({"node", "chrome", "ffmpeg", "ffprobe", "python3", "uv", "pillow", "chatterbox", "kokoro", "acestep"}, set(tools))
        self.assertEqual(tools["python3"]["status"], "ok")
        required_missing = [t for t in tools.values() if t["need"] == "required" and t["status"] != "ok"]
        self.assertEqual(p.returncode, 1 if required_missing else 0)
        for t in tools.values():
            self.assertEqual(bool(t["install"]), t["status"] != "ok", t)

    def test_install_has_a_command_for_every_tool(self):
        for tool in ["node", "chrome", "ffmpeg", "python3", "uv", "chatterbox", "kokoro", "acestep"]:
            p = run("bash", SCRIPTS / "install.sh", tool, "--dry-run", ok=False)
            self.assertTrue(p.stdout.startswith("+ ") or p.returncode == 1, (tool, p.stdout, p.stderr))
        self.assertIn("@puppeteer/browsers install chrome-headless-shell", run("bash", SCRIPTS / "install.sh", "chrome", "--dry-run").stdout)
        self.assertEqual(run("bash", SCRIPTS / "install.sh", "nothing", "--dry-run", ok=False).returncode, 2)

    @unittest.skipUnless(shutil.which("node"), "needs Node")
    def test_finds_chrome_for_testing_where_install_puts_it(self):
        home = TMP / "lf-home"
        binary = home / "browsers/chrome-headless-shell/mac_arm-140.0.1/chrome-headless-shell-mac-arm64/chrome-headless-shell"
        binary.parent.mkdir(parents=True)
        binary.write_text("")
        code = f"import {{ installedBrowser }} from {json.dumps(str(SCRIPTS / 'cdp.mjs'))}; console.log(installedBrowser())"
        p = subprocess.run(["node", "--input-type=module", "-e", code], capture_output=True, text=True, env={**os.environ, "MOTION_DESIGNER_HOME": str(home)})
        self.assertEqual(p.stdout.strip(), str(binary))


@unittest.skipUnless(HAVE_FFMPEG, "needs ffmpeg")
class Music(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.dir = TMP / "music"
        cls.dir.mkdir()
        cls.track = cls.dir / "track.wav"
        synth_track(cls.track)
        cls.printed = run(sys.executable, SCRIPTS / "beats.py", cls.track, "--json", cls.dir / "grid.json").stdout
        cls.grid = json.loads((cls.dir / "grid.json").read_text())

    def test_tempo(self):
        self.assertAlmostEqual(self.grid["bpm"], BPM, delta=0.005, msg=self.printed)

    def test_hears_how_busy_full_and_bright_each_bar_is(self):
        quiet = [b["hits"] for b in self.grid["bars"] if b["bar"] <= 8]
        loud = [b["hits"] for b in self.grid["bars"] if 9 <= b["bar"] <= 16]
        for hits in quiet + loud:
            self.assertTrue(0.75 <= hits <= 2, (quiet, loud))
        self.assertLess(abs(sum(quiet) / 8 - sum(loud) / 8), 0.4, "how busy a bar is does not depend on how loud it is")
        self.assertTrue(all(0 < b["fill"] < 1 and b["bright"] > 0 and b["crest"] > 0 for b in self.grid["bars"]))
        self.assertRegex(self.printed, r"sound: [\d.]+ attacks a second, [\d.]+ kHz, fill \d+%, crest \d+ dB; ")

    def test_draws_the_track_with_its_bars(self):
        sheet = self.dir / "sheet.png"
        run(sys.executable, SCRIPTS / "beats.py", self.track, "--sheet", sheet)
        size = run("ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", sheet).stdout.strip()
        self.assertEqual(size, "1600,480")

    def test_bar_one_starts_on_the_first_downbeat(self):
        self.assertAlmostEqual(self.grid["bar1"], OFFSET, delta=0.002, msg=self.printed)

    def test_drops_and_breakdowns(self):
        marks = {b["bar"]: b["mark"] for b in self.grid["bars"] if b["mark"]}
        self.assertEqual(marks, {9: "drop", 17: "breakdown", 21: "drop"}, self.printed)

    def test_cut_is_bar_exact_and_starts_on_a_downbeat(self):
        out = self.dir / "edit"
        printed = run(sys.executable, SCRIPTS / "music_edit.py", self.track, self.dir / "grid.json",
                      "--from-bar", 5, "--bars", 8, "--out", out).stdout
        frames = round(8 * 4 * 60 / self.grid["bpm"] * 60)
        self.assertIn(f"film: BEATS 32, DURATION {frames} / 60", printed)
        self.assertRegex(printed, r"track bar 9 \(drop\) → film beat 17 at 7\.74\ds")
        samples, rate = wav_frames(f"{out}.wav")
        self.assertEqual(rate, 44100)
        self.assertEqual(samples, round(frames / 60 * 44100))
        self.assertAlmostEqual(float(probe(f"{out}.m4a")["audio"]["duration"]), frames / 60, delta=0.03)

        again = run(sys.executable, SCRIPTS / "beats.py", f"{out}.wav", "--json", self.dir / "edit.json").stdout
        grid = json.loads((self.dir / "edit.json").read_text())
        bar = 4 * 60 / grid["bpm"]
        self.assertAlmostEqual(grid["bpm"], BPM, delta=0.02, msg=again)
        self.assertLess(min(grid["bar1"], bar - grid["bar1"]), 0.003, again)

    def test_tempo_between_autocorrelation_steps(self):
        track = self.dir / "track128.wav"
        synth_track(track, 128.0)
        printed = run(sys.executable, SCRIPTS / "beats.py", track).stdout
        self.assertRegex(printed, r"^128\.00\d BPM", printed)

    def test_cut_refuses_bars_past_the_end(self):
        p = run(sys.executable, SCRIPTS / "music_edit.py", self.track, self.dir / "grid.json",
                "--from-bar", 20, "--bars", 8, "--out", self.dir / "late", ok=False)
        self.assertNotEqual(p.returncode, 0)
        self.assertIn("whole bars", p.stderr)


class MusicGen(unittest.TestCase):

    def setUp(self):
        self.dir = TMP / f"music-gen-{self._testMethodName}"
        (self.dir / "audio/source").mkdir(parents=True)
        self.spec = self.dir / "music.json"
        self.spec.write_text(json.dumps({"bpm": 120, "key": "D major", "seconds": 48, "takes": {
            "pop": {"seed": 7, "caption": "Instrumental indie pop, 120 BPM, a build and a drop, no vocals"},
            "house": {"seed": 11, "caption": "Instrumental piano house, 120 BPM, no vocals"}}}))

    def gen(self, *takes, **env):
        return subprocess.run([sys.executable, SCRIPTS / "music_gen.py", self.spec, *takes], capture_output=True, text=True,
                              timeout=120, env={**os.environ, "MOTION_DESIGNER_ACESTEP_URL": "", **env})

    def test_makes_the_missing_takes_on_a_server(self):
        import http.server
        import threading
        asked, polls = [], {}

        class Ace(http.server.BaseHTTPRequestHandler):
            def log_message(self, *_):
                pass

            def reply(self, data, raw=False):
                body = data if raw else json.dumps({"data": data, "code": 200, "error": None}).encode()
                self.send_response(200)
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                if self.path == "/release_task":
                    asked.append((self.headers.get("Authorization"), body))
                    self.reply({"task_id": f"task{len(asked)}", "status": "queued"})
                else:
                    items = []
                    for task in body["task_id_list"]:
                        polls[task] = polls.get(task, 0) + 1
                        done = polls[task] > 1
                        items.append({"task_id": task, "status": int(done),
                                      "result": json.dumps([{"file": f"/v1/audio?path={task}.wav", "status": 1}]) if done else ""})
                    self.reply(items)

            def do_GET(self):
                self.reply(b"RIFF" + self.path.encode(), raw=True)

        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Ace)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        kept = self.dir / "audio/source/ace-house.wav"
        kept.write_bytes(b"made before")
        try:
            p = self.gen(MOTION_DESIGNER_ACESTEP_URL=f"http://127.0.0.1:{server.server_port}", MOTION_DESIGNER_ACESTEP_KEY="k")
        finally:
            server.shutdown()
            server.server_close()
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertEqual(len(asked), 1, "only the take that is not there yet is asked for")
        key, body = asked[0]
        self.assertEqual(key, "Bearer k")
        self.assertEqual({k: body[k] for k in ["prompt", "thinking", "bpm", "key_scale", "audio_duration", "seed", "use_random_seed", "audio_format"]},
                         {"prompt": "Instrumental indie pop, 120 BPM, a build and a drop, no vocals", "thinking": True, "bpm": 120,
                          "key_scale": "D major", "audio_duration": 48, "seed": 7, "use_random_seed": False, "audio_format": "wav"})
        self.assertTrue(body["lyrics"].startswith("[Intro]\n[Instrumental]"), body["lyrics"])
        self.assertEqual((self.dir / "audio/source/ace-pop.wav").read_bytes(), b"RIFF/v1/audio?path=task1.wav")
        self.assertEqual(kept.read_bytes(), b"made before")
        self.assertIn("house: kept", p.stdout)

    def test_says_where_ace_step_is_missing(self):
        p = self.gen("pop", MOTION_DESIGNER_ACESTEP=str(TMP / "no-ace"))
        self.assertNotEqual(p.returncode, 0)
        self.assertIn("setup_music.sh", p.stderr)

    def test_refuses_a_take_that_is_not_in_the_file(self):
        p = self.gen("techno")
        self.assertNotEqual(p.returncode, 0)
        self.assertIn("no take techno", p.stderr)

    def test_says_what_a_planned_take_will_sound_like_without_planning_it_again(self):
        sys.path.insert(0, str(SCRIPTS))
        import music_gen
        spec = json.loads(self.spec.read_text())
        cache = self.dir / "out/music"
        cache.mkdir(parents=True)
        (cache / "pop.codes").write_text("<|audio_code_1|>")
        hears = {"caption": "A light lo-fi groove with a soft kick.", "bpm": 120, "key": "D major", "vocals": False}
        (cache / "pop.about.json").write_text(json.dumps({"asked": music_gen.asked(spec, "pop"), "hears": hears}))
        p = self.gen("pop", "--plan-only", MOTION_DESIGNER_ACESTEP=str(TMP / "no-ace"))
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertIn("pop: hears 120 BPM, D major: A light lo-fi groove with a soft kick.", p.stdout)
        spec["takes"]["pop"]["seed"] = 8
        self.spec.write_text(json.dumps(spec))
        self.assertIn("setup_music.sh", self.gen("pop", "--plan-only", MOTION_DESIGNER_ACESTEP=str(TMP / "no-ace")).stderr,
                      "a changed seed plans again")


@unittest.skipUnless(HAVE_FFMPEG, "needs ffmpeg")
class Sounds(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.dir = TMP / "sfx"
        cls.dir.mkdir()
        cls.cues = cls.dir / "cues.json"
        cls.cues.write_text(json.dumps({"fps": 60, "frames": 300, "bpm": 120, "cues": [
            {"sound": "pop", "t": 1.0, "note": 2}, {"sound": "whoosh", "t": 2.0, "pan": 0.5}, {"sound": "tick", "t": 3.0},
            {"sound": "chime", "t": 3.5}]}))
        tone(cls.dir / "bed.m4a", 5)
        cls.printed = run(sys.executable, SCRIPTS / "sfx.py", cls.cues, "--key", "D major", "--music", cls.dir / "bed.m4a",
                          "--out", cls.dir / "mix").stdout

    def test_every_sound_starts_on_its_cue(self):
        frames, rate = wav_frames(self.dir / "mix-sfx.wav")
        self.assertEqual((frames, rate), (5 * 44100, 44100))
        with wave.open(str(self.dir / "mix-sfx.wav")) as w:
            x = array.array("h", w.readframes(w.getnframes()))[::2]
        first = lambda a, b: next(i for i in range(int(a * rate), int(b * rate)) if abs(x[i]) > 30) / rate
        for t in (1.0, 2.0, 3.0, 3.5):
            self.assertAlmostEqual(first(t - 0.2, t + 0.3), t, delta=0.02)
        self.assertLess(max(abs(v) for v in x[int(0.8 * rate):int(0.95 * rate)]), 30, "silence between cues")
        self.assertGreater(max(abs(v) for v in x[:int(0.3 * rate)]), 30, "the chime's tail runs on into the start, as the film loops")

    def test_mixes_the_sounds_over_the_music(self):
        self.assertIn("4 cues over 5.000s", self.printed)
        out = run("ffmpeg", "-v", "info", "-i", self.dir / "mix.wav", "-af", "ebur128=framelog=quiet", "-f", "null", "-").stderr
        lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])
        self.assertAlmostEqual(lufs, -16, delta=1.5)
        self.assertAlmostEqual(float(probe(self.dir / "mix.m4a")["audio"]["duration"]), 5, delta=0.05)

    def test_refuses_a_sound_it_does_not_have(self):
        bad = self.dir / "bad.json"
        bad.write_text(json.dumps({"fps": 60, "frames": 60, "cues": [{"sound": "kazoo", "t": 0.1}]}))
        p = run(sys.executable, SCRIPTS / "sfx.py", bad, "--out", self.dir / "bad", ok=False)
        self.assertNotEqual(p.returncode, 0)
        self.assertIn("no sound 'kazoo'", p.stderr)


@unittest.skipUnless(HAVE_FFMPEG and shutil.which("say"), "needs ffmpeg and macOS say")
class Voiceover(unittest.TestCase):

    FRAMES = 600

    @classmethod
    def setUpClass(cls):
        cls.dir = TMP / "voice"
        (cls.dir / "audio").mkdir(parents=True)
        run("ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anoisesrc=d=10:c=pink:a=0.25", "-ar", 44100, "-ac", 2,
            cls.dir / "audio/edit.wav")
        cls.printed = cls.speak("voiceover.json", [
            {"id": "n01", "start": 0.5, "voice": "narrator", "text": "This is a short test line."},
            {"id": "n02", "start": 5.0, "voice": "narrator", "text": "Saved in one tap.", "until": 7.0},
        ]).stdout

    @classmethod
    def speak(cls, name, lines, ok=True):
        spec = {"frames": cls.FRAMES, "fps": 60, "music": "audio/edit.wav", "out": "audio/voiceover-mix",
                "backend": "say", "voices": {"narrator": {}}, "lines": lines}
        (cls.dir / name).write_text(json.dumps(spec))
        return run(sys.executable, SCRIPTS / "voiceover.py", cls.dir / name, ok=ok)

    def test_lines_start_where_the_script_puts_them(self):
        self.assertRegex(self.printed, r"0\.50–\s*\d\.\d\ds  narrator  This is a short test line\.")
        self.assertRegex(self.printed, r"5\.00–\s*\d\.\d\ds  narrator  Saved in one tap\.")

    def test_mix_is_exactly_as_long_as_the_film(self):
        samples, rate = wav_frames(self.dir / "audio/voiceover-mix.wav")
        self.assertEqual((samples, rate), (round(self.FRAMES / 60 * 44100), 44100))
        self.assertTrue((self.dir / "audio/voiceover-mix.m4a").is_file())

    def test_voice_sits_well_above_the_music(self):
        above = float(re.search(r"voice (-?[\d.]+) dB above the music", self.printed)[1])
        self.assertGreater(above, 10, self.printed)

    def test_takes_are_cached_beside_the_script(self):
        self.assertLessEqual({"n01.wav", "n02.wav"}, {p.name for p in (self.dir / "out/voiceover/say").glob("*.wav")})

    def test_a_line_that_cannot_fit_stops_the_mix(self):
        p = self.speak("tight.json", [{"id": "t01", "start": 1.0, "voice": "narrator", "until": 1.6,
                                       "text": "This sentence is far too long to be spoken in half a second."}], ok=False)
        self.assertNotEqual(p.returncode, 0)
        self.assertIn("cannot fit before 1.60s", p.stderr)


TTS_PYTHON = Path(os.environ.get("MOTION_DESIGNER_TTS_PYTHON", Path.home() / ".cache/motion-designer/chatterbox/bin/python"))


@unittest.skipUnless(HAVE_FFMPEG and TTS_PYTHON.exists(), "needs ffmpeg and the Chatterbox environment (scripts/setup_tts.sh)")
class Chatterbox(unittest.TestCase):

    def test_turbo_voice_line(self):
        folder = TMP / "chatterbox"
        (folder / "audio").mkdir(parents=True)
        run("ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anoisesrc=d=6:c=pink:a=0.25", "-ar", 44100, "-ac", 2,
            folder / "audio/edit.wav")
        spec = {"frames": 360, "fps": 60, "music": "audio/edit.wav", "out": "audio/mix", "backend": "chatterbox",
                "voices": {"narrator": {"sample": "turbo", "exaggeration": 0.6, "cfg_weight": 0.4}},
                "lines": [{"id": "n01", "start": 0.8, "voice": "narrator", "text": "Every coin, in plain view."}]}
        (folder / "voiceover.json").write_text(json.dumps(spec))
        printed = run(sys.executable, SCRIPTS / "voiceover.py", folder / "voiceover.json", timeout=1800).stdout
        takes = json.loads((folder / "out/voiceover/chatterbox/takes.json").read_text())
        self.assertIn(takes["n01"]["seed"], (1, 2, 3))
        self.assertTrue((folder / "out/voiceover/chatterbox/narrator-voice.wav").is_file())
        self.assertEqual(wav_frames(folder / "audio/mix.wav"), (360 * 44100 // 60, 44100))
        self.assertGreater(float(re.search(r"voice (-?[\d.]+) dB above the music", printed)[1]), 10, printed)


KOKORO_PYTHON = Path(os.environ.get("MOTION_DESIGNER_KOKORO_PYTHON", Path.home() / ".cache/motion-designer/kokoro/bin/python"))
KOKORO_MODELS = Path(os.environ.get("MOTION_DESIGNER_KOKORO_MODELS", Path.home() / ".cache/motion-designer/kokoro/models"))


@unittest.skipUnless(HAVE_FFMPEG and KOKORO_PYTHON.exists() and (KOKORO_MODELS / "voices-v1.0.bin").exists(),
                     "needs ffmpeg and the Kokoro environment (scripts/setup_kokoro.sh)")
class Kokoro(unittest.TestCase):

    def test_preset_voices_line(self):
        folder = TMP / "kokoro"
        (folder / "audio").mkdir(parents=True)
        run("ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anoisesrc=d=6:c=pink:a=0.25", "-ar", 44100, "-ac", 2,
            folder / "audio/edit.wav")
        spec = {"frames": 360, "fps": 60, "music": "audio/edit.wav", "out": "audio/mix", "backend": "kokoro",
                "voices": {"narrator": {"kokoro": "af_heart"}, "customer": {"kokoro": "bm_george", "speed": 1.05, "lang": "en-gb"}},
                "lines": [{"id": "c01", "start": 0.4, "voice": "customer", "text": "Coffee, four fifty."},
                          {"id": "n01", "start": 2.6, "voice": "narrator", "text": "Every coin, in plain view."}]}
        (folder / "voiceover.json").write_text(json.dumps(spec))
        printed = run(sys.executable, SCRIPTS / "voiceover.py", folder / "voiceover.json", timeout=600).stdout
        self.assertIn("c01: bm_george", printed)
        self.assertIn("n01: af_heart", printed)
        self.assertEqual(sorted(p.name for p in (folder / "out/voiceover/kokoro").glob("*.wav")), ["c01.wav", "n01.wav"])
        self.assertEqual(wav_frames(folder / "audio/mix.wav"), (360 * 44100 // 60, 44100))
        self.assertGreater(float(re.search(r"voice (-?[\d.]+) dB above the music", printed)[1]), 10, printed)

def tearDownModule():
    if not os.environ.get("MOTION_DESIGNER_KEEP"):
        shutil.rmtree(TMP, ignore_errors=True)
    else:
        print(f"\nkept {TMP}")


if __name__ == "__main__":
    unittest.main()

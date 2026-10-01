import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { openFilm } from "./cdp.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  const [, value] = args.splice(i, 2);
  return value;
};
const scale = Number(flag("--scale", 1));
const audio = flag("--audio", null);
const from = Number(flag("--from", 0));
const toArg = flag("--to", null);
const crf = flag("--crf", "14");
const under = flag("--under", null);
const underFrom = Number(flag("--under-from", 0));
const deband = args.includes("--deband") ? (args.splice(args.indexOf("--deband"), 1), true) : false;
const [mode, pageArg, out, ...rest] = args;
if (!["stills", "sheet", "video", "cues", "verify"].includes(mode) || !pageArg || !out) {
  console.error("usage: render.mjs stills <page.html> <out-dir> <t1,t2,...> [--scale 2]\n" +
    "       render.mjs sheet <page.html> <out.png> <from> <to> <step>\n" +
    "       render.mjs video <page.html> <out.mp4> [--audio file] [--scale 2] [--from s] [--to s] [--crf 14] [--deband]\n" +
    "       any mode: [--under footage.mp4 [--under-from s]] draws the film with a clear background over the footage\n" +
    "       render.mjs cues <page.html> <out.json>\n" +
    "       render.mjs verify <page.html> <rendered.mp4>");
  process.exit(2);
}

const open = async () => {
  const film = await openFilm(resolve(pageArg), { scale });
  if (under) {
    await film.page.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
    await film.page.evaluate(`document.head.insertAdjacentHTML("beforeend", "<style>html,body,#stage{background:transparent!important}</style>")`);
  }
  return film;
};
let { page, info } = await open();
const shotAt = async (t) => {
  try {
    await page.evaluate(`seek(${t})`);
    return await page.screenshot();
  } catch (e) {
    console.error(`frame at ${t}s: ${e.message.split("\n")[0]}; restarting Chrome and trying again`);
    await page.close().catch(() => {});
    ({ page } = await open());
    await page.evaluate(`seek(${t})`);
    return page.screenshot();
  }
};
const fit = `scale=${info.W}:${info.H}:force_original_aspect_ratio=increase,crop=${info.W}:${info.H},setsar=1`;
const frameAt = async (t) => {
  const png = await shotAt(t);
  if (!under || mode === "video") return png;
  const r = spawnSync("ffmpeg", ["-v", "error", "-ss", String(underFrom + t), "-i", under, "-i", "pipe:0",
    "-filter_complex", `[0:v]${fit}[bg];[1:v]scale=${info.W * scale}:${info.H * scale}[fg];[bg]scale=${info.W * scale}:${info.H * scale}[bg2];[bg2][fg]overlay`, "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "pipe:1"], { input: png, maxBuffer: 1 << 28 });
  if (r.status) throw new Error(`ffmpeg could not lay the frame at ${t}s over ${under}: ${String(r.stderr).trim()}`);
  return r.stdout;
};

try {
  if (mode === "cues") {
    const cues = (await page.evaluate("window.FILM_CUES")) || [];
    writeFileSync(out, JSON.stringify({ fps: info.FPS, frames: info.frames, bpm: info.BPM, cues }, null, 1));
    console.log(`${out}: ${cues.length} cues`);
  } else if (mode === "stills") {
    mkdirSync(out, { recursive: true });
    for (const t of rest[0].split(",").map(Number)) writeFileSync(join(out, `t${t.toFixed(3)}.png`), await frameAt(t));
  } else if (mode === "sheet") {
    const [a, b, step] = rest.map(Number);
    const dir = out.replace(/\.png$/, "");
    mkdirSync(dir, { recursive: true });
    for (let t = a; t <= b + 1e-9; t += step) writeFileSync(join(dir, `t${t.toFixed(3)}.png`), await frameAt(+t.toFixed(3)));
    const sheet = [join(here, "sheet.py"), out, dir, String(info.BPM || 0)];
    if (spawnSync("uv", ["--version"]).status === 0) await run("uv", ["run", "--quiet", ...sheet]);
    else await run("python3", sheet);
  } else if (mode === "verify") {
    await verify(out);
  } else {
    const first = Math.round(from * info.FPS);
    const last = toArg === null ? info.frames : Math.min(info.frames, Math.round(Number(toArg) * info.FPS));
    const seconds = (last - first) / info.FPS;
    const down = [scale > 1 && `scale=${info.W}:${info.H}:flags=lanczos`, deband && "gradfun=1.2:16"].filter(Boolean).join(",");
    const picture = under
      ? ["-filter_complex", `[1:v]${fit},fps=${info.FPS}[bg];[0:v]${scale > 1 ? `scale=${info.W}:${info.H}:flags=lanczos` : "null"}[fg];[bg][fg]overlay=format=auto${deband ? ",gradfun=1.2:16" : ""}[v]`, "-map", "[v]"]
      : [...(down ? ["-vf", down] : []), "-map", "0:v"];
    const sound = audio ? ["-ss", String(from), "-i", audio] : [];
    const soundMap = audio ? ["-map", `${under ? 2 : 1}:a`] : under ? ["-map", "1:a?"] : [];
    const ff = spawn("ffmpeg", [
      "-y", "-loglevel", "error",
      "-f", "image2pipe", "-framerate", String(info.FPS), "-c:v", "png", "-i", "-",
      ...(under ? ["-ss", String(underFrom + from), "-i", under] : []),
      ...sound, ...picture, ...soundMap,
      ...(audio || under ? ["-c:a", "aac", "-b:a", "256k"] : []),
      "-c:v", "libx264", "-preset", "slow", "-crf", crf, "-pix_fmt", "yuv420p",
      "-profile:v", "high", "-movflags", "+faststart", "-t", String(seconds), out,
    ], { stdio: ["pipe", "inherit", "inherit"] });
    const done = new Promise((res, rej) => ff.on("exit", (c) => (c ? rej(new Error(`ffmpeg exited ${c}`)) : res())));
    const started = Date.now();
    for (let i = first; i < last; i++) {
      const png = await frameAt(i / info.FPS);
      if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
      if ((i - first) % 120 === 0) console.log(`frame ${i - first}/${last - first}  ${((Date.now() - started) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end();
    await done;
    console.log(`${out}: ${last - first} frames in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  }
  if (page.errors.length) {
    console.error("page errors:", page.errors);
    process.exitCode = 1;
  }
} finally {
  await page.close();
}

async function verify(video) {
  const probe = (args) => spawnSync("ffprobe", ["-v", "error", ...args, "-of", "json", video], { encoding: "utf8" });
  const meta = JSON.parse(probe(["-count_frames", "-show_entries", "stream=codec_type,width,height,nb_read_frames:format=duration"]).stdout);
  const v = meta.streams.find((s) => s.codec_type === "video");
  const hasAudio = meta.streams.some((s) => s.codec_type === "audio");
  const duration = Number(meta.format.duration);
  const tmp = mkdtempSync(join(tmpdir(), "motion-designer-verify-"));
  const frame = (n, path) => spawnSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-vf", `select=eq(n\\,${n})`, "-frames:v", "1", path]);
  const psnr = (a, b) => {
    const r = spawnSync("ffmpeg", ["-hide_banner", "-i", a, "-i", b, "-lavfi", `[1]scale=${v.width}:${v.height}[b];[0][b]psnr`, "-f", "null", "-"], { encoding: "utf8" });
    const m = r.stderr.match(/average:(\S+)/);
    return m ? (m[1] === "inf" ? Infinity : Number(m[1])) : NaN;
  };
  const mid = Math.floor(Number(v.nb_read_frames) / 2);
  frame(0, join(tmp, "first.png"));
  frame(Number(v.nb_read_frames) - 1, join(tmp, "last.png"));
  frame(mid, join(tmp, "mid.png"));
  writeFileSync(join(tmp, "still.png"), await frameAt(mid / info.FPS));
  const checks = [
    [Number(v.nb_read_frames) === info.frames, `frames ${v.nb_read_frames} (film ${info.frames})`],
    [v.width === info.W && v.height === info.H, `size ${v.width}x${v.height} (film ${info.W}x${info.H})`],
    [Math.abs(duration - info.frames / info.FPS) < 0.05, `duration ${duration.toFixed(3)}s (film ${(info.frames / info.FPS).toFixed(3)}s)`],
    [psnr(join(tmp, "mid.png"), join(tmp, "still.png")) > 30, `frame ${mid} matches a still of ${(mid / info.FPS).toFixed(3)}s`],
  ];
  for (const [ok, what] of checks) console.log(`${ok ? "PASS" : "FAIL"}  ${what}`);
  const loop = psnr(join(tmp, "first.png"), join(tmp, "last.png"));
  console.log(`info  ${hasAudio ? "with" : "no"} audio; first and last frame ${loop === Infinity ? "identical" : `${loop.toFixed(1)} dB apart`}`);
  rmSync(tmp, { recursive: true, force: true });
  if (checks.some(([ok]) => !ok)) process.exitCode = 1;
}

function run(cmd, argv) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, argv, { stdio: "inherit" });
    p.on("exit", (c) => (c ? rej(new Error(`${cmd} exited ${c}`)) : res()));
  });
}

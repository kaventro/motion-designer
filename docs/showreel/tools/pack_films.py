import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

film = Path(__file__).resolve().parent.parent
repo = film.parent.parent
scripts = repo / "skills/motion-designer/scripts"
BOOT = "new URLSearchParams(location.search)"


def force_render(html, name):
    assert html.count(BOOT) == 1, f"{name}: unexpected boot code"
    return html.replace(BOOT, 'new URLSearchParams("render")')


def story():
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp) / "story"
        subprocess.run(["bash", str(scripts / "new_film.sh"), str(work), "story"], check=True, capture_output=True)
        scenes = work / "src/scenes.js"
        text = scenes.read_text()
        text = text.replace("BPM: 120, BEATS: 48", "BPM: 105, BEATS: 48")
        assert "BPM: 105" in text
        scenes.write_text(text)
        out = work / "story.html"
        subprocess.run([sys.executable, str(scripts / "build_single.py"), str(work / "src/index.html"), str(out), "--no-audio"], check=True, capture_output=True)
        return out.read_text()


films = {
    "rolyn": force_render((repo / "examples/rolyn/dist/rolyn-launch-film.html").read_text(), "rolyn"),
    "story": force_render(story(), "story"),
}
dest = film / "src/films.js"
dest.write_text("window.FILMS = " + json.dumps(films) + ";\n")
print(dest, f"{dest.stat().st_size / 1e6:.2f} MB")

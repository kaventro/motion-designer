import base64
import json
from pathlib import Path

film = Path(__file__).resolve().parent.parent
frames = {p.stem: "data:image/jpeg;base64," + base64.b64encode(p.read_bytes()).decode() for p in sorted((film / "assets/img").glob("oryn_*.jpg"))}
dest = film / "src/frames.js"
dest.write_text("window.FRAMES = " + json.dumps(frames, separators=(",", ":")) + ";\n")
print(dest, f"{len(frames)} frames, {dest.stat().st_size / 1e6:.2f} MB")

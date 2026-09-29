# /// script
# dependencies = ["numpy"]
# ///
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

film = Path(__file__).resolve().parent.parent
audio = film / "audio" / "edit.wav"
beats, per = 96, 16
sr = 8000
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout
y = np.frombuffer(raw, dtype=np.float32)
beat = len(y) / beats


def rms(n):
    edges = np.linspace(0, len(y), n + 1).astype(int)
    return np.array([float(np.sqrt(np.mean(y[a:b] ** 2))) if b > a else 0.0 for a, b in zip(edges[:-1], edges[1:])])


def norm(v):
    return np.round((v / v.max()) ** 0.7, 3).tolist()


out = film / "src" / "wave.js"
out.write_text("window.WAVE = " + json.dumps(norm(rms(beats))) + ";\nwindow.WAVEF = " + json.dumps(norm(rms(beats * per))) + ";\n")
print(out, f"{out.stat().st_size / 1e3:.1f} kB")

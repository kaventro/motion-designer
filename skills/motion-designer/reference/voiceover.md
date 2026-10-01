# Voiceover

One JSON script drives everything: lines with start times, voices, the music bed and the mix. `voiceover.py` speaks every line, checks every take, fits each line into its slot, mixes it over the music and writes a track exactly as long as the film. Scripts are in `$SKILL_DIR/scripts`.

## 0. Choose the engine

Unless the user has already picked one, ask, because it decides the install and the sound:

| | Chatterbox | Kokoro |
|---|---|---|
| Sound | the most natural: intonation, pauses, some emotion | clear and pleasant, a little more even |
| Voices | one built-in voice, or a timbre taken from a 10–20 s sample, so one narrator carries every film | 54 preset voices: American and British English, plus Spanish, French, Hindi, Italian, Japanese, Portuguese and Mandarin |
| Install | about 4 GB (8 GB once a voice uses the Turbo sample) | about 0.6 GB |
| Speed | slow: three takes a line, the best one kept | fast: one take, a second or two a line |

Suggest Chatterbox for a brand narrator that should sound human and stay the same across films, Kokoro for a quick turnaround, a small machine or one of its other languages. Either way, draft the timing with `say` first. The choice is the script's `"backend"`.

## 1. Write the lines

- One idea per line, 4–12 words, in the viewer's language. It names what the screen is showing right then.
- A line starts a beat or half a beat after the action it describes (never before it) and ends before the next action. Leave at least a second between lines; speech should fill well under two thirds of the film.
- Numbers, currencies and names as they should be said: "four fifty", "twelve dollars", and a name the model misreads spelled the way it sounds.
- Words that must match text on screen get `"until"`: the line is sped up by at most 1.2× to finish by then.
- Show the lines and their times to the user before generating the final voice.

## 2. The script

`voiceover.json` in the film folder (paths are relative to it; `frames`/`fps` from `FILM_INFO`):

```json
{
  "frames": 2791, "fps": 60,
  "music": "audio/edit.wav",
  "out": "audio/voiceover-mix",
  "backend": "chatterbox",
  "voices": {
    "narrator": {"sample": "turbo", "exaggeration": 0.62, "cfg_weight": 0.35, "say": "Samantha"}
  },
  "lines": [
    {"id": "n01", "start": 1.2, "voice": "narrator", "text": "This is where your money goes."},
    {"id": "n02", "start": 9.4, "voice": "narrator", "text": "Say it, and it's saved.", "until": 11.0}
  ],
  "mix": {"music_gain": 0.26, "duck_ratio": 2.8, "lufs": -16}
}
```

A voice can carry settings for every engine, so switching `backend` changes nothing else.

Voice settings (Chatterbox): `sample` is the timbre: `"turbo"` (Chatterbox Turbo's built-in voice, cloned), a path to a clean 10–20 s WAV of a voice the user has rights to, or absent for the original model's own voice. `exaggeration` 0.5–0.7 (higher is livelier), `cfg_weight` 0.3–0.5 (lower is slower and more natural). For a second character use a different `sample`, because `"turbo"` is one voice.

Voice settings (Kokoro): `kokoro` is the voice: `af_heart`, `af_bella`, `am_michael`, `bf_emma`, `bm_george` and the rest: the first letter is the language (a American, b British English, e Spanish, f French, h Hindi, i Italian, j Japanese, p Portuguese, z Mandarin), the second f or m. `speed` 0.85–1.15; `lang` is the espeak-ng language (`en-us` by default, `en-gb` for the British voices).

## 3. Draft with `say`, then speak it for real

```bash
python3 $SKILL_DIR/scripts/voiceover.py voiceover.json --backend say   # seconds, for timing
python3 $SKILL_DIR/scripts/voiceover.py voiceover.json                 # the final, with the script's backend
```

- Chatterbox needs a one-time setup: its own Python 3.11 environment with PyTorch, about 4 GB with the weights (8 GB once a voice uses the Turbo sample), downloaded once. Ask the user first, then `bash $SKILL_DIR/scripts/install.sh chatterbox` (it needs uv; see [setup](setup.md)). An existing environment: `MOTION_DESIGNER_TTS_PYTHON=/path/bin/python`.
- Kokoro needs a smaller one-time setup: its own Python environment with kokoro-onnx and the model files, about 0.6 GB. Ask first, then `bash $SKILL_DIR/scripts/install.sh kokoro`. An existing one: `MOTION_DESIGNER_KOKORO_PYTHON=/path/bin/python`, and `MOTION_DESIGNER_KOKORO_MODELS=/dir` for `kokoro-v1.0.onnx` and `voices-v1.0.bin`.
- Chatterbox speaks each line three times; the take whose intonation moves most like speech is kept (`out/voiceover/chatterbox/takes.json` says why). Kokoro speaks a line the same way every time, so it takes one. Takes are cached in `out/voiceover/<backend>/`; delete a line's `.wav` there to speak it again, or change its text.
- Every take is checked: its length against a plain reading (0.7–1.7×), no gap over 0.7 s inside it, and it must end before its `until` or the next line. A failing line stops the run with the reason. Reword it or move it.

## 4. Mix

The mix is built in: a light voice chain (high-pass, presence, compression, de-ess), the music at `music_gain` with a dip at 2.6 kHz, ducked by the voice (`duck_ratio`), then loudness-normalised to `lufs` (−16 LUFS, −1.5 dBTP). The run ends with the balance:

```
voice 17.9 dB above the music while speaking; music between lines -7.0 dB against the voice
```

Aim for 16–20 dB while speaking and −5 to −9 dB between lines. Too much music: lower `music_gain` by 0.04 or raise `duck_ratio`; music too faint between lines: raise `music_gain`. Tell the user the two numbers when you change them.

## 5. Put it on the picture

No re-render. Mux the mix over the rendered video:

```bash
ffmpeg -y -i out/film.mp4 -i audio/voiceover-mix.m4a -map 0:v -map 1:a -c copy out/film-voiceover.mp4
```

Check with `ffprobe` that the video and audio durations match `frames / fps`.

## Rules

- Chatterbox output carries Resemble's inaudible Perth watermark; say so. Kokoro-82M is released under Apache-2.0. Clone only voices the user has the rights to; never imitate a real person without their consent.
- macOS `say` voices are for drafts: their licence is personal and non-commercial.
- Same music cut as the music-only version, so both versions share one picture.
- More in [rights](rights.md#voices).

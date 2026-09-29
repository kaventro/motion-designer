# motion-designer showreel

The skill's showreel, made with the skill and told as a job application: motion-designer is the applicant, its
pebble is the face on the CV, and every shot is a piece of work. 45 seconds, 1920 × 1080, 60 fps, cut to 128 BPM
(96 beats, 24 bars), with an original track.

[![motion-designer showreel](poster.jpg)](preview.mp4)

The first 15 seconds are a reel on their own: a hello, then six one-bar hits of craft (kinetic type, springs,
shapes that become an interface, a beat grid, one camera, a motion vocabulary). The next 15 explain what the skill
does with a real app: it reads the code and writes a brief, makes the music and finds its beat, builds every frame
from time, and checks and renders it. The drop lands at 30.0 s and opens the work: Rolyn, Oryn and the story film,
each in its own frame, taken from its own film. The last two bars are the ask, and the last frame is the first one,
so the video loops.

## Files

- [`preview.mp4`](preview.mp4) is the film at 1080p with its music and sounds. [`poster.jpg`](poster.jpg) is its title frame.
- [`brief.md`](brief.md) is the plan the shots were written from: the look, the beat map and the shot API.
- [`src/`](src/) is the film: `index.html`, `film.css`, `core.js` (the skill's engine), `kit.js` (the pebble, the
  slate, wipes, headlines), `scenes.js` (the clock and the harness), one file per shot and `main.js`.
- [`tools/`](tools/) has what makes the generated files.

## Beat map

| Bars | Time | Shot | What happens |
|---|---|---|---|
| 1–2 | 0:00 | hello | The pebble hops across "motion-designer", one syllable a beat, each landing fills its letters; the swash, "Launch films for your app.", and a slam that opens the next colour |
| 3 | 0:03.75 | type | "CUT ON THE BEAT." one word a beat, a slice through CUT, four beat pips, the full stop lands |
| 4 | 0:05.63 | springs | Nine balls ripple in and bounce on the beats with three different springs; the spring curve beside them |
| 5 | 0:07.50 | morph | One white shape: dot, switch, card, phone |
| 6 | 0:09.38 | grid | An arrangement view: clips land on the beat grid, a playhead sweeps, 128 BPM |
| 7 | 0:11.25 | wall | The camera pulls back from one knob to a wall of fifteen small interfaces, all moving on the beat |
| 8 | 0:13.13 | vocab | Four words that move the way they read: arrive, settle, snap, glide |
| 9–10 | 0:15.00 | brief | "Reads your app.": files, then a brief, approved |
| 11–12 | 0:18.75 | music | "Makes the music.": the waveform of this film's own track, its beat, the drop marked |
| 13–14 | 0:22.50 | seek | "Every frame is a function of time.": a scrubber jumps around, the picture always matches |
| 15–16 | 0:26.25 | check | "Checks every frame.": four checks, a contact sheet, the render counting to the last frame, then one line |
| **17–22** | **0:30.00** | work | **Drop.** The line opens into Rolyn, then Oryn, then the story film, each on its own two bars |
| 23–24 | 0:41.25 | ask | "Hire me." the install line, the site; the circle closes on the pebble, which sits where it started |

## Sound

The music is an original instrumental made on the same Mac with ACE-Step 1.5 (MIT). Four takes were made from four
captions ([`tools/gen_music.py`](tools/gen_music.py)); the take called `futurebass2` has a real breakdown with the
drums out and a drop, so the film uses its bars 17–40 and the drop lands on film beat 65. The track's own silence
just before the drop (29.57 to 29.72 s) is where the check shot collapses into one line. `beats.py` reads the cut
half a beat late because of the off-beat plucks, but the kick sits on the grid (checked against the low band).

The small sounds come from `cues()` in every shot, synthesized by the skill's `sfx.py` and tuned to A minor: a pop
for every syllable of the name, thuds for landings, ticks for typing, a whoosh for every wipe. The mix is at −16 LUFS.
The reel has no voiceover. The track was generated from text captions only; whether AI-generated music can be
protected differs by country, so read ACE-Step's terms again before a paid campaign.

## What is on screen

- Everything is drawn in HTML and SVG from `seek(t)`, with the skill's own engine. Inter and JetBrains Mono, both
  under the SIL Open Font License (`assets/fonts`).
- Rolyn and the story film play live inside the page, from `examples/rolyn` and the story template. Oryn is 226
  frames rendered from its own page (`tools/oryn_frames.mjs`), since its film needs its whole capture bundle.
  Rolyn's merchant logos belong to their owners; Oryn, Rolyn and Appname carry invented data.
- The waveform in the music shot is this film's own track (`tools/wave.py` writes `src/wave.js`).
- Everything the reel says about the skill is true of it: 128 BPM, 60 fps, four checks, Rolyn's 46.5 s.

## Build it again

```bash
S=../../skills/motion-designer/scripts
python3 tools/pack_films.py
node tools/oryn_frames.mjs 6.09375 226 960 82 && python3 tools/pack_frames.py
python3 $S/assets.py src/assets.js --font "Inter=assets/fonts/Inter-Variable.ttf" --font "JetBrains Mono:100 800=assets/fonts/JetBrainsMono-Variable.ttf"
node $S/check.mjs src/index.html
node $S/render.mjs cues src/index.html audio/cues.json
python3 $S/sfx.py audio/cues.json --key "A minor" --music audio/edit.wav --music-gain 0.9 --out audio/mix
tools/render_parallel.sh src/index.html motion-designer-showreel 45 audio/mix.m4a 3
python3 $S/build_single.py src/index.html dist/motion-designer-showreel.html
```

`audio/`, `out/`, `dist/`, `assets/img/`, `src/frames.js` and `src/films.js` are not in the repository; the commands
above make them. To make the track again, run `tools/gen_music.py codes` and then `tools/gen_music.py audio` with
ACE-Step's Python, analyse `audio/source/ace-futurebass2.wav` with `beats.py` and cut bars 17–40 with
`music_edit.py` into `audio/edit`.

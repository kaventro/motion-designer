# motion-designer showreel: brief

A 45 second showreel of the skill itself, told as a job application: the skill is a motion designer, its pebble
is the face on the CV, and every shot is a piece of work. 1920 × 1080, 60 fps, 128 BPM, 96 beats, 24 bars. The
last frame is the first one, so it loops.

The first 15 seconds are a complete reel on their own: a hello, then six one-bar hits of craft. The next 15 explain
how the skill works. The drop lands at 30.0 s (bar 17) and opens the work: three real films made with the skill.
The last two bars are the ask.

## Look

Tokens are in `src/film.css` and `COL` in `src/kit.js`. Fields change on bar lines by a shape that belongs to the
shot before it. Type is Inter (up to 900) and JetBrains Mono. The pebble from the site is the relay object.

| Token | Value | Use |
|---|---|---|
| violet | `#5B47F0` | the brand field: hook, work, ask |
| deep | `#1C1450` | dark violet field, phone screens |
| night | `#0D0F14` | the "how it works" act |
| paper | `#F4F1EA` | light fields |
| orange | `#E0703A` | the pebble, the accent, "now" |
| mint | `#53E0B4` | pass, success, the drop |
| lilac | `#8B7CFF` | accent on dark |
| ink | `#17150F` | type on light fields |

Type: headlines 96 to 130 px, weight 800 to 900, tracking -0.04em; labels in mono at 22 to 28 px, uppercase,
tracking 0.14em; anything that must be read is at least 26 px. A persistent slate (timecode, BPM, beat pips) is
drawn by the harness in the bottom 110 px: keep that strip clear and keep 96 px side margins.

## Beat map

Beat `n` is at `(n - 1) * 60 / 128` s; bar `b` starts at `(b - 1) * 1.875` s. In code: `BT(bar, beat)`, `BAR(bar)`.

| Bars | Time | File | id | Field | What happens | Enters by |
|---|---|---|---|---|---|---|
| 1–2 | 0.00 | `s01_hook.js` | hook | violet | The pebble hops across "motion-designer" one syllable per beat; each lands and fills its letters. The swash, "Launch films for your app.", the pebble slams down | none |
| 3 | 3.75 | `s02_type.js` | type | orange | "CUT ON THE BEAT." one word per beat, a slice through CUT, four beat pips; the full stop lands | circle from the pebble's slam |
| 4 | 5.63 | `s03_springs.js` | springs | paper | A row of balls ripples in and bounces on the beats with three different springs, a spring curve beside them | circle from the full stop |
| 5 | 7.50 | `s04_morph.js` | morph | violet | One white shape: dot, switch, card, phone, one per beat | circle from the last ball |
| 6 | 9.38 | `s05_grid.js` | grid | deep | An arrangement view: clips land on the beat grid, a playhead sweeps, 128 BPM | box from the phone screen |
| 7 | 11.25 | `s06_wall.js` | wall | paper | The camera pulls back from one tiny control to a wall of fifteen UI tiles, all moving on the beat | diagonal wipe |
| 8 | 13.13 | `s07_vocab.js` | vocab | orange, mint, paper, night | Four words that move the way they read: arrive, settle, snap, glide | circle |
| 9–10 | 15.00 | `s08_brief.js` | brief | night | "Reads your app." files, then a brief card, approved | push from the right, lilac edge |
| 11–12 | 18.75 | `s09_music.js` | music | night | "Makes the music." a waveform, the beat grid, 128.0 BPM, the drop marked | push from the right |
| 13–14 | 22.50 | `s10_seek.js` | seek | night | "Every frame is a function of time." a scrubber jumps around, the picture always matches | push from the right |
| 15–16 | 26.25 | `s11_check.js` | check | night | "Checks every frame." four checks pass, a contact sheet, the render counts to the last frame, all of it becomes one line | push from the right |
| 17–22 | 30.00 | `s12_work.js` | work | violet | **Drop.** Rolyn, Oryn and the story film, each in its window, a camera pan on bar lines | box from the centre line |
| 23–24 | 41.25 | `s13_cta.js` | cta | violet | "Hire me." the install line, one sentence about how this film was made; the last beat hands back to the first frame | circle |

Every shot is complete and clean at the moment the next one starts to enter. Nothing crosses text on its way.

## How a shot is written

One file per shot, registered with `shot({...})` (see `src/s02_type.js`, `src/kit.js` and `src/scenes.js`):

```js
shot({
  id: "springs",
  bars: [4, 5],
  bg: "var(--paper)",
  tone: "dark",
  enter: () => ({ kind: "circle", dur: 0.36, ...HAND.type }),
  build(id) { return `html of the inside of the shot, every data-k starts with ${id}_`; },
  ready(id) { measure things, set HAND.springs },
  at(t, u) { set every property from t },
  cues() { return [["thud", BT(4, 2)], ...]; },
});
```

- The harness makes `<div class="shot" data-k="id">` (absolute, 1920 × 1080, `overflow: hidden`, background `bg`),
  calls `build`, `collect`s every `data-k` into `$`, calls `ready`, then every frame calls `at(t, u)` while the shot
  is visible. `u` is `t - BAR(bars[0])`.
- The shot is visible from `enter.t0` to the moment the next shot has fully entered. `enter.t0 = BAR(bars[0]) -
  dur + 0.06`: the wipe finishes 60 ms after the bar line. Wipe kinds: `circle` (`x`, `y`, `r0`), `fromRight`,
  `fromLeft`, `fromBottom`, `fromTop`, `diag`, `box` (`l`, `t`, `r`, `b`, `rad` as insets in px). `edge: { color, w }`
  draws a line at the leading edge of a `fromRight` or `fromLeft` wipe.
- `HAND` holds where a wipe starts. A shot that hands over to the next one writes its object's place in `ready` and
  the next shot reads it in `enter`.
- Before its first moment a shot must draw its empty state (`show(el, false)` or offscreen) and every property must
  be a function of `t` alone. Use `E`, `prog`, `spring`, `track`, `pulse`, `offset`, `roller`/`roll`, `mixRect`,
  `rise`, `measure`, `headline`/`headlineAt`, `typed`, `letters`, `pebble`/`pebbleFace`/`pebbleAt`, `mixc`, `hash`.
- Sounds: `cues()` returns `[sound, t, { note, gain, pan }]` with `tick, click, pop, thud, whoosh, swish, blip,
  chime, hop`. The harness already adds a whoosh at every wipe. One sound per action that matters.

## Rules for the code

- Every frame is a pure function of `t`. No timers, no `Date`, no `Math.random` (use `hash(i)` for fixed variety),
  no CSS transitions or animations, and never write those words: `check.mjs` greps for them.
- No comments and no docstrings. No em-dashes or arrows in any text, on screen or off.
- Round the resting position of type (`Math.round`); keep fractions for motion.
- Show a layer at the same `t` its motion starts. Clamp `spring()` where overshoot would uncover something.
- Text is never crossed by anything moving. Each line that must be read is up and still for 0.5 s plus 0.33 s a word.
- Motion from shapes: no crossfades between scenes, blur-ins, glow, glass, 3D flips or particles. Inside an object
  a fade is fine. Hard offset shadows (`8px 8px 0`) are welcome on light fields; no soft glows.
- Real things only: numbers and names on screen are true of this skill (128 BPM, 60 fps, four checks, seven styles,
  Rolyn, Oryn). Data in UI mockups is invented.
- Shots use inline styles or the classes in `film.css` and keep their helpers in their own file, prefixed with the
  shot's name.

## Checking a shot

```bash
S=../../skills/motion-designer/scripts
node $S/render.mjs sheet src/index.html out/qa/springs.png 5.6 7.6 0.1
node $S/render.mjs stills src/index.html out/qa/st 6.2,6.9 --scale 1
```

Open the PNG and look at every tile: flashes, overlaps, cut text, things popping, the first and the
last frame of the shot, the frames each side of every beat. Run from `docs/showreel`. Printed "page errors" are bugs.

## The shots

### springs (bar 4, paper)

Enter: circle from `HAND.type`, 0.36 s. Nine balls, diameter 120, centres at x = 240 + 180 i, resting on a 3 px ink
ground line at y = 760 (centre y = 700), colours violet, orange, ink, mint repeating. Headline "Springs, not *tweens.*"
top left (size 92, ink, accent violet).

- 5.69 to 6.05: the balls drop in from above the frame, left to right, 0.055 s apart, and land with a squash
  (scaleX 1.25, scaleY 0.72 at the ground, decaying with `offset`).
- B14, B15, B16 (`BT(4, 2..4)`): every ball hops 190 px, the wave running left to right with 0.03 s between balls.
  Each beat uses a different spring for its landing squash: damping 0.42, 0.68, 0.92 (response 0.5). The difference
  must be visible: the first rings four or five times, the last does not ring.
- Top right: a curve card 420 × 240 (paper white, hard shadow) draws the step response of the current beat's spring
  as a polyline sampled from `spring()`, with a dot travelling along it, and the mono label "DAMPING 0.42" rolling to
  0.68 and 0.92.
- End: on the last beat the other eight balls shrink to nothing right to left; ball 8 (violet, centre x 1680, y 700)
  stays. Set `HAND.springs = { x: 1680, y: 700, r0: 60 }`. At the moment `morph` enters (BAR(5) - 0.34) it is still
  a clean 120 px ball.

### morph (bar 5, violet)

Enter: circle from `HAND.springs`, dur 0.4. One white shape, centred at (960, 540), morphs on each beat with
`mixRect` and `E.snappy` in 0.34 s, starting at `BT(5, 1..4)`:

1. dot 200 × 200; 2. switch 420 × 230 (radius 115): a 170 px knob slides right and the fill turns mint;
3. card 640 × 420 (radius 44): an avatar circle, two text bars and a check pill draw in, the pill in orange;
4. phone 380 × 760 (radius 64), a deep (`#1C1450`) screen 332 × 712 (radius 44) inside it and a notch pill, the
   screen holds three lilac bars growing. The screen's rect at the end is `HAND.morph` (insets l 794, t 184, r 794,
   b 184, rad 44) and must match it exactly; `grid` opens from it.

Content of the previous form leaves by scaling into the new one, never by crossfade across the stage. A mono label
bottom left at y 900 rolls "01 DOT", "02 SWITCH", "03 CARD", "04 SCREEN" (28 px, white 70%). A 12 px orange dot
travels along the outline of each form once (a "relay" object). The headline "Shapes become *windows.*" sits top
left (size 92, white, accent orange) and stays for the whole bar.

### grid (bar 6, deep)

Enter: box from `HAND.morph`, dur 0.45. An arrangement view. Track labels (mono, 24 px, white 60%) KICK, BASS,
KEYS, LEAD at x 96; four lanes 120 px tall at y = 300, 440, 580, 720 from x 240 to 1824 (16 beats wide, 99 px a
beat). Thin grid line at every beat, brighter at every fourth, and every line pulses on its beat. Big "128" (size
200, weight 900, white) top left at y 90 with the mono word BPM beside it, rolling in with `rise`.

- Ten clips (radius 16, 1 to 4 beats wide, mint, orange, lilac, white) land on grid lines, one or two per beat
  from BAR(6) + 0.5: each drops 70 px with a squash and settles exactly on its line and lane. Each holds a mini
  waveform (thin bars) drawn from `hash`.
- An orange playhead line 6 px wide sweeps the lanes linearly from x 240 at BAR(6) + 0.45 to x 1824 at BAR(7).
- Top right: mono "BAR 06 / 24" and a beat counter that steps.
- End: every clip sits on a line, the playhead is at the right edge.

### wall (bar 7, paper)

Enter: `diag`, dur 0.42. Fifteen tiles in five columns and three rows, each 300 × 190, gap 26 (the wall is
1604 × 622, centred). Tiles are white with an 8 px hard offset shadow (ink at 14%) and a radius of 26. Each holds
one micro interface that advances on the beat with its own phase: a toggle flipping, a ring counting, bars
growing, a checklist ticking, a counter rolling, a slider, a line drawing, avatars, stars filling, a heat grid,
a progress bar, chat bubbles, equaliser bars, a switch group, and the pebble blinking in the middle tile. Labels in
tiles are mono, at least 22 px.

The camera starts at scale 9 on a small part of one tile (a knob, a dot) and pulls back to scale 1 with `E.smooth`
over 1.35 s, from BAR(7) + 0.06 to BAR(7) + 1.4; then it drifts 1.5%. The wall wrapper is one element with a
transform. Text in tiles is only judged at the end of the pull-back. Headline "One *camera.*" (size 96) sits top
left at y 96 only after the pull-back, rising in, above the wall (the wall is centred lower: shift it down 60 px if
needed).

### brief, music, seek, check (bars 9 to 16, night)

The Midnight look: night field, text `#F2F4F8`, secondary `#A3ABBA`, tertiary `#6B7384`, cards `#151922` with a
1 px border of white at 8%, radius 28, accent lilac `#8B7CFF`, success mint, now-orange. Each shot enters by
`fromRight`, dur 0.5, `edge: { color: "#8B7CFF", w: 8 }`, and is two bars (3.75 s). Each has a headline at the left
(x 96, y 170, size 118, weight 800, two or three lines, one accent word in lilac with its stroke) that rises in
from the wipe's end, and a right-hand stage 900 to 1000 px wide with the doing. Mono captions are 26 px. Every
number and name is true of the skill.

**brief** (bars 9 to 10): "Reads / your *app.*" and under it, in mono, "screens, tokens, fonts, icons, copy".
Right: a card titled REPO with five rows that rise one per 0.16 s from BAR(9) + 0.5: `Theme.swift`, `Views/Home.swift`,
`Fonts/Manrope.ttf`, `Assets.xcassets`, `Strings.swift`, each with a small tag chip at the right (colors, screens,
type, icons, copy). At BT(9, 5) the rows flow into the card: the title changes to BRIEF and five fields type in, one
a beat: `Product  Rolyn`, `Style  Meadow`, `Film  iOS, 46 s, 129 BPM`, `Music  original, made here`, `Voice  none`.
At BT(10, 3) a mint APPROVE button (pill, 64 px tall) presses, the card border turns mint and a check draws.
Under the card, in mono, "Nothing is built until you say so." The card slides out to the left, `E.in`, from
BT(10, 4) + 0.1 as `music` pushes in.

**music** (bars 11 to 12): "Makes / the *music.*" and in mono "original, on your Mac". Right: a waveform panel
1000 × 560: 96 thin bars (one per beat of the film, 8 px wide, rounded) whose heights follow the film's energy
(quiet bars 1 to 8, building 9 to 16, high 17 to 22, falling 23 to 24; take it from `hash` for the texture and
from `window.WAVE` if it exists: an array of 96 values 0..1). Bars draw left to right as a lilac playhead sweeps
across the panel from BAR(11) + 0.5 to BAR(12) + 1.4; the bar grid (every fourth bar line brighter) is under it.
Mono labels pop as it passes: "128.0 BPM" at the left (a `roller`), "bar 1" at the first line, and at bar 17 a
mint marker "drop" with a `thud` cue. Under the panel, mono: "ACE-Step, local, about 3 minutes a take".

**seek** (bars 13 to 14): "Every frame / is a function / of *time.*" Right: on top a big mono `seek(t)` (size 96,
white) and, under it, a timeline card 940 × 130 with a scrubber handle that jumps: t = 12.40 s, then 41.60 s, then
3.20 s, then 27.80 s, one jump a beat from BAR(13) + 0.6, each with a spring and a mono readout `t = 41.60 s`
(a `roller`). Under it a preview frame 560 × 315 (a mini scene drawn as a pure function of that t: a ball on a
ground line whose x and squash come from t, a bar chart growing, the timecode) that snaps to the state at each
jump. At BT(14, 3) the last two jumps go back and forth quickly and two thumbnails 270 × 152 appear side by side,
labelled "forward" and "backward", identical, with a mint check between them and the mono line "same pixels, any
order".

**check** (bars 15 to 16): "Checks / every *frame.*" then, under it once the checks are done, "Renders it."
Right: four check rows (mono, 30 px) tick one per beat from BAR(15) + 0.5, each with a mint check that draws:
"no clocks, timers or randomness", "no page errors on any frame", "the loop closes", "same frame in any order".
At BT(16, 1) the rows compress into a contact sheet of 16 × 9 tiny frames (each a small gradient in the reel's
colours) that a mint sweep scans, one tile turning mint-outlined after another, then at BT(16, 2) the sheet
becomes a progress bar with a counter rolling "frame 0" to "2,700 / 2,700" (60 fps, so 2,700 frames) with `roller`
digits, finishing at BT(16, 4). At BT(16, 4) + 0.1 the bar and everything else collapse into one lilac vertical
line at the stage centre (x 956 to 964, full height, growing from the bar), which is where `work` opens from at the
drop.

### vocab, work, cta

Written without a spec; see `src/s07_vocab.js`, `src/s12_work.js`, `src/s13_cta.js`.

## Sound

An original track made on this Mac (ACE-Step 1.5), cut to 24 bars so that its drop lands on bar 17. The small
sounds come from `cues()` through `sfx.py`. The reel has no voiceover.

## Sources and rights

Inter and JetBrains Mono, SIL Open Font License (`assets/fonts`). The pebble is the skill's own character. The
films in the work section are `examples/rolyn`, `examples/oryn` and the story template, all in this repository;
their music is not used, this reel has its own track.

## What changed while building

- **brief**: the fields say what is true of Rolyn (46.5 s, "Digital Clouds, Mixkit", "English, Chatterbox") instead of
  "original, none". The fields type in as a cascade, not one per beat.
- **music**: the waveform is this film's own track (`window.WAVE`, made by `tools/wave.py`), the drop marker lands
  exactly on 20.625 s, the beat where the sweep reaches bar 17.
- **seek**: the jumps start on the downbeat of bar 13 and the forward and backward comparison comes two beats
  earlier, so "same pixels, any order" can be read before `check` pushes in.
- **check**: the ticks start on beat 1 of bar 15 and the collapse into the line starts on beat 4 of bar 16, so the
  line is whole before `work` starts to open from it at 29.72 s.
- **springs and morph**: the balls fall in as the first beat and a single ball jumps on the last one; the shapes
  change in triplets. `morph` ends with its screen exactly on `HAND.morph`.
- **grid and wall**: clips land two or three to an eighth note; the wall's headline starts before the pull-back ends.
  `vocab` opens from the pebble's tile in the wall (`HAND.wall`).
- **work**: the film frames have square corners (a rounded clip over a changing image antialiased differently
  depending on what had been drawn before, which the check catches), Oryn shows its camera push-in, the story
  window starts on its beat 12 so its wipe and three checks land on the reel's beats. It opens from `HAND.check`.
- New: a small pebble accompanies bars 9 to 16 (`s11b_badge.js`).

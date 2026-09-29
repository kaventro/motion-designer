# motion-designer

A Claude Code skill that makes launch films for apps. It rebuilds your app's real interface in HTML, puts it
in an iPhone or in a window on a laptop, times every move to the music, checks the film frame by frame and
renders it to video.

[![The motion-designer launch film](docs/launch-film/poster.jpg)](docs/launch-film/preview.mp4)

This is the skill's own launch film, made with the skill in one Claude Code session. The music was generated
on the same Mac with ACE-Step and the voice with Chatterbox. [How it was made](docs/launch-film).

All the films and how it works are also on the site: [designer.ostinos.com](https://designer.ostinos.com).

## Examples

| | | |
|:---:|:---:|:---:|
| [![Rolyn](examples/rolyn/poster.jpg)](examples/rolyn/preview.mp4) | [![Oryn](examples/oryn/poster.jpg)](examples/oryn/preview.mp4) | [![Story](examples/story/poster.jpg)](examples/story/preview.mp4) |
| [Rolyn](examples/rolyn): iOS, personal finance | [Oryn](examples/oryn): desktop file manager | [Story](examples/story): a story ad with a character |

Click a poster to watch with sound. Each folder has the film's beat map and how it was made. Rolyn and Oryn
carry their sources; the story film is the demo in the story template.

Also in the folder: [Oryn showreel](examples/oryn-reel), a 60 s cut created with the motion-designer skill in a Claude Code session.

## Install

As a skill, where the command is `/motion-designer`:

```bash
npx skills add kaventro/motion-designer
```

As a Claude Code plugin from this repository's marketplace. Plugin commands carry the plugin's name, so there
the command is `/motion-designer:motion-designer`:

```
/plugin marketplace add kaventro/motion-designer
/plugin install motion-designer@motion-designer
```

From a clone you can link the skill folder instead:
`ln -s "$PWD/skills/motion-designer" ~/.claude/skills/motion-designer`.

On the first run it looks for Node 22+, Chrome, ffmpeg, Python 3 and uv, tells you what is missing and why, and
installs only what you agree to. Chrome comes as Chrome for Testing and needs no admin rights. The voice and
music models are installed only when you want a voiceover or an original track.

## Use it

Open your app's repository, type `/motion-designer` and say what you need:

- "Make a 30-second launch film of this iOS app for our website."
- "We launch the desktop app next week. Make a film of the real UI, with the transfer finishing on the drop."
- "Make a 30-second story ad: the problem, our app, three features, and a sign-up button at the end."
- "Here's the track. Cut it so the drop lands when the dashboard appears."
- "Add an English voiceover and captions."

It starts in plan mode. It works out the product's name, reads what the app does and writes a brief with the
materials, the look and the story scene by scene. Nothing is built until you approve it. Besides a product
film in its device it can make a story in panels with your character, feature cards, a type-led film or a
short sting.

The skill has four parts and opens each one only when a film needs it:

| Part | What it does |
|---|---|
| film | materials, a beat map and four stills for approval, the build, QA and the render |
| music | decides what the film should sound like; makes an original track with ACE-Step (here or on a GPU machine) and hears it before using it, or takes yours; finds the tempo, the downbeat, the drops and how busy and full each bar is; cuts to the bar and the frame; puts small synthesized sounds on the actions |
| voiceover | puts lines on the timeline in a local voice: Chatterbox, the most natural, or Kokoro with 54 preset voices, and `say` for drafts; mixes them at −16 LUFS with the music ducked under the voice |
| setup | checks what the tools need and installs it, asking first |

## How it works

A film is one web page, and every frame is a function of time, `seek(t)`. There are no timers and no random
numbers, so any frame can be rendered on its own, a render is exact to the frame and the film loops cleanly.

Screens are rebuilt in HTML from the app's code and screenshots. A mobile app stays inside the iPhone for the
whole film. A desktop app stays in its window, and the pointer moves only when it shows something. For Tauri,
Electron and web apps the real frontend can be captured instead, which is how [Oryn](examples/oryn) was made.

`beats.py` fits the tempo through the attack of every beat and finds bar one and the drops. `music_edit.py`
cuts whole bars, exact to the frame. `check.mjs` looks for clocks, timers, random numbers and CSS animation in
the code, seeks every 0.05 s looking for errors, and checks that the loop closes and that a frame looks the same
however you get to it. Contact sheets are then reviewed against a written list of common mistakes.

The render drives headless Chrome over the DevTools protocol into ffmpeg: H.264, supersampled 2×, with optional
debanding. You also get a muted loop, a poster and one self-contained HTML file.

## Styles

There are seven [styles](skills/motion-designer/reference/styles.md), each with its own canvas, type, accent,
motion, camera and one signature move: Brand-native, Meadow (Rolyn), Warm ink (Oryn), Midnight (the skill's own
film), Field guide, Paper and ink, and Color block.

## What's inside

```
skills/motion-designer/
  SKILL.md       the film workflow, the rules, and where each part lives
  reference/     brief, film types, styles, motion, phone, desktop, capture, qa, rights, music, voiceover, setup
  templates/     the shared engine and the mobile, desktop and story starter films
  scripts/       doctor, install, new_film, render, check, beats, music_edit, music_gen, sfx, voiceover, assets, symbols, build_single
.claude-plugin/  plugin.json and marketplace.json, so this repository is also the plugin
tests/           end-to-end tests of every script and template
evals/           behaviour evals for claude plugin eval
examples/        Rolyn, Oryn, a story film and the skill-made Oryn showreel
docs/launch-film the skill's own film
site/            the site, published to designer.ostinos.com by .github/workflows/pages.yml
```

## Requirements

`bash skills/motion-designer/scripts/doctor.sh` shows what this machine has. `install.sh <tool>` next to it
installs one thing the usual way for the system: Homebrew on macOS, the package manager on Linux, WSL2 on
Windows.

| For | Needs |
|---|---|
| films, checks, renders | Node 22+, Chrome, Chromium or Chrome for Testing (`install.sh chrome`, no admin rights, or `CHROME=/path`), ffmpeg |
| music, voiceover, single file | Python 3.9+ with the standard library |
| contact sheets | Pillow, which uv fetches on first use |
| SF Symbols | Swift, on macOS |
| original music | ACE-Step 1.5 (`install.sh acestep`, about 11 GB), or an ACE-Step server on a GPU machine (`MOTION_DESIGNER_ACESTEP_URL`) |
| voiceover | macOS `say` for drafts; Chatterbox (`install.sh chatterbox`, about 4 GB, 8 GB with the Turbo sample) or Kokoro (`install.sh kokoro`, about 0.6 GB), each in its own environment |

`MOTION_DESIGNER_HOME`, `~/.cache/motion-designer` by default, holds Chrome for Testing, the Chatterbox and
Kokoro environments and ACE-Step.

## Music

The repository has no music files. When you don't bring a track, the skill makes an original one for the film
with ACE-Step 1.5 (MIT) from a caption and a seed, and synthesizes the small sounds on a film's actions. The
example videos carry their soundtracks as the licences allow, and each example says which track it uses and
where to get it. There is also a list of [places to get music you may use](skills/motion-designer/reference/music-sources.md)
and what their licences allow.

## Tests

```bash
python3 tests/test_plugin.py -v
claude plugin eval . --runs 1 --allow-tools Bash Write Edit --scaffold
```

The tests build and check every template, render video with sound and compare it with stills, recover a
synthetic track's tempo, downbeat and sections, cut and mix audio, pack fonts and SF Symbols, prove that
single-file builds match their sources, and make sure the checks catch random numbers, loop seams, CSS
transitions, broken frames and a frame that never finishes. Tools a machine doesn't have are skipped, with the
reason.

## License

MIT for the skill, the templates and the example films' code. Rolyn and Oryn are real apps by the author;
Appname in the story film is made up. Brand logos in the Rolyn example belong to their owners. Music: "Digital
Clouds" by Alejandro Magaña (Mixkit License) in Rolyn, "Ethereal Pulse" by Surf House Productions (CC BY 4.0) in
Oryn, and original ACE-Step tracks in the story film and the skill's own film. Voices made with Chatterbox carry
Resemble AI's inaudible watermark.

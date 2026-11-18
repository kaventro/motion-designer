# DESIGN.md — site/ (static HTML)

Applies only to `site/` (`index.html`, `site.css`, `site.js`), the page at [designer.ostinos.com](https://designer.ostinos.com). Not the Claude plugin, skill, templates, or films (`skills/`, `docs/`, `examples/`). Those have their own motion and style rules. Do not pull React, Tailwind, or a bundler in to use a component library.

## Stack

Plain HTML/CSS/JS. No build. GitHub Pages copies the three files (`.github/workflows/pages.yml`). Tokens live in `:root` in `site/site.css` — use them; do not invent a parallel palette.

## Tokens that exist (`site/site.css`)

| Token | Value | Use |
|---|---|---|
| `--field` | `#5B47F0` | Hero canvas, `theme-color` |
| `--field-ink` | `#1C1450` | Type and icons on white buttons |
| `--bg` / `--bg2` / `--card` | `#0D0F14` / `#121620` / `#151922` | Page, deeper, cards |
| `--ink` / `--ink2` / `--ink3` | `#F2F4F8` / `#A3ABBA` / `#6B7384` | Body, secondary, labels |
| `--hair` / `--hair2` | white 8% / 14% | Hairlines |
| `--violet` | `#8B7CFF` | Inline `code`, step numbers, `.acc` |
| `--mint` | `#53E0B4` | License / ok notes, copy-done |
| `--orange` | `#E0703A` | Pebble, star icon, list dots |
| `--cc` | `#D77757` | Declared; unused on the page today |
| `--sans` | Inter, system-ui | Body, headings |
| `--mono` | JetBrains Mono | Nav, labels, terminal, meta |
| `--script` | Great Vibes | Wordmark (`.name`) and footer sign only |
| `--gutter` | `clamp(16px, 4vw, 56px)` | Page inset |
| `--wide` | `1240px` | Content max |
| `color-scheme` | `dark` | Dark-only; no light theme |

There are no `--space-*`, `--radius-*`, or `--duration-*` variables. Match nearby literals: gaps 8/12/16/24, section padding `clamp(72px, 11vw, 140px)`, pills `border-radius: 999px`, cards 20–24px, inner 10–16px. Body is `400 16px/1.55 var(--sans)`.

Type: labels 12px mono uppercase; h2 `650 clamp(34px, 4.6vw, 62px)/1.04` with `-0.035em`; lede 17px `--ink2`; buttons 15px/600. Do not add a fourth font family. Fonts load from Google Fonts (SIL OFL) in `index.html`.

Icons: the inline SVGs already in `index.html` (star, play, close). Same stroke/fill language. No emoji as icons. The `⏺` in `.term` is Claude Code chrome in a mock, not a site icon.

## What to use

- Own CSS variables above. A new colour, size, or duration gets a `:root` variable first.
- Motion recipes: [transitions.dev](https://transitions.dev) ships HTML/CSS (custom licence: free use, no redistribution; some items Pro/paid). Port the CSS into `site.css`; do not vendor the library.
- Inspiration only: [styles.refero.design](https://styles.refero.design), [cta.gallery](https://cta.gallery), [footer.design](https://footer.design).
- Paid shader/3D packs (Scroll Shaders, Scrolltide, HorizonX) only with owner approval, and only on a marketing hero with a static image fallback. The pebble in `site.js` is the existing character; do not replace it with a WebGL hero.

React kits (Aceternity, Astryx, ObsidianUI, affectUI, BoardUI) do not apply.

## Anti-slop (hard)

- No purple/blue **gradient** heroes, gradient text, glow blobs, or extra glass. The hero is solid `--field`. Existing `backdrop-filter` is only the frosted nav, `.btn-glass`, film tags, player backdrop, and cursor label — do not spread it.
- One accent role per token (table above). Do not reassign `--mint` to buttons or `--violet` to body text.
- No filler copy. Say what the skill does, as `index.html` already does.
- Body contrast ≥ 4.5:1 (WCAG 2.2 AA), including 12px labels. Prefer `--ink` / `--ink2` on `--bg`/`--card`. Existing `.label` uses `--ink3` (~4:1 on `--bg` at 12px); new copy at that size should use `--ink2` or better.
- Spacing: 4/8 px multiples. Two or three radius roles (pill, card, inner).
- Pages readable without JS (content is in HTML). JS is for the pebble, custom cursor, magnets, dialog player, copy, star count. Videos: keep `poster` plus an accessible name; size with `aspect-ratio` (or width/height).
- Do not add a light theme unless asked. Do not restyle this page like a film (`skills/motion-designer/reference/styles.md` is for films).

## Motion (this site)

Purposeful, short, on transform/opacity (and the existing clip-path / stroke-dash intro). Easing already in use: `cubic-bezier(0.2, 0.8, 0.2, 1)` in CSS; JS follows with `1 - Math.exp(-dt / tau)` in `site.js`.

| Kind | Duration | Where |
|---|---|---|
| UI hover/focus | 200–350 ms | `.nav a`, `.btn`, `.copy`, cursor ring |
| Tiny state | ~80–200 ms | beat dots, cursor dot |
| One-shot hero | 0.9–1.75 s, delayed | `.hi`, `.name-text`, `.swash`, `.bio`, `.cta` — already there; do not stack more entrance theater |
| Media hover | 0.8 s scale | `.film video` |
| Scroll reveal | view-timeline `appear` | gated by `@supports (animation-timeline: view())` |

- **Always** honour `prefers-reduced-motion`. CSS already snaps animation/transition to ~0 (`site.css`). JS already sets `reduce` from `matchMedia` and skips the custom cursor, magnetic buttons, loop autoplay (hover-to-play instead), and the pebble’s hop, drop, and idle sway. Gaze and blink still run. New motion must take the same `reduce` path.
- Custom cursor and magnets: fine pointer and not-reduced only (`hover: hover` and `pointer: fine`).
- Pebble idle is tied to 128 BPM (`BEAT` in `site.js`) — keep it on the beat; do not add a second clock.
- Do not add GSAP, Framer Motion, Lenis, scroll-jacking, looping decorative CSS, or random particles.
- New transitions: 150–300 ms on transform/opacity unless matching an existing recipe above.

## Review checklist (before “done”)

- [ ] Dark, wide and 375 px wide (there is no light theme).
- [ ] No new anti-slop hits (grep: `linear-gradient(` on text/hero, extra `backdrop-filter`, emoji as icons). Film scrims and the pebble SVG gradients already in the page are allowed.
- [ ] Keyboard: `:focus-visible` on `.btn` / `.copy`; Tab order nav → hero CTAs → films → install. Do not `outline: none` without a replacement.
- [ ] `prefers-reduced-motion: reduce`: no cursor-hide, no magnets, no looping autoplay, no pebble hop/drop/sway (gaze and blink still run), hero already drawn.
- [ ] Lighthouse accessibility ≥ 95 for the public page.
- [ ] Copied snippet: source URL + licence in a comment.

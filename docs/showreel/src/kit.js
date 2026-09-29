const COL = {
  violet: "#5B47F0", deep: "#1C1450", night: "#0D0F14", night2: "#151922", paper: "#F4F1EA", ink: "#17150F",
  orange: "#E0703A", mint: "#53E0B4", lilac: "#8B7CFF", coral: "#FF6B5E", white: "#FFFFFF",
};

const BAR = (n) => (n - 1) * 4 * FILM.P;
const BT = (bar, beat = 1) => BAR(bar) + (beat - 1) * FILM.P;

const rgb = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mixc = (a, b, p) => {
  const x = rgb(a), y = rgb(b);
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp(p)))).join(",")})`;
};
const bump = (x) => (x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0);
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const px = (v) => v.toFixed(2) + "px";
const letters = (key, text, style = "") => [...text].map((ch, i) => `<span class="t" data-k="${key}${i}" style="${style}">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
const offset = (t, t0, amp, rate = 9, freq = 26) => {
  const d = t - t0;
  if (d < 0) return 0;
  const ramp = Math.min(1, d / 0.05);
  return amp * ramp * Math.exp(-rate * d) * Math.cos(freq * d);
};

const PB = { body: "M100 18 C156 18 186 64 186 116 C186 170 150 202 100 202 C50 202 14 170 14 116 C14 64 44 18 100 18Z", CX: 100, CY: 114, RX: 86, RY: 90, YAW: 0.56, DOWN: 0.4, anchorY: 0.916, aspect: 214 / 228 };
const f2 = (v) => v.toFixed(2);

function pbProject(fx, fy, yaw, pitch) {
  const z = Math.sqrt(Math.max(0, 1 - fx * fx - fy * fy));
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const y1 = fy * cp + z * sp, z1 = -fy * sp + z * cp;
  const x2 = fx * cy + z1 * sy, z2 = -fx * sy + z1 * cy;
  return { x: PB.CX + PB.RX * x2, y: PB.CY + PB.RY * y1, nx: x2, ny: y1, nz: z2 };
}

function pbSurface(p) {
  const at = `translate(${f2(p.x)} ${f2(p.y)})`;
  if (Math.hypot(p.nx, p.ny) < 1e-4) return at;
  const th = (Math.atan2(p.ny, p.nx) * 180) / Math.PI;
  return `${at} rotate(${f2(th)}) scale(${Math.max(0.08, p.nz).toFixed(3)} 1) rotate(${f2(-th)})`;
}

function pbMouth(happy, wide) {
  if (wide > 0.35) {
    const w = 6 + 4 * wide, o = 4 + 10 * wide;
    return `M${f2(-w)} 0 a${f2(w)} ${f2(o)} 0 1 0 ${f2(2 * w)} 0 a${f2(w)} ${f2(o)} 0 1 0 ${f2(-2 * w)} 0Z`;
  }
  const c = 9 + 12 * happy, half = 13 + 4 * happy;
  return `M${f2(-half)} 0 Q0 ${f2(c)} ${f2(half)} 0 Q0 ${f2(c * 0.42)} ${f2(-half)} 0Z`;
}

const pbEye = (id, side) => `<g data-k="${id}_eye${side}"><g data-k="${id}_open${side}"><ellipse rx="15" ry="19" fill="url(#${id}e)"/>
<g clip-path="url(#${id}k)"><g data-k="${id}_pupil${side}"><circle r="8.2" fill="#15110F"/><circle cx="-2.7" cy="-3.1" r="2.5" fill="#fff"/></g></g></g>
<path data-k="${id}_lid${side}" d="M-13 1 Q0 9 13 1" fill="none" stroke="#1A1210" stroke-width="3.4" stroke-linecap="round" opacity="0"/></g>`;

function pebble(id, w, shadowColor = "#150A4E") {
  const h = w * PB.aspect;
  return `<div class="abs" data-k="${id}" style="left:0;top:0;width:${w}px;height:${h.toFixed(2)}px;transform-origin:0 0"><svg viewBox="-14 6 228 214" width="100%" height="100%" style="overflow:visible">
<defs>
<radialGradient id="${id}b" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#F8A56B"/><stop offset=".42" stop-color="#E3733C"/><stop offset=".82" stop-color="#C85520"/><stop offset="1" stop-color="#AE451A"/></radialGradient>
<radialGradient id="${id}r" cx=".88" cy=".92" r=".62"><stop offset="0" stop-color="#B3A8FF" stop-opacity=".8"/><stop offset=".5" stop-color="#8B7CFF" stop-opacity=".22"/><stop offset="1" stop-color="#8B7CFF" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#4A1604" stop-opacity="0"/><stop offset="1" stop-color="#4A1604" stop-opacity=".34"/></linearGradient>
<radialGradient id="${id}e" cx=".5" cy=".62" r=".62"><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#E4DDF3"/></radialGradient>
<clipPath id="${id}c"><path d="${PB.body}"/></clipPath>
<clipPath id="${id}k"><ellipse rx="15" ry="19"/></clipPath>
<filter id="${id}s" x="-60%" y="-200%" width="220%" height="500%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="${id}h" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="${id}m" x="-80%" y="-120%" width="260%" height="340%"><feGaussianBlur stdDeviation="4"/></filter>
</defs>
<ellipse data-k="${id}_shadow" cx="100" cy="206" rx="66" ry="9" fill="${shadowColor}" opacity=".5" filter="url(#${id}s)"/>
<g data-k="${id}_body">
<path d="${PB.body}" fill="url(#${id}b)"/>
<g clip-path="url(#${id}c)">
<rect x="0" y="10" width="200" height="200" fill="url(#${id}o)"/>
<rect x="0" y="10" width="200" height="200" fill="url(#${id}r)"/>
<ellipse data-k="${id}_cheekL" rx="14" ry="8" fill="#FF6A5C" filter="url(#${id}m)"/>
<ellipse data-k="${id}_cheekR" rx="14" ry="8" fill="#FF6A5C" filter="url(#${id}m)"/>
${pbEye(id, "L")}${pbEye(id, "R")}
<path data-k="${id}_mouth" fill="#1A1210"/>
</g>
<path d="M58 40 C70 30 88 26 104 27" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="10" stroke-linecap="round" filter="url(#${id}h)"/>
</g>
</svg></div>`;
}

function pebbleFace(id, s = {}) {
  const g = (n) => $[`${id}_${n}`];
  const { yaw = 0, pitch = 0, eyaw = yaw, epitch = pitch, happy = 0.4, wide = 0, blink = 0, sq = 0, lean = 0, lift = 0, shadow = 1 } = s;
  const open = Math.max(0.06, 1 - blink) * (1 - 0.14 * happy) * (1 + 0.2 * wide);
  const gx = clamp((eyaw - yaw) / 0.28 + (eyaw / PB.YAW) * 0.5, -1, 1) * 5.5;
  const gy = clamp((epitch - pitch) / 0.24 + (epitch / PB.DOWN) * 0.5, -1, 1) * 6.5;
  g("eyeL").setAttribute("transform", pbSurface(pbProject(-0.302, -0.111, yaw, pitch)));
  g("eyeR").setAttribute("transform", pbSurface(pbProject(0.302, -0.111, yaw, pitch)));
  const lens = `scale(${f2(1 + 0.12 * wide)} ${open.toFixed(3)})`;
  g("openL").setAttribute("transform", lens);
  g("openR").setAttribute("transform", lens);
  const gaze = `translate(${f2(gx)} ${f2(gy)}) scale(${f2(1 + 0.1 * happy)})`;
  g("pupilL").setAttribute("transform", gaze);
  g("pupilR").setAttribute("transform", gaze);
  const lid = clamp((0.4 - open) / 0.3, 0, 1).toFixed(2);
  g("lidL").setAttribute("opacity", lid);
  g("lidR").setAttribute("opacity", lid);
  g("mouth").setAttribute("transform", pbSurface(pbProject(0, 0.356, yaw, pitch)));
  g("mouth").setAttribute("d", pbMouth(happy, wide));
  g("cheekL").setAttribute("transform", pbSurface(pbProject(-0.47, 0.2, yaw, pitch)));
  g("cheekR").setAttribute("transform", pbSurface(pbProject(0.47, 0.2, yaw, pitch)));
  const blush = (0.16 + 0.34 * happy).toFixed(3);
  g("cheekL").setAttribute("opacity", blush);
  g("cheekR").setAttribute("opacity", blush);
  g("body").setAttribute("transform", `translate(100 202) rotate(${f2(lean)}) translate(0 ${f2(-lift)}) scale(${(1 - 0.5 * sq).toFixed(4)} ${(1 + sq).toFixed(4)}) translate(-100 -202)`);
  const k = clamp(1 - lift / 260, 0.35, 1);
  g("shadow").setAttribute("transform", `translate(100 206) scale(${(k * (1 - 0.7 * sq)).toFixed(3)} ${k.toFixed(3)}) translate(-100 -206)`);
  g("shadow").setAttribute("opacity", (0.5 * k * shadow).toFixed(3));
}

function pebbleAt(id, x, y, s = 1) {
  const el = $[id], w = parseFloat(el.style.width), h = parseFloat(el.style.height);
  setT(el, `translate(${(x - (w / 2) * s).toFixed(2)}px,${(y - h * PB.anchorY * s).toFixed(2)}px) scale(${s.toFixed(4)})`);
}

const blinkAt = (t, times, dur = 0.17) => times.reduce((m, t0) => Math.max(m, bump((t - t0) / dur)), 0);

function clipFor(kind, p, o = {}) {
  if (p >= 1) return "none";
  const q = Math.max(0, p);
  switch (kind) {
    case "circle": {
      const R = Math.hypot(Math.max(o.x, FILM.W - o.x), Math.max(o.y, FILM.H - o.y));
      const r0 = o.r0 || 0;
      return `circle(${(r0 + (R - r0) * q).toFixed(2)}px at ${o.x}px ${o.y}px)`;
    }
    case "fromRight": return `inset(0 0 0 ${((1 - q) * 100).toFixed(3)}%)`;
    case "fromLeft": return `inset(0 ${((1 - q) * 100).toFixed(3)}% 0 0)`;
    case "fromBottom": return `inset(${((1 - q) * 100).toFixed(3)}% 0 0 0)`;
    case "fromTop": return `inset(0 0 ${((1 - q) * 100).toFixed(3)}% 0)`;
    case "diag": {
      const s = 26, a = (1 - q) * (100 + s);
      return `polygon(${a.toFixed(3)}% 0, 100% 0, 100% 100%, ${(a - s).toFixed(3)}% 100%)`;
    }
    case "box": return `inset(${(o.t * (1 - q)).toFixed(2)}px ${(o.r * (1 - q)).toFixed(2)}px ${(o.b * (1 - q)).toFixed(2)}px ${(o.l * (1 - q)).toFixed(2)}px round ${(o.rad * (1 - q)).toFixed(2)}px)`;
    default: return "none";
  }
}

const toneRgb = (v) => `${Math.round(lerp(255, 23, v))},${Math.round(lerp(255, 21, v))},${Math.round(lerp(255, 15, v))}`;

function hudMarkup() {
  return `<div class="abs" data-k="hud" style="left:0;top:0;width:${FILM.W}px;height:${FILM.H}px">
    <div class="abs row" data-k="slate" style="left:96px;top:${FILM.H - 76}px;height:28px;gap:14px">
      <i data-k="rec" style="display:block;width:9px;height:9px;border-radius:50%;background:var(--coral)"></i>
      <span class="label" data-k="tc" style="font-size:18px;font-weight:500;letter-spacing:0.08em;width:170px">00:00:00:00</span>
      <span class="label" data-k="bpm" style="font-size:18px;letter-spacing:0.12em">128 BPM</span>
      <span class="row" style="gap:8px;margin-left:6px">${[0, 1, 2, 3].map((i) => `<i data-k="pip${i}" style="display:block;width:9px;height:9px;border-radius:50%"></i>`).join("")}</span>
    </div>
    <div class="abs label" data-k="hudR" style="right:96px;top:${FILM.H - 76}px;height:28px;line-height:28px;font-size:18px;letter-spacing:0.12em">motion-designer</div>
  </div>`;
}

function hudAt(t, tone, rec = 1) {
  const c = toneRgb(clamp(tone));
  const f = Math.floor(t * FILM.FPS + 1e-6) % FILM.frames;
  const ff = f % FILM.FPS, ss = Math.floor(f / FILM.FPS) % 60, mm = Math.floor(f / (FILM.FPS * 60)) % 60;
  const tc = `00:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
  if ($.tc.textContent !== tc) $.tc.textContent = tc;
  const beat = (t % FILM.DURATION) / FILM.P + 1e-6, bi = Math.floor(beat) % 4, ph = beat - Math.floor(beat);
  $.tc.style.color = `rgba(${c},0.62)`;
  $.bpm.style.color = `rgba(${c},0.62)`;
  $.hudR.style.color = `rgba(${c},0.62)`;
  $.rec.style.opacity = rec.toFixed(3);
  for (let i = 0; i < 4; i++) {
    const on = i === bi ? Math.exp(-ph * 4.5) : 0;
    $["pip" + i].style.background = `rgba(${c},${(0.28 + 0.72 * on).toFixed(3)})`;
    setT($["pip" + i], `scale(${(1 + 0.55 * on).toFixed(3)})`);
  }
}

const SHOTS = [];
function shot(def) {
  SHOTS.push(def);
  return def;
}

const HAND = {
  hook: { x: 1650, y: 460, r0: 0 },
  type: { x: 1596, y: 744, r0: 28 },
  springs: { x: 1728, y: 640, r0: 60 },
  morph: { l: 794, t: 184, r: 794, b: 184, rad: 44 },
  wall: { x: 953, y: 624, r0: 46 },
  check: { l: 956, t: 0, r: 956, b: 0, rad: 0 },
  grid: { x: 1824, y: 289, r0: 11 },
  work: { x: 700, y: 494, r0: 0 },
};

const HL = {};
function headline(key, text, { size = 112, weight = 800, color = "#fff", accent = COL.lilac, lh = 1.06, track = "-0.04em", align = "left" } = {}) {
  const h = (HL[key] = { words: 0, marks: [] });
  const lines = text.split("\n").map((line) => {
    const words = line.split(/(\*[^*]+\*)/).filter(Boolean).flatMap((part) => {
      const acc = part.startsWith("*");
      return (acc ? part.slice(1, -1) : part).split(" ").filter(Boolean).map((w) => ({ w, acc }));
    });
    const html = words.map(({ w, acc }) => {
      const i = h.words++;
      const inner = `<span class="mask" style="display:block;padding-bottom:${(size * 0.18).toFixed(1)}px;margin-bottom:${(-size * 0.18).toFixed(1)}px"><span class="t" data-k="${key}w${i}" style="font-weight:${weight};color:${acc ? accent : color}">${w}</span></span>`;
      if (!acc) return `<span style="display:block">${inner}</span>`;
      const width = measure(w, size, weight, `letter-spacing:${track}`);
      h.marks.push({ i, width });
      return `<span style="position:relative;display:block">${inner}<svg class="abs" style="left:0;top:${(size * 1.02).toFixed(1)}px;overflow:visible" width="${width.toFixed(1)}" height="${(size * 0.16).toFixed(1)}"><path data-k="${key}u${i}" d="M3 ${(size * 0.09).toFixed(1)} Q${(width * 0.45).toFixed(1)} ${(size * 0.01).toFixed(1)} ${(width - 3).toFixed(1)} ${(size * 0.07).toFixed(1)}" fill="none" stroke="${accent}" stroke-width="${(size * 0.038).toFixed(2)}" stroke-linecap="round"/></svg></span>`;
    }).join("");
    return `<div class="row" style="height:${(size * lh).toFixed(1)}px;gap:${(size * 0.24).toFixed(1)}px;align-items:flex-start;white-space:nowrap;${align === "center" ? "justify-content:center" : ""}">${html}</div>`;
  });
  return `<div data-k="${key}" style="font-size:${size}px;letter-spacing:${track}">${lines.join("")}</div>`;
}

function headlineAt(key, t, t0, out = Infinity, stagger = 0.07) {
  const h = HL[key], leave = prog(t, out, 0.3, E.in);
  for (let i = 0; i < h.words; i++) {
    const p = clamp(spring(t, t0 + i * stagger, 0.42, 0.9), 0, 1.04);
    setT($[`${key}w${i}`], `translateY(${(((1 - p) + leave) * 135).toFixed(2)}%)`);
  }
  const done = t0 + h.words * stagger + 0.2;
  h.marks.forEach(({ i, width }) => {
    const path = $[`${key}u${i}`], len = width * 1.05 + 6;
    path.style.strokeDasharray = `${len.toFixed(1)} ${len.toFixed(1)}`;
    path.style.strokeDashoffset = (len * (1 - prog(t, done, 0.35, E.out) + leave)).toFixed(2);
  });
  return done;
}

function typed(el, text, t, t0, cps = 30) {
  const n = clamp(Math.floor((t - t0) * cps), 0, text.length);
  const s = text.slice(0, n);
  if (el.textContent !== s) el.textContent = s;
  return n;
}

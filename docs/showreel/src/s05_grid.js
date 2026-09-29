const GRID = {
  x0: 240, step: 99, top: 300, pitch: 140, lh: 120, inset: 12, ch: 96, fall: 0.2, drop: 70, lineTop: 292, lineH: 556,
  names: ["KICK", "BASS", "KEYS", "LEAD"],
  colors: ["#FFFFFF", "#8B7CFF", "#53E0B4", "#E0703A"],
  clips: [[0, 0, 4, 0], [1, 2, 2, 0], [2, 0, 3, 0], [0, 4, 4, 1], [3, 5, 1, 1], [1, 8, 3, 2], [2, 9, 4, 2], [3, 11, 3, 2], [0, 12, 4, 3], [1, 13, 3, 3]],
  K: null,
};

function gridClock() {
  const P = FILM.P, b = BAR(6);
  return {
    build: b - 0.075, ph0: b + 0.45, ph1: BAR(7),
    land: [BT(6, 2), BT(6, 2) + P / 2, BT(6, 3), BT(6, 3) + P / 2],
    beats: [b + 0.185, BT(6, 2), BT(6, 3), BT(6, 4)],
  };
}

function gridWave(lane, b0, w, h) {
  const n = Math.floor((w - 14) / 6), lead = (w - (n * 6 - 3)) / 2, wave = window.WAVE;
  let d = "";
  for (let i = 0; i < n; i++) {
    const x = lead + i * 6, pos = b0 + (x + 1.5) / GRID.step, fb = Math.floor(pos), ph = pos - fb, half = (ph * 2) % 1;
    const energy = wave && wave.length > 20 + fb ? 0.62 + 0.38 * wave[20 + fb] : 0.8 + 0.2 * hash(fb + 3.3);
    const r = hash(lane * 977 + b0 * 131 + i * 7.7);
    let env;
    if (lane === 0) env = 0.12 + 0.88 * Math.exp(-ph * 7);
    else if (lane === 1) env = 0.34 + 0.52 * Math.exp(-half * 4);
    else if (lane === 2) env = half < 0.62 ? 0.56 + 0.3 * Math.exp(-half * 5) : 0.14;
    else env = 0.28 + 0.6 * Math.abs(Math.sin(pos * 1.9 + 0.8));
    const bh = Math.max(4, Math.round(env * energy * (0.74 + 0.26 * r) * (h - 26)));
    d += `M${x.toFixed(1)} ${((h - bh) / 2 + 1.5).toFixed(1)}a1.5 1.5 0 0 1 3 0v${bh - 3}a1.5 1.5 0 0 1 -3 0z`;
  }
  return d;
}

const gridX = (t) => GRID.x0 + 16 * GRID.step * clamp((t - GRID.K.ph0) / (GRID.K.ph1 - GRID.K.ph0));

shot({
  id: "grid",
  bars: [6, 7],
  bg: "var(--deep)",
  tone: "light",
  enter: () => ({ kind: "box", dur: 0.45, ...HAND.morph }),
  build(id) {
    const G = GRID, x1 = G.x0 + 16 * G.step;
    const mono = (size) => `font-family:var(--mono);font-weight:500;letter-spacing:0.14em;text-transform:uppercase;font-size:${size}px`;
    const vis = (text, size) => measure(text, size, 500, mono(size)) - 0.14 * size;
    const w128 = measure("128", 200, 900, "letter-spacing:-0.04em");
    const numTop = Math.round(90 - (0.93375 - 0.7275) * 200), base = numTop + 0.93375 * 200;
    const monoTop = (size, b) => Math.round(b - 0.93 * size), rTop = Math.round(90 - 0.2 * 28);
    const barW = vis("BAR 06 / 24", 28), beatW = vis("BEAT", 28), digit = 0.6 * 28;
    const digitL = Math.round(x1 - digit);
    const lanes = G.names.map((_, i) => `<div class="abs" data-k="${id}_lane${i}" style="left:${G.x0}px;top:${G.top + i * G.pitch}px;width:${x1 - G.x0}px;height:${G.lh}px;border-radius:14px;background:rgba(255,255,255,0.045);transform-origin:0 50%"></div>`).join("");
    const lines = Array.from({ length: 17 }, (_, i) => `<div class="abs" data-k="${id}_ln${i}" style="left:${G.x0 + i * G.step - 1}px;top:${G.lineTop}px;width:2px;height:${G.lineH}px;border-radius:1px;background:#fff;transform-origin:50% 50%"></div>`).join("");
    const labels = G.names.map((n, i) => {
      const cy = G.top + i * G.pitch + G.lh / 2;
      return `<div class="abs mask" style="left:96px;top:${Math.round(cy - 0.565 * 26)}px;height:30px"><span class="t" data-k="${id}_tl${i}" style="${mono(26)};color:rgba(255,255,255,0.6)">${n}</span></div>`;
    }).join("");
    const clips = G.clips.map(([L, b, n], i) => {
      const w = n * G.step - 6, x = G.x0 + b * G.step + 3, y = G.top + L * G.pitch + G.inset, d = gridWave(L, b, w, G.ch);
      const svg = (op) => `<svg class="abs" width="${w}" height="${G.ch}" style="left:0;top:0"><path d="${d}" fill="#1C1450" fill-opacity="${op}"/></svg>`;
      return `<div class="abs" data-k="${id}_c${i}" style="left:${x}px;top:${y}px;width:${w}px;height:${G.ch}px;border-radius:16px;background:${G.colors[L]};overflow:hidden;transform-origin:50% 100%">
        <div class="abs" data-k="${id}_cw${i}" style="left:0;top:0;width:${w}px;height:${G.ch}px;transform-origin:50% 50%">${svg(0.4)}
          <div class="abs" data-k="${id}_cp${i}" style="left:0;top:0;width:0;height:${G.ch}px;overflow:hidden">${svg(0.8)}</div>
        </div>
      </div>`;
    }).join("");
    return `
      ${lanes}${lines}${clips}
      <div class="abs" data-k="${id}_ph" style="left:0;top:0;width:6px;height:0">
        <div class="abs" data-k="${id}_phHead" style="left:-8px;top:${G.lineTop - 20}px;width:22px;height:18px;border-radius:5px;background:var(--orange);box-shadow:0 0 0 2px var(--deep);transform-origin:50% 100%"></div>
        <div class="abs" data-k="${id}_phLine" style="left:0;top:${G.lineTop - 4}px;width:6px;height:${G.lineH + 8}px;border-radius:3px;background:var(--orange);box-shadow:0 0 0 2px var(--deep);transform-origin:50% 0"></div>
      </div>
      ${labels}
      <div class="abs row" style="left:96px;top:${numTop}px;height:228px;overflow:hidden;font-size:200px;font-weight:900;letter-spacing:-0.04em;color:#fff">${["1", "2", "8"].map((c, i) => `<span class="t" data-k="${id}_n${i}">${c}</span>`).join("")}</div>
      <div class="abs mask" style="left:${Math.round(96 + w128 + 22)}px;top:${monoTop(36, base)}px;height:42px"><span class="t" data-k="${id}_bpm" style="${mono(36)};color:rgba(255,255,255,0.6)">BPM</span></div>
      <div class="abs mask" style="left:${Math.round(x1 - barW)}px;top:${rTop}px;height:32px"><span class="t" data-k="${id}_bar" style="${mono(28)};color:rgba(255,255,255,0.6)">BAR 06 / 24</span></div>
      <div class="abs mask" style="left:${Math.round(digitL - 14 - beatW)}px;top:${rTop + 44}px;height:32px"><span class="t" data-k="${id}_beat" style="${mono(28)};color:rgba(255,255,255,0.6)">BEAT</span></div>
      <div class="abs" data-k="${id}_beatN" style="left:${digitL}px;top:${rTop + 44}px;width:18px;height:32px;overflow:hidden"></div>`;
  },
  ready(id) {
    GRID.K = gridClock();
    HAND.grid = { x: GRID.x0 + 16 * GRID.step, y: GRID.lineTop - 11, r0: 11 };
    GRID.roll = roller($[`${id}_beatN`], "font-family:var(--mono);font-weight:500;font-size:28px;color:var(--orange)");
  },
  at(t) {
    const G = GRID, K = G.K, id = "grid", ph = gridX(t);
    for (let i = 0; i < 4; i++) {
      const p = prog(t, K.build + i * 0.05, 0.5, E.out);
      show($[`${id}_lane${i}`], p > 0);
      setT($[`${id}_lane${i}`], `scaleX(${p.toFixed(4)})`);
    }
    for (let i = 0; i <= 16; i++) {
      const el = $[`${id}_ln${i}`], g = prog(t, K.build + 0.03 + i * 0.012, 0.36, E.out);
      const ti = K.ph0 + (i / 16) * (K.ph1 - K.ph0), pl = t >= ti ? Math.exp(-(t - ti) * 7) : 0;
      const base = i % 4 === 0 ? 0.26 : 0.11;
      show(el, g > 0);
      el.style.opacity = (base + (0.75 - base) * pl).toFixed(3);
      setT(el, `scale(${(1 + 1.2 * pl).toFixed(3)},${g.toFixed(4)})`);
    }
    G.clips.forEach(([L, b, n, m], i) => {
      const el = $[`${id}_c${i}`], tc = K.land[m], ts = tc - G.fall;
      show(el, t >= ts);
      if (t < ts) return;
      const u = clamp((t - ts) / G.fall), w = n * G.step - 6;
      const y = t < tc ? -G.drop * (1 - u * u) : 0;
      const stretch = t < tc ? 0.07 * u * u : 0.07 * Math.exp(-(t - tc) / 0.012);
      const sq = offset(t, tc, 0.45, 14, 16), g = clamp(u / 0.6), sc = 0.6 + 0.4 * g * g * (3 - 2 * g);
      el.style.opacity = clamp(u / 0.15).toFixed(3);
      setT(el, `translateY(${y.toFixed(2)}px) scale(${(sc * (1 + (sq - 0.5 * stretch) * (36 / w))).toFixed(4)},${(sc * (1 + stretch - sq)).toFixed(4)})`);
      setT($[`${id}_cw${i}`], `scaleY(${(1 - offset(t, tc + 0.03, 0.5, 11, 22)).toFixed(4)})`);
      $[`${id}_cp${i}`].style.width = px(clamp(ph - (G.x0 + b * G.step + 3), 0, w));
    });
    const hp = clamp(spring(t, K.ph0 - 0.03, 0.34, 0.62), 0, 1.3), lp = prog(t, K.ph0 - 0.05, 0.16, E.out);
    show($[`${id}_ph`], t >= K.ph0 - 0.05);
    setT($[`${id}_ph`], `translateX(${(ph - 3).toFixed(2)}px)`);
    setT($[`${id}_phHead`], `scale(${hp.toFixed(4)})`);
    setT($[`${id}_phLine`], `scaleY(${lp.toFixed(4)})`);
    const up = (el, t0) => rise(el, clamp(spring(t, t0, 0.42, 0.9), 0, 1.04));
    for (let i = 0; i < 3; i++) up($[`${id}_n${i}`], K.build + 0.01 + i * 0.06);
    up($[`${id}_bpm`], K.build + 0.2);
    for (let i = 0; i < 4; i++) up($[`${id}_tl${i}`], K.build + 0.14 + i * 0.05);
    up($[`${id}_bar`], K.build + 0.22);
    up($[`${id}_beat`], K.build + 0.26);
    roll(G.roll, t, K.beats.map((bt, i) => ({ t: bt, v: String(i + 1) })));
  },
  cues() {
    const K = gridClock(), mid = (m) => GRID.clips.filter((c) => c[3] === m).reduce((s, c, _, a) => s + (GRID.x0 + (c[1] + c[2] / 2) * GRID.step) / a.length, 0);
    return [
      ["swish", K.build + 0.02, { gain: -6, pan: -0.5 }],
      ["blip", K.ph0, { note: 7, gain: -8 }],
      ...K.land.map((t, m) => ["click", t, { gain: m % 2 ? -3 : 0, pan: +((mid(m) / FILM.W) * 1.2 - 0.6).toFixed(2) }]),
    ];
  },
});

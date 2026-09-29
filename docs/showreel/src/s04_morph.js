const MORPH = {
  cx: 960, cy: 540, dur: 0.34,
  forms: [[200, 200, 100], [420, 230, 115], [640, 420, 44], [380, 760, 64]],
  screen: { x: 794, y: 184, w: 332, h: 712, r: 44 },
  avatar: { x: 736, y: 426, r: 48 },
  bars: [[816, 392, 320], [816, 438, 220]], barH: 26,
  pill: { x: 1052, y: 638, w: 180, h: 64 },
  notch: { x: 906, y: 202, w: 108, h: 32 },
  lilac: [[834, 590, 252], [834, 646, 188], [834, 702, 222]], lilacH: 32,
  labels: ["01 DOT", "02 SWITCH", "03 CARD", "04 SCREEN"],
  K: null, lab: null,
};

function morphClock() {
  const t0 = BT(5, 1), step = (2 / 3) * FILM.P;
  return { m: [0, 1, 2, 3].map((k) => t0 + k * step), clear: BT(5, 4), words: t0 - 0.02 };
}

function morphShape(t) {
  const M = MORPH, K = M.K;
  let r = { x: M.cx, y: M.cy, w: 0, h: 0, r: 0 };
  M.forms.forEach(([w, h, rad], k) => {
    r = mixRect(r, { x: M.cx - w / 2, y: M.cy - h / 2, w, h, r: rad }, prog(t, K.m[k], M.dur, E.snappy));
  });
  return r;
}

function morphEdge(R, s) {
  const r = Math.min(R.r, R.w / 2, R.h / 2), a = Math.max(0, R.w - 2 * r), b = Math.max(0, R.h - 2 * r), q = (Math.PI * r) / 2;
  const total = 2 * a + 2 * b + 4 * q, L = R.x, T = R.y, Rt = R.x + R.w, Bt = R.y + R.h;
  if (total < 1e-6) return { x: R.x + R.w / 2, y: R.y + R.h / 2 };
  const arc = (ox, oy, from, d) => ({ x: ox + r * Math.cos(from + d / r), y: oy + r * Math.sin(from + d / r) });
  let d = clamp(s) * total;
  const segs = [
    [a / 2, (e) => ({ x: L + R.w / 2 + e, y: T })],
    [q, (e) => arc(Rt - r, T + r, -Math.PI / 2, e)],
    [b, (e) => ({ x: Rt, y: T + r + e })],
    [q, (e) => arc(Rt - r, Bt - r, 0, e)],
    [a, (e) => ({ x: Rt - r - e, y: Bt })],
    [q, (e) => arc(L + r, Bt - r, Math.PI / 2, e)],
    [b, (e) => ({ x: L, y: Bt - r - e })],
    [q, (e) => arc(L + r, T + r, Math.PI, e)],
    [a / 2, (e) => ({ x: L + r + e, y: T })],
  ];
  for (const [len, at] of segs) {
    if (d <= len) return at(d);
    d -= len;
  }
  return { x: L + R.w / 2, y: T };
}

function morphLeave(el, t, K, x, y, w, h, grow = 1, sy = 1) {
  const k = prog(t, K.m[3], 0.18, E.snappy), s = 1 - k;
  setT(el, `translate(${((MORPH.cx - x - w / 2) * k).toFixed(2)}px,${((MORPH.cy - y - h / 2) * k).toFixed(2)}px) scale(${(grow * s).toFixed(4)},${(sy * s).toFixed(4)})`);
  return s > 0.002;
}

shot({
  id: "morph",
  bars: [5, 6],
  bg: "var(--violet)",
  tone: "light",
  enter: () => ({ kind: "circle", dur: 0.4, ...HAND.springs, pan: +((HAND.springs.x / FILM.W) * 1.2 - 0.6).toFixed(2) }),
  build(id) {
    const M = MORPH, P = M.pill, N = M.notch;
    const bar = (k, [x, y, w]) => `<div class="abs" data-k="${id}_bar${k}" style="left:${x}px;top:${y}px;width:${w}px;height:${M.barH}px;border-radius:${M.barH / 2}px;background:rgba(28,20,80,0.14);transform-origin:0 50%"></div>`;
    const lilac = (k, [x, y, w]) => `<div class="abs" data-k="${id}_li${k}" style="left:${x}px;top:${y}px;width:${w}px;height:${M.lilacH}px;border-radius:${M.lilacH / 2}px;background:${COL.lilac};transform-origin:0 50%"></div>`;
    return `
      <div class="abs" style="left:96px;top:81px">${headline(id + "_h", "Shapes\nbecome\n*windows.*", { size: 92, weight: 900, color: "#fff", accent: COL.orange })}</div>
      <div class="abs" data-k="${id}_lab" style="left:96px;top:900px;width:420px;height:34px;overflow:hidden;font-family:var(--mono);font-weight:500;font-size:28px;letter-spacing:0.14em;color:rgba(255,255,255,0.7)"></div>
      <div class="abs" data-k="${id}_shape" style="left:0;top:0;width:0;height:0;background:#fff"></div>
      ${M.bars.map((b, k) => bar(k, b)).join("")}
      <div class="abs" data-k="${id}_pill" style="left:${P.x}px;top:${P.y}px;width:${P.w}px;height:${P.h}px;border-radius:${P.h / 2}px;background:var(--orange);transform-origin:50% 50%">
        <svg class="abs" style="left:0;top:0;overflow:visible" width="${P.w}" height="${P.h}"><path data-k="${id}_tick" d="M${P.w / 2 - 20} ${P.h / 2 + 1} L${P.w / 2 - 6} ${P.h / 2 + 14} L${P.w / 2 + 21} ${P.h / 2 - 13}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="72 72"/></svg>
      </div>
      <div class="abs" data-k="${id}_knob" style="left:0;top:0;width:0;height:0;border-radius:50%;background:var(--deep)"></div>
      <div class="abs" data-k="${id}_screen" style="left:0;top:0;width:0;height:0;background:var(--deep)"></div>
      <div class="abs" data-k="${id}_notch" style="left:${N.x}px;top:${N.y}px;width:${N.w}px;height:${N.h}px;border-radius:${N.h / 2}px;background:#0C0926;transform-origin:50% 50%"></div>
      ${M.lilac.map((b, k) => lilac(k, b)).join("")}
      <div class="abs" data-k="${id}_relay" style="left:-6px;top:-6px;width:12px;height:12px;border-radius:50%;background:var(--orange)"></div>`;
  },
  ready(id) {
    MORPH.K = morphClock();
    MORPH.lab = roller($[id + "_lab"], "");
  },
  at(t) {
    const M = MORPH, K = M.K, id = "morph", A = M.avatar;
    const drawn = headlineAt(id + "_h", t, K.words, Infinity, 0.07);
    HL[id + "_h"].marks.forEach(({ i }) => show($[`${id}_hu${i}`], t > drawn));
    roll(M.lab, t, M.labels.map((v, k) => ({ t: K.m[k], v })), 0.28);

    const R = morphShape(t), shape = $[id + "_shape"];
    show(shape, R.w > 0.5);
    rectCss(shape, R);
    const mint = prog(t, K.m[1] + 0.12, 0.1, E.inOut) * (1 - prog(t, K.m[2], 0.12, E.out));
    shape.style.background = mixc(COL.white, COL.mint, mint);

    const p1 = prog(t, K.m[1], M.dur, E.snappy), p2 = prog(t, K.m[2], 0.24, E.snappy);
    const slide = clamp(spring(t, K.m[1] + 0.1, 0.26, 0.72), 0, 1.06), [sw, sh] = M.forms[1];
    let kx = lerp(M.cx - sw / 2 + sh / 2, M.cx + sw / 2 - sh / 2, slide), ky = M.cy, kr = 85 * p1;
    kx = lerp(kx, A.x, p2);
    ky = lerp(ky, A.y, p2);
    kr = lerp(kr, A.r, p2);
    const k3 = prog(t, K.m[3], 0.18, E.snappy);
    kx = lerp(kx, M.cx, k3);
    ky = lerp(ky, M.cy, k3);
    kr *= 1 - k3;
    const knob = $[id + "_knob"];
    show(knob, t >= K.m[1] && kr > 0.3);
    rectCss(knob, { x: kx - kr, y: ky - kr, w: 2 * kr, h: 2 * kr, r: kr });

    M.bars.forEach(([x, y, w], k) => {
      const g = prog(t, K.m[2] + 0.1 + 0.04 * k, 0.16, E.out), el = $[`${id}_bar${k}`];
      show(el, g > 0 && morphLeave(el, t, K, x, y, w, M.barH, g));
    });
    const P = M.pill, pr = clamp(spring(t, K.m[2] + 0.12, 0.3, 0.6), 0, 1.15), pp = Math.abs(pr - 1) < 0.002 ? 1 : pr;
    show($[id + "_pill"], t >= K.m[2] + 0.12 && morphLeave($[id + "_pill"], t, K, P.x, P.y, P.w, P.h, pp, pp));
    $[id + "_tick"].style.strokeDashoffset = (72 * (1 - prog(t, K.m[2] + 0.17, 0.11, E.out))).toFixed(2);

    const sp = prog(t, K.m[3], M.dur, E.snappy), S = M.screen, scr = $[id + "_screen"];
    show(scr, sp > 0);
    rectCss(scr, mixRect({ x: M.cx, y: M.cy, w: 0, h: 0, r: 0 }, S, sp));

    const gone = prog(t, K.clear, 0.07, E.inOut);
    const np = clamp(spring(t, K.m[3] + 0.12, 0.3, 0.7), 0, 1.1) * (1 - gone);
    show($[id + "_notch"], t >= K.m[3] + 0.12 && np > 0.002);
    setT($[id + "_notch"], `scale(${np.toFixed(4)})`);
    M.lilac.forEach((_, k) => {
      const g = prog(t, K.m[3] + 0.07 + 0.045 * k, 0.2, E.out) * (1 - gone), el = $[`${id}_li${k}`];
      show(el, g > 0.002);
      setT(el, `scaleX(${g.toFixed(4)})`);
    });

    const s = clamp((t - K.m[0]) / (K.clear - K.m[0])), relay = $[id + "_relay"];
    const rs = prog(t, K.m[0], 0.12, E.out);
    show(relay, rs > 0);
    const e = morphEdge(R, s);
    setT(relay, `translate(${e.x.toFixed(2)}px,${e.y.toFixed(2)}px) scale(${rs.toFixed(4)})`);
  },
  cues() {
    const K = morphClock();
    return [
      ["pop", K.m[0], { note: 0, gain: -2 }],
      ["pop", K.m[1], { note: 2, gain: -3 }],
      ["click", K.m[1] + 0.22, { gain: -4, pan: 0.1 }],
      ["pop", K.m[2], { note: 4, gain: -3 }],
      ["tick", K.m[2] + 0.22, { gain: -2, pan: 0.15 }],
      ["thud", K.m[3], { gain: -2 }],
      ["pop", K.m[3] + 0.02, { note: 7, gain: -4 }],
      ["blip", K.m[3] + 0.1, { note: 5, gain: -10 }],
      ["swish", K.clear, { gain: -9 }],
    ];
  },
});

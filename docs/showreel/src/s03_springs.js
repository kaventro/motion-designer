const SPRINGS = {
  x0: 240, dx: 180, floor: 760, rest: 700, cols: [COL.violet, COL.orange, COL.ink, COL.mint],
  hop: 190, air: 0.25, resp: 0.16, damp: [0.42, 0.68, 0.92], sqY: 0.28, sqX: 0.25, gap: 0.03, dropGap: 0.035,
  fall: 0.28, from: -140, pull: 0.18, dropPull: 0.26, crouch: 0.09,
  card: { x: 1396, y: 100, w: 420, h: 240 }, px: 28, py: 214, pw: 364, ky: 100, win: 0.4, steps: 72,
  K: null, curves: null, val: null,
};

function springsClock() {
  const S = SPRINGS, b = [BT(4, 2), BT(4, 3), BT(4, 4)], idx = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  return {
    b, line: BAR(4) - 0.065, words: BAR(4) + 0.155, card: b[0] - 0.055,
    drop: idx.map((i) => b[0] - S.dropGap * (8 - i)),
    hop: idx.map((i) => b[1] - S.gap * (8 - i)),
    gone: idx.map((i) => b[2] - S.air + 0.012 + 0.024 * (7 - i)),
  };
}

function springsGround(t, land, damp, next) {
  const S = SPRINGS, s = S.sqY * (1 - spring(t, land, S.resp, damp));
  const c = next === undefined ? 0 : S.crouch * bump((t - next + 0.09) / 0.1);
  return { ground: true, lift: 0, sx: 1 + (S.sqX / S.sqY) * s + 0.7 * c, sy: 1 - s - c };
}

function springsAir(t, up, land) {
  const S = SPRINGS, u = clamp((t - up) / (land - up));
  const st = S.pull * Math.abs(1 - 2 * u) * clamp(u / 0.1) * clamp((1 - u) / 0.1);
  return { ground: false, lift: 4 * S.hop * u * (1 - u), sx: 1 - 0.55 * st, sy: 1 + st };
}

function springsDrop(t, land) {
  const S = SPRINGS, d = t - (land - S.fall), g = (2 * (S.rest - S.from)) / (S.fall * S.fall);
  const st = S.dropPull * (d / S.fall) * clamp((land - t) / 0.035);
  return { ground: false, lift: S.rest - (S.from + 0.5 * g * d * d), sx: 1 - 0.55 * st, sy: 1 + st };
}

function springsPose(i, t) {
  const S = SPRINGS, K = S.K, l0 = K.drop[i], l1 = K.hop[i], u1 = l1 - S.air;
  if (t < l0 - S.fall) return null;
  if (t < l0) return springsDrop(t, l0);
  if (t < u1) return springsGround(t, l0, S.damp[0], u1);
  if (t < l1) return springsAir(t, u1, l1);
  if (i < 8) {
    const q = clamp((t - K.gone[i]) / 0.17);
    if (q >= 1) return null;
    const p = springsGround(t, l1, S.damp[1]);
    const k = q < 0.3 ? 1 + 0.07 * Math.sin((Math.PI * q) / 0.3) : 1 - E.in((q - 0.3) / 0.7);
    return { ground: true, lift: 0, sx: p.sx * k, sy: p.sy * k };
  }
  const l2 = K.b[2], u2 = l2 - S.air;
  if (t < u2) return springsGround(t, l1, S.damp[1], u2);
  if (t < l2) return springsAir(t, u2, l2);
  return springsGround(t, l2, S.damp[2]);
}

function springsPath(vals) {
  const S = SPRINGS;
  return "M" + vals.map((v, k) => `${(S.px + (S.pw * k) / S.steps).toFixed(1)} ${(S.py - S.ky * v).toFixed(1)}`).join(" L");
}

shot({
  id: "springs",
  bars: [4, 5],
  bg: "var(--paper)",
  tone: "dark",
  enter: () => ({ kind: "circle", dur: 0.36, ...HAND.type, pan: +((HAND.type.x / FILM.W) * 1.2 - 0.6).toFixed(2) }),
  build(id) {
    const S = SPRINGS, C = S.card;
    const balls = S.cols.concat(S.cols, S.cols).slice(0, 9).map((c, i) => `<div class="abs" data-k="${id}_b${i}" style="left:${S.x0 + S.dx * i - 60}px;top:${S.floor - 120}px;width:120px;height:120px;border-radius:50%;background:${c};transform-origin:50% 100%"></div>`).join("");
    const ghost = (k) => `<path data-k="${id}_g${k}" fill="none" stroke="rgba(23,21,15,0.2)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `
      <div class="abs" style="left:96px;top:81px">${headline(id + "_h", "Springs, not *tweens.*", { size: 92, weight: 900, color: COL.ink, accent: COL.violet })}</div>
      <div class="abs" data-k="${id}_line" style="left:96px;top:${S.floor}px;width:1728px;height:3px;background:var(--ink);transform-origin:0 50%"></div>
      ${balls}
      <div class="abs" data-k="${id}_card" style="left:${C.x}px;top:${C.y}px;width:${C.w}px;height:${C.h}px;border-radius:24px;background:#fff;box-shadow:8px 8px 0 var(--ink);transform-origin:50% 50%">
        <div class="abs row label" style="left:${S.px}px;top:24px;height:30px;font-size:26px;gap:16px;color:rgba(23,21,15,0.55)"><span>DAMPING</span><span data-k="${id}_val" style="position:relative;display:block;width:80px;height:30px;overflow:hidden"></span></div>
        <svg class="abs" style="left:0;top:0;overflow:visible" width="${C.w}" height="${C.h}">
          <path d="M${S.px} ${S.py - S.ky} H${S.px + S.pw} M${S.px} ${S.py} H${S.px + S.pw}" stroke="rgba(23,21,15,0.12)" stroke-width="2" fill="none"/>
          ${ghost(0)}${ghost(1)}
          <path data-k="${id}_cv" fill="none" stroke="${COL.violet}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle data-k="${id}_dot" r="0" fill="${COL.orange}"/>
        </svg>
      </div>`;
  },
  ready(id) {
    const S = SPRINGS;
    S.K = springsClock();
    S.curves = S.damp.map((z) => Array.from({ length: S.steps + 1 }, (_, k) => spring((S.win * k) / S.steps, 0, S.resp, z)));
    $[id + "_g0"].setAttribute("d", springsPath(S.curves[0]));
    $[id + "_g1"].setAttribute("d", springsPath(S.curves[1]));
    S.val = roller($[id + "_val"], `color:${COL.violet};font-weight:700`);
    HAND.springs = { x: S.x0 + S.dx * 8, y: S.rest, r0: 60 };
  },
  at(t) {
    const S = SPRINGS, K = S.K, id = "springs";
    const gl = prog(t, K.line, 0.34, E.out);
    show($[id + "_line"], gl > 0);
    setT($[id + "_line"], `scaleX(${gl.toFixed(4)})`);

    for (let i = 0; i < 9; i++) {
      const el = $[`${id}_b${i}`], p = springsPose(i, t);
      show(el, !!p);
      if (!p) continue;
      const yb = p.ground ? S.floor : S.rest - p.lift + 60 * p.sy;
      setT(el, `translate(0px,${(yb - S.floor).toFixed(2)}px) scale(${p.sx.toFixed(4)},${p.sy.toFixed(4)})`);
    }

    const drawn = headlineAt(id + "_h", t, K.words, Infinity, 0.055);
    HL[id + "_h"].marks.forEach(({ i }) => show($[`${id}_hu${i}`], t > drawn));

    const cp = clamp(spring(t, K.card, 0.36, 0.62), 0, 1.2);
    show($[id + "_card"], t >= K.card);
    setT($[id + "_card"], Math.abs(cp - 1) < 0.002 ? "none" : `scale(${cp.toFixed(4)})`);
    roll(S.val, t, [{ t: K.card, v: "0.42" }, { t: K.b[1], v: "0.68" }, { t: K.b[2], v: "0.92" }], 0.3);

    let j = 0;
    for (let k = 1; k < 3; k++) if (t >= K.b[k]) j = k;
    const mp = j ? prog(t, K.b[j], 0.3, E.snappy) : 1;
    const from = S.curves[Math.max(0, j - 1)], to = S.curves[j];
    $[id + "_cv"].setAttribute("d", springsPath(to.map((v, k) => lerp(from[k], v, mp))));
    show($[id + "_g0"], t >= K.b[1]);
    show($[id + "_g1"], t >= K.b[2]);

    const tau = t - K.b[j], dot = $[id + "_dot"];
    if (tau < 0) {
      dot.setAttribute("r", "0");
    } else {
      const q = clamp(tau, 0, S.win);
      const v = lerp(spring(q, 0, S.resp, S.damp[Math.max(0, j - 1)]), spring(q, 0, S.resp, S.damp[j]), mp);
      const ds = clamp(tau / 0.05) * (j < 2 ? 1 - clamp((tau - S.win) / 0.04) : 1);
      dot.setAttribute("cx", (S.px + (S.pw * q) / S.win).toFixed(2));
      dot.setAttribute("cy", (S.py - S.ky * v).toFixed(2));
      dot.setAttribute("r", (9 * ds).toFixed(2));
    }
  },
  cues() {
    const S = SPRINGS, K = springsClock(), pan = (i) => +(((S.x0 + S.dx * i) / FILM.W) * 1.2 - 0.6).toFixed(2);
    const list = [];
    for (let i = 0; i < 8; i++) list.push(["tick", K.drop[i], { gain: -6, pan: pan(i) }], ["tick", K.hop[i], { gain: -9, pan: pan(i) }]);
    return list.concat([
      ["pop", K.b[0], { note: 2, gain: -2, pan: pan(8) }],
      ["hop", K.hop[0] - S.air, { gain: -9, pan: pan(3) }],
      ["pop", K.b[1], { note: 4, gain: -2, pan: pan(8) }],
      ["hop", K.b[2] - S.air, { gain: -5, pan: pan(8) }],
      ["swish", K.gone[7], { gain: -9, pan: pan(4) }],
      ["pop", K.b[2], { note: 7, gain: 0, pan: pan(8) }],
    ]);
  },
});

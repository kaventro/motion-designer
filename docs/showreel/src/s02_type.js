const TYPE = { size: 268, x0: 140, base1: 500, base2: 772, gap: 0.2, css: "letter-spacing:-0.035em", dot: 56 };

shot({
  id: "type",
  bars: [3, 4],
  bg: "var(--orange)",
  tone: "dark",
  enter: () => ({ kind: "circle", dur: 0.45, ...HAND.hook }),
  build(id) {
    const s = TYPE.size, w = (t) => measure(t, s, 900, TYPE.css), gap = TYPE.gap * s;
    const top = (base) => base - 0.9335 * s;
    const wc = w("CUT"), wo = w("ON"), wt = w("THE"), wb = w("BEAT");
    Object.assign(TYPE, { wc, wo, wt, wb });
    const st = (x, y) => `left:${x}px;top:${top(y).toFixed(1)}px;font-size:${s}px;font-weight:900;${TYPE.css};color:var(--ink);transform-origin:50% 82%`;
    const cut = (k, clip) => `<div class="abs" data-k="${id}_${k}" style="${st(TYPE.x0, TYPE.base1)};clip-path:${clip}"><span class="t">CUT</span></div>`;
    const x2 = TYPE.x0 + wt + gap;
    TYPE.xBeat = x2;
    TYPE.dotX = x2 + wb + 14 + TYPE.dot / 2;
    TYPE.dotY = TYPE.base2 - TYPE.dot / 2 - 4;
    HAND.type = { x: TYPE.dotX, y: TYPE.dotY, r0: TYPE.dot / 2 };
    return `
      <div class="abs" data-k="${id}_cutBox" style="left:0;top:0;width:${FILM.W}px;height:${FILM.H}px;transform-origin:${TYPE.x0 + wc / 2}px ${TYPE.base1 - 100}px">
        ${cut("cutA", "polygon(0 0, 100% 0, 100% 34%, 0 66%)")}${cut("cutB", "polygon(0 66%, 100% 34%, 100% 100%, 0 100%)")}
        <div class="abs" data-k="${id}_knife" style="left:${TYPE.x0 - 40}px;top:${TYPE.base1 - 100}px;width:${wc + 80}px;height:6px;background:var(--paper);border-radius:3px;transform-origin:50% 50%"></div>
      </div>
      <div class="abs" data-k="${id}_on" style="${st(TYPE.x0 + wc + gap, TYPE.base1)}"><span class="t">ON</span></div>
      <div class="abs" data-k="${id}_the" style="${st(TYPE.x0, TYPE.base2)}"><span class="t">THE</span></div>
      <div class="abs" style="left:${x2}px;top:${top(TYPE.base2).toFixed(1)}px;font-size:${s}px;font-weight:900;${TYPE.css};color:var(--ink)">${["B", "E", "A", "T"].map((c, i) => `<span class="t" data-k="${id}_be${i}" style="transform-origin:50% 82%">${c}</span>`).join("")}</div>
      <div class="abs" data-k="${id}_ringB" style="left:0;top:0;width:100px;height:100px;border-radius:50%;border:5px solid var(--paper)"></div>
      <div class="abs" data-k="${id}_dot" style="left:${TYPE.dotX - TYPE.dot / 2}px;top:${TYPE.dotY - TYPE.dot / 2}px;width:${TYPE.dot}px;height:${TYPE.dot}px;border-radius:50%;background:var(--paper)"></div>
      ${[0, 1, 2, 3].map((i) => `<div class="abs" data-k="${id}_pip${i}" style="left:${1452 + i * 88}px;top:320px;width:64px;height:64px;border-radius:50%;border:5px solid var(--ink)"><div class="abs" data-k="${id}_pf${i}" style="left:-5px;top:-5px;width:64px;height:64px;border-radius:50%;background:var(--ink)"></div></div>`).join("")}`;
  },
  at(t) {
    const id = "type", H = [0, 1, 2, 3].map((i) => BT(3, 1) + i * FILM.P);
    const s = TYPE.size;

    const cIn = 1 + 0.5 * (1 - E.in(clamp((t - (H[0] - 0.16)) / 0.16)));
    const cScale = t >= H[0] - 0.16 ? cIn : 1;
    show($[id + "_cutBox"], t >= H[0] - 0.16);
    setT($[id + "_cutBox"], `scale(${cScale.toFixed(4)})`);
    const knifeT = H[0] + 0.08;
    const gapX = offset(t, knifeT, 62, 9, 24);
    setT($[id + "_cutA"], `translateX(${(gapX).toFixed(2)}px)`);
    setT($[id + "_cutB"], `translateX(${(-gapX).toFixed(2)}px)`);
    const kn = clamp((t - knifeT) / 0.12);
    const knifeOn = t >= knifeT - 0.02 && t < knifeT + 0.16;
    show($[id + "_knife"], knifeOn);
    const ang = -Math.atan2(0.32 * s * 0.9, TYPE.wc) * 180 / Math.PI;
    setT($[id + "_knife"], `translate(0px,${(-0.04 * s + 20).toFixed(1)}px) rotate(${ang.toFixed(2)}deg) scaleX(${(E.out(clamp((t - (knifeT - 0.02)) / 0.08)) * (1 - kn * 0.6)).toFixed(3)})`);

    const on = (1 - clamp(spring(t, H[1] - 0.22, 0.36, 0.7), 0, 1.15)) * 760;
    show($[id + "_on"], t >= H[1] - 0.22);
    setT($[id + "_on"], `translateX(${on.toFixed(2)}px) skewX(${(-9 * clamp(on / 760)).toFixed(2)}deg)`);

    const upP = clamp(spring(t, H[2] - 0.26, 0.34, 0.66), 0, 1.3);
    show($[id + "_the"], t >= H[2] - 0.26);
    setT($[id + "_the"], `translateY(${((1 - upP) * 470).toFixed(2)}px) scale(${lerp(0.86, 1, clamp(upP)).toFixed(4)},${lerp(1.22, 1, clamp(upP)).toFixed(4)})`);

    for (let i = 0; i < 4; i++) {
      const at = H[3] - 0.16 + i * 0.045;
      const p = clamp(spring(t, at, 0.36, 0.62), 0, 1.3);
      show($[`${id}_be${i}`], t >= at);
      setT($[`${id}_be${i}`], `translateY(${((1 - p) * 420).toFixed(2)}px) scale(${lerp(0.88, 1, clamp(p)).toFixed(4)},${lerp(1.25, 1, clamp(p)).toFixed(4)})`);
    }
    const rp = clamp((t - H[3]) / 0.55);
    show($[id + "_ringB"], rp > 0 && rp < 1);
    const ring = $[id + "_ringB"], cx = TYPE.xBeat + TYPE.wb / 2, cy = TYPE.base2 - 100;
    const rr = 120 + 620 * E.out(rp);
    show(ring, rp > 0 && rp < 1);
    Object.assign(ring.style, { left: px(cx - rr), top: px(cy - rr), width: px(rr * 2), height: px(rr * 2), opacity: (0.55 * (1 - rp)).toFixed(3) });

    const dp = spring(t, H[3] - 0.14, 0.3, 0.62);
    show($[id + "_dot"], t >= H[3] - 0.14 && t < BAR(4) - 0.3 + 0.02);
    setT($[id + "_dot"], `translateY(${((1 - dp) * 400).toFixed(2)}px)`);

    for (let i = 0; i < 4; i++) {
      const p = clamp(spring(t, H[i], 0.34, 0.62), 0, 1.25);
      setT($[`${id}_pf${i}`], `scale(${(t >= H[i] ? p : 0).toFixed(4)})`);
      setT($[`${id}_pip${i}`], `scale(${(1 + 0.18 * pulse(t, H[i], 0.3)).toFixed(4)})`);
      show($[`${id}_pip${i}`], t >= H[0] - 0.2);
    }
  },
  cues() {
    const H = [0, 1, 2, 3].map((i) => BT(3, 1) + i * FILM.P);
    return [
      ["thud", H[0]], ["click", H[0] + 0.08, { gain: 2 }],
      ["whoosh", H[1] - 0.3, { pan: 0.6, gain: -4 }], ["thud", H[1], { gain: -3 }],
      ["thud", H[2], { gain: -1 }],
      ["thud", H[3], { gain: 1 }], ["pop", H[3] + 0.1, { note: 9 }],
      ...[0, 1, 2, 3].map((i) => ["blip", H[i] + 0.02, { note: 5 + i, gain: -4 }]),
    ];
  },
});

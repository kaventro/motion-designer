const VOCAB = {
  size: 330, base: 610, gw: 280, gh: 120,
  items: [
    { word: "arrive", bg: COL.orange, ink: COL.ink, cap: "E.out, 0.45 s", curve: (x) => E.out(x), kind: null },
    { word: "settle", bg: COL.mint, ink: COL.ink, cap: "spring, damping 0.9", curve: (x) => spring(x * 1.3, 0, 0.55, 0.9) / 1.12, kind: "fromBottom" },
    { word: "snap", bg: COL.paper, ink: COL.violet, cap: "E.snappy, 0.14 s", curve: (x) => E.snappy(x), kind: "diag" },
    { word: "glide", bg: COL.night, ink: "#FFFFFF", cap: "E.smooth, 0.5 s", curve: (x) => E.smooth(x), kind: "fromTop" },
  ],
};

const vocabBeat = (i) => BT(8, i + 1);

function vocabCurve(fn, w, h) {
  const pts = [];
  for (let k = 0; k <= 48; k++) pts.push(`${(6 + (w - 12) * (k / 48)).toFixed(1)} ${(h - 8 - (h - 22) * fn(k / 48)).toFixed(1)}`);
  return `M${pts.join(" L")}`;
}

shot({
  id: "vocab",
  bars: [8, 9],
  bg: "var(--orange)",
  tone: "dark",
  enter: () => ({ kind: "circle", dur: 0.4, ...HAND.wall }),
  build(id) {
    const s = VOCAB.size, top = VOCAB.base - 0.9335 * s;
    return VOCAB.items.map((it, i) => {
      const w = measure(it.word, s, 900, "letter-spacing:-0.05em");
      const left = Math.round((FILM.W - w) / 2);
      const dark = it.ink === "#FFFFFF";
      const line = dark ? "rgba(255,255,255,0.5)" : "rgba(23,21,15,0.55)";
      return `<div class="abs" data-k="${id}_f${i}" style="left:0;top:0;width:${FILM.W}px;height:${FILM.H}px;background:${it.bg};overflow:hidden">
        <div class="abs" data-k="${id}_w${i}" style="left:${left}px;top:${top.toFixed(1)}px;font-size:${s}px;font-weight:900;letter-spacing:-0.05em;color:${it.ink};white-space:nowrap"><span class="t">${it.word}</span></div>
        <div class="abs label" style="left:0;top:742px;width:${FILM.W}px;text-align:center;font-size:30px;letter-spacing:0.06em;text-transform:none;color:${line}">${it.cap}</div>
        <svg class="abs" style="left:${(FILM.W - VOCAB.gw) / 2}px;top:800px" width="${VOCAB.gw}" height="${VOCAB.gh}" viewBox="0 0 ${VOCAB.gw} ${VOCAB.gh}">
          <path d="M6 ${VOCAB.gh - 8} L${VOCAB.gw - 6} ${VOCAB.gh - 8}" stroke="${line}" stroke-width="2" fill="none" opacity="0.45"/>
          <path d="${vocabCurve(it.curve, VOCAB.gw, VOCAB.gh)}" stroke="${it.ink}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <circle data-k="${id}_d${i}" r="10" fill="${it.ink}"/>
        </svg>
      </div>`;
    }).join("");
  },
  at(t) {
    const id = "vocab", brief = SHOTS.find((q) => q.id === "brief");
    const push = brief && brief.en ? prog(t, brief.en.t0, brief.en.dur, brief.en.ease || E.inOut) : 0;
    const B = [0, 1, 2, 3].map(vocabBeat);
    const motion = [
      { p: prog(t, B[0] - 0.08, 0.5, E.out), x: 0, y: (1 - prog(t, B[0] - 0.08, 0.5, E.out)) * 820 },
      { p: clamp(spring(t, B[1] - 0.3, 0.55, 0.9), 0, 1.1), x: 0, y: -(1 - clamp(spring(t, B[1] - 0.3, 0.55, 0.9), 0, 1.1)) * 560 },
      { p: prog(t, B[2] - 0.12, 0.14, E.snappy), x: -(1 - prog(t, B[2] - 0.12, 0.14, E.snappy)) * 1500, y: 0 },
      { p: push, x: -push * FILM.W, y: 0 },
    ];
    VOCAB.items.forEach((it, i) => {
      const f = $[`${id}_f${i}`];
      if (i > 0) {
        const wp = prog(t, B[i] - 0.25, 0.3, E.inOut);
        show(f, t >= B[i] - 0.25);
        f.style.clipPath = clipFor(it.kind, wp);
      }
      const m = motion[i];
      setT($[`${id}_w${i}`], `translate(${m.x.toFixed(2)}px,${m.y.toFixed(2)}px)`);
      const dot = $[`${id}_d${i}`], q = clamp(m.p, 0, 1);
      dot.setAttribute("cx", (6 + (VOCAB.gw - 12) * q).toFixed(1));
      dot.setAttribute("cy", (VOCAB.gh - 8 - (VOCAB.gh - 22) * it.curve(q)).toFixed(1));
    });
  },
  cues() {
    const B = [0, 1, 2, 3].map(vocabBeat);
    return [
      ["whoosh", B[0] - 0.4, { gain: -6 }], ["thud", B[0], { gain: 0 }],
      ["whoosh", B[1] - 0.3, { pan: -0.3, gain: -3 }], ["pop", B[1] + 0.02, { note: 4 }],
      ["whoosh", B[2] - 0.3, { pan: 0.3, gain: -3 }], ["click", B[2] + 0.02, { gain: 3 }],
      ["whoosh", B[3] - 0.3, { gain: -3 }], ["swish", B[3] + 0.1, { gain: 3 }],
    ];
  },
});

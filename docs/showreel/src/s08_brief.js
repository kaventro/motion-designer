const BRIEF = {
  x: 864, y: 194, w: 960, pad: 40, head: 88, row: 76, foot: 104, bw: 232,
  ink: "#F2F4F8", sub: "#A3ABBA", ter: "#6B7384",
  files: [["Views/", "Home.swift", "screens", 0], ["", "Theme.swift", "tokens", 0], ["Fonts/", "Manrope.ttf", "fonts", 0], ["", "Assets.xcassets", "icons", 1], ["", "Strings.swift", "copy", 0]],
  fields: [["Product", "Rolyn"], ["Style", "Meadow"], ["Film", "iOS, 46.5 s, 129 BPM"], ["Music", "Digital Clouds, Mixkit"], ["Voice", "English, Chatterbox"]],
  title: null,
};

function briefClock() {
  const P = FILM.P, open = BAR(9) - 0.44;
  return {
    open, head: open + 0.5, sub: open + 0.8,
    rows: [0, 1, 2, 3, 4].map((i) => BT(9, 2) + (i * P) / 3),
    flow: BT(10, 1),
    swap: [0, 1, 2, 3, 4].map((i) => BT(10, 1) + 0.15 + i * 0.05),
    types: [0, 1, 2, 3, 4].map((i) => BT(10, 1) + 0.28 + i * 0.05),
    cap: BT(9, 4) + 0.2,
    approve: BT(10, 3),
    out: BT(10, 4) + 0.1,
  };
}

const briefRest = (v, t, t1) => (t >= t1 ? 1 : v);
const briefTY = (v) => (Math.abs(v) < 0.005 ? "none" : `translateY(${v.toFixed(2)}%)`);
const briefScale = (v, axis = "") => (Math.abs(v - 1) < 0.00005 ? "none" : `scale${axis}(${v.toFixed(4)})`);

const briefMono = (size, color, lh, extra = "") => `font-family:var(--mono);font-size:${size}px;line-height:${lh}px;color:${color};white-space:nowrap;${extra}`;

function briefIcon(folder) {
  const st = `fill="none" stroke="${BRIEF.ter}" stroke-width="1.6" stroke-linejoin="round"`;
  return folder
    ? `<svg width="26" height="22" viewBox="0 0 26 22" style="display:block"><path d="M1.8 4.3a2.5 2.5 0 0 1 2.5-2.5h5.2l2.6 3h9.6a2.5 2.5 0 0 1 2.5 2.5v11a2.5 2.5 0 0 1-2.5 2.5H4.3a2.5 2.5 0 0 1-2.5-2.5z" ${st}/></svg>`
    : `<svg width="22" height="26" viewBox="0 0 22 26" style="display:block"><path d="M4 1.8h9.2l6.8 6.8v13.9a1.7 1.7 0 0 1-1.7 1.7H4a1.7 1.7 0 0 1-1.7-1.7V3.5A1.7 1.7 0 0 1 4 1.8zM13 1.8v6.8h7" ${st}/></svg>`;
}

function briefFoot() {
  const B = BRIEF, fy = B.head + 5 * B.row + B.foot / 2;
  return {
    bar: { x: B.pad, y: fy - 2, w: B.w - 2 * B.pad, h: 4, r: 2 },
    btn: { x: B.w - B.pad - B.bw, y: fy - 32, w: B.bw, h: 64, r: 32 },
  };
}

shot({
  id: "brief",
  bars: [9, 10],
  bg: "var(--night)",
  tone: "light",
  enter: () => ({ kind: "fromRight", dur: 0.5, edge: { color: "#8B7CFF", w: 8 } }),
  build(id) {
    const B = BRIEF, iw = B.w - 2 * B.pad, H = B.head + 5 * B.row + B.foot, F = briefFoot();
    const cw = (tag) => Math.round(measure(tag, 24, 400, "font-family:var(--mono)")) + 34;
    const lw = 2 * Math.round(measure("Approve", 26, 700, "letter-spacing:-0.01em") / 2);
    const rows = B.files.map(([dir, name, tag, folder], i) => `
      <div class="abs mask" style="left:0;top:${B.head + i * B.row}px;width:${B.w}px;height:${B.row}px">
        <div class="abs" data-k="${id}_f${i}" style="left:${B.pad}px;top:0;width:${iw}px;height:${B.row}px">
          <div class="abs center" style="left:0;top:${(B.row - 26) / 2}px;width:26px;height:26px">${briefIcon(folder)}</div>
          <div class="abs" style="left:46px;top:${(B.row - 40) / 2}px;${briefMono(30, B.ink, 40)}"><span style="color:${B.ter}">${dir}</span>${name}</div>
          <div class="abs" data-k="${id}_c${i}" style="left:${iw - cw(tag)}px;top:${(B.row - 40) / 2}px;width:${cw(tag)}px;height:40px;padding:0 16px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);${briefMono(24, B.sub, 38)}">${tag}</div>
        </div>
        <div class="abs" data-k="${id}_g${i}" style="left:${B.pad}px;top:0;width:${iw}px;height:${B.row}px;line-height:${B.row}px;white-space:nowrap">
          <span style="display:inline-block;width:200px;font-family:var(--mono);font-size:26px;color:${B.ter}">${B.fields[i][0]}</span><span data-k="${id}_v${i}" style="font-family:var(--mono);font-size:30px;color:${B.ink}"></span>
        </div>
      </div>`).join("");
    const lines = [1, 2, 3, 4].map((i) => `<div class="abs" data-k="${id}_l${i}" style="left:${B.pad}px;top:${B.head + i * B.row}px;width:${iw}px;height:1px;background:rgba(255,255,255,0.07);transform-origin:0 0"></div>`).join("");
    const box = `left:0;top:0;width:${B.w}px;height:${H}px;border-radius:28px`;
    return `
      <div class="abs" style="left:96px;top:170px">${headline(id + "_h", "Reads\nyour *app.*", { size: 118, weight: 800, color: B.ink })}</div>
      <div class="abs mask" style="left:96px;top:470px;height:40px"><div data-k="${id}_sub" style="${briefMono(26, B.sub, 40)}">screens, tokens, fonts, icons, copy</div></div>
      <div class="abs" data-k="${id}_stage" style="left:${B.x}px;top:${B.y}px;width:${B.w}px;height:${H + 80}px">
        <div class="abs" style="${box};background:#151922"></div>
        <div class="abs mask" data-k="${id}_title" style="left:${B.pad}px;top:${(B.head - 30) / 2}px;width:240px;height:30px"></div>
        <div class="abs" style="left:0;top:${B.head}px;width:${B.w}px;height:1px;background:rgba(255,255,255,0.07)"></div>
        ${rows}${lines}
        <div class="abs" data-k="${id}_track" style="left:${F.bar.x}px;top:${F.bar.y}px;width:${F.bar.w}px;height:4px;border-radius:2px;background:rgba(255,255,255,0.07)"></div>
        <div class="abs center" data-k="${id}_btn" style="left:0;top:0;overflow:hidden">
          <span data-k="${id}_btnL" style="display:block;width:${lw}px;font-size:26px;font-weight:700;line-height:32px;letter-spacing:-0.01em;white-space:nowrap;color:#0D0F14">Approve</span>
          <svg class="abs" style="left:50%;top:50%;margin:-14px 0 0 -18px;overflow:visible" width="36" height="28"><path data-k="${id}_chk" d="M4 15 L13.5 24 L32 4" fill="none" stroke="#0D0F14" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="abs" data-k="${id}_edge" style="${box};border:1px solid rgba(255,255,255,0.08)"></div>
        <div class="abs" data-k="${id}_ok" style="${box};border:2px solid #53E0B4"></div>
        <div class="abs mask" style="left:0;top:${H + 36}px;width:${B.w}px;height:40px"><div data-k="${id}_cap" style="${briefMono(26, B.sub, 40)}">Nothing is built until you say so.</div></div>
      </div>`;
  },
  ready(id) {
    BRIEF.title = roller($[id + "_title"], `${briefMono(26, BRIEF.sub, 30)};font-weight:500;letter-spacing:0.14em`);
    BRIEF.chk = $[id + "_chk"].getTotalLength() + 2;
  },
  at(t) {
    const id = "brief", B = BRIEF, K = briefClock(), F = briefFoot();
    headlineAt(id + "_h", t, K.head);
    rise($[id + "_sub"], clamp(spring(t, K.sub, 0.42, 0.9), 0, 1.04));

    const dx = 110 * (1 - prog(t, K.open, 0.9, E.out)) - 1150 * prog(t, K.out, 0.55, E.in);
    setT($[id + "_stage"], Math.abs(dx) < 0.005 ? "none" : `translateX(${dx.toFixed(2)}px)`);

    roll(B.title, t, [{ t: 0, v: "REPO" }, { t: K.flow, v: "BRIEF" }], 0.36);

    for (let i = 0; i < 5; i++) {
      const pin = clamp(spring(t, K.rows[i], 0.42, 0.86), 0, 1.03);
      const po = prog(t, K.flow, 0.15, E.in), pn = prog(t, K.swap[i], 0.32, E.out);
      const f = $[`${id}_f${i}`], g = $[`${id}_g${i}`], c = $[`${id}_c${i}`];
      show(f, t >= K.rows[i] && po < 1);
      setT(f, briefTY((1 - pin) * 105 - po * 30));
      f.style.opacity = (1 - po).toFixed(3);
      const cp = briefRest(clamp(spring(t, K.rows[i] + 0.1, 0.3, 0.6), 0, 1.2), t, K.rows[i] + 0.7);
      setT(c, briefScale(lerp(0.7, 1, cp)));
      c.style.opacity = clamp(cp * 2.5).toFixed(3);
      show(g, pn > 0);
      setT(g, briefTY((1 - pn) * 35));
      g.style.opacity = pn.toFixed(3);
      typed($[`${id}_v${i}`], B.fields[i][1], t, K.types[i], 80);
      if (i < 4) setT($[`${id}_l${i + 1}`], briefScale(prog(t, K.rows[i] + 0.04, 0.5, E.out), "X"));
    }

    const fill = K.rows.reduce((s, r) => s + 0.2 * clamp(spring(t, r + 0.06, 0.34, 0.9), 0, 1), 0);
    const mp = t < K.flow ? 0 : briefRest(clamp(spring(t, K.flow, 0.42, 0.72), 0, 1.1), t, K.flow + 0.8);
    const btn = $[id + "_btn"];
    show(btn, fill > 0.001);
    rectCss(btn, mixRect({ ...F.bar, w: F.bar.w * fill }, F.btn, mp));
    btn.style.background = mixc(COL.lilac, COL.mint, clamp(mp * 1.4));
    setT(btn, briefScale(t >= K.approve + 0.45 ? 1 : press(t, K.approve, 0.93)));
    $[id + "_track"].style.opacity = (1 - prog(t, K.flow, 0.25)).toFixed(3);

    const lbl = $[id + "_btnL"];
    const lo = prog(t, K.approve + 0.05, 0.26, E.snappy);
    show(lbl, t >= K.flow + 0.2 && lo < 1);
    lbl.style.opacity = prog(t, K.flow + 0.2, 0.18).toFixed(3);
    setT(lbl, briefTY(-220 * lo));
    const chk = $[id + "_chk"], ct = K.approve + 0.09;
    show(chk, t >= ct);
    chk.style.strokeDasharray = `${B.chk.toFixed(1)} ${B.chk.toFixed(1)}`;
    chk.style.strokeDashoffset = (B.chk * (1 - prog(t, ct, 0.3, E.out))).toFixed(2);

    const ok = prog(t, K.approve + 0.06, 0.32, E.out);
    $[id + "_edge"].style.opacity = (1 - ok).toFixed(3);
    $[id + "_ok"].style.opacity = ok.toFixed(3);
    show($[id + "_ok"], ok > 0);

    rise($[id + "_cap"], clamp(spring(t, K.cap, 0.42, 0.9), 0, 1.04));
  },
  cues() {
    const K = briefClock();
    return [
      ...K.rows.map((r) => ["tick", r + 0.04, { gain: -9, pan: 0.35 }]),
      ["swish", K.flow - 0.04, { pan: 0.35, gain: -6 }],
      ...K.types.map((r) => ["tick", r, { gain: -12, pan: 0.35 }]),
      ["click", K.approve, { gain: 1, pan: 0.45 }],
      ["chime", K.approve + 0.09, { note: 7, gain: -4, pan: 0.3 }],
    ];
  },
});

const CHECK = {
  x: 924, y: 194, w: 900, h: 404, cx: 956, cw: 836, rowY: 284, rowH: 71,
  rows: ["no clocks, timers or randomness", "no page errors on any frame", "the loop closes", "same frame in any order"],
  cols: 16, nr: 9, gap: 6, stripY: 512, sw: 4.8, headH: 64, lineX: 956, total: 2700, dh: 110, dw: 57.6,
  ink: "#F2F4F8", ink2: "#A3ABBA", ink3: "#6B7384", dim: "#343A47", card: "#151922",
};
CHECK.tw = (CHECK.cw - (CHECK.cols - 1) * CHECK.gap) / CHECK.cols;
CHECK.th = (CHECK.tw * 9) / 16;

function checkClock() {
  const P = FILM.P;
  const close = BT(16, 4);
  return {
    ticks: [1, 2, 3, 4].map((b) => BT(15, b)), hl: BAR(15) + 0.06, hl2: BT(15, 4) + P / 2,
    fold: BT(16, 1), scan: BT(16, 1) + 0.2, scanD: 0.26, unspool: BT(16, 2), cnt: BT(16, 2) + 0.2,
    race0: BT(16, 2) + 0.41, race1: close - 0.13, out: close - 0.19, cout: close - 0.04, close, grow: close + 0.094,
  };
}

function checkTileCol(i) {
  const t = ((i + 0.5) * FILM.DURATION) / (CHECK.cols * CHECK.nr);
  const segs = [
    [BAR(3), COL.violet, COL.orange], [BAR(4), COL.orange, COL.ink], [BAR(5), COL.paper, COL.violet], [BAR(6), COL.violet, COL.white],
    [BAR(7), COL.deep, COL.lilac], [BAR(8), COL.paper, COL.ink], [BT(8, 2), COL.orange, COL.ink], [BT(8, 3), COL.mint, COL.ink],
    [BT(8, 4), COL.paper, COL.ink], [BAR(17), "#1E2331", COL.lilac], [BAR(23), COL.violet, COL.deep], [Infinity, COL.violet, COL.orange],
  ];
  const [, base, acc] = segs.find(([end]) => t < end);
  return `linear-gradient(135deg, ${base} 35%, ${mixc(base, acc, 0.38)})`;
}

function checkOdo(V, k, w = 0.35) {
  const unit = Math.pow(10, k), base = Math.floor(V / unit + 1e-9), lower = V - base * unit;
  const r = clamp((lower - (unit - w)) / w);
  return (base % 10) + r * r * (3 - 2 * r);
}

const checkIn = cubicBezier(0.32, 0, 0.67, 0);
const checkUp = (el, t, t0, resp = 0.42, ex = 0) => setT(el, `translateY(${((1 - clamp(spring(t, t0, resp, 0.9), 0, 1.04) - ex) * 135).toFixed(2)}%)`);

function checkLeave(key, t, t0) {
  const h = HL[key];
  for (let i = 0; i < h.words; i++) {
    const leave = prog(t, t0 + 0.02 * i, 0.24, checkIn);
    if (leave > 0) setT($[`${key}w${i}`], `translateY(${(-leave * 135).toFixed(2)}%)`);
  }
  h.marks.forEach(({ i, width }) => {
    const path = $[`${key}u${i}`], len = width * 1.05 + 6, leave = prog(t, t0, 0.18, checkIn);
    if (leave > 0) path.style.strokeDashoffset = (-len * leave).toFixed(2);
    show(path, Math.abs(parseFloat(path.style.strokeDashoffset)) < len - 0.5);
  });
}

shot({
  id: "check",
  bars: [15, 16],
  bg: "var(--night)",
  tone: "light",
  enter: { kind: "fromRight", dur: 0.5, edge: { color: "#8B7CFF", w: 8 } },
  build(id) {
    const C = CHECK;
    const mono = (size, color) => `font-family:var(--mono);font-size:${size}px;font-weight:500;color:${color}`;
    const passX = Math.round(C.cx + C.cw - measure("PASS", 22, 500, "font-family:var(--mono);letter-spacing:0.14em"));
    const rows = C.rows.map((txt, k) => {
      const y = C.rowY + C.rowH * k;
      return `<i class="abs" style="left:${C.cx}px;top:${y}px;width:${C.cw}px;height:1px;background:rgba(255,255,255,0.06)"></i>
        <i class="abs" style="left:${C.cx}px;top:${y + 21}px;width:32px;height:32px;border-radius:50%;border:2px solid rgba(255,255,255,0.18)"></i>
        <i class="abs" data-k="${id}_cd${k}" style="left:${C.cx}px;top:${y + 21}px;width:32px;height:32px;border-radius:50%;background:#53E0B4"></i>
        <svg class="abs" style="left:${C.cx}px;top:${y + 21}px;overflow:visible" width="32" height="32"><path data-k="${id}_cp${k}" d="M9.5 16.5 L14 21 L23 11.5" fill="none" stroke="#0D0F14" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="22 22"/></svg>
        <div class="abs t" data-k="${id}_ct${k}" style="left:${C.cx + 54}px;top:${y + 18}px;${mono(30, C.ink2)}">${txt}</div>
        <div class="abs mask" style="left:${passX}px;top:${y + 25}px;height:26px"><div class="t label" data-k="${id}_cs${k}" style="font-size:22px;color:#53E0B4">pass</div></div>`;
    }).join("");
    const tiles = Array.from({ length: C.cols * C.nr }, (_, i) => `<i class="abs" data-k="${id}_x${i}" style="left:0;top:0;width:${C.tw.toFixed(3)}px;height:${C.th.toFixed(3)}px;border-radius:4px;background:${checkTileCol(i)}"></i>`).join("");
    const cell = (i, key, inner) => `<span class="abs mask" style="left:${Math.round(C.cx + i * C.dw)}px;top:330px;width:${C.dw}px;height:${C.dh}px"><span class="abs mask" data-k="${id}_${key}" style="left:0;top:0;width:${C.dw}px;height:${C.dh}px">${inner}</span></span>`;
    const strip = (p) => cell(p === 3 ? 0 : 4 - p, `dc${p}`, `<span class="abs" data-k="${id}_d${p}" style="left:0;top:0;width:${C.dw}px">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => `<span style="display:block;height:${C.dh}px;line-height:${C.dh}px;${mono(96, "inherit")}">${d}</span>`).join("")}</span>`);
    return `
      <div class="abs" style="left:96px;top:170px">${headline(id + "_hl", "Checks\nevery *frame.*", { size: 118, weight: 800, color: C.ink })}</div>
      <div class="abs" style="left:96px;top:420px">${headline(id + "_h2", "Renders it.", { size: 118, weight: 800, color: C.ink })}</div>
      <div class="abs" data-k="${id}_card" style="left:${C.x}px;top:${C.y}px;width:${C.w}px;height:${C.h}px;border-radius:28px;background:${C.card};border:1px solid rgba(255,255,255,0.08)"></div>
      <div class="abs" data-k="${id}_in" style="left:0;top:0;width:${FILM.W}px;height:${FILM.H}px">
        <div class="abs" data-k="${id}_ti" style="left:${C.cx}px;top:${C.y + 28}px;width:400px;height:32px;overflow:hidden"></div>
        <div class="abs" data-k="${id}_tr" style="left:${C.cx + C.cw - 156}px;top:${C.y + 28}px;width:160px;height:32px;overflow:hidden"></div>
        <div class="abs" data-k="${id}_rows" style="left:0;top:0;width:${FILM.W}px;height:${FILM.H}px;transform-origin:0 ${C.rowY + 2 * C.rowH}px">${rows}</div>
        <div class="abs" data-k="${id}_sheet" style="left:0;top:0;width:${FILM.W}px;height:${FILM.H}px;transform-origin:0 ${C.rowY + 2 * C.rowH}px">${tiles}
          <i class="abs" data-k="${id}_scan" style="left:0;top:${C.rowY - 6}px;width:3px;height:${(C.nr * C.th + (C.nr - 1) * C.gap + 12).toFixed(1)}px;border-radius:2px;background:#53E0B4"></i>
        </div>
        <div class="abs mask" style="left:${C.cx}px;top:298px;height:28px"><div class="t label" data-k="${id}_fl" style="font-size:22px;color:${C.ink3}">frame</div></div>
        <div class="abs" data-k="${id}_num">${[0, 1, 2, 3].map((k) => strip(k)).join("")}${cell(1, "cm", `<span class="abs t" style="left:0;top:0;line-height:${C.dh}px;${mono(96, "inherit")}">,</span>`)}</div>
        <div class="abs mask" style="left:${C.cx + 5 * C.dw + 22}px;top:379px;height:52px"><div class="t" data-k="${id}_of" style="${mono(44, C.ink3)}">/ 2,700</div></div>
      </div>
      <i class="abs" data-k="${id}_line" style="left:${C.lineX}px;top:0;width:8px;height:0;background:#8B7CFF"></i>`;
  },
  ready(id) {
    const C = CHECK, K = (C.K = checkClock());
    const css = `font-family:var(--mono);font-size:26px;font-weight:500;color:${C.ink3};white-space:pre`;
    C.ti = roller($[id + "_ti"], css);
    C.tr = roller($[id + "_tr"], css);
    C.tiSteps = [{ t: -10, v: "check.mjs" }, { t: K.fold, v: "render.mjs" }];
    C.trSteps = [{ t: -10, v: "0 / 4" }, ...K.ticks.map((t, k) => ({ t, v: `${k + 1} / 4` })), { t: K.fold, v: "144 frames" }, { t: K.unspool, v: "60 fps" }].map((s) => ({ ...s, v: s.v.padStart(10, " ") }));
    HAND.check = { l: C.lineX, t: 0, r: FILM.W - C.lineX - 8, b: 0, rad: 0 };
  },
  at(t) {
    const id = "check", C = CHECK, K = C.K;
    headlineAt(id + "_hl", t, K.hl);
    headlineAt(id + "_h2", t, K.hl2);
    checkLeave(id + "_hl", t, K.out);
    checkLeave(id + "_h2", t, K.out + 0.03);
    roll(C.ti, t, C.tiSteps, 0.26);
    roll(C.tr, t, C.trSteps, 0.2);

    K.ticks.forEach((t0, k) => {
      const on = t >= t0;
      setT($[`${id}_cd${k}`], `scale(${(on ? clamp(spring(t, t0, 0.3, 0.6), 0, 1.15) : 0).toFixed(4)})`);
      $[`${id}_cp${k}`].style.strokeDashoffset = (22 * (1 - prog(t, t0 + 0.06, 0.18, E.out))).toFixed(2);
      $[`${id}_ct${k}`].style.color = mixc(C.ink2, C.ink, prog(t, t0, 0.25, E.out));
      checkUp($[`${id}_cs${k}`], t, t0 + 0.04);
    });

    const fold = checkIn(clamp((t - K.fold) / 0.09));
    show($[id + "_rows"], t < K.fold + 0.09);
    setT($[id + "_rows"], fold > 0 ? `scaleY(${(1 - 0.97 * fold).toFixed(4)})` : "none");
    $[id + "_rows"].style.opacity = (1 - fold).toFixed(3);
    const sheetOn = t >= K.fold + 0.08, sy = 0.03 + 0.97 * clamp(spring(t, K.fold + 0.08, 0.3, 0.78), 0, 1.04);
    show($[id + "_sheet"], sheetOn);
    setT($[id + "_sheet"], sheetOn && Math.abs(sy - 1) > 0.0005 ? `scaleY(${sy.toFixed(4)})` : "none");
    $[id + "_sheet"].style.opacity = clamp((t - K.fold - 0.08) / 0.05).toFixed(3);

    const sp = clamp((t - K.scan) / K.scanD);
    show($[id + "_scan"], sp > 0 && sp < 1);
    setT($[id + "_scan"], `translateX(${(C.cx - 1.5 + C.cw * sp).toFixed(2)}px)`);

    const race = cubicBezier(0.45, 0, 0.15, 1)(clamp((t - K.race0) / (K.race1 - K.race0)));
    const shrink = 1 - checkIn(clamp((t - K.close) / 0.09));
    const headX = C.cx + race * (C.cw - 8);
    const n = C.cols * C.nr, slot = C.cw / n;
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / C.cols), c = i % C.cols;
      const sx0 = C.cx + c * (C.tw + C.gap), sy0 = C.rowY + r * (C.th + C.gap);
      const outAt = K.scan + (K.scanD * (c + 0.5)) / C.cols + r * 0.012;
      const pop = 1 + 0.1 * bump((t - outAt) / 0.16);
      const ux = E.inOut(clamp((t - (K.unspool + 0.008 * r)) / 0.12));
      const uy = E.inOut(clamp((t - (K.unspool + 0.08 + 0.008 * r)) / 0.16));
      const x1 = C.cx + i * slot;
      let x = lerp(sx0, x1, ux), w = lerp(C.tw, C.sw, ux);
      const y = lerp(sy0, C.stripY, uy);
      x = C.cx + (x - C.cx) * shrink;
      w *= shrink;
      const sc = lerp(pop, 1, ux), W = w * sc, Ht = C.th * sc;
      const el = $[`${id}_x${i}`];
      el.style.left = px(x - (W - w) / 2);
      el.style.top = px(y - (Ht - C.th) / 2);
      el.style.width = px(Math.max(0, W));
      el.style.height = px(Ht);
      el.style.borderRadius = px(Math.min(4, W / 2));
      const lit = clamp((headX + 8 - x1) / 10);
      el.style.opacity = (lerp(1, 0.4, uy) + 0.6 * lit * (t >= K.race0 ? 1 : 0)).toFixed(3);
      el.style.boxShadow = t >= outAt && ux < 0.999 ? `inset 0 0 0 2px rgba(83,224,180,${(1 - ux).toFixed(3)})` : "none";
    }

    const cIn = t >= K.cnt ? clamp(spring(t, K.cnt, 0.28, 0.9), 0, 1.04) : 0;
    const V = C.total * race, ex = checkIn(clamp((t - K.cout) / 0.12));
    for (let p = 0; p < 4; p++) {
      const el = $[`${id}_d${p}`], unit = Math.pow(10, p);
      const pos = checkOdo(V, p);
      setT(el, `translateY(${(-pos * C.dh).toFixed(2)}px)`);
      setT($[`${id}_dc${p}`], `translateY(${(C.dh * ((1 - cIn) * 1.2 - 1.25 * ex)).toFixed(2)}px)`);
      el.style.color = p === 0 ? C.ink : mixc(C.dim, C.ink, clamp(V / unit));
    }
    $[id + "_cm"].style.color = mixc(C.dim, C.ink, clamp(V / 1000));
    setT($[id + "_cm"], `translateY(${(C.dh * ((1 - cIn) * 1.2 - 1.25 * ex)).toFixed(2)}px)`);
    checkUp($[id + "_fl"], t, K.cnt, 0.28, ex);
    checkUp($[id + "_of"], t, K.cnt + 0.04, 0.28, ex);

    const q = checkIn(clamp((t - K.close) / 0.11));
    const head = { x: C.lineX, y: C.stripY + C.th / 2 - C.headH / 2, w: 8, h: C.headH, r: 0 };
    const rc = mixRect({ x: C.x, y: C.y, w: C.w, h: C.h, r: 28 }, head, q);
    rectCss($[id + "_card"], rc);
    $[id + "_card"].style.borderColor = `rgba(255,255,255,${(0.08 * (1 - q)).toFixed(3)})`;
    show($[id + "_card"], q < 1);
    show($[id + "_in"], q < 1);
    $[id + "_in"].style.clipPath = `inset(${rc.y.toFixed(2)}px ${(FILM.W - rc.x - rc.w).toFixed(2)}px ${(FILM.H - rc.y - rc.h).toFixed(2)}px ${rc.x.toFixed(2)}px round ${rc.r.toFixed(2)}px)`;

    const hIn = t >= K.race0 - 0.14 ? clamp(spring(t, K.race0 - 0.14, 0.3, 0.8), 0, 1.05) : 0;
    const g = E.out(clamp((t - K.grow) / 0.09));
    const hh = C.headH * hIn, hx = C.cx + (headX - C.cx) * shrink;
    const top = lerp(head.y + (C.headH - hh) / 2, 0, g), bot = lerp(head.y + (C.headH + hh) / 2, FILM.H, g);
    const ln = $[id + "_line"];
    ln.style.left = px(g > 0 ? C.lineX : hx);
    ln.style.top = px(top);
    ln.style.height = px(Math.max(0, bot - top));
    show(ln, hh > 0.5 || g > 0);
  },
  cues() {
    const K = checkClock();
    return [
      ...K.ticks.map((t0, k) => ["blip", t0, { note: 2 + k, gain: -3 }]),
      ["thud", K.fold, { gain: -4 }],
      ["swish", K.scan, { gain: -8 }],
      ["click", K.unspool + 0.34, { gain: -4 }],
      ["pop", K.race1, { note: 9, gain: -2 }],
      ["swish", K.close, { gain: -3 }],
    ];
  },
});

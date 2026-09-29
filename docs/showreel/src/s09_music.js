const MUSIC = {
  x: 824, y: 194, w: 1000, h: 560, left: 68, pitch: 9, bw: 6, top: 132, head: 56, area: 320, n: 96,
  ink: "#F2F4F8", sub: "#A3ABBA", ter: "#6B7384", dot: "#3A3E45", bar: "#E6E9EF", e: null, marks: [0, 4, 8, 12, 16, 20],
};

function musicClock() {
  const open = BAR(11) - 0.44, s0 = BT(11, 2), L = 4.5 * FILM.P;
  return { open, head: open + 0.5, sub: open + 0.8, cap: open + 0.95, s0, L, drop: s0 + (64 / 96) * L, out: BT(12, 4) + 0.1 };
}

function musicWave() {
  const W = window.WAVE;
  if (Array.isArray(W) && W.length >= 96) return W.slice(0, 96).map((v) => clamp(Number(v) || 0));
  return Array.from({ length: 96 }, (_, i) => {
    let base;
    if (i < 32) base = 0.2 + 0.06 * (i / 31);
    else if (i < 64) base = 0.3 + 0.3 * Math.pow((i - 32) / 31, 1.4);
    else if (i < 88) base = 0.9;
    else base = 0.84 - 0.62 * ((i - 88) / 7);
    const tex = i >= 64 && i < 88 ? 0.86 + 0.14 * hash(i + 11) : 0.7 + 0.45 * hash(i + 11);
    return clamp(base * tex * (i % 4 === 0 ? 1.1 : 1) * (i === 63 ? 0.35 : 1), 0.05, 1);
  });
}

function musicRuler(id) {
  const M = MUSIC;
  return M.marks.map((k, j) => `<div class="abs mask" style="left:${M.left + 36 * k}px;top:${M.top + M.area + 20}px;height:32px"><div data-k="${id}_r${j}" style="${musicMono(24, M.ter, 32)}">${j ? k + 1 : "bar 1"}</div></div>`).join("");
}

const musicRest = (v, t, t1) => (t >= t1 ? 1 : v);
const musicScale = (v, axis = "") => (Math.abs(v - 1) < 0.00005 ? "none" : `scale${axis}(${v.toFixed(4)})`);

const musicMono = (size, color, lh, extra = "") => `font-family:var(--mono);font-size:${size}px;line-height:${lh}px;color:${color};white-space:nowrap;${extra}`;

shot({
  id: "music",
  bars: [11, 12],
  bg: "var(--night)",
  tone: "light",
  enter: () => ({ kind: "fromRight", dur: 0.5, edge: { color: "#8B7CFF", w: 8 } }),
  build(id) {
    const M = MUSIC, mid = M.top + M.area / 2;
    const grid = Array.from({ length: 25 }, (_, k) => `<div class="abs" data-k="${id}_g${k}" style="left:${M.left + 36 * k}px;top:${M.top}px;width:1px;height:${M.area}px"></div>`).join("");
    const bars = Array.from({ length: M.n }, (_, i) => `<div class="abs" data-k="${id}_b${i}" style="left:${M.left + 2 + M.pitch * i}px;top:${mid - 3}px;width:${M.bw}px;height:6px;border-radius:3px;background:${M.dot}"></div>`).join("");
    const digits = [..."128.0"].map((ch, k) => `<span data-k="${id}_d${k}" style="display:inline-block">${ch}</span>`).join("");
    const dropX = M.left + 36 * 16;
    return `
      <div class="abs" style="left:96px;top:170px">${headline(id + "_h", "Makes\nthe *music.*", { size: 118, weight: 800, color: M.ink })}</div>
      <div class="abs mask" style="left:96px;top:470px;height:40px"><div data-k="${id}_sub" style="${musicMono(26, M.sub, 40)}">original, on your Mac</div></div>
      <div class="abs" data-k="${id}_stage" style="left:${M.x}px;top:${M.y}px;width:${M.w}px;height:${M.h + 80}px">
        <div class="abs" style="left:0;top:0;width:${M.w}px;height:${M.h}px;border-radius:28px;background:#151922;border:1px solid rgba(255,255,255,0.08)"></div>
        <div class="abs mask" style="left:${M.left}px;top:${M.head}px;height:40px;font-family:var(--mono);font-size:30px;line-height:36px;white-space:nowrap"><span style="color:${M.ink}">${digits}</span><span data-k="${id}_bpm" style="display:inline-block;margin-left:12px;font-size:24px;letter-spacing:0.14em;font-weight:500;color:${M.ter}">BPM</span></div>
        <div class="abs" style="left:${M.w - M.left - Math.round(measure("24 bars", 24, 400, "font-family:var(--mono)"))}px;top:${M.head}px;height:40px;font-family:var(--mono);font-size:30px;line-height:36px;white-space:nowrap"><span style="font-size:24px;color:${M.ter}">24 bars</span></div>
        ${grid}${bars}
        <div class="abs" data-k="${id}_dl" style="left:${dropX}px;top:${M.head + 38}px;width:2px;height:${M.top + M.area - M.head - 38}px;background:${COL.mint};transform-origin:50% 0"></div>
        <div class="abs" data-k="${id}_df" style="left:${dropX}px;top:${M.head - 2}px;height:40px;padding:0 15px;border-radius:4px 20px 20px 4px;background:${COL.mint};transform-origin:0 100%;${musicMono(26, "#0D0F14", 40, "font-weight:600")}">drop</div>
        <div class="abs" data-k="${id}_ph" style="left:0;top:${M.top}px;width:2px;height:${M.area}px">
          <div class="abs" data-k="${id}_pl" style="left:0;top:0;width:2px;height:${M.area}px;background:${COL.lilac}"></div>
          <div class="abs" data-k="${id}_pk" style="left:-5px;top:-6px;width:12px;height:12px;border-radius:6px;background:${COL.lilac}"></div>
        </div>
        ${musicRuler(id)}
        <div class="abs mask" style="left:0;top:${M.h + 36}px;width:${M.w}px;height:40px"><div data-k="${id}_cap" style="${musicMono(26, M.sub, 40)}">ACE-Step, local, about 3 minutes a take</div></div>
      </div>`;
  },
  ready() {
    MUSIC.e = musicWave();
  },
  at(t) {
    const id = "music", M = MUSIC, K = musicClock(), span = M.pitch * M.n, mid = M.top + M.area / 2;
    headlineAt(id + "_h", t, K.head);
    rise($[id + "_sub"], clamp(spring(t, K.sub, 0.42, 0.9), 0, 1.04));

    const dx = 110 * (1 - prog(t, K.open, 0.9, E.out)) - 1250 * prog(t, K.out, 0.55, E.in);
    setT($[id + "_stage"], Math.abs(dx) < 0.005 ? "none" : `translateX(${dx.toFixed(2)}px)`);

    for (let k = 0; k < 5; k++) rise($[`${id}_d${k}`], clamp(spring(t, K.s0 - 0.1 + k * 0.035, 0.4, 0.82), 0, 1.03));
    rise($[id + "_bpm"], clamp(spring(t, K.s0 + 0.1, 0.4, 0.82), 0, 1.03));
    MUSIC.marks.forEach((k, j) => rise($[`${id}_r${j}`], clamp(spring(t, K.s0 + ((4 * k) / M.n) * K.L, 0.4, 0.82), 0, 1.03)));

    for (let k = 0; k < 25; k++) {
      const tk = K.s0 + ((4 * k) / M.n) * K.L;
      const a = (k % 4 === 0 ? 0.14 : 0.055) + (t >= tk ? 0.22 * Math.exp(-(t - tk) * 7) : 0);
      $[`${id}_g${k}`].style.background = `rgba(255,255,255,${a.toFixed(3)})`;
    }

    for (let i = 0; i < M.n; i++) {
      const ti = K.s0 + ((i + 0.5) / M.n) * K.L, el = $[`${id}_b${i}`];
      const full = 6 + (M.area - 16) * M.e[i];
      const h = t < ti ? 6 : lerp(6, full, clamp(spring(t, ti, 0.26, 0.58), 0, 1.25));
      el.style.top = (mid - h / 2).toFixed(2) + "px";
      el.style.height = h.toFixed(2) + "px";
      el.style.background = t < ti ? M.dot : mixc(M.dot, i >= 64 ? COL.mint : M.bar, prog(t, ti, 0.12, E.out));
    }

    const ph = $[id + "_ph"], pa = K.s0 - 0.16;
    show(ph, t >= pa);
    setT(ph, `translateX(${(M.left + span * clamp((t - K.s0) / K.L) - 0.5).toFixed(2)}px)`);
    const grow = musicRest(clamp(spring(t, pa, 0.3, 0.8), 0, 1.04), t, pa + 0.8);
    setT($[id + "_pl"], musicScale(grow, "Y"));
    const ky = (1 - clamp(grow)) * M.area * 0.5, ks = musicRest(clamp(spring(t, pa + 0.08, 0.3, 0.6), 0, 1.2), t, pa + 0.9);
    setT($[id + "_pk"], ky < 0.005 && ks === 1 ? "none" : `translateY(${ky.toFixed(2)}px) scale(${ks.toFixed(4)})`);

    const dp = musicRest(clamp(spring(t, K.drop, 0.34, 0.7), 0, 1.06), t, K.drop + 0.6), fp = musicRest(clamp(spring(t, K.drop + 0.04, 0.32, 0.55), 0, 1.2), t, K.drop + 0.6);
    show($[id + "_dl"], t >= K.drop);
    show($[id + "_df"], t >= K.drop + 0.04);
    setT($[id + "_dl"], musicScale(dp, "Y"));
    setT($[id + "_df"], musicScale(fp));

    rise($[id + "_cap"], clamp(spring(t, K.cap, 0.42, 0.9), 0, 1.04));
  },
  cues() {
    const K = musicClock();
    return [
      ["tick", K.s0 - 0.04, { gain: -5, pan: 0.2 }],
      ["thud", K.drop, { gain: 1, pan: 0.15 }],
      ["pop", K.drop + 0.04, { note: 7, gain: -5, pan: 0.2 }],
    ];
  },
});

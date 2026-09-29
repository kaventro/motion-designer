const SEEK = {
  x0: 884, w: 940, sy: 191, cy: 330, ch: 130, py: 500, pw: 560, ph: 315,
  tx: 920, tw: 868, ty: 420, len: 45, thumb: 270 / 560, ax: 884, bx: 1264, mx: 1074, ay: 582,
  bars: [50, 64, 40, 58, 46], hop: 0.994, ph0: 0.0322, ball: 54, lift: 112,
  ink: "#F2F4F8", ink2: "#A3ABBA", ink3: "#6B7384", card: "#151922",
};

const seekX = (T) => SEEK.tx + (SEEK.tw * T) / SEEK.len;

function seekClock() {
  const P = FILM.P, b = BAR(13);
  const J = [[0, 12.4], [1, 41.6], [2, 3.2], [3, 27.8], [3.5, 41.6], [4, 27.8]].map(([k, v]) => ({ t: b + k * P, v }));
  return { J, hl: b + 0.06, split: J[3].t + 0.05, deal: J[3].t + 0.17, cap: J[3].t + 0.05, fwd: J[3].t + 0.34, back: J[5].t + 0.1, ok: J[5].t + 0.06 };
}

function seekPic(k) {
  const bars = SEEK.bars.map((h, i) => {
    const x = 424 + i * 24;
    return `<i class="abs" style="left:${x}px;top:${100 - h}px;width:14px;height:${h}px;border-radius:3px;background:rgba(255,255,255,0.16)"></i><i class="abs" data-k="${k}b${i}" style="left:${x}px;top:${100 - h}px;width:14px;height:${h}px;border-radius:3px;background:#FFFFFF;transform-origin:50% 100%"></i>`;
  }).join("");
  return `<div class="abs" data-k="${k}" style="left:0;top:0;width:560px;height:315px;border-radius:18px;overflow:hidden;background:#5B47F0;transform-origin:0 0">
    <span class="abs t mono" data-k="${k}tc" style="left:26px;top:18px;font-size:26px;font-weight:500;letter-spacing:0.02em;color:rgba(255,255,255,0.92)"></span>
    ${bars}
    <i class="abs" style="left:26px;top:262px;width:508px;height:3px;border-radius:2px;background:rgba(255,255,255,0.5)"></i>
    <i class="abs" data-k="${k}sh" style="left:0;top:259px;width:52px;height:10px;border-radius:50%;background:rgba(19,9,70,0.5)"></i>
    <div class="abs" data-k="${k}ball" style="left:0;top:0;width:${SEEK.ball}px;height:${SEEK.ball}px;border-radius:50%;background:#E0703A;overflow:hidden;transform-origin:50% 100%"><i class="abs" style="left:10px;top:7px;width:18px;height:11px;border-radius:50%;background:rgba(255,255,255,0.32);transform:rotate(-24deg)"></i></div>
    <i class="abs" data-k="${k}ok" style="left:0;top:0;width:560px;height:315px;border-radius:18px;border:4px solid #53E0B4"></i>
  </div>`;
}

function seekPicAt(k, T) {
  const f = Math.round(T * 60);
  const tc = `00:${String(Math.floor(f / 60)).padStart(2, "0")}:${String(f % 60).padStart(2, "0")}`;
  if ($[k + "tc"].textContent !== tc) $[k + "tc"].textContent = tc;
  SEEK.bars.forEach((h, i) => setT($[`${k}b${i}`], `scaleY(${clamp((T - 9 * i) / 9).toFixed(4)})`));
  const ph = (((T / SEEK.hop + SEEK.ph0) % 1) + 1) % 1, w = 0.07;
  let lift = 0, sq = 0, st = 0;
  if (ph < w || ph > 1 - w) sq = Math.sin((Math.PI * ((ph + w) % 1)) / (2 * w));
  else {
    const q = (ph - w) / (1 - 2 * w);
    lift = 4 * q * (1 - q);
    st = Math.pow(Math.abs(1 - 2 * q), 1.6);
  }
  const sy = 1 + 0.2 * st - 0.3 * sq, sx = 1 - 0.1 * st + 0.36 * sq;
  const r = SEEK.ball / 2, x = 26 + r + (508 - 2 * r) * clamp(T / SEEK.len);
  setT($[k + "ball"], `translate(${(x - r).toFixed(2)}px,${(262 - 2 * r - SEEK.lift * lift).toFixed(2)}px) scale(${sx.toFixed(4)},${sy.toFixed(4)})`);
  const s = 1 - 0.55 * lift;
  setT($[k + "sh"], `translate(${(x - 26).toFixed(2)}px,0px) scale(${(s * (1 + 0.3 * sq)).toFixed(4)},${s.toFixed(4)})`);
  $[k + "sh"].style.opacity = (0.35 + 0.65 * s).toFixed(3);
}

function seekHandle(t) {
  const K = SEEK.K;
  return track(t, seekX(0), K.J.map((j, i) => ({ t: j.t, to: seekX(j.v), spring: i > 3 ? [0.22, 0.74] : [0.3, 0.68] })));
}

shot({
  id: "seek",
  bars: [13, 14],
  bg: "var(--night)",
  tone: "light",
  enter: { kind: "fromRight", dur: 0.5, edge: { color: "#8B7CFF", w: 8 } },
  build(id) {
    const S = SEEK;
    const ticks = Array.from({ length: 25 }, (_, i) => {
      const big = i % 4 === 0, h = big ? 16 : 8, x = S.tx + (S.tw * i) / 24;
      return `<i class="abs" style="left:${(x - 1).toFixed(2)}px;top:${S.ty - h / 2}px;width:2px;height:${h}px;border-radius:1px;background:rgba(255,255,255,${big ? 0.24 : 0.12})"></i>`;
    }).join("");
    const mono = (size, color) => `font-family:var(--mono);font-size:${size}px;font-weight:500;color:${color}`;
    return `
      <div class="abs" style="left:96px;top:170px">${headline(id + "_hl", "Every frame\nis a function\nof *time.*", { size: 118, weight: 800, color: S.ink })}</div>
      <div class="abs mask" style="left:96px;top:600px;height:32px"><div class="t" data-k="${id}_cap" style="${mono(26, S.ink2)}">same pixels, any order</div></div>
      <div class="abs t" style="left:${S.x0}px;top:${S.sy}px;${mono(96, S.ink)};font-weight:600;letter-spacing:-0.02em">seek(<span data-k="${id}_st">t</span>)</div>
      <div class="abs" style="left:${S.x0}px;top:${S.cy}px;width:${S.w}px;height:${S.ch}px;border-radius:28px;background:${S.card};border:1px solid rgba(255,255,255,0.08)"></div>
      <div class="abs t" style="left:${S.tx}px;top:${S.cy + 26}px;${mono(30, S.ink)};white-space:pre">t =</div>
      <div class="abs" data-k="${id}_ro" style="left:${S.tx + 72}px;top:${S.cy + 26}px;width:90px;height:38px;overflow:hidden"></div>
      <div class="abs t" style="left:${S.tx + 180}px;top:${S.cy + 26}px;${mono(30, S.ink)}">s</div>
      <div class="abs t" style="right:${FILM.W - S.tx - S.tw}px;top:${S.cy + 26}px;${mono(30, S.ink3)}">45.00 s</div>
      <i class="abs" style="left:${S.tx}px;top:${S.ty - 1}px;width:${S.tw}px;height:2px;background:rgba(255,255,255,0.12)"></i>
      ${ticks}
      <i class="abs" data-k="${id}_pl" style="left:${S.tx}px;top:${S.ty - 1}px;width:0;height:2px;background:rgba(255,255,255,0.45)"></i>
      <i class="abs" data-k="${id}_hd" style="left:0;top:0;width:28px;height:28px;border-radius:50%;background:#E0703A;box-shadow:0 0 0 3px ${S.card}"></i>
      ${seekPic(id + "_pa")}${seekPic(id + "_pv")}
      <div class="abs mask" style="left:${S.ax}px;top:752px;height:30px"><div class="t label" data-k="${id}_lf" style="font-size:24px;color:${S.ink2}">forward</div></div>
      <div class="abs mask" style="left:${S.bx}px;top:752px;height:30px"><div class="t label" data-k="${id}_lb" style="font-size:24px;color:${S.ink2}">backward</div></div>
      <svg class="abs" data-k="${id}_ok" style="left:${(S.ax + 270 + S.bx) / 2 - 30}px;top:${S.ay + 76 - 30}px;overflow:visible;transform-origin:30px 30px" width="60" height="60"><circle cx="30" cy="30" r="28" fill="#53E0B4"/><path data-k="${id}_okp" d="M18 31 L26.5 39.5 L43 22" fill="none" stroke="#0D0F14" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="40 40"/></svg>`;
  },
  ready(id) {
    SEEK.K = seekClock();
    SEEK.ro = roller($[id + "_ro"], `font-family:var(--mono);font-size:30px;font-weight:500;white-space:pre`);
    SEEK.steps = [{ t: -10, v: " 0.00" }, ...SEEK.K.J.map((j) => ({ t: j.t, v: j.v.toFixed(2).padStart(5, " ") }))];
  },
  at(t) {
    const id = "seek", S = SEEK, K = S.K;
    headlineAt(id + "_hl", t, K.hl);
    HL[id + "_hl"].marks.forEach(({ i }) => {
      const path = $[`${id}_hlu${i}`];
      show(path, parseFloat(path.style.strokeDashoffset) < parseFloat(path.style.strokeDasharray) - 0.5);
    });

    let last = null;
    for (const j of K.J) if (t >= j.t) last = j;
    const since = last ? t - last.t : 9;
    const now = mixc(COL.orange, S.ink, E.out(clamp(since / 0.5)));
    $[id + "_st"].style.color = now;
    roll(S.ro, t, S.steps, 0.2);
    S.ro.a.style.color = now;
    S.ro.b.style.color = now;

    const h = 1 / 600, x = seekHandle(t), xa = seekHandle(t - h), xb = seekHandle(t + h);
    const v = (xb - xa) / (2 * h), acc = (xb - 2 * x + xa) / (h * h);
    const e = clamp(Math.abs(v) / 5200 + (acc * Math.sign(v)) / 900000, -0.3, 0.55);
    setT($[id + "_hd"], `translate(${(x - 14).toFixed(2)}px,${(S.ty - 14).toFixed(2)}px) scale(${(1 + e).toFixed(4)},${(1 / (1 + e)).toFixed(4)})`);
    $[id + "_pl"].style.width = px(Math.max(0, x - S.tx));

    seekPicAt(id + "_pv", last ? last.v : 0);
    seekPicAt(id + "_pa", 27.8);
    const p1 = clamp(spring(t, K.split, 0.3, 0.92), 0, 1), p2 = clamp(spring(t, K.deal, 0.32, 0.72), 0, 1.1);
    const mx = lerp(S.x0, S.mx, p1), my = lerp(S.py, S.ay, p1), ms = lerp(1, S.thumb, p1);
    const place = (el, tx) => setT(el, `translate(${(mx + (tx - S.mx) * p2).toFixed(2)}px,${my.toFixed(2)}px) scale(${ms.toFixed(4)})`);
    place($[id + "_pv"], S.bx);
    place($[id + "_pa"], S.ax);
    show($[id + "_pa"], t >= K.split);
    const ok = prog(t, K.ok + 0.04, 0.25, E.out);
    $[id + "_pvok"].style.opacity = ok.toFixed(3);
    $[id + "_paok"].style.opacity = ok.toFixed(3);

    const up = (el, t0) => setT(el, `translateY(${((1 - clamp(spring(t, t0, 0.42, 0.9), 0, 1.04)) * 135).toFixed(2)}%)`);
    up($[id + "_cap"], K.cap);
    up($[id + "_lf"], K.fwd);
    up($[id + "_lb"], K.back);

    const okS = t >= K.ok ? clamp(spring(t, K.ok, 0.34, 0.55), 0, 1.2) : 0;
    show($[id + "_ok"], t >= K.ok);
    setT($[id + "_ok"], `scale(${okS.toFixed(4)})`);
    $[id + "_okp"].style.strokeDashoffset = (40 * (1 - prog(t, K.ok + 0.08, 0.22, E.out))).toFixed(2);
  },
  cues() {
    const K = seekClock();
    return [
      ...K.J.map((j, i) => ["blip", j.t, { note: Math.round((j.v / 45) * 9), gain: i > 3 ? -7 : -3 }]),
      ["swish", K.split, { gain: -8 }],
      ["chime", K.ok, { note: 4, gain: -5 }],
    ];
  },
});

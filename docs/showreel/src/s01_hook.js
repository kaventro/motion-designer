const HOOK = { size: 208, top: 392, pw: 250, rest: { x: 250, y: 880 }, tops: [0.6, 0.76, 0.78, 0.76, 0.6], syl: ["mo", "tion-", "de", "sign", "er"], contact: 0.11, G: null };

function hookClock() {
  const land = [1, 2, 3, 4, 5].map((n) => BT(1, 1 + n));
  const jump = BT(1, 7) + 0.28, slam = BT(3, 1) - 0.45 + 0.06;
  return { land, jump, slam, wave: land[4] + 0.05, tag: BT(1, 5) + 0.05, hi: BT(1, 3) - 0.09 };
}

function hookPath(t, way) {
  const n = way.length;
  let k = 0;
  while (k < n - 1 && t >= way[k + 1].t) k++;
  const a = way[k];
  if (k >= n - 1) return { x: a.x, y: a.y, sq: -0.28 * bump((t - a.t) / 0.22), lean: 0, lift: 0, air: 0, dx: 0 };
  const b = way[k + 1];
  const takeoff = a.take ?? (k === 0 ? 0.13 : a.t + HOOK.contact);
  if (t < takeoff) {
    const rest = takeoff - a.t, aw = k === 0 ? takeoff : 0.16;
    let sq = k > 0 ? -0.28 * bump((t - a.t) / (2 * HOOK.contact)) : 0;
    if (k === 0 || rest > 0.25) sq += -0.22 * E.in(clamp((t - (takeoff - aw)) / aw));
    return { x: a.x, y: a.y, sq, lean: 0, lift: 0, air: 0, dx: b.x - a.x };
  }
  const u = clamp((t - takeoff) / (b.t - takeoff));
  const dx = b.x - a.x;
  const apex = b.apex + Math.max(0, a.y - b.y) * 0.25;
  const arc = 4 * apex * u * (1 - u);
  const sq = 0.13 * (1 - E.out(clamp(u * 3))) + 0.1 * E.in(clamp((u - 0.68) / 0.32));
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), sq, lean: 6 * Math.sign(dx) * Math.sin(Math.PI * u), lift: arc, air: 1, dx };
}

shot({
  id: "hook",
  bars: [1, 3],
  bg: "var(--violet)",
  tone: "light",
  windows: () => [[-1, HOOK.out], [FILM.END - 0.8, FILM.END + 1]],
  build(id) {
    const words = ["Launch", "films", "for", "your", "app."].map((w, i) => `<span class="mask" style="padding-bottom:0.14em"><span class="t" data-k="${id}_tg${i}" style="font-weight:700">${w}</span></span>`).join("");
    return `
      <div class="abs" data-k="${id}_ring" style="left:960px;top:540px;width:100px;height:100px;margin:-50px 0 0 -50px;border-radius:50%;border:2px solid #fff"></div>
      <div class="abs mask" data-k="${id}_hiMask" style="left:0;top:${HOOK.top - 118}px;height:96px"><div class="t" data-k="${id}_hi" style="font-size:66px;font-weight:700;letter-spacing:-0.02em;color:#fff">Hi, I'm</div></div>
      <div class="abs row" data-k="${id}_name" style="left:0;top:${HOOK.top}px;font-size:${HOOK.size}px;font-weight:900;letter-spacing:-0.045em;white-space:nowrap">${HOOK.syl.map((s, j) => `<span data-k="${id}_s${j}" class="row" style="display:inline-flex">${letters(`${id}_l${j}_`, s)}</span>`).join("")}</div>
      <svg class="abs" data-k="${id}_swashBox" style="left:0;top:${HOOK.top + 246}px;overflow:visible" width="10" height="60"><path data-k="${id}_swash" fill="none" stroke="#E0703A" stroke-width="15" stroke-linecap="round"/></svg>
      <div class="abs row" data-k="${id}_tag" style="left:0;top:${HOOK.top + 330}px;gap:0.26em;font-size:78px;letter-spacing:-0.025em;color:#fff">${words}</div>
      ${pebble(id + "P", HOOK.pw)}`;
  },
  ready(id) {
    const stage = document.getElementById("stage");
    const k = stage.getBoundingClientRect().width / FILM.W || 1;
    const rel = (el) => {
      const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
      return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k };
    };
    const name = $[`${id}_name`];
    const nr = rel(name);
    const x0 = Math.round((FILM.W - nr.w) / 2);
    name.style.left = x0 + "px";
    const lettersRel = HOOK.syl.map((s, j) => [...s].map((_, i) => rel($[`${id}_l${j}_${i}`])));
    const baseline = HOOK.top + 0.9335 * HOOK.size;
    const sylC = lettersRel.map((ls) => (ls[0].x + ls[ls.length - 1].x + ls[ls.length - 1].w) / 2);
    const lx = lettersRel.flat().map((r) => r.x + r.w / 2);
    HOOK.G = { x0, w: nr.w, baseline, sylC, lx };
    $[`${id}_hiMask`].style.left = x0 + "px";
    $[`${id}_tag`].style.left = x0 + "px";
    const sw = $[`${id}_swashBox`];
    sw.style.left = x0 + "px";
    sw.setAttribute("width", nr.w.toFixed(1));
    HOOK.swashLen = nr.w * 1.06 + 10;
    $[`${id}_swash`].setAttribute("d", `M6 34 C${(nr.w * 0.22).toFixed(1)} 10 ${(nr.w * 0.6).toFixed(1)} -4 ${(nr.w - 8).toFixed(1)} 20`);
    HOOK.K = hookClock();
    HOOK.out = BT(3, 1) + 0.2;
    HOOK.way = [
      { t: 0, x: HOOK.rest.x, y: HOOK.rest.y },
      ...sylC.map((cx, j) => ({
        t: HOOK.K.land[j], x: cx, y: baseline - HOOK.tops[j] * HOOK.size,
        apex: j === 0 ? 210 : 60 + 0.1 * Math.abs(cx - sylC[j - 1]), take: j === 4 ? HOOK.K.jump : undefined,
      })),
      { t: HOOK.K.slam, x: sylC[4], y: baseline - HOOK.tops[4] * HOOK.size, apex: 200 },
    ];
    HOOK.way[0].apex = 0;
    HOOK.exitAt = { x: sylC[4], y: baseline - HOOK.tops[4] * HOOK.size };
    HAND.hook = { x: HOOK.exitAt.x, y: HOOK.exitAt.y, r0: 0 };
  },
  at(time) {
    const t = time > FILM.END - 1 ? time - FILM.END : time;
    const K0 = HOOK.K, G = HOOK.G, id = "hook";
    const beat = t / FILM.P + 1e-6, ph = beat - Math.floor(beat), strong = Math.floor(beat) % 4 === 0 ? 1 : 0.7;
    const rr = 90 + ph * 1250;
    const ring = $[id + "_ring"];
    ring.style.width = ring.style.height = px(rr * 2);
    ring.style.margin = `${-rr}px 0 0 ${-rr}px`;
    ring.style.opacity = (0.2 * strong * Math.pow(1 - ph, 1.6)).toFixed(3);

    setT($[id + "_hi"], `translateY(${((1 - clamp(spring(t, K0.hi, 0.5, 0.86), 0, 1.04)) * 135).toFixed(2)}%)`);

    const infl = (i, j) => Math.exp(-Math.abs(G.lx[i] - G.sylC[j]) / 300);
    let li = 0;
    HOOK.syl.forEach((s, j) => {
      const landed = t >= K0.land[j];
      const col = landed ? mixc(COL.orange, COL.white, E.out(clamp((t - K0.land[j]) / 0.5))) : "rgba(255,255,255,0.2)";
      [...s].forEach((_, i) => {
        const el = $[`${id}_l${j}_${i}`];
        let d = 0;
        for (let q = 0; q < 5; q++) d += infl(li, q) * offset(t, K0.land[q], 1, 9, 27);
        el.style.color = col;
        el.style.transformOrigin = "50% 82%";
        setT(el, `translateY(${(4 * d).toFixed(2)}px) scale(${(1 + 0.05 * d).toFixed(4)},${(1 - 0.2 * d).toFixed(4)})`);
        li++;
      });
    });

    const path = $[id + "_swash"];
    path.style.strokeDasharray = `${HOOK.swashLen.toFixed(1)} ${HOOK.swashLen.toFixed(1)}`;
    path.style.strokeDashoffset = (HOOK.swashLen * (1 - prog(t, K0.wave, 0.5, E.out))).toFixed(2);
    for (let i = 0; i < 5; i++) setT($[`${id}_tg${i}`], `translateY(${((1 - clamp(spring(t, K0.tag + i * 0.07, 0.42, 0.9), 0, 1.04)) * 135).toFixed(2)}%)`);

    const pose = hookPath(t, HOOK.way);
    const sinceLand = K0.land.reduce((m, l) => (t >= l ? Math.min(m, t - l) : m), 9);
    const jumping = t >= K0.jump && t < K0.slam ? 1 : 0;
    const wide = clamp(0.9 * bump(sinceLand / 0.45) + 0.9 * jumping + 0.9 * bump((t - K0.slam) / 0.4), 0, 1);
    const idle = 0.16 * Math.sin((2 * Math.PI * t) / (4 * FILM.P));
    const toward = clamp(pose.dx / 420, -1, 1) * 0.42 * (pose.air ? 1 : 0.4);
    const camLook = prog(t, K0.land[4] + 0.05, 0.25, E.out);
    const yaw = lerp(idle * (t < K0.land[0] ? 1 : 0.35) + (t < K0.land[4] ? toward : 0), 0, camLook);
    pebbleFace(id + "P", {
      yaw, pitch: lerp(pose.air ? -0.06 : 0, -0.04, camLook), eyaw: yaw * 1.25,
      happy: 0.45 + 0.4 * camLook + 0.25 * pose.air, wide, blink: blinkAt(t, [0.95, 2.62, 2.98]),
      sq: pose.sq + 0.013 * Math.sin((2 * Math.PI * t) / (4 * FILM.P)),
      lean: pose.lean, lift: pose.lift * (228 / HOOK.pw), shadow: pose.air ? 1 - clamp(pose.lift / 70) : 1,
    });
    pebbleAt(id + "P", pose.x, pose.y, 1);
  },
  cues() {
    const K0 = hookClock();
    const notes = [-5, -3, -1, 0, 2];
    return [
      ["hop", 0.13, { gain: -3 }],
      ...K0.land.map((t, j) => ["pop", t, { note: notes[j], gain: 1 }]),
      ...K0.land.slice(0, 4).map((t) => ["hop", t + HOOK.contact, { gain: -6 }]),
      ["swish", K0.wave],
      ["hop", K0.jump, { gain: -2 }],
      ["thud", K0.slam, { gain: 2 }],
    ];
  },
});

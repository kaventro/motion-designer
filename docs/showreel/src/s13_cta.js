const CTA = { x0: 460, size: 260, base: 430, pillY: 520, pillH: 100, rest: { x: 250, y: 880 }, cmd: "npx skills add kaventro/motion-designer", cps: 40, pw: 250 };

function ctaClock() {
  const enter = BT(23, 1) - 0.45 + 0.06;
  return { enter, hire: enter + 0.45, land: BT(23, 2) + 0.06, label: BT(23, 3), pill: BT(23, 3) + 0.02, type: BT(23, 3) + 0.34, site: BT(24, 1), repo: BT(24, 2) };
}

shot({
  id: "cta",
  bars: [23, 25],
  bg: "var(--orange)",
  tone: "dark",
  enter: () => ({ kind: "circle", dur: 0.45, ...(CUT ? HAND.grid : HAND.work) }),
  exit: { kind: "circle", dur: 0.75, x: 250, y: 775 },
  build(id) {
    const s = CTA.size, tw = measure(CTA.cmd, 44, 500, "font-family:var(--mono)");
    CTA.pillW = Math.round(tw + 190);
    return `
      <div class="abs" data-k="${id}_hl" style="left:${CTA.x0}px;top:${(CTA.base - 0.9335 * s).toFixed(1)}px">${headline("ctaH", "Hire *me.*", { size: s, weight: 900, color: "#17150F", accent: "#F4F1EA", lh: 1 })}</div>
      <div class="abs mask" style="left:${CTA.x0}px;top:${CTA.pillY - 56}px;height:44px"><div class="label t" data-k="${id}_lab" style="font-size:26px;color:rgba(23,21,15,0.78)">Made with itself · Free · MIT</div></div>
      <div class="abs row" data-k="${id}_pill" style="left:${CTA.x0}px;top:${CTA.pillY}px;width:${CTA.pillW}px;height:${CTA.pillH}px;border-radius:28px;background:#17150F;padding:0 44px;gap:22px;transform-origin:0 50%">
        <span class="mono" style="font-size:44px;font-weight:600;color:#E0703A">$</span>
        <span class="mono" data-k="${id}_cmd" style="font-size:44px;font-weight:500;color:#F4F1EA;white-space:pre"></span>
        <i data-k="${id}_caret" style="display:block;width:6px;height:54px;margin-left:-12px;background:#F4F1EA"></i>
      </div>
      <div class="abs mask" style="left:${CTA.x0}px;top:${CTA.pillY + CTA.pillH + 44}px;height:66px"><div class="t mono" data-k="${id}_site" style="font-size:46px;font-weight:600;color:#17150F">designer.ostinos.com</div></div>
      <div class="abs mask" style="left:${CTA.x0}px;top:${CTA.pillY + CTA.pillH + 116}px;height:48px"><div class="t mono" data-k="${id}_repo" style="font-size:30px;color:rgba(23,21,15,0.72)">github.com/kaventro/motion-designer</div></div>
      ${pebble(id + "P", CTA.pw)}`;
  },
  at(t) {
    const id = "cta", K0 = ctaClock();
    headlineAt("ctaH", t, K0.hire, Infinity, FILM.P);
    setT($[id + "_lab"], `translateY(${((1 - clamp(spring(t, K0.label, 0.42, 0.9), 0, 1.04)) * 135).toFixed(2)}%)`);

    const pp = clamp(spring(t, K0.pill, 0.5, 0.8), 0, 1.06);
    show($[id + "_pill"], t >= K0.pill);
    $[id + "_pill"].style.opacity = clamp(pp * 2.2).toFixed(3);
    setT($[id + "_pill"], `translateY(${((1 - pp) * 50).toFixed(2)}px) scale(${(0.92 + 0.08 * pp * press(t, K0.type - 0.08, 0.96)).toFixed(4)})`);
    const n = typed($[id + "_cmd"], CTA.cmd, t, K0.type, CTA.cps);
    $[id + "_caret"].style.opacity = (n < CTA.cmd.length ? 1 : Math.floor((t - K0.type) * 2.4) % 2 === 0 ? 1 : 0).toFixed(0);
    show($[id + "_caret"], t >= K0.type - 0.1);

    setT($[id + "_site"], `translateY(${((1 - clamp(spring(t, K0.site, 0.42, 0.9), 0, 1.04)) * 135).toFixed(2)}%)`);
    setT($[id + "_repo"], `translateY(${((1 - clamp(spring(t, K0.repo, 0.42, 0.9), 0, 1.04)) * 135).toFixed(2)}%)`);

    const takeoff = K0.land - 0.5, u = clamp((t - takeoff) / 0.5);
    const from = { x: -260, y: CTA.rest.y }, apex = 250;
    const air = t >= takeoff && t < K0.land ? 1 : 0;
    const arc = 4 * apex * u * (1 - u);
    const x = t < K0.land ? lerp(from.x, CTA.rest.x, E.out(u)) : CTA.rest.x;
    const close = prog(t, FILM.END - 0.8, 0.5, E.inOut);
    const since = t - K0.land;
    const sq = (t >= K0.land ? -0.28 * bump(since / 0.22) : air ? 0.14 * (1 - u) + 0.1 * E.in(clamp((u - 0.7) / 0.3)) : 0) + 0.013 * Math.sin((2 * Math.PI * t) / (4 * FILM.P)) * (1 - close);
    const look = lerp(0.4, 0, close);
    pebbleFace(id + "P", {
      yaw: look * (air ? 0.4 : 1), pitch: lerp(-0.12, 0, close), eyaw: look * 1.3, happy: lerp(0.75, 0.45, close) + 0.2 * air,
      wide: t >= K0.land ? clamp(0.9 * bump(since / 0.4), 0, 1) * (1 - close) : air ? 0.6 : 0,
      blink: blinkAt(t, [K0.land + 0.9, K0.site + 0.2]), sq, lean: 5 * air * Math.sin(Math.PI * u), lift: arc * (228 / CTA.pw), shadow: air ? 1 - clamp(arc / 70) : 1,
    });
    show($[id + "P"], t >= takeoff - 0.02);
    pebbleAt(id + "P", x, CTA.rest.y, 1);
  },
  cues() {
    const K0 = ctaClock();
    return [
      ["pop", K0.hire, { note: 7 }], ["pop", K0.hire + FILM.P, { note: 9 }],
      ["hop", K0.land - 0.5, { gain: -3 }], ["thud", K0.land, { gain: 1 }],
      ["blip", K0.label, { note: 4, gain: -5 }], ["click", K0.pill + 0.05, { gain: 1 }],
      ...[...CTA.cmd].map((_, i) => ["tick", K0.type + i / CTA.cps, { gain: -7 }]),
      ["chime", K0.site, { gain: -6 }], ["blip", K0.repo, { note: 6, gain: -6 }],
    ];
  },
});

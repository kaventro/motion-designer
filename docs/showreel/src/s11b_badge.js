const BADGE = { x: 250, y: 880, pw: 200 };

function badgeClock() {
  return { in: BT(9, 3), out: BAR(16) + 0.55, react: [BT(10, 3), 20.625, 24.44] };
}

shot({
  id: "badge",
  bars: [9, 17],
  bg: "transparent",
  tone: "light",
  windows: () => [[BT(9, 3) - 0.6, BAR(16) + 1.2]],
  build(id) {
    return pebble(id + "P", BADGE.pw);
  },
  at(t) {
    const id = "badge", K0 = badgeClock();
    const takeoff = K0.in - 0.5, u = clamp((t - takeoff) / 0.5);
    const leave = clamp((t - K0.out) / 0.5);
    const inAir = t >= takeoff && t < K0.in;
    const outAir = t >= K0.out;
    const beat = (t - K0.in) / FILM.P, ph = beat - Math.floor(beat);
    const grounded = t >= K0.in && !outAir;
    const bob = grounded ? Math.exp(-ph * 6) : 0;
    const bar = (t - BAR(10)) / (4 * FILM.P), bph = bar - Math.floor(bar);
    const hop = grounded && t >= BAR(10) ? 46 * 4 * Math.max(0, 1 - bph * 3.4) * Math.min(1, bph * 3.4) * (bph < 0.29 ? 1 : 0) : 0;
    let x = BADGE.x, y = BADGE.y - hop, sq = 0.05 * bob - 0.16 * bump((t - K0.in) / 0.22) * (t >= K0.in ? 1 : 0), air = 0, lift = 0, lean = 0;
    if (inAir) {
      x = lerp(-240, BADGE.x, E.out(u));
      lift = 4 * 120 * u * (1 - u);
      sq = 0.13 * (1 - E.out(clamp(u * 3))) + 0.1 * E.in(clamp((u - 0.7) / 0.3));
      lean = 5 * Math.sin(Math.PI * u);
      air = 1;
    }
    if (outAir) {
      x = lerp(BADGE.x, -260, E.in(leave));
      lift = 4 * 170 * leave * (1 - leave);
      sq = 0.12 * (1 - leave);
      lean = -5 * Math.sin(Math.PI * leave);
      air = 1;
    }
    const react = K0.react.reduce((m, r) => Math.max(m, bump((t - r) / 0.5)), 0);
    if (react > 0 && grounded) y -= 60 * react;
    pebbleFace(id + "P", {
      yaw: outAir ? -0.35 : 0.34, pitch: -0.1, eyaw: (outAir ? -0.35 : 0.34) * 1.35, happy: 0.6 + 0.35 * react + 0.2 * air,
      wide: clamp(0.9 * react + 0.6 * bump((t - K0.in) / 0.4), 0, 1), blink: blinkAt(t, [16.6, 19.9, 23.4, 26.9]),
      sq, lean, lift: lift * (228 / BADGE.pw), shadow: air ? 1 - clamp(lift / 70) : 1 - 0.3 * clamp(hop / 46),
    });
    show($[id + "P"], t >= takeoff - 0.02 && x > -250);
    pebbleAt(id + "P", x, y, 1);
  },
  cues() {
    const K0 = badgeClock();
    return [["hop", K0.in - 0.5, { gain: -4 }], ["thud", K0.in, { gain: -2 }], ...K0.react.map((t, i) => ["hop", t, { gain: -6 - i }]), ["hop", K0.out, { gain: -4 }]];
  },
});

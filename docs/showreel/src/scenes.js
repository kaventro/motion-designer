film({ W: 1920, H: 1080, BPM: 128.00094, BEATS: 96 });
FILM.END = FILM.DURATION;
const CUT = window.CUT === 15 ? { ids: ["hook", "type", "springs", "morph", "grid", "cta"], from: 11.25, jump: 30 } : null;
if (CUT) {
  FILM.BEATS = 32;
  FILM.frames = 900;
  FILM.DURATION = 15;
}
const shotTime = (s, t) => (CUT && (s.id === "cta" || (s.id === "hook" && t >= CUT.from)) ? t + CUT.jump : t);
const shotOn = (s, t) => {
  if (CUT && !CUT.ids.includes(s.id)) return false;
  const ts = shotTime(s, t);
  return s.win.some(([lo, hi]) => ts >= lo && ts < hi);
};

function build(stage) {
  stage.innerHTML = SHOTS.map((s) => `<div class="shot" data-k="${s.id}" style="background:${s.bg}">${s.build(s.id)}</div>`).join("") +
    `<div class="abs" data-k="edge" style="left:0;top:0;width:8px;height:${FILM.H}px;background:#8B7CFF;visibility:hidden"></div>` + hudMarkup();
  collect(stage);
  SHOTS.forEach((s) => s.ready && s.ready(s.id));
  SHOTS.forEach((s) => {
    s.t0 = BAR(s.bars[0]);
    const e = typeof s.enter === "function" ? s.enter() : s.enter;
    s.en = e ? { ...e, t0: s.t0 - e.dur + (e.late ?? 0.06) } : null;
    s.enEnd = s.en ? s.en.t0 + s.en.dur : -1;
  });
  SHOTS.forEach((s, i) => {
    const next = SHOTS.slice(i + 1).find((q) => q.en);
    s.win = s.windows ? s.windows() : [[s.en ? s.en.t0 : -1, next ? next.enEnd : FILM.END + 1]];
    if (s.exit) s.ex = { ...s.exit, t0: FILM.END - s.exit.dur - (s.exit.early ?? 0) };
  });
}

async function prepare() {
  for (const s of SHOTS) if (s.prepare) await s.prepare(s.id);
}

function toneAt(t) {
  let cur = 0;
  for (const s of SHOTS) {
    if (!shotOn(s, t)) continue;
    const ts = shotTime(s, t), target = s.tone === "dark" ? 1 : 0;
    if (s.en && ts < s.en.t0 + s.en.dur) cur = lerp(cur, target, clamp((ts - s.en.t0 - 0.25 * s.en.dur) / (0.5 * s.en.dur)));
    else cur = target;
    if (s.ex && ts >= s.ex.t0) cur = lerp(cur, 0, clamp((ts - s.ex.t0) / s.ex.dur));
  }
  return cur;
}

function apply(t) {
  const pending = [];
  let edge = null;
  for (const s of SHOTS) {
    const on = shotOn(s, t);
    show($[s.id], on);
    if (!on) continue;
    const ts = shotTime(s, t);
    let clip = "none";
    if (s.en && ts < s.enEnd) {
      const p = prog(ts, s.en.t0, s.en.dur, s.en.ease || E.inOut);
      clip = clipFor(s.en.kind, p, s.en);
      if (s.en.edge) edge = { p, ...s.en.edge, kind: s.en.kind };
    }
    if (s.ex && ts >= s.ex.t0) clip = clipFor(s.ex.kind, 1 - prog(ts, s.ex.t0, s.ex.dur, E.inOut), s.ex);
    $[s.id].style.clipPath = clip;
    const r = s.at(ts, ts - s.t0);
    if (r && typeof r.then === "function") pending.push(r);
  }
  const eg = $.edge;
  if (edge && edge.p > 0 && edge.p < 1) {
    const w = edge.w || 8, x = edge.kind === "fromRight" ? (1 - edge.p) * FILM.W : edge.p * FILM.W;
    eg.style.width = w + "px";
    eg.style.background = edge.color || COL.lilac;
    eg.style.left = (x - w / 2).toFixed(2) + "px";
    show(eg, true);
  } else show(eg, false);
  hudAt(t, toneAt(t));
  return pending.length ? Promise.all(pending) : undefined;
}

function cues() {
  const list = [];
  for (const s of SHOTS) {
    if (CUT && !CUT.ids.includes(s.id)) continue;
    const mine = [];
    if (s.en && !s.silentEnter) mine.push(["whoosh", s.en.t0 + 0.02, { pan: s.en.pan ?? 0, gain: s.en.gain ?? -3 }]);
    if (s.cues) mine.push(...s.cues());
    for (const c of mine) {
      if (!CUT) list.push(c);
      else if (s.id === "cta") list.push([c[0], c[1] - CUT.jump, c[2]]);
      else if (c[1] < CUT.from) list.push(c);
    }
  }
  return list;
}

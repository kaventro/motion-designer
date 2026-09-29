const WORK = {
  win: [
    { x: 940, y: 110, w: 860, h: 860, r: 0 },
    { x: 120, y: 110, w: 860, h: 860, r: 0 },
    { x: 880, y: 274, w: 944, h: 531, r: 0 },
  ],
  pages: [
    { title: "Rolyn", tag: "IOS · PERSONAL FINANCE", meta: ["46.5 s", "129 BPM", "Meadow"], tx: 96 },
    { title: "Oryn", tag: "MACOS · FILE MANAGER", meta: ["67.5 s", "128 BPM", "Warm ink"], tx: 1060 },
    { title: "Story", tag: "STORY AD · WITH A CHARACTER", meta: ["27.4 s", "105 BPM", "Appname, made up"], tx: 96 },
  ],
  size: 268, base: 640, pw: 150, frames: 226, spot: [],
  rolyn: { bpm: 128.998, drop: 24.187 }, story: { bpm: 105, from: (11 * 60) / 105 },
  live: {},
};

const workAt = (i) => [BAR(17), BAR(19), BAR(21)][i];
const workCam = (t) => track(t, 0, [{ t: BAR(19) - 0.6, d: 0.6, to: FILM.W, e: E.smooth }, { t: BAR(21) - 0.6, d: 0.6, to: FILM.W * 2, e: E.smooth }]);

function workPage(id, i) {
  const p = WORK.pages[i], w = WORK.win[i], x0 = i * FILM.W;
  const top = WORK.base - 0.9335 * WORK.size;
  const host = [
    `<div class="abs" data-k="${id}_h0" style="left:0;top:0;width:1440px;height:1440px;transform-origin:0 0"></div>`,
    `<img class="abs" data-k="${id}_h1" alt="" style="left:0;top:0;width:${w.w}px;height:${w.h}px;background:#EEE9E1">`,
    `<div class="abs" data-k="${id}_h2" style="left:0;top:0;width:1920px;height:1080px;transform-origin:0 0"></div>`,
  ][i];
  return `<div class="abs" style="left:${x0}px;top:0;width:${FILM.W}px;height:${FILM.H}px">
    <div class="abs" data-k="${id}_tg${i}" style="left:0;top:0;width:${FILM.W}px;height:${FILM.H}px">
      <div class="abs mask" style="left:${p.tx}px;top:${top - 92}px;height:48px"><div class="label t" data-k="${id}_tag${i}" style="font-size:26px;color:rgba(255,255,255,0.8)">${p.tag}</div></div>
      <div class="abs row" style="left:${p.tx}px;top:${top}px;font-size:${WORK.size}px;font-weight:900;letter-spacing:-0.045em;white-space:nowrap">${letters(`${id}_l${i}_`, p.title)}</div>
      <div class="abs row" style="left:${p.tx}px;top:${WORK.base + 96}px;gap:14px">${p.meta.map((m, k) => `<span class="chip label" data-k="${id}_m${i}_${k}" style="height:56px;padding:0 24px;border-radius:28px;border:2px solid rgba(255,255,255,0.45);font-size:24px;color:#fff">${m}</span>`).join("")}</div>
    </div>
    <div class="abs" data-k="${id}_w${i}" style="left:${w.x}px;top:${w.y}px;width:${w.w}px;height:${w.h}px;border-radius:${w.r}px;background:#8B7CFF;overflow:hidden">
      <div class="abs" data-k="${id}_c${i}" style="left:0;top:0;width:${w.w}px;height:${w.h}px">${host}</div>
      <div class="abs" data-k="${id}_bar${i}" style="left:0;bottom:0;width:0;height:7px;background:var(--orange)"></div>
    </div>
  </div>`;
}

async function workFrame(id, key, hostKey, size) {
  const f = document.createElement("iframe");
  f.setAttribute("sandbox", "allow-scripts allow-same-origin");
  f.style.cssText = `position:absolute;left:0;top:0;width:${size.w}px;height:${size.h}px;border:0;pointer-events:none`;
  const loaded = new Promise((r) => f.addEventListener("load", r, { once: true }));
  f.srcdoc = FILMS[key];
  $[hostKey].appendChild(f);
  await loaded;
  await f.contentWindow.seek(0);
  return f;
}

shot({
  id: "work",
  bars: [17, 23],
  bg: "var(--violet)",
  tone: "light",
  enter: () => ({ kind: "box", dur: 0.3, late: 0.02, ...HAND.check }),
  build(id) {
    return `
      <div class="abs" data-k="${id}_world" style="left:0;top:0;width:${FILM.W * 3}px;height:${FILM.H}px">${[0, 1, 2].map((i) => workPage(id, i)).join("")}</div>
      <div class="abs mask" style="left:96px;top:56px;height:44px"><div class="label t" data-k="${id}_hdr" style="font-size:24px;color:rgba(255,255,255,0.75)">SELECTED WORK</div></div>
      <div class="abs mask" data-k="${id}_ctr" style="right:96px;top:56px;width:160px;height:44px"></div>
      ${pebble(id + "P", WORK.pw)}`;
  },
  async prepare(id) {
    try {
      WORK.live.rolyn = await workFrame(id, "rolyn", `${id}_h0`, { w: 1440, h: 1440 });
      WORK.live.story = await workFrame(id, "story", `${id}_h2`, { w: 1920, h: 1080 });
    } catch (e) {
      WORK.live = {};
    }
  },
  ready(id) {
    const stage = document.getElementById("stage");
    const k = stage.getBoundingClientRect().width / FILM.W || 1;
    WORK.pages.forEach((p, i) => {
      const last = [...p.title].length - 1;
      const r = $[`${id}_l${i}_${last}`].getBoundingClientRect(), s = stage.getBoundingClientRect();
      const cx = (r.left - s.left) / k - i * FILM.W + r.width / k / 2;
      WORK.spot[i] = { x: Math.round(cx), y: Math.round(WORK.base - 0.546 * WORK.size) };
    });
    $[`${id}_h0`].style.transform = `scale(${(WORK.win[0].w / 1440).toFixed(5)})`;
    $[`${id}_h2`].style.transform = `scale(${(WORK.win[2].w / 1920).toFixed(5)})`;
    WORK.ctr = roller($[`${id}_ctr`], "font-family:var(--mono);font-size:24px;letter-spacing:0.14em;color:rgba(255,255,255,0.75);right:0;left:auto");
    HAND.work = { x: WORK.spot[2].x, y: WORK.spot[2].y, r0: 0 };
  },
  at(t) {
    const id = "work", cam = workCam(t), pending = [];
    setT($[id + "_world"], `translateX(${(-cam).toFixed(2)}px)`);
    const A = [0, 1, 2].map(workAt);

    WORK.pages.forEach((p, i) => {
      const d = i * FILM.W - cam, on = Math.abs(d) < FILM.W + 20;
      const w = WORK.win[i], el = $[`${id}_w${i}`];
      const morph = i === 0 ? clamp(spring(t, A[0], 0.5, 0.86), 0, 1.03) : 1;
      if (i === 0) {
        const line = { x: 956, y: 0, w: 8, h: FILM.H, r: 0 };
        const r = mixRect(line, { x: w.x, y: w.y, w: w.w, h: w.h, r: w.r }, morph);
        rectCss(el, r);
        $[`${id}_c0`].style.left = px(w.x - r.x);
        $[`${id}_c0`].style.top = px(w.y - r.y);
        el.style.background = mixc("#8B7CFF", "#F4F5F1", clamp((morph - 0.35) / 0.4));
        el.style.boxShadow = `${(14 * clamp(morph)).toFixed(1)}px ${(14 * clamp(morph)).toFixed(1)}px 0 #1C1450`;
        $[`${id}_c0`].style.opacity = clamp((morph - 0.3) / 0.4).toFixed(3);
      } else {
        el.style.boxShadow = "14px 14px 0 #1C1450";
      }
      setT(el, `translateX(${(d * 0.12).toFixed(2)}px)`);
      setT($[`${id}_tg${i}`], `translateX(${(d * -0.06).toFixed(2)}px)`);
      show(el, on && t >= (i === 0 ? A[0] - 0.4 : 0));
      $[`${id}_bar${i}`].style.width = px(w.w * clamp((t - A[i]) / (FILM.P * 8)));
      const lead = i === 0 ? A[0] + 0.14 : A[i] - 0.5;
      [...p.title].forEach((_, kk) => {
        const q = clamp(spring(t, lead + kk * 0.045, 0.45, 0.82), 0, 1.08);
        const el2 = $[`${id}_l${i}_${kk}`];
        el2.style.visibility = t >= lead ? "" : "hidden";
        setT(el2, `translateY(${((1 - q) * 80).toFixed(2)}px)`);
      });
      const tagP = clamp(spring(t, lead + 0.2, 0.42, 0.9), 0, 1.04);
      setT($[`${id}_tag${i}`], `translateY(${((1 - tagP) * 135).toFixed(2)}%)`);
      p.meta.forEach((_, kk) => {
        const q = clamp(spring(t, lead + 0.34 + kk * 0.07, 0.42, 0.8), 0, 1.06);
        const chip = $[`${id}_m${i}_${kk}`];
        chip.style.opacity = clamp(q * 1.6).toFixed(3);
        setT(chip, `translateY(${((1 - q) * 26).toFixed(2)}px)`);
      });
    });

    const w0 = WORK.live.rolyn;
    if (w0 && Math.abs(0 - cam) < FILM.W && t >= A[0]) {
      const rt = WORK.rolyn.drop + (t - A[0]) * (FILM.BPM / WORK.rolyn.bpm);
      pending.push(w0.contentWindow.seek(rt));
    }
    const img = $[id + "_h1"];
    if (Math.abs(FILM.W - cam) < FILM.W) {
      const j = clamp(Math.round((t - A[1]) * FILM.FPS), 0, WORK.frames - 1);
      const uri = FRAMES[`oryn_${String(j).padStart(3, "0")}`];
      if (img.getAttribute("src") !== uri) {
        img.setAttribute("src", uri);
        pending.push(img.decode().catch(() => {}));
      }
    }
    const w2 = WORK.live.story;
    if (w2 && Math.abs(2 * FILM.W - cam) < FILM.W) {
      const st = WORK.story.from + Math.max(0, t - A[2]) * (FILM.BPM / WORK.story.bpm);
      pending.push(w2.contentWindow.seek(st));
    }

    setT($[id + "_hdr"], `translateY(${((1 - clamp(spring(t, A[0] + 0.3, 0.42, 0.9), 0, 1.04)) * 135).toFixed(2)}%)`);
    roll(WORK.ctr, t, [{ t: A[0] + 0.3, v: "01 / 03" }, { t: A[1], v: "02 / 03" }, { t: A[2], v: "03 / 03" }]);

    const way = [
      { t: A[0] + 0.15, x: WORK.spot[0].x, y: -260, drop: true },
      { t: BT(17, 2), x: WORK.spot[0].x, y: WORK.spot[0].y },
      { t: A[1], x: WORK.spot[1].x, y: WORK.spot[1].y, take: A[1] - 0.5 },
      { t: A[2], x: WORK.spot[2].x, y: WORK.spot[2].y, take: A[2] - 0.5 },
      { t: BAR(23) - 0.45 + 0.06, x: WORK.spot[2].x, y: WORK.spot[2].y, take: BAR(23) - 0.45 + 0.06 - 0.3, apex: 210 },
    ];
    const pose = workPebble(t, way);
    const dir = t < A[1] - 0.5 ? 1 : t < A[2] - 0.5 ? -1 : 1;
    const look = pose.air ? 0.5 * pose.vx : dir * 0.34;
    pebbleFace(id + "P", {
      yaw: look, pitch: 0, eyaw: look * 1.3, happy: 0.55 + 0.3 * pose.air, wide: clamp(0.9 * bump(pose.since / 0.4) + 0.5 * pose.air, 0, 1),
      blink: blinkAt(t, [31.6, 35.2, 38.6]), sq: pose.sq + 0.013 * Math.sin((2 * Math.PI * t) / (4 * FILM.P)),
      lean: pose.lean, lift: pose.lift * (228 / WORK.pw), shadow: pose.air ? 1 - clamp(pose.lift / 70) : 1,
    });
    show($[id + "P"], t >= A[0] + 0.15);
    pebbleAt(id + "P", pose.x, pose.y, 1);
    return pending.length ? Promise.all(pending) : undefined;
  },
  cues() {
    const A = [0, 1, 2].map(workAt);
    return [
      ["thud", A[0], { gain: 3 }], ["pop", A[0] + 0.3, { note: 4 }],
      ["hop", A[0] + 0.15, { gain: -4 }], ["thud", BT(17, 2), { gain: -2 }],
      ...[1, 2].flatMap((i) => [["whoosh", A[i] - 0.6, { pan: 0.4, gain: -3 }], ["hop", A[i] - 0.5, { gain: -3 }], ["thud", A[i], { gain: 0 }], ["pop", A[i] + 0.14, { note: 5 + i }]]),
      ["hop", BAR(23) - 0.45 + 0.06 - 0.3, { gain: -2 }], ["thud", BAR(23) - 0.45 + 0.06, { gain: 2 }],
    ];
  },
});

function workPebble(t, way) {
  const drop = way[0];
  if (t < drop.t) return { x: drop.x, y: drop.y, sq: 0, lean: 0, lift: 0, air: 0, vx: 0, since: 9 };
  const n = way.length;
  let k = 0;
  while (k < n - 1 && t >= way[k + 1].t) k++;
  if (k === 0) {
    const u = clamp((t - drop.t) / (way[1].t - drop.t));
    return { x: drop.x, y: lerp(drop.y, way[1].y, E.in(u)), sq: 0.14 * (1 - u), lean: 0, lift: 0, air: 1, vx: 0, since: 9 };
  }
  const a = way[k], last = k >= n - 1;
  const since = t - a.t;
  if (last) return { x: a.x, y: a.y, sq: -0.28 * bump(since / 0.22), lean: 0, lift: 0, air: 0, vx: 0, since };
  const b = way[k + 1];
  const takeoff = b.take ?? b.t;
  if (t < takeoff) return { x: a.x, y: a.y, sq: -0.28 * bump(since / 0.22) - 0.2 * E.in(clamp((t - (takeoff - 0.14)) / 0.14)), lean: 0, lift: 0, air: 0, vx: 0, since };
  const u = clamp((t - takeoff) / (b.t - takeoff));
  const dx = b.x - a.x, apex = b.apex ?? 240;
  const arc = 4 * apex * u * (1 - u);
  return { x: lerp(a.x, b.x, E.smooth(u)), y: lerp(a.y, b.y, u), sq: 0.13 * (1 - E.out(clamp(u * 3))) + 0.1 * E.in(clamp((u - 0.7) / 0.3)), lean: 5 * Math.sign(dx) * Math.sin(Math.PI * u), lift: arc, air: 1, vx: Math.sign(dx), since: 9 };
}

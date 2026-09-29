const WALL = {
  x0: 158, y0: 289, s0: 9, soft: "#ECE7DC", track: "#E4DFD3",
  kinds: ["ring", "counter", "check", "bars", "toggle", "eq", "slider", "pebble", "team", "stars", "heat", "progress", "chat", "line", "modes"],
  label: { pebble: "AVAILABLE", ring: "STEPS", counter: "LIKES", check: "TODAY", bars: "THIS WEEK", toggle: "SYNC", eq: "LEVELS", slider: "VOLUME", team: "TEAM", stars: "RATING", heat: "ACTIVITY", progress: "EXPORT", chat: "CHAT", line: "TREND", modes: "VIEW" },
  phase: { ring: 0.5, counter: 0.25, check: 0.75, bars: 0.5, toggle: 0, slider: 0, team: 0.5, stars: 0.25, heat: 0.75, progress: 0.25, chat: 0.5, line: 0.75, modes: 0 },
  slider: [0.4, 0.46, 0.72, 0.38, 0.64, 0.5, 0.58],
  ring: [0.52, 0.6, 0.67, 0.74, 0.81, 0.88, 0.94],
  progress: [0.46, 0.55, 0.63, 0.71, 0.8, 0.88, 0.95],
  line: [80, 64, 70, 48, 55, 34, 40, 16],
  items: ["brief", "music", "render"],
  avatars: ["#FF6B5E", "#8B7CFF", "#53E0B4", "#E0703A", "#5B47F0", "#1C1450"],
};

const wallMod = (a, n) => ((a % n) + n) % n;
const wallPick = (arr, k) => arr[clamp(k + 1, 0, arr.length - 1)];

function wallTick(t, phase) {
  const P = FILM.P, k = Math.floor((t - BAR(7)) / P - phase), t0 = BAR(7) + (k + phase) * P;
  return { k, t0, d: t - t0 };
}

const wallTrig = (phase, k) => BAR(7) + (k + phase) * FILM.P;

function wallCam(t) {
  const W = WALL, p = E.smooth(clamp((t - W.t1) / W.dur)), s = Math.pow(W.s0, 1 - p);
  const q = clamp((t - W.driftT) / (W.end - W.driftT)), d = 1 - 0.015 * q * q;
  return { x: W.x0 * (1 - d) + W.F.x * (1 - s) * d, y: W.y0 * (1 - d) + W.F.y * (1 - s) * d, s: s * d };
}

function wallStar(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

const wallMono = (size, weight = 500, color = "#17150F") => `font-family:var(--mono);font-size:${size}px;font-weight:${weight};color:${color}`;

const WALL_UI = {
  ring: {
    html: () => `<svg class="abs" style="left:170px;top:58px;overflow:visible" width="106" height="106"><circle cx="53" cy="53" r="46" fill="none" stroke="rgba(23,21,15,0.08)" stroke-width="13"/><circle data-k="wall_rgArc" cx="53" cy="53" r="46" fill="none" stroke="#E0703A" stroke-width="13" stroke-linecap="round" transform="rotate(-90 53 53)"/></svg>
      <div class="abs t" data-k="wall_rgNum" style="left:24px;top:119px;font-size:44px;font-weight:800;letter-spacing:-0.03em;color:#17150F;font-variant-numeric:tabular-nums"></div>`,
    at(t) {
      const { k, t0, d } = wallTick(t, WALL.phase.ring), C = 2 * Math.PI * 46;
      const f = lerp(wallPick(WALL.ring, k - 1), wallPick(WALL.ring, k), clamp(spring(t, t0, 0.5, 0.82), 0, 1.03));
      const arc = $.wall_rgArc;
      arc.style.strokeDasharray = `${C.toFixed(2)} ${C.toFixed(2)}`;
      arc.style.strokeDashoffset = (C * (1 - f)).toFixed(2);
      const n = (kk) => Math.round(wallPick(WALL.ring, kk) * 1100) * 10;
      const v = Math.round(lerp(n(k - 1), n(k), E.out(clamp(d / 0.45)))).toLocaleString("en-US");
      if ($.wall_rgNum.textContent !== v) $.wall_rgNum.textContent = v;
    },
  },
  counter: {
    html() {
      const s = 52, dw = measure("0", s, 800, "font-variant-numeric:tabular-nums"), css = `font-size:${s}px;font-weight:800;color:#17150F;font-variant-numeric:tabular-nums`;
      return `<div class="abs row" style="left:24px;top:111px;height:60px;align-items:flex-start"><span class="t" style="${css};letter-spacing:-0.02em">12,4</span>
        <div data-k="wall_cnT" style="position:relative;width:${dw.toFixed(2)}px;height:60px;overflow:hidden"></div><div data-k="wall_cnO" style="position:relative;width:${dw.toFixed(2)}px;height:60px;overflow:hidden"></div></div>
        <svg class="abs" data-k="wall_cnH" style="left:232px;top:125px;overflow:visible;transform-origin:17px 16px" width="34" height="30"><path d="M17 29 C5 21 1 14 1 9 C1 4.5 4.5 1 9 1 C12.5 1 15.5 3 17 6 C18.5 3 21.5 1 25 1 C29.5 1 33 4.5 33 9 C33 14 29 21 17 29Z" fill="#FF6B5E"/></svg>`;
    },
    ready() {
      const css = "font-size:52px;font-weight:800;color:#17150F;font-variant-numeric:tabular-nums";
      WALL.cnT = roller($.wall_cnT, css);
      WALL.cnO = roller($.wall_cnO, css);
      const ph = WALL.phase.counter, n = (k) => 12487 + k, tens = [{ t: 0, v: "8" }], ones = [{ t: 0, v: "5" }];
      for (let k = -1; k <= 5; k++) {
        const tt = wallTrig(ph, k), a = String(n(k)), b = String(n(k - 1));
        if (a[3] !== b[3]) tens.push({ t: tt, v: a[3] });
        ones.push({ t: tt, v: a[4] });
      }
      Object.assign(WALL, { cnTs: tens, cnOs: ones });
    },
    at(t) {
      const { t0 } = wallTick(t, WALL.phase.counter);
      roll(WALL.cnT, t, WALL.cnTs);
      roll(WALL.cnO, t, WALL.cnOs);
      setT($.wall_cnH, `scale(${(1 + offset(t, t0, 0.95, 10, 18)).toFixed(4)})`);
    },
  },
  check: {
    html: () => WALL.items.map((w, i) => {
      const y = 62 + i * 36, tw = w.length * 13.8;
      return `<div class="abs" style="left:24px;top:${y}px;width:26px;height:26px;border-radius:8px;border:2.5px solid rgba(23,21,15,0.2)"></div>
        <div class="abs" data-k="wall_ckF${i}" style="left:24px;top:${y}px;width:26px;height:26px;border-radius:8px;background:#53E0B4;transform-origin:50% 50%"></div>
        <svg class="abs" style="left:24px;top:${y}px;overflow:visible" width="26" height="26"><path data-k="wall_ckT${i}" d="M7.5 13.5 L11.5 17.5 L19 9.5" fill="none" stroke="#1C1450" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="abs t" data-k="wall_ckL${i}" style="left:64px;top:${y - 2}px;${wallMono(23)}">${w}</div>
        <div class="abs" data-k="wall_ckS${i}" style="left:61px;top:${y + 12}px;width:${(tw + 6).toFixed(1)}px;height:2.5px;border-radius:2px;background:rgba(23,21,15,0.45);transform-origin:0 50%"></div>`;
    }).join(""),
    at(t) {
      const { k, t0, d } = wallTick(t, WALL.phase.check), s = wallMod(k, 4), reset = s === 0;
      for (let i = 0; i < 3; i++) {
        let fill, tick, strike;
        if (reset) {
          const out = E.in(clamp(d / 0.16));
          fill = 1 - out; tick = 1 - out; strike = 1 - out;
        } else if (i < s - 1) {
          fill = 1; tick = 1; strike = 1;
        } else if (i === s - 1) {
          fill = clamp(spring(t, t0, 0.3, 0.5), 0, 1.22); tick = E.out(clamp((d - 0.05) / 0.18)); strike = E.out(clamp((d - 0.08) / 0.26));
        } else {
          fill = 0; tick = 0; strike = 0;
        }
        setT($[`wall_ckF${i}`], `scale(${fill.toFixed(4)})`);
        const tp = $[`wall_ckT${i}`];
        tp.style.strokeDasharray = "20 20";
        tp.style.strokeDashoffset = (20 * (1 - tick)).toFixed(2);
        setT($[`wall_ckS${i}`], `scaleX(${strike.toFixed(4)})`);
        $[`wall_ckL${i}`].style.color = mixc("#17150F", "#A29E95", strike);
      }
    },
  },
  bars: {
    html: () => `<div class="abs" style="left:24px;top:162px;width:252px;height:2px;border-radius:1px;background:rgba(23,21,15,0.1)"></div>` +
      Array.from({ length: 7 }, (_, j) => {
        const h = Math.round(34 + 58 * hash(j * 3.7 + 11));
        return `<div class="abs" data-k="wall_br${j}" style="left:${30 + 36 * j}px;top:${162 - h}px;width:24px;height:${h}px;border-radius:6px 6px 3px 3px;transform-origin:50% 100%"></div>`;
      }).join(""),
    at(t) {
      const { k, t0, d } = wallTick(t, WALL.phase.bars), s = wallMod(k + 2, 8);
      for (let j = 0; j < 7; j++) {
        const el = $[`wall_br${j}`];
        let sc = 0, col = "#D6D0FA";
        if (s === 7) {
          sc = 1 - E.in(clamp((d - 0.02 * (6 - j)) / 0.18));
        } else if (j < s) {
          sc = 1;
          col = j === s - 1 ? mixc("#5B47F0", "#D6D0FA", clamp(d / 0.25)) : "#D6D0FA";
        } else if (j === s) {
          sc = clamp(spring(t, t0, 0.42, 0.6), 0, 1.12);
          col = "#5B47F0";
        }
        show(el, sc > 0.001);
        el.style.background = col;
        setT(el, `scaleY(${sc.toFixed(4)})`);
      }
    },
  },
  toggle: {
    html: () => `<div class="abs" data-k="wall_tgV" style="left:234px;top:20px;width:42px;height:27px;overflow:hidden"></div>
      <div class="abs" data-k="wall_tgT" style="left:24px;top:94px;width:128px;height:72px;border-radius:36px"></div>
      <div class="abs" data-k="wall_tgK" style="left:0;top:100px;width:60px;height:60px;border-radius:30px;background:#fff;box-shadow:0 3px 0 rgba(23,21,15,0.12)"></div>`,
    ready() {
      WALL.tgR = roller($.wall_tgV, `${wallMono(23, 600)};width:42px;text-align:right`);
      WALL.tgS = [{ t: 0, v: "OFF" }];
      for (let k = -1; k <= 5; k++) WALL.tgS.push({ t: wallTrig(0, k), v: wallMod(k, 2) === 0 ? "ON" : "OFF" });
    },
    at(t) {
      const { k, t0, d } = wallTick(t, 0), on = (kk) => (wallMod(kk, 2) === 0 ? 1 : 0);
      const a = on(k - 1), b = on(k), q = a + (b - a) * clamp(spring(t, t0, 0.3, 0.72), 0, 1.06);
      const w = 60 + 14 * bump(clamp(d / 0.26)), cx = 60 + 56 * q;
      $.wall_tgK.style.width = px(w);
      setT($.wall_tgK, `translateX(${clamp(cx - w / 2, 30, 146 - w).toFixed(2)}px)`);
      $.wall_tgT.style.background = mixc(WALL.track, "#53E0B4", q);
      roll(WALL.tgR, t, WALL.tgS);
    },
  },
  eq: {
    html: () => `<div class="abs" data-k="wall_eqDot" style="left:258px;top:26px;width:12px;height:12px;border-radius:6px;background:#FF6B5E"></div>` +
      Array.from({ length: 9 }, (_, j) => `<div class="abs" data-k="wall_eqB${j}" style="left:${42 + 25 * j}px;top:68px;width:16px;height:94px;border-radius:4px 4px 2px 2px;background:#53E0B4;transform-origin:50% 100%"></div>
        <div class="abs" data-k="wall_eqC${j}" style="left:${42 + 25 * j}px;top:0;width:16px;height:5px;border-radius:2px;background:#17150F"></div>`).join(""),
    at(t) {
      const half = FILM.P / 2, kk = Math.floor((t - BAR(7)) / half);
      const peak = (j, i) => 14 + 80 * (0.3 + 0.7 * hash(j * 13.1 + i * 7.3)) * (wallMod(i, 2) === 0 ? 1 : 0.7) * (1 - 0.035 * j);
      const level = (j, i, dt) => 12 + (peak(j, i) - 12) * Math.exp(-dt * 4.5);
      for (let j = 0; j < 9; j++) {
        const t0 = BAR(7) + kk * half, h = level(j, kk, t - t0);
        let cap = h + 4;
        for (let i = kk; i > kk - 5; i--) {
          const dt = t - (BAR(7) + i * half), fall = dt < 0.08 ? 0 : 0.5 * 1400 * (dt - 0.08) * (dt - 0.08);
          cap = Math.max(cap, peak(j, i) + 4 - fall);
        }
        setT($[`wall_eqB${j}`], `scaleY(${(h / 94).toFixed(4)})`);
        setT($[`wall_eqC${j}`], `translateY(${(162 - cap - 5).toFixed(2)}px)`);
      }
      const bd = wallTick(t, 0).d;
      setT($.wall_eqDot, `scale(${(1 + 0.45 * Math.exp(-bd * 7)).toFixed(4)})`);
    },
  },
  slider: {
    html: () => `<div class="abs" data-k="wall_slV" style="left:248px;top:20px;width:28px;height:27px;overflow:hidden"></div>
      <div class="abs" style="left:24px;top:120px;width:252px;height:8px;border-radius:4px;background:${WALL.track}"></div>
      <div class="abs" data-k="wall_slF" style="left:24px;top:120px;width:100px;height:8px;border-radius:4px;background:#5B47F0"></div>
      <div class="abs" data-k="wall_slK" style="left:0;top:107px;width:34px;height:34px;border-radius:50%;background:#fff;border:3px solid #17150F;box-shadow:3px 3px 0 rgba(23,21,15,0.14)"></div>`,
    ready() {
      WALL.slR = roller($.wall_slV, wallMono(23, 600));
      WALL.slS = [{ t: 0, v: String(Math.round(WALL.slider[0] * 100)) }];
      for (let k = 0; k <= 5; k++) WALL.slS.push({ t: wallTrig(0, k), v: String(Math.round(wallPick(WALL.slider, k) * 100)) });
    },
    at(t) {
      const val = (tt) => {
        const a = wallTick(tt, 0);
        return lerp(wallPick(WALL.slider, a.k - 1), wallPick(WALL.slider, a.k), spring(tt, a.t0, 0.34, 0.7));
      };
      const v = val(t), vel = (v - val(t - 1 / 120)) * 120 * 252, st = clamp(Math.abs(vel) / 2600, 0, 0.22), x = 24 + v * 252;
      setT($.wall_slK, `translateX(${(x - 17).toFixed(2)}px) scale(${(1 + st).toFixed(4)},${(1 - 0.45 * st).toFixed(4)})`);
      $.wall_slF.style.width = px(x - 24);
      roll(WALL.slR, t, WALL.slS);
    },
  },
  pebble: {
    html: () => `<div class="abs" data-k="wall_pbDot" style="left:258px;top:26px;width:12px;height:12px;border-radius:6px;background:#53E0B4"></div>${pebble("wallP", 124, "#17150F")}`,
    at(t) {
      const bd = wallTick(t, 0).d, look = E.inOut(clamp((t - (BT(7, 3) - 0.1)) / 0.4));
      const eyaw = lerp(-0.42, 0, look);
      pebbleFace("wallP", {
        yaw: eyaw * 0.55, pitch: lerp(-0.04, -0.06, look), eyaw, epitch: -0.02, happy: 0.55 + 0.25 * look,
        blink: blinkAt(t, [BT(7, 2), BT(7, 4) + 0.02]), sq: -0.06 * bump(clamp(bd / 0.3)) + 0.04 * bump(clamp((bd - 0.2) / 0.25)), shadow: 0.6,
      });
      pebbleAt("wallP", 150, 172, 1);
      setT($.wall_pbDot, `scale(${(1 + 0.4 * Math.exp(-wallTick(t, 0.5).d * 6)).toFixed(4)})`);
    },
  },
  team: {
    html: () => Array.from({ length: 5 }, (_, m) => `<div class="abs" data-k="wall_av${m}" style="left:0;top:84px;width:60px;height:60px;border-radius:50%;border:4px solid #fff;overflow:hidden;transform-origin:50% 50%">
        <div class="abs" style="left:17px;top:9px;width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,0.62)"></div>
        <div class="abs" style="left:8px;top:30px;width:36px;height:30px;border-radius:18px 18px 0 0;background:rgba(255,255,255,0.62)"></div></div>`).join("") +
      `<div class="abs" style="left:168px;top:84px;width:60px;height:60px;border-radius:50%;border:4px solid #fff;background:${WALL.soft};z-index:20"></div>
      <div class="abs" data-k="wall_avN" style="left:176px;top:101px;width:44px;height:27px;overflow:hidden;z-index:21"></div>`,
    ready() {
      WALL.avR = roller($.wall_avN, `${wallMono(23, 600)};width:44px;text-align:center`);
      WALL.avS = [{ t: 0, v: "+7" }];
      for (let k = -1; k <= 5; k++) WALL.avS.push({ t: wallTrig(WALL.phase.team, k) + 0.12, v: `+${8 + k}` });
    },
    at(t) {
      const { k, t0 } = wallTick(t, WALL.phase.team), sp = clamp(spring(t, t0, 0.4, 0.78), 0, 1.04);
      for (let j = k - 4; j <= k; j++) {
        const el = $[`wall_av${wallMod(j, 5)}`], slot = k - j - 1 + sp;
        const sc = j === k ? clamp(spring(t, t0, 0.34, 0.55), 0, 1.2) : 1;
        show(el, slot < 3.98 || j === k);
        el.style.background = WALL.avatars[wallMod(j, 6)];
        el.style.zIndex = String(10 + j - k);
        setT(el, `translateX(${(24 + 36 * Math.max(0, slot)).toFixed(2)}px) scale(${sc.toFixed(4)})`);
      }
      roll(WALL.avR, t, WALL.avS);
    },
  },
  stars: {
    html: () => Array.from({ length: 5 }, (_, i) => `<svg class="abs" style="left:${36 + 48 * i}px;top:94px;overflow:visible" width="36" height="36"><path d="${wallStar(18, 19, 17, 7.4)}" fill="${WALL.soft}" stroke="${WALL.soft}" stroke-width="3" stroke-linejoin="round"/>
        <path data-k="wall_st${i}" d="${wallStar(18, 19, 17, 7.4)}" fill="#E0703A" stroke="#E0703A" stroke-width="3" stroke-linejoin="round" style="transform-origin:18px 19px"/></svg>`).join(""),
    at(t) {
      const { k, t0, d } = wallTick(t, WALL.phase.stars), s = wallMod(k + 1, 6);
      for (let i = 0; i < 5; i++) {
        let sc = 0;
        if (s === 0) sc = 1 - E.in(clamp(d / 0.18));
        else if (i < s - 1) sc = 1;
        else if (i === s - 1) sc = clamp(spring(t, t0, 0.32, 0.45), 0, 1.3);
        setT($[`wall_st${i}`], `scale(${sc.toFixed(4)})`);
      }
    },
  },
  heat: {
    html: () => `<div class="abs" style="left:37px;top:62px;width:226px;height:100px;overflow:hidden">` +
      Array.from({ length: 60 }, (_, n) => `<div class="abs" data-k="wall_ht${n}" style="left:${Math.floor(n / 5) * 21}px;top:${(n % 5) * 21}px;width:16px;height:16px;border-radius:4px"></div>`).join("") + `</div>`,
    at(t) {
      const { k, t0, d } = wallTick(t, WALL.phase.heat), sp = E.snappy(clamp(d / 0.3));
      const levels = [0.07, 0.2, 0.4, 0.66, 1];
      for (let n = 0; n < 60; n++) {
        const c = Math.floor(n / 5), r = n % 5, el = $[`wall_ht${n}`], abs = c + k;
        const lv = levels[Math.floor(hash(abs * 5.3 + r * 1.7 + 0.4) * 4.999)];
        const sc = c === 11 ? clamp(spring(t, t0 + r * 0.03, 0.3, 0.6), 0, 1.15) : 1;
        el.style.background = `rgba(91,71,240,${lv})`;
        setT(el, `translateX(${(-21 * sp).toFixed(2)}px) scale(${sc.toFixed(4)})`);
      }
    },
  },
  progress: {
    html: () => `<div class="abs t" data-k="wall_pgN" style="left:24px;top:71px;font-size:44px;font-weight:800;letter-spacing:-0.03em;color:#17150F;font-variant-numeric:tabular-nums"></div>
      <div class="abs" style="left:24px;top:136px;width:252px;height:16px;border-radius:8px;background:${WALL.soft}"></div>
      <div class="abs" data-k="wall_pgF" style="left:24px;top:136px;width:100px;height:16px;border-radius:8px;background:#1C1450"></div>`,
    at(t) {
      const { k, t0, d } = wallTick(t, WALL.phase.progress);
      const a = wallPick(WALL.progress, k - 1), b = wallPick(WALL.progress, k);
      const f = lerp(a, b, clamp(spring(t, t0, 0.42, 0.8), 0, 1.02));
      $.wall_pgF.style.width = px(Math.max(16, f * 252));
      const v = `${Math.round(lerp(a, b, E.out(clamp(d / 0.4))) * 100)}%`;
      if ($.wall_pgN.textContent !== v) $.wall_pgN.textContent = v;
    },
  },
  chat: {
    html: () => `<div class="abs" style="left:16px;top:54px;width:268px;height:124px;overflow:hidden">` +
      Array.from({ length: 4 }, (_, m) => `<div class="abs" data-k="wall_cb${m}" style="left:0;top:0;height:40px"><div class="abs" data-k="wall_cs${m}" style="left:20px;top:16px;height:8px;border-radius:4px"></div>
        ${[0, 1, 2].map((i) => `<div class="abs" data-k="wall_cd${m}_${i}" style="left:${19 + 12 * i}px;top:16px;width:8px;height:8px;border-radius:4px;background:rgba(23,21,15,0.35)"></div>`).join("")}</div>`).join("") + `</div>`,
    at(t) {
      const { k, t0, d } = wallTick(t, WALL.phase.chat), sp = clamp(spring(t, t0, 0.42, 0.8), 0, 1.03), half = FILM.P / 2;
      for (let j = k - 3; j <= k; j++) {
        const m = wallMod(j, 4), el = $[`wall_cb${m}`], sk = $[`wall_cs${m}`], slot = k - j - 1 + sp, me = hash(j * 3.1 + 0.7) > 0.5;
        const full = Math.round(116 + 80 * hash(j * 7.7 + 2.2)), sc = j === k ? clamp(spring(t, t0, 0.32, 0.6), 0, 1.08) : 1;
        const typing = j === k && !me, open = typing ? clamp(spring(t, t0 + half, 0.3, 0.72), 0, 1.05) : 1, w = Math.round(lerp(64, full, open));
        const dots = typing ? 1 - clamp((d - half) / 0.05) : 0;
        for (let i = 0; i < 3; i++) {
          const dot = $[`wall_cd${m}_${i}`], hop = bump((d - 0.02 - 0.05 * i) / 0.12);
          show(dot, dots > 0);
          dot.style.opacity = dots.toFixed(3);
          setT(dot, `translateY(${(-5 * hop).toFixed(2)}px)`);
        }
        sk.style.opacity = clamp((open - 0.5) / 0.4).toFixed(3);
        show(el, slot < 2);
        el.style.width = px(w);
        el.style.left = px(me ? 260 - w : 8);
        el.style.background = me ? "#5B47F0" : "#EFEAE0";
        el.style.borderRadius = me ? "20px 20px 6px 20px" : "20px 20px 20px 6px";
        el.style.transformOrigin = me ? "100% 100%" : "0 100%";
        el.style.opacity = clamp((2 - slot) / 0.7).toFixed(3);
        sk.style.width = px(Math.max(0, w - 40));
        sk.style.background = me ? "rgba(255,255,255,0.55)" : "rgba(23,21,15,0.2)";
        setT(el, `translateY(${(76 - 50 * Math.max(0, slot)).toFixed(2)}px) scale(${Math.max(0.001, sc).toFixed(4)})`);
      }
    },
  },
  line: {
    html: () => `<svg class="abs" style="left:24px;top:62px;overflow:visible" width="252" height="100">
        ${[20, 52, 84].map((y) => `<path d="M0 ${y}H252" stroke="rgba(23,21,15,0.07)" stroke-width="2"/>`).join("")}
        <path data-k="wall_lnA" fill="rgba(224,112,58,0.13)"/><path data-k="wall_lnL" fill="none" stroke="#E0703A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <circle data-k="wall_lnD" r="6.5" fill="#E0703A" stroke="#fff" stroke-width="3"/></svg>`,
    at(t) {
      const { k, t0, d } = wallTick(t, WALL.phase.line), s = wallMod(k + 3, 9), ys = WALL.line, X = (i) => 6 + i * 34.3;
      const e = s === 0 ? 0 : s - 1 + E.out(clamp(d / 0.32));
      const pts = [[X(0), ys[0]]];
      for (let i = 1; i <= Math.ceil(e) && i < 8; i++) {
        const f = Math.min(1, e - (i - 1));
        pts.push([lerp(X(i - 1), X(i), f), lerp(ys[i - 1], ys[i], f)]);
      }
      const end = pts[pts.length - 1], line = "M" + pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("L");
      const gone = s === 0 ? E.in(clamp(d / 0.2)) : 0;
      $.wall_lnL.setAttribute("d", line);
      $.wall_lnA.setAttribute("d", `${line}L${end[0].toFixed(2)} 96L${X(0)} 96Z`);
      $.wall_lnL.style.opacity = $.wall_lnA.style.opacity = (1 - gone).toFixed(3);
      const dot = $.wall_lnD, pop = 1 + offset(t, t0 + 0.3, 0.6, 12, 22);
      dot.setAttribute("cx", end[0].toFixed(2));
      dot.setAttribute("cy", end[1].toFixed(2));
      dot.setAttribute("r", (6.5 * pop).toFixed(2));
    },
  },
  modes: {
    html() {
      const seg = 244 / 3, lab = ["DAY", "WEEK", "YEAR"];
      const row = (color) => lab.map((w, i) => `<div class="abs t" style="left:${Math.round(4 + seg * i + (seg - w.length * 13.8 - (w.length - 1) * 1.84) / 2)}px;top:15px;${wallMono(23, 600, color)};letter-spacing:0.08em">${w}</div>`).join("");
      return `<div class="abs" style="left:24px;top:102px;width:252px;height:56px;border-radius:28px;background:#EFEAE0">
        <div class="abs" data-k="wall_mdP" style="left:0;top:4px;height:48px;border-radius:24px;background:#1C1450"></div>
        ${row("rgba(23,21,15,0.55)")}
        <div class="abs" data-k="wall_mdW" style="left:0;top:0;width:252px;height:56px">${row("#FFFFFF")}</div></div>`;
    },
    at(t) {
      const { k, t0, d } = wallTick(t, 0), seg = 244 / 3, sel = (kk) => [0, 1, 2, 1][wallMod(kk, 4)];
      const f = lerp(sel(k - 1), sel(k), clamp(spring(t, t0, 0.3, 0.7), -0.04, 1.04));
      const w = seg + 18 * bump(clamp(d / 0.28)), x = 4 + seg * f - (w - seg) / 2;
      const L = clamp(x, 4, 248 - w);
      $.wall_mdP.style.width = px(w);
      setT($.wall_mdP, `translateX(${L.toFixed(2)}px)`);
      $.wall_mdW.style.clipPath = `inset(4px ${(252 - L - w).toFixed(2)}px 4px ${L.toFixed(2)}px round 24px)`;
    },
  },
};

shot({
  id: "wall",
  bars: [7, 8],
  bg: "var(--paper)",
  tone: "dark",
  enter: { kind: "diag", dur: 0.42 },
  build(id) {
    const tiles = WALL.kinds.map((kind, i) => {
      const x = WALL.x0 + (i % 5) * 326, y = WALL.y0 + Math.floor(i / 5) * 216, lab = WALL.label[kind];
      return `<div class="abs" style="left:${x}px;top:${y}px;width:300px;height:190px;border-radius:26px;background:#fff;box-shadow:8px 8px 0 rgba(23,21,15,0.14)">
        ${lab ? `<div class="abs label" style="left:24px;top:20px;font-size:23px;color:rgba(23,21,15,0.5)">${lab}</div>` : ""}${WALL_UI[kind].html()}</div>`;
    }).join("");
    return `<div class="abs" data-k="${id}_cam" style="left:0;top:0;width:${FILM.W}px;height:${FILM.H}px;transform-origin:0 0">${tiles}</div>
      <div class="abs" style="left:${WALL.x0}px;top:76px">${headline(`${id}_hl`, "One *camera.*", { size: 96, weight: 900, color: COL.ink, accent: COL.violet })}</div>`;
  },
  ready() {
    const W = WALL, P = { x: W.x0 + 326 + 24 + W.slider[0] * 252, y: W.y0 + 216 + 124 };
    Object.assign(W, {
      t1: BAR(7) + 0.06, dur: 1.34, driftT: BAR(7) + 1.0, end: BAR(8) + 0.06,
      F: { x: (W.s0 * P.x - FILM.W / 2) / (W.s0 - 1), y: (W.s0 * P.y - FILM.H / 2) / (W.s0 - 1) },
    });
    WALL.kinds.forEach((kind) => WALL_UI[kind].ready && WALL_UI[kind].ready());
    const c = wallCam(BAR(8) - 0.15), px0 = W.x0 + 2 * 326 + 150, py0 = W.y0 + 216 + 122;
    HAND.wall = { x: Math.round(c.x + px0 * c.s), y: Math.round(c.y + py0 * c.s), r0: 46 };
  },
  at(t) {
    const c = wallCam(t);
    setT($.wall_cam, `translate(${c.x.toFixed(3)}px,${c.y.toFixed(3)}px) scale(${c.s.toFixed(5)})`);
    WALL.kinds.forEach((kind) => WALL_UI[kind].at(t));
    const done = headlineAt("wall_hl", t, BT(7, 3));
    show($.wall_hl, t >= BT(7, 3));
    show($.wall_hlu1, t > done);
  },
  cues() {
    return [
      ["tick", BAR(7), { gain: -2 }],
      ["swish", BAR(7) + 0.1, { gain: -4 }],
      ["thud", BT(7, 3) + 0.06, { gain: -3, pan: -0.4 }],
      ["blip", BT(7, 4), { note: 2, gain: -6 }],
    ];
  },
});

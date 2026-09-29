(() => {
  const html = document.documentElement;
  const cursor = document.querySelector(".cursor");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const BEAT = 60 / 128;
  const BODY = "M100 18 C156 18 186 64 186 116 C186 170 150 202 100 202 C50 202 14 170 14 116 C14 64 44 18 100 18Z";
  const CX = 100, CY = 114, RX = 86, RY = 90;
  const MAX_YAW = 0.56, MAX_UP = 0.36, MAX_DOWN = 0.4;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (dt, tau) => 1 - Math.exp(-dt / tau);
  const f2 = (v) => v.toFixed(2);
  const bump = (x) => (x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0);

  const FILMS = {
    launch: {
      src: "../docs/launch-film/preview.mp4",
      poster: "../docs/launch-film/poster.jpg",
      cap: "motion-designer, the skill's own launch film. The music is an original track made with ACE-Step, the voice is Chatterbox.",
    },
    rolyn: {
      src: "../examples/rolyn/preview.mp4",
      poster: "../examples/rolyn/poster.jpg",
      cap: "Rolyn. Music: “Digital Clouds” by Alejandro Magaña, <a href=\"https://mixkit.co/license/\">Mixkit License</a>. Voice: Chatterbox.",
    },
    oryn: {
      src: "../examples/oryn/preview.mp4",
      poster: "../examples/oryn/poster.jpg",
      cap: "Oryn. Music: “Ethereal Pulse” by <a href=\"https://surf-house-productions.bandcamp.com\">Surf House Productions</a>, <a href=\"https://creativecommons.org/licenses/by/4.0/\">CC BY 4.0</a>. Voice: Chatterbox.",
    },
    showreel: {
      src: "../docs/showreel/preview.mp4",
      poster: "../docs/showreel/poster.jpg",
      cap: "motion-designer, the skill's own showreel. The music is an original track made with ACE-Step, the small sounds come from sfx.py.",
    },
    reel: {
      src: "../examples/oryn-reel/preview.mp4",
      poster: "../examples/oryn-reel/poster.jpg",
      cap: "Oryn showreel, created with the motion-designer skill in a Claude Code session. The music is an original score synthesized in code, with no samples.",
    },
    story: {
      src: "../examples/story/preview.mp4",
      poster: "../examples/story/poster.jpg",
      cap: "Appname, the demo in the story template. The music is an original track made with ACE-Step, the sounds come from sfx.py.",
    },
  };

  const pointer = { x: innerWidth * 0.3, y: innerHeight * 0.35, seen: false, moved: -1e9, speed: 0, stamp: 0 };
  const clock = () => performance.now() / 1000;
  const start = clock();

  const eye = (id, side) =>
    `<g data-p="eye${side}"><g data-p="open${side}"><ellipse rx="15" ry="19" fill="url(#${id}e)"/>` +
    `<g clip-path="url(#${id}k)"><g data-p="pupil${side}"><circle r="8.2" fill="#15110F"/><circle cx="-2.7" cy="-3.1" r="2.5" fill="#fff"/></g></g></g>` +
    `<path data-p="lid${side}" d="M-13 1 Q0 9 13 1" fill="none" stroke="#1A1210" stroke-width="3.4" stroke-linecap="round" opacity="0"/></g>`;

  const markup = (id) => `<svg viewBox="-14 6 228 214" aria-hidden="true" focusable="false">
<defs>
<radialGradient id="${id}b" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#F8A56B"/><stop offset=".42" stop-color="#E3733C"/><stop offset=".82" stop-color="#C85520"/><stop offset="1" stop-color="#AE451A"/></radialGradient>
<radialGradient id="${id}r" cx=".88" cy=".92" r=".62"><stop offset="0" stop-color="#B3A8FF" stop-opacity=".8"/><stop offset=".5" stop-color="#8B7CFF" stop-opacity=".22"/><stop offset="1" stop-color="#8B7CFF" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#4A1604" stop-opacity="0"/><stop offset="1" stop-color="#4A1604" stop-opacity=".34"/></linearGradient>
<radialGradient id="${id}e" cx=".5" cy=".62" r=".62"><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#E4DDF3"/></radialGradient>
<clipPath id="${id}c"><path d="${BODY}"/></clipPath>
<clipPath id="${id}k"><ellipse rx="15" ry="19"/></clipPath>
<filter id="${id}s" x="-60%" y="-200%" width="220%" height="500%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="${id}h" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="${id}m" x="-80%" y="-120%" width="260%" height="340%"><feGaussianBlur stdDeviation="4"/></filter>
</defs>
<ellipse data-p="shadow" cx="100" cy="206" rx="66" ry="9" fill="#150A4E" opacity=".5" filter="url(#${id}s)"/>
<g data-p="body">
<path d="${BODY}" fill="url(#${id}b)"/>
<g clip-path="url(#${id}c)">
<rect x="0" y="10" width="200" height="200" fill="url(#${id}o)"/>
<rect x="0" y="10" width="200" height="200" fill="url(#${id}r)"/>
<ellipse data-p="cheekL" rx="14" ry="8" fill="#FF6A5C" filter="url(#${id}m)"/>
<ellipse data-p="cheekR" rx="14" ry="8" fill="#FF6A5C" filter="url(#${id}m)"/>
${eye(id, "L")}${eye(id, "R")}
<path data-p="mouth" fill="#1A1210"/>
</g>
<path d="M58 40 C70 30 88 26 104 27" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="10" stroke-linecap="round" filter="url(#${id}h)"/>
</g>
</svg>`;

  function project(fx, fy, yaw, pitch) {
    const z = Math.sqrt(Math.max(0, 1 - fx * fx - fy * fy));
    const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
    const y1 = fy * cp + z * sp, z1 = -fy * sp + z * cp;
    const x2 = fx * cy + z1 * sy, z2 = -fx * sy + z1 * cy;
    return { x: CX + RX * x2, y: CY + RY * y1, nx: x2, ny: y1, nz: z2 };
  }

  function onSurface(p) {
    const at = `translate(${f2(p.x)} ${f2(p.y)})`;
    if (Math.hypot(p.nx, p.ny) < 1e-4) return at;
    const th = (Math.atan2(p.ny, p.nx) * 180) / Math.PI;
    return `${at} rotate(${f2(th)}) scale(${Math.max(0.08, p.nz).toFixed(3)} 1) rotate(${f2(-th)})`;
  }

  function mouthPath(happy, wide) {
    if (wide > 0.35) {
      const w = 6 + 4 * wide, o = 4 + 10 * wide;
      return `M${f2(-w)} 0 a${f2(w)} ${f2(o)} 0 1 0 ${f2(2 * w)} 0 a${f2(w)} ${f2(o)} 0 1 0 ${f2(-2 * w)} 0Z`;
    }
    const c = 9 + 12 * happy, half = 13 + 4 * happy;
    return `M${f2(-half)} 0 Q0 ${f2(c)} ${f2(half)} 0 Q0 ${f2(c * 0.42)} ${f2(-half)} 0Z`;
  }

  let uid = 0;
  const pebbles = [];

  function pebble(host, { drop = false } = {}) {
    const id = `pb${++uid}`;
    host.innerHTML = markup(id);
    const el = {};
    for (const k of ["shadow", "body", "eyeL", "eyeR", "openL", "openR", "pupilL", "pupilR", "lidL", "lidR", "mouth", "cheekL", "cheekR"]) {
      el[k] = host.querySelector(`[data-p="${k}"]`);
    }
    const s = {
      yaw: 0, pitch: 0, eyaw: 0, epitch: 0, happy: 0, wide: 0,
      hop: -9, drop: drop && !reduce ? 0.2 : -9,
      blink: -9, twice: false, nextBlink: 1.4 + Math.random() * 2,
      visible: true, rect: null,
    };
    const p = { host, el, s };
    host.addEventListener("click", () => p.poke());
    p.poke = () => {
      const t = clock() - start;
      if (t - s.hop > 0.6 && t - s.drop > 1) s.hop = t;
    };
    pebbles.push(p);
    new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; }).observe(host);
    return p;
  }

  function target(p, t) {
    const r = p.s.rect;
    const fx = r.left + 0.5 * r.width, fy = r.top + 0.486 * r.height;
    const idle = !pointer.seen || t - (pointer.moved - start) > 7;
    if (idle) {
      const away = clamp((Math.sin(t * 0.23 + 0.6) - 0.35) * 3, 0, 1);
      return {
        yaw: (0.42 * Math.sin(t * 0.5) + 0.12 * Math.sin(t * 1.3)) * (1 - away),
        pitch: 0.16 * Math.sin(t * 0.37 + 1.2) * (1 - away),
        near: away > 0.9,
      };
    }
    const dx = pointer.x - fx, dy = pointer.y - fy;
    if (Math.hypot(dx, dy) < r.width * 0.3) return { yaw: 0, pitch: 0, near: true };
    const d = Math.max(innerWidth, innerHeight) * 0.6;
    return {
      yaw: clamp(Math.atan2(dx, d), -MAX_YAW, MAX_YAW),
      pitch: clamp(Math.atan2(dy, d), -MAX_UP, MAX_DOWN),
      near: false,
    };
  }

  function update(p, t, dt) {
    const { el, s } = p;
    const aim = target(p, t);
    const kh = ease(dt, 0.17), ke = ease(dt, 0.05);
    s.yaw += (aim.yaw - s.yaw) * kh;
    s.pitch += (aim.pitch - s.pitch) * kh;
    s.eyaw += (aim.yaw - s.eyaw) * ke;
    s.epitch += (aim.pitch - s.epitch) * ke;
    s.happy += ((aim.near ? 1 : 0) - s.happy) * ease(dt, 0.25);

    const hopAge = t - s.hop, dropAge = t - s.drop;
    const startled = (hopAge >= 0 && hopAge < 0.55) || (dropAge >= 0 && dropAge < 0.75) ? 1 : clamp((pointer.speed - 2600) / 3000, 0, 1);
    s.wide += (startled - s.wide) * ease(dt, startled > s.wide ? 0.05 : 0.3);

    if (t >= s.nextBlink) {
      s.blink = t;
      s.twice = Math.random() < 0.22;
      s.nextBlink = t + 2.4 + Math.random() * 3.6;
    }
    const b = t - s.blink;
    const closed = clamp(bump(b / 0.17) + (s.twice ? bump((b - 0.26) / 0.17) : 0), 0, 1);
    const open = Math.max(0.06, 1 - closed) * (1 - 0.14 * s.happy) * (1 + 0.2 * s.wide);

    const px = clamp((s.eyaw - s.yaw) / 0.28 + (s.eyaw / MAX_YAW) * 0.5, -1, 1) * 5.5;
    const py = clamp((s.epitch - s.pitch) / 0.24 + (s.epitch / MAX_DOWN) * 0.5, -1, 1) * 6.5;

    el.eyeL.setAttribute("transform", onSurface(project(-0.302, -0.111, s.yaw, s.pitch)));
    el.eyeR.setAttribute("transform", onSurface(project(0.302, -0.111, s.yaw, s.pitch)));
    const lens = `scale(${f2(1 + 0.12 * s.wide)} ${open.toFixed(3)})`;
    el.openL.setAttribute("transform", lens);
    el.openR.setAttribute("transform", lens);
    const gaze = `translate(${f2(px)} ${f2(py)}) scale(${f2(1 + 0.1 * s.happy)})`;
    el.pupilL.setAttribute("transform", gaze);
    el.pupilR.setAttribute("transform", gaze);
    const lid = clamp((0.4 - open) / 0.3, 0, 1).toFixed(2);
    el.lidL.setAttribute("opacity", lid);
    el.lidR.setAttribute("opacity", lid);
    el.mouth.setAttribute("transform", onSurface(project(0, 0.356, s.yaw, s.pitch)));
    el.mouth.setAttribute("d", mouthPath(s.happy, s.wide));
    el.cheekL.setAttribute("transform", onSurface(project(-0.47, 0.2, s.yaw, s.pitch)));
    el.cheekR.setAttribute("transform", onSurface(project(0.47, 0.2, s.yaw, s.pitch)));
    const blush = (0.16 + 0.34 * s.happy).toFixed(3);
    el.cheekL.setAttribute("opacity", blush);
    el.cheekR.setAttribute("opacity", blush);

    let sq = reduce ? 0 : 0.013 * Math.sin((2 * Math.PI * t) / (4 * BEAT)) - s.pitch * 0.05;
    let lift = 0;
    if (!reduce && hopAge >= 0 && hopAge < 1.4) {
      if (hopAge < 0.09) sq -= 0.12 * Math.sin((hopAge / 0.09) * (Math.PI / 2));
      else if (hopAge < 0.53) {
        const f = (hopAge - 0.09) / 0.44;
        lift = 70 * 4 * f * (1 - f);
        sq += 0.09 * Math.sin(f * Math.PI) - 0.12 * Math.max(0, 1 - f * 5);
      } else {
        const g = hopAge - 0.53;
        sq -= 0.16 * Math.exp(-g * 8) * Math.cos(g * 24);
      }
    }
    if (s.drop > -9) {
      if (dropAge < 0) lift = 900;
      else if (dropAge < 0.62) lift = 900 * (1 - (dropAge / 0.62) ** 2);
      else if (dropAge < 2.5) {
        const g = dropAge - 0.62;
        sq -= 0.2 * Math.exp(-g * 7) * Math.cos(g * 22);
      }
    }
    const lean = s.yaw * 9;
    el.body.setAttribute("transform", `translate(100 202) rotate(${f2(lean)}) translate(0 ${f2(-lift)}) scale(${(1 - 0.5 * sq).toFixed(4)} ${(1 + sq).toFixed(4)}) translate(-100 -202)`);
    const k = clamp(1 - lift / 260, 0.35, 1);
    el.shadow.setAttribute("transform", `translate(100 206) scale(${(k * (1 - 0.7 * sq)).toFixed(3)} ${k.toFixed(3)}) translate(-100 -206)`);
    el.shadow.setAttribute("opacity", (0.5 * k).toFixed(3));
  }

  function setupCursor() {
    if (!fine || reduce) return null;
    html.classList.add("cursor-on");
    const root = cursor;
    const ring = root.querySelector(".cursor-ring");
    const label = ring.querySelector("span");
    const dot = root.querySelector(".cursor-dot");
    const at = { x: pointer.x, y: pointer.y };
    root.classList.add("is-out");
    document.addEventListener("pointerover", (e) => {
      const hit = e.target.closest("[data-cursor], a, button");
      const text = hit && hit.dataset.cursor;
      root.classList.toggle("is-label", !!text);
      root.classList.toggle("is-link", !!hit && !text);
      if (text) label.textContent = text;
    });
    document.addEventListener("pointerdown", () => root.classList.add("is-down"));
    document.addEventListener("pointerup", () => root.classList.remove("is-down"));
    document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) root.classList.add("is-out"); });
    document.addEventListener("mouseover", () => root.classList.remove("is-out"));
    return (dt) => {
      const k = ease(dt, 0.09);
      at.x += (pointer.x - at.x) * k;
      at.y += (pointer.y - at.y) * k;
      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      ring.style.transform = `translate3d(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px, 0)`;
    };
  }

  function setupMagnets() {
    if (!fine || reduce) return;
    for (const el of document.querySelectorAll("[data-magnetic]")) {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.translate = `${f2(x * 0.22)}px ${f2(y * 0.32)}px`;
      });
      el.addEventListener("pointerleave", () => { el.style.translate = ""; });
    }
  }

  function setupFilms() {
    const dlg = document.querySelector(".player");
    const video = dlg.querySelector("video");
    const cap = dlg.querySelector(".player-cap");
    const custom = html.classList.contains("cursor-on");
    const open = (key) => {
      const film = FILMS[key];
      if (!film) return;
      video.poster = film.poster;
      video.src = film.src;
      cap.innerHTML = film.cap;
      html.classList.remove("cursor-on");
      dlg.showModal();
      video.muted = false;
      video.play().catch(() => {});
    };
    dlg.addEventListener("close", () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (custom) html.classList.add("cursor-on");
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.querySelector(".player-close").addEventListener("click", () => dlg.close());
    for (const el of document.querySelectorAll("[data-film]")) {
      el.addEventListener("click", (e) => { e.preventDefault(); open(el.dataset.film); });
    }
    const loops = document.querySelectorAll(".film video");
    if (reduce) {
      for (const v of loops) {
        v.parentElement.addEventListener("pointerenter", () => v.play().catch(() => {}));
        v.parentElement.addEventListener("pointerleave", () => v.pause());
      }
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause();
    }, { threshold: 0.35 });
    for (const v of loops) io.observe(v);
  }

  function setupCopy(helper) {
    for (const b of document.querySelectorAll("[data-copy]")) {
      b.addEventListener("click", async () => {
        let ok = true;
        try {
          await navigator.clipboard.writeText(b.dataset.copy);
        } catch {
          ok = false;
          const code = b.parentElement.querySelector("code");
          const range = document.createRange();
          range.selectNodeContents(code);
          getSelection().removeAllRanges();
          getSelection().addRange(range);
        }
        b.textContent = ok ? "Copied" : "Selected";
        b.classList.toggle("done", ok);
        if (helper) helper.poke();
        clearTimeout(b.reset);
        b.reset = setTimeout(() => { b.textContent = "Copy"; b.classList.remove("done"); }, 1800);
      });
    }
  }

  function setupStars() {
    const slots = document.querySelectorAll("[data-stars]");
    const show = (n) => {
      if (!(n > 0)) return;
      const text = n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
      for (const s of slots) {
        s.textContent = text;
        s.hidden = false;
      }
    };
    try {
      const saved = JSON.parse(sessionStorage.getItem("md-stars") || "null");
      if (saved && Date.now() - saved.at < 600000) return show(saved.n);
    } catch {}
    fetch("https://api.github.com/repos/kaventro/motion-designer", { headers: { Accept: "application/vnd.github+json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((repo) => {
        show(repo.stargazers_count);
        try { sessionStorage.setItem("md-stars", JSON.stringify({ n: repo.stargazers_count, at: Date.now() })); } catch {}
      })
      .catch(() => {});
  }

  function setupSlate() {
    const tc = document.querySelector("[data-tc]");
    const dots = [...document.querySelectorAll(".beats i")];
    const hero = document.querySelector(".hero");
    let shown = true;
    new IntersectionObserver(([e]) => { shown = e.isIntersecting; }).observe(hero);
    let last = -1;
    return (t) => {
      if (!shown) return;
      const f = Math.floor(t * 60);
      if (f === last) return;
      last = f;
      const parts = [Math.floor(f / 216000), Math.floor(f / 3600) % 60, Math.floor(f / 60) % 60, f % 60];
      tc.textContent = parts.map((n) => String(n).padStart(2, "0")).join(":");
      const beat = Math.floor(t / BEAT) % 4, on = t % BEAT < 0.14;
      dots.forEach((d, i) => d.classList.toggle("on", on && i === beat));
    };
  }

  const track = (x, y) => {
    const now = clock();
    const dt = Math.max(0.004, now - pointer.stamp);
    pointer.speed = pointer.speed * 0.75 + (Math.hypot(x - pointer.x, y - pointer.y) / dt) * 0.25;
    pointer.x = x;
    pointer.y = y;
    pointer.seen = true;
    pointer.moved = now;
    pointer.stamp = now;
    cursor.classList.remove("is-out");
  };
  addEventListener("pointermove", (e) => track(e.clientX, e.clientY), { passive: true });
  addEventListener("pointerdown", (e) => track(e.clientX, e.clientY), { passive: true });
  addEventListener("touchmove", (e) => { const p = e.touches[0]; if (p) track(p.clientX, p.clientY); }, { passive: true });

  const hosts = Object.fromEntries([...document.querySelectorAll("[data-pebble]")].map((h) => [h.dataset.pebble, h]));
  if (hosts.logo) pebble(hosts.logo);
  if (hosts.hero) pebble(hosts.hero, { drop: true });
  const helper = hosts.install ? pebble(hosts.install) : null;

  const moveCursor = setupCursor();
  setupMagnets();
  setupFilms();
  setupCopy(helper);
  setupStars();
  const slate = setupSlate();

  let last = clock();
  const frame = () => {
    const now = clock();
    const dt = Math.min(0.05, now - last);
    last = now;
    const t = now - start;
    pointer.speed *= Math.exp(-dt / 0.15);
    const live = pebbles.filter((p) => p.s.visible);
    for (const p of live) p.s.rect = p.host.getBoundingClientRect();
    for (const p of live) update(p, t, dt);
    slate(t);
    if (moveCursor) moveCursor(dt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();

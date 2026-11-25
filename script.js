/* A little surprise — interactions
   Vanilla JS, no dependencies. */
(() => {
  "use strict";

  const body = document.body;
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = reduceMotionQuery.matches;
  reduceMotionQuery.addEventListener?.("change", (e) => { reduceMotion = e.matches; });

  /* ---------------------------------------------------------
     Build the big name letter by letter
     --------------------------------------------------------- */
  const nameEl = document.querySelector(".reveal__name");
  if (nameEl) {
    const word = nameEl.dataset.letters || "";
    const frag = document.createDocumentFragment();
    [...word, "!"].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = ch === "!" ? "ch ch--bang" : "ch";
      span.textContent = ch;
      span.style.setProperty("--i", i);
      frag.appendChild(span);
    });
    nameEl.appendChild(frag);
  }

  /* ---------------------------------------------------------
     Decorative barcode (purely ornamental)
     --------------------------------------------------------- */
  const barcode = document.getElementById("barcode");
  if (barcode) {
    let seed = 1712; // deterministic so it looks the same every time
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const W = 100, H = 60;
    let x = 0, rects = "";
    while (x < W) {
      const w = 0.6 + Math.floor(rand() * 4) * 0.7;
      if (x + w > W) break;
      rects += `<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${H}"/>`;
      x += w + 0.7 + Math.floor(rand() * 3) * 0.7;
    }
    barcode.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" fill="#2e0a15" opacity=".85">${rects}</svg>`;
  }

  /* ---------------------------------------------------------
     Particle sky: twinkling stars, drifting motes, heart bursts
     --------------------------------------------------------- */
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1;
  let stars = [], motes = [], bursts = [];
  let rafId = 0, last = 0;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const palette = ["255,247,243", "240,201,207", "247,223,226", "196,139,150", "232,226,230"];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const area = W * H;
    const starCount = Math.round(Math.min(110, Math.max(40, area / 7000)));
    const moteCount = Math.round(Math.min(26, Math.max(12, area / 30000)));
    stars = Array.from({ length: starCount }, () => ({
      x: rnd(0, W), y: rnd(0, H),
      r: rnd(0.3, 1.25),
      a: rnd(0.15, 0.8),
      tw: rnd(0.4, 1.6), ph: rnd(0, Math.PI * 2),
      sparkle: Math.random() < 0.06,
    }));
    motes = Array.from({ length: moteCount }, () => newMote(true));
    flashScale();
    if (reduceMotion) drawStatic();
  }

  function newMote(anywhere) {
    return {
      x: rnd(0, W),
      y: anywhere ? rnd(0, H) : H + 20,
      vy: rnd(6, 16),
      sway: rnd(6, 20), ph: rnd(0, Math.PI * 2),
      r: rnd(1.2, 3.2),
      a: rnd(0.08, 0.32),
      heart: Math.random() < 0.28,
      c: palette[(Math.random() * palette.length) | 0],
    };
  }

  function heartPath(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y - s * 0.15, x - s * 0.5, y + s * 0.2);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.55, x, y + s * 0.75, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.75, x + s * 0.5, y + s * 0.55, x + s * 0.5, y + s * 0.2);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 0.15, x, y, x, y + s * 0.3);
    ctx.closePath();
  }

  function sparkle(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x, y, x + s, y);
    ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y);
    ctx.quadraticCurveTo(x, y, x, y - s);
    ctx.closePath();
  }

  function drawStars(t) {
    for (const s of stars) {
      const tw = reduceMotion ? 1 : 0.55 + 0.45 * Math.sin(t * s.tw + s.ph);
      const alpha = s.a * tw;
      if (s.sparkle) {
        ctx.fillStyle = `rgba(255,240,242,${alpha})`;
        sparkle(s.x, s.y, s.r * 3.2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(255,240,242,${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    drawStars(0);
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    const t = now / 1000;

    ctx.clearRect(0, 0, W, H);
    drawStars(t);

    // drifting motes and tiny hearts
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y -= m.vy * dt;
      const x = m.x + Math.sin(t * 0.6 + m.ph) * m.sway;
      if (m.y < -20) motes[i] = newMote(false);
      ctx.fillStyle = `rgba(${m.c},${m.a})`;
      if (m.heart) {
        heartPath(x, m.y, m.r * 2.6);
        ctx.fill();
      } else {
        ctx.shadowColor = `rgba(${m.c},.8)`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x, m.y, m.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // reveal burst particles
    for (let i = bursts.length - 1; i >= 0; i--) {
      const p = bursts[i];
      p.life += dt;
      if (p.life > p.ttl) { bursts.splice(i, 1); continue; }
      p.vx *= 1 - 1.6 * dt;
      p.vy = p.vy * (1 - 1.6 * dt) + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const k = p.life / p.ttl;
      const alpha = (k < 0.1 ? k / 0.1 : 1 - Math.pow((k - 0.1) / 0.9, 1.6)) * p.a;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = `rgba(${p.c},${alpha})`;
      if (p.kind === "heart") { heartPath(0, -p.s / 2, p.s); ctx.fill(); }
      else if (p.kind === "spark") { sparkle(0, 0, p.s * 0.6); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.s * 0.22, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }

  function start() {
    if (reduceMotion) { drawStatic(); return; }
    if (!rafId) { last = 0; rafId = requestAnimationFrame(frame); }
  }
  function stop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function burst() {
    if (reduceMotion) return;
    const cx = W / 2, cy = H * 0.46;
    const n = W < 500 ? 90 : 140;
    for (let i = 0; i < n; i++) {
      const ang = rnd(0, Math.PI * 2);
      const sp = rnd(120, Math.max(W, H) * 0.9);
      const r = Math.random();
      bursts.push({
        x: cx + rnd(-10, 10), y: cy + rnd(-10, 10),
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 60,
        g: rnd(18, 50),
        s: r < 0.35 ? rnd(7, 14) : r < 0.6 ? rnd(6, 12) : rnd(4, 8),
        kind: r < 0.35 ? "heart" : r < 0.6 ? "spark" : "dot",
        rot: rnd(-0.6, 0.6), vr: rnd(-1.5, 1.5),
        life: 0, ttl: rnd(2.2, 4.2),
        a: rnd(0.55, 1),
        c: palette[(Math.random() * palette.length) | 0],
      });
    }
    // a gentle second wave of hearts rising from below
    setTimeout(() => {
      for (let i = 0; i < (W < 500 ? 22 : 34); i++) {
        bursts.push({
          x: rnd(0, W), y: H + rnd(0, 60),
          vx: rnd(-14, 14), vy: rnd(-200, -120),
          g: -6, s: rnd(6, 12), kind: "heart",
          rot: rnd(-0.4, 0.4), vr: rnd(-0.6, 0.6),
          life: 0, ttl: rnd(4, 6.5), a: rnd(0.35, 0.75),
          c: palette[(Math.random() * palette.length) | 0],
        });
      }
    }, 900);
  }

  function flashScale() {
    // scale needed for a 40px circle to cover the viewport diagonal
    const d = Math.hypot(W, H);
    document.documentElement.style.setProperty("--flash-scale", Math.ceil((d / 40) * 1.6));
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  reduceMotionQuery.addEventListener?.("change", () => { stop(); start(); });

  resize();
  start();

  /* ---------------------------------------------------------
     Screen flow
     --------------------------------------------------------- */
  const screens = Object.fromEntries(
    [...document.querySelectorAll(".screen")].map((s) => [s.id, s])
  );
  let current = "intro";
  let busy = false;

  // Inactive screens are hidden from assistive tech and keyboard
  Object.values(screens).forEach((s) => { if (s.id !== current) s.inert = true; });

  function show(id) {
    const from = screens[current];
    const to = screens[id];
    if (!to || id === current) return;

    from.classList.remove("is-active");
    from.classList.add("is-leaving");
    from.inert = true;
    const outMs = reduceMotion ? 250 : 800;
    setTimeout(() => {
      from.hidden = true;
      from.classList.remove("is-leaving");
    }, outMs);

    to.hidden = false;
    to.inert = false;
    to.scrollTop = 0;
    void to.offsetWidth; // restart entrance animations
    to.classList.add("is-active");
    current = id;
    body.dataset.screen = id;

    const focusTarget = to.querySelector("[tabindex='-1']");
    if (focusTarget) setTimeout(() => focusTarget.focus({ preventScroll: true }), 50);
  }

  const flash = document.getElementById("flash");
  const gift = document.querySelector(".gift");

  function reveal() {
    if (reduceMotion) { show("reveal"); return; }
    gift?.classList.add("is-opening");
    if (navigator.vibrate) { try { navigator.vibrate([14, 60, 24]); } catch (_) {} }
    setTimeout(() => {
      flash.classList.remove("is-bursting");
      void flash.offsetWidth;
      flash.classList.add("is-bursting");
    }, 380);
    setTimeout(() => show("reveal"), 900);
    setTimeout(burst, 1150);
  }

  function replay() {
    gift?.classList.remove("is-opening");
    flash.classList.remove("is-bursting");
    bursts.length = 0;
    show("intro");
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-go]");
    if (!btn || busy) return;
    busy = true;
    const target = btn.dataset.go;
    if (target === "reveal") reveal();
    else if (btn.hasAttribute("data-replay")) replay();
    else show(target);
    setTimeout(() => { busy = false; }, target === "reveal" ? 1600 : 900);
  });

  /* ---------------------------------------------------------
     Ticket: gentle tilt toward the pointer (fine pointers only)
     --------------------------------------------------------- */
  const ticket = document.querySelector(".ticket");
  if (ticket && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    ticket.addEventListener("animationend", (e) => {
      if (e.target !== ticket) return;
      ticket.style.animation = "none";
      ticket.style.opacity = "1";
      ticket.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
    });
    screens.ticket.addEventListener("pointermove", (e) => {
      if (reduceMotion || ticket.style.animation !== "none") return;
      const r = ticket.getBoundingClientRect();
      const px = (e.clientX - (r.left + r.width / 2)) / r.width;
      const py = (e.clientY - (r.top + r.height / 2)) / r.height;
      ticket.style.transform =
        `perspective(900px) rotateY(${(px * 8).toFixed(2)}deg) rotateX(${(-py * 8).toFixed(2)}deg)`;
    });
    screens.ticket.addEventListener("pointerleave", () => { ticket.style.transform = ""; });
    // restore the entrance animation next time the ticket is shown
    new MutationObserver(() => {
      if (screens.ticket.hidden) {
        ticket.style.animation = "";
        ticket.style.opacity = "";
        ticket.style.transform = "";
        ticket.style.transition = "";
      }
    }).observe(screens.ticket, { attributes: true, attributeFilter: ["hidden"] });
  }
})();

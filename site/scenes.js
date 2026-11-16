(() => {
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const COLORS = ["#f58a1f", "#ffc21a", "#ffb02e", "#fff3d6"];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- falling petals (page-wide + inside each scene) ---------- */
  function petals(layer, n, minDur, maxDur) {
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "petal";
      p.style.left = rand(0, 100) + "%";
      p.style.background = COLORS[i % COLORS.length];
      p.style.animationDuration = rand(minDur, maxDur) + "s";
      p.style.animationDelay = rand(-maxDur, 0) + "s";
      p.style.opacity = rand(.45, .9);
      layer.appendChild(p);
    }
  }
  const field = document.getElementById("petalField");
  if (field) petals(field, 16, 11, 20);
  document.querySelectorAll(".petal-layer").forEach(l => petals(l, 9, 5, 9));

  /* ---------- Scene 1: muggu being drawn ---------- */
  function buildMuggu(svg) {
    const cx = 284, cy = 277;
    const rings = [[150, 26, "#ffd34d", 3.2, 0], [112, 19, "#ff5d8f", 3, .7], [78, 13, "#4fd1c5", 2.8, 1.4], [44, 7.5, "#ffffff", 2.4, 2.1]];
    rings.forEach(([rx, ry, col, w, delay]) => {
      el("path", { class: "ring", pathLength: 1, d: `M${cx - rx},${cy} A${rx},${ry} 0 1 1 ${cx + rx},${cy} A${rx},${ry} 0 1 1 ${cx - rx},${cy}`, stroke: col, "stroke-width": w, style: `animation-delay:${delay}s`, filter: "drop-shadow(0 0 3px " + col + ")" }, svg);
    });
    const dotCols = ["#ff5d8f", "#ffd34d", "#ffffff", "#4fd1c5"];
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      el("circle", { class: "dot", cx: cx + Math.cos(a) * 163, cy: cy + Math.sin(a) * 29, r: 3, fill: dotCols[i % 4], style: `animation-delay:${(i * .09 + 1).toFixed(2)}s` }, svg);
    }
    // diya glows
    [[22, 140], [38, 140], [529, 109], [81, 262], [472, 256], [117, 292], [454, 292]].forEach(([x, y], i) =>
      el("circle", { class: "glow", cx: x, cy: y, r: i < 3 ? 13 : 9, fill: "#ffb347", opacity: .7, style: `animation-delay:${i * .23}s;filter:blur(3px)` }, svg));
    // rice-flour powder falling from both hands
    [[254, 242], [359, 239]].forEach(([x, y], h) => {
      for (let i = 0; i < 6; i++)
        el("circle", { class: "powder", cx: x + rand(-6, 6), cy: y, r: 1.8, fill: ["#fff", "#ff8fb3", "#ffe27a"][i % 3], style: `--dx:${rand(-14, 14)}px;animation-delay:${(i * .18 + h * .09).toFixed(2)}s` }, svg);
    });
  }

  /* ---------- Scene 2: marigold garland being tied ---------- */
  function buildGarland(svg) {
    const segs = [[[226, 49], [279, 14], [339, 12]], [[339, 12], [410, 70], [489, 34]]];
    let idx = 0;
    segs.forEach(seg => {
      for (let i = 0; i <= 14; i++) {
        const t = i / 14, [p0, p1, p2] = seg, u = 1 - t;
        const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
        const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
        el("circle", { class: "bead", cx: x, cy: y + 4, r: 6.5, fill: idx % 5 === 4 ? "#fff3d6" : COLORS[idx % 3], stroke: "#c25b00", "stroke-width": .6, style: `animation-delay:${(idx * .16 + 1).toFixed(2)}s` }, svg);
        idx++;
      }
    });
    // glint travelling along the garland
    const path = el("path", { id: "gpath", d: "M226,53 Q279,18 339,16 Q410,74 489,38", fill: "none" }, svg);
    const g = el("circle", { r: 5, fill: "#fffbe0", style: "filter:blur(1.5px)" }, svg);
    const m = el("animateMotion", { dur: "3.2s", repeatCount: "indefinite" }, g);
    el("mpath", { href: "#gpath" }, m);
    // "tying" pulses at the two pairs of hands
    [[334, 9], [484, 34]].forEach(([x, y], i) => el("circle", { class: "tie", cx: x, cy: y, r: 12, style: `animation-delay:${i * .9}s` }, svg));
  }

  /* ---------- Scenes 3 & 4: canvas effects ---------- */
  function setupCanvas(canvas) {
    const dpr = Math.min(devicePixelRatio || 1, 2), ctx = canvas.getContext("2d");
    const fit = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width * dpr; canvas.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit(); addEventListener("resize", fit);
    return { ctx, w: () => canvas.clientWidth, h: () => canvas.clientHeight };
  }
  const boom = (list, x, y, n, hue) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(40, 150);
      list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, decay: rand(.5, .9), hue: hue + rand(-15, 15), size: rand(1.2, 2.4), g: 90 });
    }
  };
  function drawParticles(ctx, list, dt) {
    ctx.globalCompositeOperation = "lighter";
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .985; p.life -= p.decay * dt;
      if (p.life <= 0) { list.splice(i, 1); continue; }
      ctx.fillStyle = `hsla(${p.hue},100%,${p.white ? 90 : 62}%,${p.life})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (.5 + p.life), 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function buildCrackers(stage) {
    const canvas = stage.querySelector("canvas"), img = stage.querySelector("img");
    const { ctx, w, h } = setupCanvas(canvas), parts = [], rockets = [];
    const IW = 1178, IH = 328, TIPS = [[302, 26], [880, 26]];
    let running = false, last = 0, nextRocket = 0;
    new IntersectionObserver(e => { running = e[0].isIntersecting; if (running) { last = performance.now(); requestAnimationFrame(loop); } }, { threshold: .15 }).observe(stage);
    function loop(now) {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, .05); last = now;
      const W = w(), H = h(), s = Math.max(W / IW, H / IH), dw = IW * s, dh = IH * s;
      const px = dw > W + 2 ? (1 - Math.cos(now / 3600)) / 2 : .5;       // slow cinematic pan on narrow screens
      img.style.objectPosition = `${px * 100}% 50%`;
      const ox = (W - dw) * px, oy = (H - dh) * .5;
      ctx.clearRect(0, 0, W, H);
      // sparkler sparks at both sparkler tips
      TIPS.forEach(([tx, ty]) => {
        const x = ox + tx * s, y = oy + ty * s;
        if (x < -20 || x > W + 20) return;
        for (let i = 0; i < 4; i++) { const a = rand(0, 6.283), v = rand(30, 110); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 1, decay: rand(1.6, 2.6), hue: rand(35, 55), size: rand(.8, 1.7), g: 140, white: Math.random() < .4 }); }
      });
      // rockets + bursts in the sky
      if (now > nextRocket) { rockets.push({ x: rand(W * .08, W * .92), y: H * .75, ty: rand(H * .08, H * .38), hue: rand(0, 360) }); nextRocket = now + rand(600, 1300); }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]; r.y -= 260 * dt;
        ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = "#ffe9a8"; ctx.fillRect(r.x, r.y, 2, 6); ctx.globalCompositeOperation = "source-over";
        if (r.y <= r.ty) { boom(parts, r.x, r.y, W < 600 ? 34 : 56, r.hue); rockets.splice(i, 1); }
      }
      drawParticles(ctx, parts, dt);
      requestAnimationFrame(loop);
    }
  }

  function buildEntry(scene) {
    const stage = scene.querySelector(".stage"), canvas = stage.querySelector("canvas"), btn = scene.querySelector(".replay");
    const { ctx, w, h } = setupCanvas(canvas), flowers = [];
    let raf = 0, timer = 0, last = 0, until = 0;
    function shower(now) {
      const dt = Math.min((now - last) / 1000, .05); last = now;
      ctx.clearRect(0, 0, w(), h());
      if (now < until && Math.random() < .35) flowers.push({ x: rand(0, w()), y: -10, vx: rand(-20, 20), vy: rand(60, 130), r: rand(2.5, 4.5), rot: rand(0, 6), c: COLORS[(Math.random() * 4) | 0] });
      for (let i = flowers.length - 1; i >= 0; i--) {
        const f = flowers[i]; f.x += (f.vx + Math.sin(f.y / 30) * 25) * dt; f.y += f.vy * dt; f.rot += dt * 3;
        if (f.y > h() + 10) { flowers.splice(i, 1); continue; }
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.fillStyle = f.c;
        ctx.beginPath(); ctx.ellipse(0, 0, f.r, f.r * 1.7, 0, 0, 6.283); ctx.fill(); ctx.restore();
      }
      if (now < until || flowers.length) raf = requestAnimationFrame(shower); else ctx.clearRect(0, 0, w(), h());
    }
    function play() {
      scene.classList.remove("live"); void scene.offsetWidth; scene.classList.add("live");
      cancelAnimationFrame(raf); clearTimeout(timer); flowers.length = 0;
      timer = setTimeout(() => { last = performance.now(); until = last + 5000; raf = requestAnimationFrame(shower); }, 6800);
    }
    btn.addEventListener("click", play);
    return play;
  }

  /* ---------- wire up scenes; start each when scrolled into view ---------- */
  const scenes = {};
  document.querySelectorAll(".scene").forEach(s => {
    const name = s.dataset.scene, svg = s.querySelector("svg.fx");
    if (name === "muggu") buildMuggu(svg);
    if (name === "garland") buildGarland(svg);
    if (name === "crackers") buildCrackers(s.querySelector(".stage"));
    if (name === "entry") scenes.entry = buildEntry(s);
  });
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const s = e.target;
    if (s.dataset.scene === "entry") { scenes.entry(); io.unobserve(s); }
    else s.classList.add("live");
  }), { threshold: .4 });
  document.querySelectorAll(".scene").forEach(s => io.observe(s));
})();

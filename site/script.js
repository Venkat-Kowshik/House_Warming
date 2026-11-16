(() => {
  const cfg = window.INVITATION || {};
  const byId = id => document.getElementById(id);
  const setText = (id, value, fallback) => { byId(id).textContent = value || fallback; };
  setText("familyName", cfg.familyName, "Our Family");
  setText("eventDate", cfg.date, "Date to be announced");
  setText("eventMuhurtham", cfg.muhurtham, "To be announced");
  setText("eventTime", cfg.time, "Time to be announced");
  setText("eventNote", cfg.note, "");
  setText("eventVenue", cfg.venue, "Our New Home");
  setText("eventAddress", cfg.address, "Address will be shared soon");
  const map = byId("mapLink");
  if (cfg.mapUrl) { map.href = cfg.mapUrl; } else { map.hidden = true; }

  // Directions from the visitor's current location
  const dirBtn = byId("dirBtn"), status = byId("mapStatus");
  const dest = cfg.coords || [cfg.venue, cfg.address].filter(Boolean).join(", ");
  let mode = "driving";
  document.querySelectorAll(".chip").forEach(chip => chip.addEventListener("click", () => {
    mode = chip.dataset.mode;
    document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c === chip ? "true" : "false"));
  }));
  if (!dest) { dirBtn.hidden = true; }
  const dirUrl = origin => "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(dest) + "&travelmode=" + mode + (origin ? "&origin=" + origin : "");
  dirBtn.addEventListener("click", () => {
    const win = window.open("", "_blank");               // opened now so the browser doesn't block it
    const go = origin => { const u = dirUrl(origin); if (win && !win.closed) win.location.href = u; else location.href = u; };
    if (!navigator.geolocation) { status.textContent = "Opening Google Maps…"; go(); return; }
    status.textContent = "Finding your location…";
    navigator.geolocation.getCurrentPosition(
      p => { status.textContent = "Opening directions from where you are…"; go(p.coords.latitude + "," + p.coords.longitude); },
      () => { status.textContent = "Location not shared, so Google Maps will ask for your starting point."; go(); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
  });

  const loading = byId("loadingScreen");
  window.addEventListener("load", () => setTimeout(() => loading.classList.add("hide"), 450));
  if (document.readyState === "complete") setTimeout(() => loading.classList.add("hide"), 450);

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold: .12});
  document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

  const petalLayer = byId("petals");
  for (let i = 0; i < 24; i++) {
    const p = document.createElement("span");
    p.className = "petal";
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${8 + Math.random() * 10}s`;
    p.style.animationDelay = `${Math.random() * -16}s`;
    p.style.opacity = `${.25 + Math.random() * .55}`;
    p.style.transform = `scale(${.55 + Math.random() * .8})`;
    petalLayer.appendChild(p);
  }

  // Music: uses config.musicUrl if provided, otherwise the built-in original instrumental (music.js)
  const audio = byId("celebrationAudio");
  const toggle = byId("soundToggle");
  const label = byId("soundLabel");
  const useFile = !!cfg.musicUrl;
  if (useFile) audio.src = cfg.musicUrl;
  const setOn = on => {
    toggle.setAttribute("aria-pressed", on ? "true" : "false");
    toggle.classList.toggle("on", on);
    label.textContent = on ? "Music on" : "Play music";
  };
  toggle.addEventListener("click", async () => {
    const isOn = useFile ? !audio.paused : window.HousewarmingMusic.playing;
    try {
      if (isOn) { useFile ? audio.pause() : window.HousewarmingMusic.stop(); setOn(false); }
      else { useFile ? await audio.play() : await window.HousewarmingMusic.start(); setOn(true); }
    } catch { label.textContent = "Tap again"; setTimeout(() => setOn(false), 1800); }
  });
})();

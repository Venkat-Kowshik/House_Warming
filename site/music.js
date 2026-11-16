/* Calm, original instrumental generated in the browser (no audio file or licence needed).
   Soft sine "flute" phrases in a pentatonic scale, a warm slow pad, a gentle tanpura drone,
   and a distant temple chime, all wrapped in a long reverb. No drums, ~60 BPM feel. */
window.HousewarmingMusic = (() => {
  let ctx, master, dry, wet, timer, playing = false, nextPhrase = 0, nextPad = 0, nextDrone = 0, nextChime = 0, padIdx = 0, droneIdx = 0;
  const SC = [0, 2, 4, 7, 9, 12];                      // C D E G A C  (major pentatonic)
  const BASE = 261.63;                                 // C4
  const f = i => BASE * Math.pow(2, SC[i] / 12);
  const PHRASES = [
    [[2,1.5],[3,.5],[2,1],[1,1],[0,3]],
    [[0,1],[1,1],[2,2],[4,1],[3,1],[2,2.5]],
    [[4,2],[3,1],[2,1],[1,1],[2,1],[0,3.5]],
    [[1,1],[2,1],[3,2],[4,2],[3,1],[2,1],[1,1],[0,3]],
    [[2,2],[1,1],[0,1],[1,1],[2,1],[3,1.5],[2,3]]
  ];
  const PAD = [[65.41, 130.81, 196, 329.63], [55, 110, 164.81, 261.63], [87.31, 130.81, 174.61, 261.63], [65.41, 130.81, 196, 293.66]];

  function makeReverb() {
    const len = ctx.sampleRate * 3.6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const cv = ctx.createConvolver(); cv.buffer = buf; return cv;
  }
  // a soft, rounded note: slow attack, long release, only gentle overtones
  function soft(t, freq, dur, vol, { attack = .25, release = 2.2, overtone = .12, send = .5 } = {}) {
    const g = ctx.createGain(), o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), og = ctx.createGain(), lp = ctx.createBiquadFilter();
    o1.type = "sine"; o1.frequency.value = freq;
    o2.type = "sine"; o2.frequency.value = freq * 2; og.gain.value = overtone;
    lp.type = "lowpass"; lp.frequency.value = 2400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setTargetAtTime(0.0001, t + dur, release / 4);
    o1.connect(g); o2.connect(og); og.connect(g); g.connect(lp);
    lp.connect(dry); const s = ctx.createGain(); s.gain.value = send; lp.connect(s); s.connect(wet);
    const end = t + dur + release + .3;
    if (freq > 200) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 4.2; lg.gain.value = freq * .0025; l.connect(lg); lg.connect(o1.frequency); l.start(t + .4); l.stop(end); }
    o1.start(t); o2.start(t); o1.stop(end); o2.stop(end);
  }
  function drone(t, freq) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = "triangle"; o.frequency.value = freq; lp.type = "lowpass"; lp.frequency.value = 520;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.05, t + .06); g.gain.setTargetAtTime(0.0001, t + .1, .9);
    o.connect(lp); lp.connect(g); g.connect(dry); g.connect(wet); o.start(t); o.stop(t + 4.5);
  }
  function pump() {
    const now = ctx.currentTime, ahead = now + 1.5;
    while (nextPad < ahead) { PAD[padIdx++ % PAD.length].forEach((p, i) => soft(nextPad + i * .15, p, 7, .028, { attack: 2.4, release: 4, overtone: .05, send: .7 })); nextPad += 8; }
    while (nextDrone < ahead) { drone(nextDrone, [98, 130.81, 130.81, 130.81][droneIdx++ % 4]); nextDrone += 2.4; }
    while (nextPhrase < ahead) {
      const ph = PHRASES[Math.floor(Math.random() * PHRASES.length)]; let t = nextPhrase;
      ph.forEach(([n, beats]) => { soft(t, f(n), beats * 1.0, .1, { attack: .18, release: 2 }); t += beats; });
      nextPhrase = t + 3 + Math.random() * 3;           // a breath of silence between phrases
    }
    while (nextChime < ahead) { soft(nextChime, 1046.5, .1, .018, { attack: .01, release: 5, overtone: .2, send: .9 }); nextChime += 14 + Math.random() * 8; }
  }
  return {
    get playing() { return playing; },
    async start() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) throw new Error("No Web Audio");
        ctx = new AC();
        master = ctx.createGain(); const tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 3200;
        dry = ctx.createGain(); wet = ctx.createGain(); wet.gain.value = .55;
        const rv = makeReverb(); dry.connect(tone); wet.connect(rv); rv.connect(tone); tone.connect(master); master.connect(ctx.destination);
      }
      await ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.linearRampToValueAtTime(.7, ctx.currentTime + 3);
      const t = ctx.currentTime + .2;
      nextPad = t; nextDrone = t + .5; nextPhrase = t + 2.5; nextChime = t + 6; padIdx = 0; droneIdx = 0; playing = true;
      pump(); timer = setInterval(pump, 250);
    },
    stop() {
      if (!ctx) return;
      playing = false; clearInterval(timer);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(Math.max(master.gain.value, .0001), ctx.currentTime);
      master.gain.linearRampToValueAtTime(.0001, ctx.currentTime + 1.2);
      setTimeout(() => { if (!playing) ctx.suspend(); }, 1500);
    }
  };
})();

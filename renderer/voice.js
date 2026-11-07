// Voice follow: "talking" while the mic is clearly louder than the room; stops after silenceMs of quiet.
// The room's noise floor is tracked continuously, so it works the same on a quiet USB mic or a noisy laptop mic:
// trigger = noise floor + marginDb. Shares the microphone with your recorder.

export function toDb(rms) {
  return rms > 0 ? Math.max(-100, 20 * Math.log10(rms)) : -100;
}

// Noise suppression outputs pure digital silence between sounds; a floor that low would make any
// click count as speech, so the floor never goes below this.
export const FLOOR_MIN_DB = -60;

// Noise floor follower: drops quickly to quiet moments, rises slowly (≈1 dB/s) so speech doesn't drag it up.
export function nextFloor(floor, db) {
  const next = db < floor ? floor * 0.7 + db * 0.3 : Math.min(db, floor + 0.05);
  return Math.max(FLOOR_MIN_DB, next);
}

export async function startVoice(opts, onTalking, onLevel) {
  const stream = await navigator.mediaDevices.getUserMedia({
    // AGC off: it pumps the room noise up during pauses, which looks like talking.
    audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: false },
  });
  const ctx = new AudioContext();
  await ctx.resume(); // contexts can start "suspended" without a click; then they read pure silence
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const buf = new Float32Array(analyser.fftSize);

  let floor = null;
  let lastLoud = -Infinity;
  let talking = false;
  let peak = -100;
  let ticks = 0;
  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    const db = toDb(Math.sqrt(sum / buf.length));
    peak = Math.max(peak, db);
    floor = nextFloor(floor ?? Math.max(FLOOR_MIN_DB, db), db);
    const trigger = floor + opts.marginDb;
    const now = performance.now();
    if (db > trigger) lastLoud = now;
    const t = now - lastLoud < opts.silenceMs;
    if (t !== talking) onTalking((talking = t));
    if (++ticks % 2 === 0) onLevel?.(db, talking, trigger); // ~10 Hz for meters
  }, 50);

  return {
    update(o) { opts = o; },
    get peakDb() { return peak; },
    get floorDb() { return floor; },
    get state() { return ctx.state; },
    stop() {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      ctx.close();
    },
  };
}

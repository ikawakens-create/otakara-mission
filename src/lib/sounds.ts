let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.18): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch { /* ignore */ }
}

export function soundPull(): void {
  tone(240, 0.12, "square", 0.15);
}

export function soundMachine(): void {
  tone(180, 0.2, "sawtooth", 0.1);
  setTimeout(() => tone(210, 0.2, "sawtooth", 0.1), 200);
}

export function soundCapsule(): void {
  tone(380, 0.1, "sine", 0.18);
  setTimeout(() => tone(480, 0.15, "sine", 0.18), 110);
}

/** level: 0〜6（Rarity の順位に対応） */
export function soundReveal(level: number): void {
  const freqs = [440, 523, 659, 784, 880, 988, 1047];
  const count = Math.min(level + 1, freqs.length);
  for (let i = 0; i < count; i++) {
    setTimeout(() => tone(freqs[i], 0.35, "sine", 0.2), i * 80);
  }
}

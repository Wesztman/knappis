/**
 * Tiny WebAudio synth so the game has sound before any assets exist.
 * Soft marimba-ish tones only; nothing harsh.
 *
 * Browsers only let audio start after a click or key press. `unlock()` is
 * called from those events; gamepad presses alone do not count.
 */
export class Sounds {
  private ctx: AudioContext | null = null;

  get unlocked(): boolean {
    return this.ctx?.state === 'running';
  }

  unlock(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state !== 'running') void this.ctx.resume();
  }

  /** Soft tap when stepping onto a tile. */
  step(): void {
    this.tone(523.25, 0.08, 0.12, 'sine');
  }

  /** Rising arpeggio for a correct press. */
  correct(): void {
    this.tone(523.25, 0.12, 0.2, 'triangle', 0);
    this.tone(659.25, 0.12, 0.2, 'triangle', 0.09);
    this.tone(783.99, 0.12, 0.2, 'triangle', 0.18);
    this.tone(1046.5, 0.25, 0.22, 'triangle', 0.27);
  }

  /** Gentle "not quite": two soft low notes. */
  gentleNo(): void {
    this.tone(329.63, 0.12, 0.12, 'sine', 0);
    this.tone(293.66, 0.18, 0.12, 'sine', 0.13);
  }

  /** Little boing when pressing while standing on nothing. */
  boing(): void {
    this.tone(392, 0.15, 0.12, 'sine', 0, 523.25);
  }

  /** Round complete fanfare. */
  fanfare(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => this.tone(f, 0.16, 0.2, 'triangle', i * 0.11));
  }

  private tone(
    freq: number,
    duration: number,
    gain: number,
    type: OscillatorType,
    delay = 0,
    glideTo?: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(env).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }
}

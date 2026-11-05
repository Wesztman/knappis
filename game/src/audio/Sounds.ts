import type { FaceButton } from '../input/buttons';

const STORAGE_KEY = 'knappis.sound';

function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '0';
  } catch {
    return true;
  }
}

function createContext(): AudioContext | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

/**
 * Tiny WebAudio synth so the game has sound before any assets exist.
 * Soft marimba-ish tones only; nothing harsh.
 *
 * Browsers only let audio start after a click or key press. `unlock()` is
 * called from those events; gamepad presses alone do not count.
 */
export class Sounds {
  private ctx: AudioContext | null = null;
  private _enabled = readPreference();
  private gestureSeen = false;

  constructor() {
    // Create the context right away. If the browser already trusts the page
    // (an earlier click to focus it, or a site the player visits a lot), it
    // starts in the 'running' state and no unlock gesture is needed.
    this.ctx = createContext();
    this.ctx?.addEventListener('statechange', () => {
      if (this.ctx?.state === 'running') this.gestureSeen = true;
    });
    if (this.ctx?.state === 'running') this.gestureSeen = true;
  }

  /**
   * The browser allows audio: either a click or key press has happened, or
   * the context was already running. Tracked ourselves rather than only via
   * AudioContext.state, which can stay suspended where there is no audio
   * device (headless test browsers, some VMs).
   */
  get unlocked(): boolean {
    return this.gestureSeen;
  }

  /** The player's on/off choice. Default on; remembered per browser. */
  get enabled(): boolean {
    return this._enabled;
  }

  setEnabled(on: boolean): void {
    this._enabled = on;
    try {
      localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    } catch {
      // Private mode or blocked storage: the choice just lasts this session.
    }
  }

  unlock(): void {
    this.gestureSeen = true;
    this.ctx ??= createContext();
    if (this.ctx && this.ctx.state !== 'running') void this.ctx.resume().catch(() => undefined);
  }

  /**
   * Ask the browser to start audio without claiming a gesture happened.
   * Chromium counts a gamepad button it saw pressed during polling as a user
   * gesture, so this is called on every gamepad press; if the browser agrees,
   * the context starts and the statechange listener marks us unlocked. If
   * not (other browsers), nothing changes and the icon keeps hinting.
   */
  tryResume(): void {
    this.ctx ??= createContext();
    if (this.ctx && this.ctx.state !== 'running') void this.ctx.resume().catch(() => undefined);
  }

  /**
   * Paint mode: a soft "plop" per splat, one note per button so painting
   * plays a little tune. C D E G: any order sounds fine.
   */
  paint(button: FaceButton): void {
    const notes: Record<FaceButton, number> = { A: 523.25, B: 587.33, X: 659.25, Y: 783.99 };
    const f = notes[button];
    this.tone(f * 1.25, 0.2, 0.16, 'triangle', 0, f);
  }

  /** Soft tap when stepping onto a tile. */
  step(): void {
    this.tone(523.25, 0.08, 0.12, 'sine');
  }

  /** Bright two-note "yes, here!" when stepping onto the right pad. */
  onTarget(): void {
    this.tone(783.99, 0.1, 0.16, 'triangle', 0);
    this.tone(1046.5, 0.18, 0.16, 'triangle', 0.09);
  }

  /** Soft, low "hmm" when stepping onto a pad that is not the one asked for. */
  hmm(): void {
    this.tone(261.63, 0.22, 0.08, 'sine', 0, 233.08);
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
    if (!this._enabled || !ctx || ctx.state !== 'running') return;
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

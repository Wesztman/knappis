/**
 * Grown-up settings, chosen on the start screen and remembered per browser.
 * Kept tiny and validated on load so a stale or hand-edited value can never
 * break the game.
 */
const STORAGE_KEY = 'knappis.settings';

export const WALK_SPEED_NAMES = ['slow', 'normal', 'fast'] as const;
export type WalkSpeed = (typeof WALK_SPEED_NAMES)[number];

export const GAME_MODES = ['find', 'free', 'paint', 'lamp'] as const;
/**
 * find: one button is asked for at a time (the badge, the glowing pad).
 * free: nothing is asked for; walk onto any pad and press that pad's button.
 * paint: no pads at all; each button leaves a splat of its own colour.
 * lamp: evening in the room; the right stick points a lamp, fireflies light up in it.
 */
export type GameMode = (typeof GAME_MODES)[number];

export interface Settings {
  readonly speed: WalkSpeed;
  readonly mode: GameMode;
}

export const DEFAULT_SETTINGS: Settings = { speed: 'normal', mode: 'find' };

/** Pixels per second at full stick deflection. A 3-year-old found 230 too fast. */
export const WALK_SPEEDS: Record<WalkSpeed, number> = { slow: 100, normal: 160, fast: 230 };

/** Pure parser so it can be unit-tested without a browser. */
export function parseSettings(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const value = JSON.parse(raw) as Partial<Record<keyof Settings, unknown>>;
    const speed = WALK_SPEED_NAMES.find((s) => s === value.speed) ?? DEFAULT_SETTINGS.speed;
    const mode = GAME_MODES.find((m) => m === value.mode) ?? DEFAULT_SETTINGS.mode;
    return { speed, mode };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function loadSettings(): Settings {
  try {
    return parseSettings(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private mode or blocked storage: the choice just lasts this session.
  }
}

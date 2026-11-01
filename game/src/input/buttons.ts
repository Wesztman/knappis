/** The four face buttons on an Xbox-style gamepad. Phaser-free. */
export type FaceButton = 'A' | 'B' | 'X' | 'Y';

export const FACE_BUTTONS: readonly FaceButton[] = ['A', 'B', 'X', 'Y'];

/** Button indices in the W3C "standard" gamepad mapping. */
export const STANDARD_BUTTON_INDEX: Record<FaceButton, number> = { A: 0, B: 1, X: 2, Y: 3 };

export const DPAD_INDEX = { up: 12, down: 13, left: 14, right: 15 } as const;

export type GamepadKind = 'xbox' | 'other';

/**
 * Only Xbox-style gamepads are supported right now (see docs/DESIGN.md).
 * Anything that identifies as Xbox/XInput, or uses the standard mapping
 * without identifying as a known non-Xbox pad, is treated as Xbox-style.
 */
export function classifyGamepad(id: string, mapping: string): GamepadKind {
  const lower = id.toLowerCase();
  if (/xbox|xinput|045e/.test(lower)) return 'xbox';
  if (/playstation|dualshock|dualsense|054c|nintendo|057e|pro controller|joy-con/.test(lower)) {
    return 'other';
  }
  return mapping === 'standard' ? 'xbox' : 'other';
}

/** The subset of the browser Gamepad we need to choose between devices. */
export interface GamepadLike {
  id: string;
  mapping: string;
  connected: boolean;
}

/** How much we trust a device to be a real, usable gamepad. Higher is better. */
export function gamepadScore(pad: GamepadLike): number {
  if (classifyGamepad(pad.id, pad.mapping) === 'xbox') return 2;
  if (pad.mapping === 'standard') return 1;
  return 0;
}

/**
 * Pick the device to play with. Browsers list anything HID-ish as a gamepad
 * (monitor USB hubs, for example), so we cannot just take the first one.
 */
export function pickGamepad<T extends GamepadLike>(pads: Iterable<T | null>): T | null {
  let best: T | null = null;
  let bestScore = -1;
  for (const pad of pads) {
    if (!pad || !pad.connected) continue;
    const score = gamepadScore(pad);
    if (score > bestScore) {
      best = pad;
      bestScore = score;
    }
  }
  return best;
}

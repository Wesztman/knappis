/** Stick maths with no Phaser dependency so it can be unit tested. */
export interface Vec2 {
  x: number;
  y: number;
}

/** Small thumbs rest on the stick, so the dead zone is generous. */
export const DEAD_ZONE = 0.25;

/**
 * Radial dead zone: ignore tiny deflections, and rescale the rest so the
 * stick still reaches full speed at the rim.
 */
export function applyDeadZone(x: number, y: number, deadZone = DEAD_ZONE): Vec2 {
  const mag = Math.hypot(x, y);
  if (mag < deadZone) return { x: 0, y: 0 };
  const scaled = Math.min(1, (mag - deadZone) / (1 - deadZone));
  return { x: (x / mag) * scaled, y: (y / mag) * scaled };
}

/** Sum several movement sources and clamp to unit length. */
export function combineMoves(...moves: Vec2[]): Vec2 {
  let x = 0;
  let y = 0;
  for (const m of moves) {
    x += m.x;
    y += m.y;
  }
  const mag = Math.hypot(x, y);
  if (mag > 1) return { x: x / mag, y: y / mag };
  return { x, y };
}

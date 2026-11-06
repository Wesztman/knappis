/**
 * Geometry for the flashlight's beam. Pure maths so it can be unit-tested and
 * so the scene only has to ask "is this point lit?".
 */
export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Cone {
  /** Where the flashlight is. */
  readonly origin: Point;
  /** Direction of the beam, radians, 0 = right, positive = clockwise on screen. */
  readonly angle: number;
  /** Half the beam's opening, radians. */
  readonly halfAngle: number;
  /** How far the beam reaches. */
  readonly radius: number;
}

/** Smallest signed difference between two angles, in -PI..PI. */
export function angleDiff(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Turn `current` part of the way towards `target`, the short way round.
 * `amount` 0..1 is how much of the remaining turn to take this step; the
 * scene derives it from the frame time so the flashlight swings smoothly instead
 * of snapping to every twitch of the stick.
 */
export function approachAngle(current: number, target: number, amount: number): number {
  return current + angleDiff(target, current) * Math.min(1, Math.max(0, amount));
}

/** Is `point` inside the beam? The origin itself counts as lit. */
export function inCone(cone: Cone, point: Point): boolean {
  const dx = point.x - cone.origin.x;
  const dy = point.y - cone.origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist > cone.radius) return false;
  if (dist === 0) return true;
  return Math.abs(angleDiff(Math.atan2(dy, dx), cone.angle)) <= cone.halfAngle;
}

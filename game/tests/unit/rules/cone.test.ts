import { describe, expect, it } from 'vitest';
import { angleDiff, inCone, type Cone } from '../../../src/rules/cone';

const beam: Cone = {
  origin: { x: 100, y: 100 },
  angle: 0, // pointing right
  halfAngle: Math.PI / 6, // 30 degrees each side
  radius: 200,
};

describe('angleDiff', () => {
  it('wraps around so that 350 and 10 degrees are 20 degrees apart', () => {
    const d = angleDiff((350 * Math.PI) / 180, (10 * Math.PI) / 180);
    expect(Math.abs(d)).toBeCloseTo((20 * Math.PI) / 180);
  });
});

describe('inCone', () => {
  it('lights a point straight ahead within reach', () => {
    expect(inCone(beam, { x: 250, y: 100 })).toBe(true);
  });

  it('does not light a point beyond the reach', () => {
    expect(inCone(beam, { x: 350, y: 100 })).toBe(false);
  });

  it('does not light a point behind the lamp', () => {
    expect(inCone(beam, { x: 50, y: 100 })).toBe(false);
  });

  it('lights inside the opening and not outside it', () => {
    // 25 degrees off-axis: inside. 40 degrees: outside.
    const inside = { x: 100 + 150 * Math.cos(0.436), y: 100 + 150 * Math.sin(0.436) };
    const outside = { x: 100 + 150 * Math.cos(0.698), y: 100 + 150 * Math.sin(0.698) };
    expect(inCone(beam, inside)).toBe(true);
    expect(inCone(beam, outside)).toBe(false);
  });

  it('handles a beam pointing left, across the angle wrap', () => {
    const left: Cone = { ...beam, angle: Math.PI };
    expect(inCone(left, { x: 0, y: 110 })).toBe(true);
    expect(inCone(left, { x: 0, y: 90 })).toBe(true);
    expect(inCone(left, { x: 200, y: 100 })).toBe(false);
  });

  it('counts the origin itself as lit', () => {
    expect(inCone(beam, { x: 100, y: 100 })).toBe(true);
  });
});

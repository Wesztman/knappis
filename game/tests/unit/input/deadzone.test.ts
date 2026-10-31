import { describe, expect, it } from 'vitest';
import { applyDeadZone, combineMoves } from '../../../src/input/deadzone';

describe('applyDeadZone', () => {
  it('zeroes small deflections', () => {
    expect(applyDeadZone(0.1, 0.1)).toEqual({ x: 0, y: 0 });
  });

  it('reaches full speed at the rim', () => {
    const v = applyDeadZone(1, 0);
    expect(v.x).toBeCloseTo(1);
    expect(v.y).toBeCloseTo(0);
  });

  it('rescales so movement starts gently just past the dead zone', () => {
    const v = applyDeadZone(0.3, 0, 0.25);
    expect(v.x).toBeGreaterThan(0);
    expect(v.x).toBeLessThan(0.1);
  });

  it('never exceeds unit length on diagonal input', () => {
    const v = applyDeadZone(1, 1);
    expect(Math.hypot(v.x, v.y)).toBeLessThanOrEqual(1.0001);
  });
});

describe('combineMoves', () => {
  it('adds sources and clamps to unit length', () => {
    const v = combineMoves({ x: 1, y: 0 }, { x: 1, y: 0 });
    expect(v).toEqual({ x: 1, y: 0 });
  });

  it('passes small combined moves through', () => {
    expect(combineMoves({ x: 0.2, y: 0 }, { x: 0, y: 0.3 })).toEqual({ x: 0.2, y: 0.3 });
  });
});

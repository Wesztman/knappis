import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT, GAME_WIDTH } from '../../src/config';

describe('config', () => {
  it('uses a 16:9 canvas', () => {
    expect(GAME_WIDTH / GAME_HEIGHT).toBeCloseTo(16 / 9);
  });
});

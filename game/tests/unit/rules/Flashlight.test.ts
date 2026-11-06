import { describe, expect, it } from 'vitest';
import { Flashlight } from '../../../src/rules/Flashlight';

describe('Flashlight', () => {
  it('has no pads, no target and no stars', () => {
    const game = new Flashlight();
    expect(game.state.tiles).toEqual([]);
    expect(game.state.target).toBeNull();
    expect(game.state.starsPerRound).toBe(0);
  });

  it('any button flares the lamp, wherever Knappis stands', () => {
    const game = new Flashlight();
    expect(game.press('X', null)).toEqual([{ type: 'flash', button: 'X' }]);
    expect(game.press('A', 'B')).toEqual([{ type: 'flash', button: 'A' }]);
    expect(game.advance()).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { Paint } from '../../../src/rules/Paint';

describe('Paint', () => {
  it('has no pads, no target and no stars', () => {
    const game = new Paint();
    expect(game.state.tiles).toEqual([]);
    expect(game.state.target).toBeNull();
    expect(game.state.starsPerRound).toBe(0);
    expect(game.state.phase).toBe('playing');
  });

  it('every press is a splat of the pressed button, wherever Knappis stands', () => {
    const game = new Paint();
    expect(game.press('B', null)).toEqual([{ type: 'paint', button: 'B', splats: 1 }]);
    expect(game.press('Y', 'A')).toEqual([{ type: 'paint', button: 'Y', splats: 2 }]);
  });

  it('never needs advancing', () => {
    const game = new Paint();
    game.press('A', null);
    expect(game.advance()).toEqual([]);
    expect(game.state.phase).toBe('playing');
  });
});

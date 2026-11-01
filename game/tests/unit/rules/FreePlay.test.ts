import { describe, expect, it } from 'vitest';
import { FACE_BUTTONS } from '../../../src/input/buttons';
import { FreePlay } from '../../../src/rules/FreePlay';

describe('FreePlay', () => {
  it('asks for nothing: target is null and the four pads are in gamepad order', () => {
    const game = new FreePlay();
    expect(game.state.target).toBeNull();
    expect(game.state.tiles).toEqual(FACE_BUTTONS);
    expect(game.state.stars).toBe(0);
    expect(game.state.phase).toBe('playing');
  });

  it('reports notOnTile off any pad', () => {
    const game = new FreePlay();
    expect(game.press('A', null)).toEqual([{ type: 'notOnTile', pressed: 'A', target: null }]);
  });

  it("wants the pad's own button: another button is wrongButton with that pad as target", () => {
    const game = new FreePlay();
    expect(game.press('A', 'B')).toEqual([
      { type: 'wrongButton', standingOn: 'B', pressed: 'A', target: 'B' },
    ]);
    expect(game.state.stars).toBe(0);
  });

  it('any pad counts when its own button is pressed', () => {
    const game = new FreePlay();
    expect(game.press('Y', 'Y')).toEqual([{ type: 'correct', button: 'Y', stars: 1 }]);
    expect(game.state.phase).toBe('celebrating');
    expect(game.press('Y', 'Y')).toEqual([]); // ignored while celebrating
    expect(game.advance()).toEqual([{ type: 'newTarget', target: null }]);
    expect(game.state.phase).toBe('playing');
  });

  it('completes a round after starsPerRound and starts the next', () => {
    const game = new FreePlay({ starsPerRound: 2 });
    game.press('A', 'A');
    game.advance();
    game.press('B', 'B');
    expect(game.advance()).toEqual([{ type: 'roundComplete', round: 1 }]);
    expect(game.advance()).toEqual([
      { type: 'newRound', round: 2, tiles: FACE_BUTTONS, target: null },
    ]);
    expect(game.state.stars).toBe(0);
    expect(game.state.round).toBe(2);
  });
});

import { describe, expect, it } from 'vitest';
import { FACE_BUTTONS, type FaceButton } from '../../../src/input/buttons';
import { FindTheButton } from '../../../src/rules/FindTheButton';

/** Deterministic "random" that always returns the same value. */
const fixed = (value: number) => () => value;

const otherThan = (b: FaceButton): FaceButton => FACE_BUTTONS.find((x) => x !== b) as FaceButton;

describe('FindTheButton', () => {
  it('starts in round 1 with no stars, four distinct tiles and a target', () => {
    const game = new FindTheButton({ random: fixed(0) });
    const s = game.state;
    expect(s.round).toBe(1);
    expect(s.stars).toBe(0);
    expect(s.phase).toBe('playing');
    expect([...s.tiles].sort()).toEqual([...FACE_BUTTONS].sort());
    expect(FACE_BUTTONS).toContain(s.target);
  });

  it('reports notOnTile when pressing off any tile', () => {
    const game = new FindTheButton({ random: fixed(0) });
    const events = game.press('A', null);
    expect(events).toEqual([{ type: 'notOnTile', pressed: 'A', target: game.state.target }]);
    expect(game.state.stars).toBe(0);
  });

  it('reports wrongTile when standing on a tile that is not the target', () => {
    const game = new FindTheButton({ random: fixed(0) });
    const target = game.state.target;
    const other = otherThan(target);
    const events = game.press(other, other);
    expect(events[0]?.type).toBe('wrongTile');
    expect(game.state.stars).toBe(0);
    expect(game.state.phase).toBe('playing');
  });

  it('reports wrongButton when on the target tile but pressing another button', () => {
    const game = new FindTheButton({ random: fixed(0) });
    const target = game.state.target;
    const events = game.press(otherThan(target), target);
    expect(events).toEqual([
      { type: 'wrongButton', standingOn: target, pressed: otherThan(target), target },
    ]);
    expect(game.state.stars).toBe(0);
  });

  it('awards a star and enters celebrating on a correct press', () => {
    const game = new FindTheButton({ random: fixed(0) });
    const target = game.state.target;
    const events = game.press(target, target);
    expect(events).toEqual([{ type: 'correct', button: target, stars: 1 }]);
    expect(game.state.phase).toBe('celebrating');
  });

  it('ignores presses while celebrating', () => {
    const game = new FindTheButton({ random: fixed(0) });
    const target = game.state.target;
    game.press(target, target);
    expect(game.press(target, target)).toEqual([]);
    expect(game.state.stars).toBe(1);
  });

  it('picks a new, different target after advancing from a celebration', () => {
    const game = new FindTheButton({ random: fixed(0.5) });
    const first = game.state.target;
    game.press(first, first);
    const events = game.advance();
    expect(events[0]?.type).toBe('newTarget');
    expect(game.state.target).not.toBe(first);
    expect(game.state.phase).toBe('playing');
  });

  it('completes the round after starsPerRound stars, then starts a new round', () => {
    const game = new FindTheButton({ starsPerRound: 2, random: fixed(0.3) });

    let t = game.state.target;
    game.press(t, t);
    game.advance();
    t = game.state.target;
    game.press(t, t);
    expect(game.state.stars).toBe(2);

    const done = game.advance();
    expect(done).toEqual([{ type: 'roundComplete', round: 1 }]);
    expect(game.state.phase).toBe('roundComplete');
    expect(game.press(t, t)).toEqual([]);

    const next = game.advance();
    expect(next[0]?.type).toBe('newRound');
    expect(game.state.round).toBe(2);
    expect(game.state.stars).toBe(0);
    expect(game.state.phase).toBe('playing');
    expect([...game.state.tiles].sort()).toEqual([...FACE_BUTTONS].sort());
  });

  it('keeps the pads in gamepad order unless shuffling is on', () => {
    const fixed_ = new FindTheButton({ starsPerRound: 1, random: fixed(0.9) });
    expect(fixed_.state.tiles).toEqual(FACE_BUTTONS);
    const t = fixed_.state.target;
    fixed_.press(t, t);
    fixed_.advance();
    fixed_.advance();
    expect(fixed_.state.round).toBe(2);
    expect(fixed_.state.tiles).toEqual(FACE_BUTTONS);

    const mixed = new FindTheButton({ shuffle: true, random: fixed(0.9) });
    expect([...mixed.state.tiles].sort()).toEqual([...FACE_BUTTONS].sort());
  });

  it('advance does nothing while playing', () => {
    const game = new FindTheButton({ random: fixed(0) });
    expect(game.advance()).toEqual([]);
  });
});

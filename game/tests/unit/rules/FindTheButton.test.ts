import { describe, expect, it } from 'vitest';
import { FACE_BUTTONS, type FaceButton } from '../../../src/input/buttons';
import { FindTheButton } from '../../../src/rules/FindTheButton';

/** Deterministic "random" that always returns the same value. */
const fixed = (value: number) => () => value;

/** Simple seeded generator so shuffles vary but tests stay repeatable. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const otherThan = (b: FaceButton): FaceButton => FACE_BUTTONS.find((x) => x !== b) as FaceButton;

/** Play one full round correctly, returning the targets in the order asked. */
function playRound(game: FindTheButton): FaceButton[] {
  const asked: FaceButton[] = [];
  for (let i = 0; i < FACE_BUTTONS.length; i++) {
    const t = game.state.target;
    asked.push(t);
    expect(game.press(t, t)).toEqual([{ type: 'correct', button: t, stars: i + 1 }]);
    game.advance();
  }
  return asked;
}

describe('FindTheButton', () => {
  it('starts in round 1 with no stars, four distinct tiles and a target', () => {
    const game = new FindTheButton({ random: fixed(0) });
    const s = game.state;
    expect(s.round).toBe(1);
    expect(s.stars).toBe(0);
    expect(s.starsPerRound).toBe(4);
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
    const events = game.press(target, otherThan(target));
    expect(events).toEqual([
      { type: 'wrongTile', standingOn: otherThan(target), pressed: target, target },
    ]);
    expect(game.state.stars).toBe(0);
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

  it('asks for each of the four buttons exactly once per round', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const game = new FindTheButton({ random: seeded(seed) });
      const asked = playRound(game);
      expect([...asked].sort()).toEqual([...FACE_BUTTONS].sort());
      expect(game.state.phase).toBe('roundComplete');
    }
  });

  it('completes the round after four stars, then starts round 2 with a fresh set of four', () => {
    const game = new FindTheButton({ random: seeded(7) });
    const first = playRound(game);
    expect(game.state.stars).toBe(4);
    expect(game.state.phase).toBe('roundComplete');
    expect(game.press(first[3] as FaceButton, first[3] as FaceButton)).toEqual([]);

    const next = game.advance();
    expect(next[0]?.type).toBe('newRound');
    expect(game.state.round).toBe(2);
    expect(game.state.stars).toBe(0);
    expect(game.state.phase).toBe('playing');

    const second = playRound(game);
    expect([...second].sort()).toEqual([...FACE_BUTTONS].sort());
  });

  it('never asks for the same button twice in a row, even across rounds', () => {
    for (const seed of [11, 12, 13, 14, 15, 16, 17, 18]) {
      const game = new FindTheButton({ random: seeded(seed) });
      const asked: FaceButton[] = [];
      for (let round = 0; round < 6; round++) {
        asked.push(...playRound(game));
        game.advance();
      }
      for (let i = 1; i < asked.length; i++) expect(asked[i]).not.toBe(asked[i - 1]);
    }
  });

  it('keeps the pads in gamepad order unless shuffling is on', () => {
    const fixed_ = new FindTheButton({ random: seeded(3) });
    expect(fixed_.state.tiles).toEqual(FACE_BUTTONS);
    playRound(fixed_);
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

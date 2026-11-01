import { FACE_BUTTONS, type FaceButton } from '../input/buttons';
import type { Phase, Rules, RulesEvent, RulesState } from './types';

export interface FindTheButtonOptions {
  /**
   * Shuffle which button each floor pad shows between rounds. Off by default:
   * the pads sit in the same diamond as on the gamepad, and that mapping is
   * the lesson. A "mixed-up" mode can turn this on later.
   */
  shuffle?: boolean;
  /** Injectable for deterministic tests. Must return [0, 1). */
  random?: () => number;
}

export type FindTheButtonState = RulesState & { readonly target: FaceButton };

/**
 * Pure state machine for Mode 1, "Hitta knappen".
 *
 * A round asks for each of the four buttons exactly once, in a random
 * order, so four stars means "the whole gamepad". The first target of a
 * round is never the last target of the previous one.
 *
 * The scene feeds it button presses and tells it when animations are done
 * (`advance`). It never touches Phaser, so it is fully unit-tested.
 *
 * Flow:  playing --correct--> celebrating --advance--> playing (new target)
 *                                         \--advance--> roundComplete (if enough stars)
 *        roundComplete --advance--> playing (new round, shuffled tiles)
 */
export class FindTheButton implements Rules {
  private tiles: FaceButton[];
  private target: FaceButton;
  /** Targets still to come this round, in order. */
  private queue: FaceButton[] = [];
  private stars = 0;
  private round = 1;
  private phase: Phase = 'playing';
  private readonly starsPerRound = FACE_BUTTONS.length;
  private readonly shuffle: boolean;
  private readonly random: () => number;

  constructor(options: FindTheButtonOptions = {}) {
    this.shuffle = options.shuffle ?? false;
    this.random = options.random ?? Math.random;
    this.tiles = this.shuffle ? this.shuffled([...FACE_BUTTONS]) : [...FACE_BUTTONS];
    this.target = this.nextTarget(null);
  }

  /** Same as `RulesState`, but this mode always has a target. */
  get state(): FindTheButtonState {
    return {
      tiles: this.tiles,
      target: this.target,
      stars: this.stars,
      starsPerRound: this.starsPerRound,
      round: this.round,
      phase: this.phase,
    };
  }

  /** The child pressed `pressed` while standing on `standingOn` (or nothing). */
  press(pressed: FaceButton, standingOn: FaceButton | null): RulesEvent[] {
    if (this.phase !== 'playing') return [];

    if (standingOn === null) {
      return [{ type: 'notOnTile', pressed, target: this.target }];
    }
    if (standingOn !== this.target) {
      return [{ type: 'wrongTile', standingOn, pressed, target: this.target }];
    }
    if (pressed !== this.target) {
      return [{ type: 'wrongButton', standingOn, pressed, target: this.target }];
    }

    this.stars += 1;
    this.phase = 'celebrating';
    return [{ type: 'correct', button: pressed, stars: this.stars }];
  }

  /** Call when the current animation has finished. */
  advance(): RulesEvent[] {
    if (this.phase === 'celebrating') {
      if (this.queue.length === 0) {
        this.phase = 'roundComplete';
        return [{ type: 'roundComplete', round: this.round }];
      }
      this.target = this.nextTarget(this.target);
      this.phase = 'playing';
      return [{ type: 'newTarget', target: this.target }];
    }
    if (this.phase === 'roundComplete') {
      this.round += 1;
      this.stars = 0;
      if (this.shuffle) this.tiles = this.shuffled(this.tiles);
      this.target = this.nextTarget(this.target);
      this.phase = 'playing';
      return [{ type: 'newRound', round: this.round, tiles: this.tiles, target: this.target }];
    }
    return [];
  }

  /** Take the next target of the round, dealing a fresh round when the queue is empty. */
  private nextTarget(previous: FaceButton | null): FaceButton {
    if (this.queue.length === 0) {
      this.queue = this.shuffled([...FACE_BUTTONS]);
      // Never ask for the same button twice in a row across the round boundary.
      if (this.queue[0] === previous && this.queue.length > 1) {
        const swap =
          1 + Math.min(this.queue.length - 2, Math.floor(this.random() * (this.queue.length - 1)));
        [this.queue[0], this.queue[swap]] = [
          this.queue[swap] as FaceButton,
          this.queue[0] as FaceButton,
        ];
      }
    }
    return this.queue.shift() as FaceButton;
  }

  private shuffled(input: FaceButton[]): FaceButton[] {
    const arr = [...input];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      const tmp = arr[i] as FaceButton;
      arr[i] = arr[j] as FaceButton;
      arr[j] = tmp;
    }
    return arr;
  }
}

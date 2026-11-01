import { FACE_BUTTONS, type FaceButton } from '../input/buttons';
import type { Phase, Rules, RulesEvent, RulesState } from './types';

export interface FreePlayOptions {
  starsPerRound?: number;
}

/**
 * Pure state machine for free play: nothing is asked for. Walk onto any
 * pad and press that pad's button to earn a star. Asked for by a
 * three-year-old tester who wanted to pick the pads himself.
 *
 * Flow:  playing --correct--> celebrating --advance--> playing
 *                                         \--advance--> roundComplete (if enough stars)
 *        roundComplete --advance--> playing (new round)
 */
export class FreePlay implements Rules {
  private readonly tiles: FaceButton[] = [...FACE_BUTTONS];
  private stars = 0;
  private round = 1;
  private phase: Phase = 'playing';
  private readonly starsPerRound: number;

  constructor(options: FreePlayOptions = {}) {
    this.starsPerRound = options.starsPerRound ?? FACE_BUTTONS.length;
  }

  get state(): RulesState {
    return {
      tiles: this.tiles,
      target: null,
      stars: this.stars,
      starsPerRound: this.starsPerRound,
      round: this.round,
      phase: this.phase,
    };
  }

  press(pressed: FaceButton, standingOn: FaceButton | null): RulesEvent[] {
    if (this.phase !== 'playing') return [];
    if (standingOn === null) {
      return [{ type: 'notOnTile', pressed, target: null }];
    }
    if (pressed !== standingOn) {
      return [{ type: 'wrongButton', standingOn, pressed, target: standingOn }];
    }
    this.stars += 1;
    this.phase = 'celebrating';
    return [{ type: 'correct', button: pressed, stars: this.stars }];
  }

  advance(): RulesEvent[] {
    if (this.phase === 'celebrating') {
      if (this.stars >= this.starsPerRound) {
        this.phase = 'roundComplete';
        return [{ type: 'roundComplete', round: this.round }];
      }
      this.phase = 'playing';
      return [{ type: 'newTarget', target: null }];
    }
    if (this.phase === 'roundComplete') {
      this.round += 1;
      this.stars = 0;
      this.phase = 'playing';
      return [{ type: 'newRound', round: this.round, tiles: this.tiles, target: null }];
    }
    return [];
  }
}

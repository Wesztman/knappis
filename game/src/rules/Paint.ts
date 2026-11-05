import type { FaceButton } from '../input/buttons';
import type { Rules, RulesEvent, RulesState } from './types';

/**
 * Pure rules for paint mode: no pads, no target, no stars. Every press
 * leaves a splat of that button's colour where Knappis stands, and that is
 * the whole game. The Xbox face buttons already have one colour each, so
 * the colour the child paints with is the colour of the button they press.
 *
 * Nothing can go wrong here, so there is no phase machine: the state is
 * always 'playing' and `advance` has nothing to do.
 */
export class Paint implements Rules {
  private splats = 0;

  get state(): RulesState {
    return {
      tiles: [],
      target: null,
      stars: 0,
      starsPerRound: 0,
      round: 1,
      phase: 'playing',
    };
  }

  press(pressed: FaceButton, _standingOn: FaceButton | null): RulesEvent[] {
    this.splats += 1;
    return [{ type: 'paint', button: pressed, splats: this.splats }];
  }

  advance(): RulesEvent[] {
    return [];
  }
}

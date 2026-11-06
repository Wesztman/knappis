import type { FaceButton } from '../input/buttons';
import type { Rules, RulesEvent, RulesState } from './types';

/**
 * Pure rules for lamp mode, step one: no pads, no target, no stars. The
 * right stick points the lamp and fireflies light up in its beam; that
 * lives in the scene with the geometry in `cone.ts`. Here the only rule is
 * that any button flares the lamp, so pressing something always does
 * something. Hidden pads that the beam reveals are the planned step two.
 */
export class Lamp implements Rules {
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
    return [{ type: 'flash', button: pressed }];
  }

  advance(): RulesEvent[] {
    return [];
  }
}

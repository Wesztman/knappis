import type { FaceButton } from '../input/buttons';

export type Phase = 'playing' | 'celebrating' | 'roundComplete';

export interface RulesState {
  /** Which button each of the four floor tiles shows, in tile-slot order. */
  readonly tiles: readonly FaceButton[];
  /**
   * The button the child is currently asked to find and press, or null when
   * nothing is asked for (free play: any pad counts).
   */
  readonly target: FaceButton | null;
  readonly stars: number;
  readonly starsPerRound: number;
  readonly round: number;
  readonly phase: Phase;
}

export type RulesEvent =
  | { type: 'correct'; button: FaceButton; stars: number }
  /** Paint mode: leave a splat of this button's colour where Knappis stands. */
  | { type: 'paint'; button: FaceButton; splats: number }
  /** Lamp mode: any button flares the lamp wider for a moment. */
  | { type: 'flash'; button: FaceButton }
  /** Right pad, wrong button. `target` is the button that was wanted. */
  | { type: 'wrongButton'; standingOn: FaceButton; pressed: FaceButton; target: FaceButton }
  | { type: 'wrongTile'; standingOn: FaceButton; pressed: FaceButton; target: FaceButton }
  | { type: 'notOnTile'; pressed: FaceButton; target: FaceButton | null }
  | { type: 'newTarget'; target: FaceButton | null }
  | { type: 'roundComplete'; round: number }
  | {
      type: 'newRound';
      round: number;
      tiles: readonly FaceButton[];
      target: FaceButton | null;
    };

/**
 * What every game mode's rules look like to the scene. Pure TypeScript,
 * never Phaser: the scene feeds presses in and renders the events out.
 */
export interface Rules {
  readonly state: RulesState;
  /** The child pressed `pressed` while standing on `standingOn` (or nothing). */
  press(pressed: FaceButton, standingOn: FaceButton | null): RulesEvent[];
  /** Call when the current animation has finished. */
  advance(): RulesEvent[];
}

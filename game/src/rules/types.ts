import type { FaceButton } from '../input/buttons';

export type Phase = 'playing' | 'celebrating' | 'roundComplete';

export interface RulesState {
  /** Which button each of the four floor tiles shows, in tile-slot order. */
  readonly tiles: readonly FaceButton[];
  /** The button the child is currently asked to find and press. */
  readonly target: FaceButton;
  readonly stars: number;
  readonly starsPerRound: number;
  readonly round: number;
  readonly phase: Phase;
}

export type RulesEvent =
  | { type: 'correct'; button: FaceButton; stars: number }
  | { type: 'wrongButton'; standingOn: FaceButton; pressed: FaceButton; target: FaceButton }
  | { type: 'wrongTile'; standingOn: FaceButton; pressed: FaceButton; target: FaceButton }
  | { type: 'notOnTile'; pressed: FaceButton; target: FaceButton }
  | { type: 'newTarget'; target: FaceButton }
  | { type: 'roundComplete'; round: number }
  | { type: 'newRound'; round: number; tiles: readonly FaceButton[]; target: FaceButton };

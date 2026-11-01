import type { GameMode } from '../settings';
import { FindTheButton } from './FindTheButton';
import { FreePlay } from './FreePlay';
import type { Rules } from './types';

/** The one place that maps a settings value to a rules implementation. */
export function createRules(mode: GameMode, starsPerRound: number): Rules {
  switch (mode) {
    case 'free':
      return new FreePlay({ starsPerRound });
    case 'find':
      return new FindTheButton({ starsPerRound });
  }
}

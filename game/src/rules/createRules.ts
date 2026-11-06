import type { GameMode } from '../settings';
import { FindTheButton } from './FindTheButton';
import { FreePlay } from './FreePlay';
import { Lamp } from './Lamp';
import { Paint } from './Paint';
import type { Rules } from './types';

/** The one place that maps a settings value to a rules implementation. */
export function createRules(mode: GameMode): Rules {
  switch (mode) {
    case 'free':
      return new FreePlay();
    case 'find':
      return new FindTheButton();
    case 'paint':
      return new Paint();
    case 'lamp':
      return new Lamp();
  }
}

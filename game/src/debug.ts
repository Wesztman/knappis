import type { RulesState } from './rules/types';

/**
 * Hooks exposed on `window.__knappis` in dev builds only, so Playwright
 * tests can read state and set up situations without flaky key-holding.
 */
export interface DebugApi {
  scene: string;
  state?: () => RulesState;
  teleport?: (x: number, y: number) => void;
  tilePosition?: (face: string) => { x: number; y: number } | null;
  avatar?: () => { x: number; y: number };
}

declare global {
  interface Window {
    __knappis?: DebugApi;
  }
}

export function setDebug(api: DebugApi): void {
  if (import.meta.env.DEV) window.__knappis = api;
}

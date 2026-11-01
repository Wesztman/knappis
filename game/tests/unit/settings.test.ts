import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings, WALK_SPEEDS } from '../../src/settings';

describe('settings', () => {
  it('falls back to defaults for nothing, junk and unknown values', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('not json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{"speed":"ludicrous","mode":"chaos"}')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid values and fills in missing ones', () => {
    expect(parseSettings('{"speed":"slow"}')).toEqual({ speed: 'slow', mode: 'find' });
    expect(parseSettings('{"mode":"free","speed":"fast"}')).toEqual({
      speed: 'fast',
      mode: 'free',
    });
  });

  it('orders the speeds slow < normal < fast', () => {
    expect(WALK_SPEEDS.slow).toBeLessThan(WALK_SPEEDS.normal);
    expect(WALK_SPEEDS.normal).toBeLessThan(WALK_SPEEDS.fast);
  });
});

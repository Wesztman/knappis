import { describe, expect, it } from 'vitest';
import { classifyGamepad } from '../../../src/input/buttons';

describe('classifyGamepad', () => {
  it('recognises Xbox pads by name', () => {
    expect(
      classifyGamepad(
        'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)',
        'standard',
      ),
    ).toBe('xbox');
  });
  it('treats unknown standard-mapping pads as Xbox-style', () => {
    expect(classifyGamepad('Generic USB Gamepad', 'standard')).toBe('xbox');
  });
  it('flags PlayStation and Nintendo pads as other', () => {
    expect(classifyGamepad('DualSense Wireless Controller (Vendor: 054c)', 'standard')).toBe(
      'other',
    );
    expect(classifyGamepad('Pro Controller (Vendor: 057e)', 'standard')).toBe('other');
  });
  it('flags non-standard mappings as other', () => {
    expect(classifyGamepad('Weird Pad', '')).toBe('other');
  });
});

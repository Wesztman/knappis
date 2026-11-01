import { describe, expect, it } from 'vitest';
import { classifyGamepad, pickGamepad } from '../../../src/input/buttons';

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

describe('pickGamepad', () => {
  const monitor = {
    id: 'PHL 34B2U6603CH (Vendor: 0bda Product: 4cb4)',
    mapping: '',
    connected: true,
  };
  const xbox = {
    id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 02fd)',
    mapping: 'standard',
    connected: true,
  };

  it('prefers an Xbox pad over a monitor hub that the browser lists first', () => {
    expect(pickGamepad([monitor, xbox, null, null])).toBe(xbox);
  });
  it('prefers a standard-mapping pad over a non-standard device', () => {
    const generic = { id: 'Generic', mapping: 'standard', connected: true };
    expect(pickGamepad([monitor, generic])).toBe(generic);
  });
  it('falls back to whatever is connected', () => {
    expect(pickGamepad([null, monitor])).toBe(monitor);
  });
  it('ignores disconnected pads', () => {
    expect(pickGamepad([{ ...xbox, connected: false }])).toBeNull();
  });
  it('treats the Philips monitor hub as not Xbox-style', () => {
    expect(classifyGamepad(monitor.id, monitor.mapping)).toBe('other');
  });
});

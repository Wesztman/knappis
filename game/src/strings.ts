/**
 * All user-facing text. The game must be playable without reading any of
 * it; these are hints for the grown-up sitting next to the child.
 * English for reach; the name Knappis stays Swedish.
 */
export const strings = {
  title: 'Knappis',
  subtitle: 'the little button',
  pressAnyButton: 'Press any button on your Xbox gamepad to start',
  orKeyboard: 'or press a key',
  nonXboxNotice:
    'Only Xbox-style gamepads are supported right now. The pictures may not match this one.',
  footer: `v${__APP_VERSION__}  ·  Xbox-style gamepads only for now  ·  Keyboard: arrow keys walk, A B X Y press, I J K L point the flashlight`,
  padNone:
    'No gamepad detected yet. The browser only reveals it on the first button press, which also starts the game.\n' +
    'Gamepad switched itself off just now? Known Windows issue with the Xbox Wireless Adapter: use a USB cable or Bluetooth.',
  padSeen: 'Gamepad: ',
  padInsecure:
    'Gamepads only work on http://localhost or https. Open http://localhost:5173 instead.',
  settingsTitle: 'Settings',
  speedLabel: 'Walking speed',
  speeds: { slow: 'Slow', normal: 'Normal', fast: 'Fast' },
  modeLabel: 'Game',
  modes: { find: 'Find the button', free: 'Free play', paint: 'Paint', flashlight: 'Flashlight' },
  modeHints: {
    find: 'One button is asked for at a time: walk to its pad and press it.',
    free: 'Nothing is asked for: walk onto any pad and press that pad’s button.',
    paint: 'No pads: walk around and press a button to leave a splat of its colour.',
    flashlight:
      'Evening in the room: the right stick points the flashlight, fireflies light up in its beam.',
  },
  done: 'Done',
  /** Shown next to the gear so the grown-up sees what is set without opening it. */
  settingsSummary: (mode: string, speed: string) => `Settings  ·  ${mode}  ·  ${speed} speed`,
};

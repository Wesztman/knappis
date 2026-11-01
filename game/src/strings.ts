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
  footer: `v${__APP_VERSION__}  ·  Xbox-style gamepads only for now  ·  Keyboard: arrow keys walk, A B X Y press`,
  padNone:
    'No gamepad detected yet. The browser only reveals it on the first button press, which also starts the game.',
  padSeen: 'Gamepad: ',
  padInsecure:
    'Gamepads only work on http://localhost or https. Open http://localhost:5173 instead.',
};

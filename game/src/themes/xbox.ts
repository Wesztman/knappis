import type { SymbolTheme } from './types';

/** Xbox face buttons: A bottom (green), B right (red), X left (blue), Y top (yellow). */
export const xboxTheme: SymbolTheme = {
  id: 'xbox',
  buttons: {
    A: { label: 'A', colour: 0x5cb85c, colourCss: '#5cb85c' },
    B: { label: 'B', colour: 0xe0453d, colourCss: '#e0453d' },
    X: { label: 'X', colour: 0x3d8ee0, colourCss: '#3d8ee0' },
    Y: { label: 'Y', colour: 0xf2c320, colourCss: '#f2c320' },
  },
  layout: {
    A: { x: 0, y: 1 },
    B: { x: 1, y: 0 },
    X: { x: -1, y: 0 },
    Y: { x: 0, y: -1 },
  },
};

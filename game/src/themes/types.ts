import type { FaceButton } from '../input/buttons';

export interface ButtonStyle {
  /** Text drawn on the button and the floor tile. */
  label: string;
  /** Colour as a number for Phaser graphics. */
  colour: number;
  /** Same colour as CSS for Phaser text. */
  colourCss: string;
}

export interface SymbolTheme {
  id: string;
  buttons: Record<FaceButton, ButtonStyle>;
  /**
   * Where each button sits in the face-button diamond, in unit offsets.
   * x right, y down. Used by the on-screen gamepad diagram.
   */
  layout: Record<FaceButton, { x: number; y: number }>;
}

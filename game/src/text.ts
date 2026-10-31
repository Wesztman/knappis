import Phaser from 'phaser';
import { CRISP_TEXT } from './render';

export const FONT = '"Arial Rounded MT Bold", "Segoe UI", Arial, sans-serif';
export const INK = '#3a2e2a';

/** Text with the crisp resolution and friendly font applied. */
export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      ...CRISP_TEXT,
      fontFamily: FONT,
      color: INK,
      ...style,
    })
    .setOrigin(0.5);
}

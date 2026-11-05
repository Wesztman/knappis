import Phaser from 'phaser';
import type { FaceButton } from '../input/buttons';
import type { SymbolTheme } from '../themes/types';

/**
 * The floor in paint mode. Splats are stamped into one RenderTexture
 * instead of being kept as game objects, so a painting with a thousand
 * splats costs the same to draw as one with ten, and the child can keep
 * going for as long as they like. Nothing fades: this is the painting.
 * It is cleared when the scene is left, so going home gives a new sheet.
 */
export class PaintCanvas {
  private readonly texture: Phaser.GameObjects.RenderTexture;
  private count = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly theme: SymbolTheme,
    width: number,
    height: number,
    depth: number,
  ) {
    this.texture = scene.add.renderTexture(0, 0, width, height).setOrigin(0).setDepth(depth);
  }

  get splats(): number {
    return this.count;
  }

  /** Stamp one splat of `button`'s colour, centred on (x, y). */
  splat(x: number, y: number, button: FaceButton): void {
    this.count += 1;
    this.texture.stamp('splat', undefined, x, y, {
      tint: this.theme.buttons[button].colour,
      rotation: Phaser.Math.FloatBetween(0, Math.PI * 2),
      scale: Phaser.Math.FloatBetween(0.85, 1.2),
    });
  }
}

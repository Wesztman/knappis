import Phaser from 'phaser';
import type { FaceButton } from '../input/buttons';
import type { SymbolTheme } from '../themes/types';
import { addText } from '../text';

export const TILE_SIZE = 190;

/**
 * A floor tile that looks like a giant version of one face button.
 * It can be highlighted (Knappis stands on it) and marked as the target
 * (pulsing ring).
 */
export class Tile extends Phaser.GameObjects.Container {
  face: FaceButton;
  private readonly ring: Phaser.GameObjects.Arc;
  private readonly plate: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly theme: SymbolTheme;
  private ringTween: Phaser.Tweens.Tween | null = null;
  private highlighted = false;

  constructor(scene: Phaser.Scene, x: number, y: number, face: FaceButton, theme: SymbolTheme) {
    super(scene, x, y);
    scene.add.existing(this);
    this.face = face;
    this.theme = theme;

    this.ring = scene.add.circle(0, 0, TILE_SIZE / 2 + 6, 0xffffff, 0).setVisible(false);
    this.ring.setStrokeStyle(10, 0xffffff, 0.9);
    this.add(this.ring);

    this.plate = scene.add.graphics();
    this.add(this.plate);

    this.label = addText(scene, 0, 4, '', { fontSize: '96px', fontStyle: 'bold' });
    this.add(this.label);

    this.setFace(face);
  }

  setFace(face: FaceButton): void {
    this.face = face;
    const style = this.theme.buttons[face];
    const light = Phaser.Display.Color.ValueToColor(style.colour).lighten(35).color;
    this.plate.clear();
    this.plate.fillStyle(light, 1);
    this.plate.fillRoundedRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 36);
    this.plate.lineStyle(8, style.colour, 1);
    this.plate.strokeRoundedRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 36);
    this.plate.fillStyle(0x1d1d22, 1);
    this.plate.fillCircle(0, 0, 62);
    this.label.setText(style.label).setColor(style.colourCss);
    this.ring.setStrokeStyle(10, style.colour, 0.9);
  }

  /** Is this world point on the tile? */
  contains(x: number, y: number): boolean {
    return Math.abs(x - this.x) <= TILE_SIZE / 2 && Math.abs(y - this.y) <= TILE_SIZE / 2;
  }

  setHighlighted(on: boolean): void {
    if (on === this.highlighted) return;
    this.highlighted = on;
    this.scene.tweens.add({
      targets: this,
      scale: on ? 1.08 : 1,
      duration: 140,
      ease: 'Sine.easeOut',
    });
  }

  setTarget(on: boolean): void {
    this.ringTween?.stop();
    this.ringTween = null;
    this.ring.setVisible(on).setScale(1).setAlpha(1);
    if (on) {
      this.ringTween = this.scene.tweens.add({
        targets: this.ring,
        scale: { from: 1, to: 1.12 },
        alpha: { from: 1, to: 0.35 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /** Gentle "not this one" wobble. */
  wobble(): void {
    this.scene.tweens.add({
      targets: this,
      angle: { from: -5, to: 5 },
      duration: 70,
      yoyo: true,
      repeat: 3,
      onComplete: () => this.setAngle(0),
    });
  }

  /** Happy pop for a correct press. */
  pop(): void {
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1.25, to: this.highlighted ? 1.08 : 1 },
      duration: 500,
      ease: 'Back.easeOut',
    });
  }
}

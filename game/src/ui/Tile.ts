import Phaser from 'phaser';
import type { FaceButton } from '../input/buttons';
import type { SymbolTheme } from '../themes/types';
import { addText } from '../text';

/** Radius of the whole floor pad (what counts as "standing on it"). */
export const TILE_RADIUS = 82;
/** Radius of the dark button face in the middle. */
const BUTTON_RADIUS = 54;

/**
 * A floor pad that looks like a giant version of one face button: a dark
 * round face with the coloured letter, sitting on a soft coloured disc.
 * The same picture as the badge at the top and the button on the pad.
 * It can be highlighted (Knappis stands on it) and marked as the target
 * (pulsing glow).
 */
export class Tile extends Phaser.GameObjects.Container {
  face: FaceButton;
  private readonly halo: Phaser.GameObjects.Arc;
  private readonly disc: Phaser.GameObjects.Arc;
  private readonly rim: Phaser.GameObjects.Arc;
  private readonly label: Phaser.GameObjects.Text;
  private readonly theme: SymbolTheme;
  private haloTween: Phaser.Tweens.Tween | null = null;
  private highlighted = false;

  constructor(scene: Phaser.Scene, x: number, y: number, face: FaceButton, theme: SymbolTheme) {
    super(scene, x, y);
    scene.add.existing(this);
    this.face = face;
    this.theme = theme;

    // Pulsing glow shown when this is the button to find.
    this.halo = scene.add.circle(0, 0, TILE_RADIUS + 10, 0xffffff, 0.8).setVisible(false);
    this.add(this.halo);

    // Soft coloured floor disc so the pad is easy to spot.
    this.disc = scene.add.circle(0, 0, TILE_RADIUS, 0xffffff, 1);
    this.add(this.disc);

    // The button itself: coloured rim, dark face, coloured letter.
    this.rim = scene.add.circle(0, 0, BUTTON_RADIUS + 6, 0xffffff, 1);
    this.add(this.rim);
    this.add(scene.add.circle(0, 0, BUTTON_RADIUS, 0x1d1d22, 1));
    this.label = addText(scene, 0, 3, '', { fontSize: '78px', fontStyle: 'bold' });
    this.add(this.label);

    this.setFace(face);
  }

  setFace(face: FaceButton): void {
    this.face = face;
    const style = this.theme.buttons[face];
    const light = Phaser.Display.Color.ValueToColor(style.colour).lighten(38).color;
    this.disc.setFillStyle(light, 1);
    this.rim.setFillStyle(style.colour, 1);
    this.halo.setFillStyle(style.colour, 0.45);
    this.label.setText(style.label).setColor(style.colourCss);
  }

  /** Is this world point on the pad? */
  contains(x: number, y: number): boolean {
    return Phaser.Math.Distance.Between(x, y, this.x, this.y) <= TILE_RADIUS;
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
    this.haloTween?.stop();
    this.haloTween = null;
    this.halo.setVisible(on).setScale(1).setAlpha(1);
    if (on) {
      this.haloTween = this.scene.tweens.add({
        targets: this.halo,
        scale: { from: 1, to: 1.18 },
        alpha: { from: 1, to: 0.3 },
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

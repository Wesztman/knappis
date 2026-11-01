import Phaser from 'phaser';
import type { FaceButton } from '../input/buttons';
import type { SymbolTheme } from '../themes/types';
import { addText } from '../text';

/** Radius of the whole floor pad (what counts as "standing on it"). */
export const TILE_RADIUS = 82;
/** Radius of the dark button face in the middle. */
const BUTTON_RADIUS = 54;

/**
 * How Knappis relates to this pad right now.
 *  - off:   nobody here
 *  - right: Knappis stands here and this is a pad worth pressing on
 *  - wrong: Knappis stands here but another pad was asked for
 */
export type Standing = 'off' | 'right' | 'wrong';

/**
 * A floor pad that looks like a giant version of one face button: a dark
 * round face with the coloured letter, sitting on a soft coloured disc.
 * The same picture as the badge at the top and the button on the pad.
 * It can be marked as the target (pulsing glow) and shows clearly whether
 * standing on it is right (big, bright, ringed) or wrong (small, dim).
 */
export class Tile extends Phaser.GameObjects.Container {
  face: FaceButton;
  private readonly halo: Phaser.GameObjects.Arc;
  private readonly disc: Phaser.GameObjects.Arc;
  private readonly rim: Phaser.GameObjects.Arc;
  private readonly ring: Phaser.GameObjects.Arc;
  private readonly label: Phaser.GameObjects.Text;
  private readonly theme: SymbolTheme;
  private haloTween: Phaser.Tweens.Tween | null = null;
  private ringTween: Phaser.Tweens.Tween | null = null;
  private standing: Standing = 'off';

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

    // Thick white ring that pulses while Knappis stands on the right pad.
    this.ring = scene.add.circle(0, 0, TILE_RADIUS + 2, 0xffffff, 0).setVisible(false);
    this.ring.setStrokeStyle(10, 0xffffff, 1);
    this.add(this.ring);

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

  setStanding(standing: Standing): void {
    if (standing === this.standing) return;
    this.standing = standing;
    this.ringTween?.stop();
    this.ringTween = null;
    this.ring
      .setVisible(standing === 'right')
      .setScale(1)
      .setAlpha(1);

    this.scene.tweens.add({
      targets: this,
      scale: this.restScale(),
      alpha: standing === 'wrong' ? 0.45 : 1,
      duration: 160,
      ease: 'Back.easeOut',
    });

    if (standing === 'right') {
      this.ringTween = this.scene.tweens.add({
        targets: this.ring,
        scale: { from: 1, to: 1.1 },
        alpha: { from: 1, to: 0.35 },
        duration: 380,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (standing === 'wrong') {
      this.wobble();
    }
  }

  private restScale(): number {
    return this.standing === 'right' ? 1.14 : this.standing === 'wrong' ? 0.92 : 1;
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
      scale: { from: 1.3, to: this.restScale() },
      duration: 500,
      ease: 'Back.easeOut',
    });
  }
}

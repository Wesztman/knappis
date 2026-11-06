import Phaser from 'phaser';
import type { FaceButton } from '../input/buttons';
import { FACE_BUTTONS } from '../input/buttons';
import type { SymbolTheme } from '../themes/types';
import { addText } from '../text';
import { FACE_CENTRE, FACE_SPREAD, GAMEPAD_SILHOUETTE } from './gamepadSilhouette';

/** Which part of the pad the child should use next. */
export type Step = 'move' | 'press' | 'look';

/**
 * Positions in the pad's local space (256 wide, centred), measured from the
 * same photo the silhouette was traced from. The left stick mirrors the
 * face-button cluster; the D-pad and right stick sit lower, nearer the middle.
 */
const STICK = { x: -66, y: -40.5 };
const RIGHT_STICK = { x: 34.5, y: -2 };
const DPAD = { x: -35, y: 1.5 };
const FACE_RADIUS = 10;
/** How far the drawn stick cap travels at full deflection. */
const STICK_TRAVEL = 6;

const BODY = 0x2f2f34;
const BODY_EDGE = 0x18181b;
const WELL = 0x1b1b1f;
const CAP = 0x45454c;
const CAP_EDGE = 0x5a5a62;

/**
 * A simplified drawing of an Xbox-style gamepad. One face button can be
 * highlighted so the child can see which physical button to press, the
 * left stick can be highlighted to say "move first", and the stick cap
 * mirrors the real stick so cause and effect is visible.
 */
export class GamepadDiagram extends Phaser.GameObjects.Container {
  private readonly buttonNodes: Record<FaceButton, Phaser.GameObjects.Container>;
  private readonly glow: Phaser.GameObjects.Arc;
  private readonly stickGlow: Phaser.GameObjects.Arc;
  private readonly stickCap: Phaser.GameObjects.Arc;
  private readonly rightGlow: Phaser.GameObjects.Arc;
  private readonly rightCap: Phaser.GameObjects.Arc;
  private pulse: Phaser.Tweens.Tween | null = null;
  private stickPulse: Phaser.Tweens.Tween | null = null;
  private current: FaceButton | null = null;
  private step: Step = 'press';

  constructor(scene: Phaser.Scene, x: number, y: number, theme: SymbolTheme, scale = 1) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setScale(scale);

    // Silhouette traced from a photo of the real controller (bumpers included).
    const points = GAMEPAD_SILHOUETTE.map(([x, y]) => new Phaser.Math.Vector2(x, y));
    const body = scene.add.graphics();
    body.fillStyle(BODY, 1);
    body.fillPoints(points, true);
    body.lineStyle(4, BODY_EDGE, 1);
    body.strokePoints(points, true);
    // A faint line where the bumpers meet the body, so the top reads as bumpers.
    body.lineStyle(2, BODY_EDGE, 0.7);
    body.lineBetween(-84, -72, -38, -84);
    body.lineBetween(38, -84, 84, -72);
    this.add(body);

    this.stickGlow = scene.add.circle(STICK.x, STICK.y, 23, 0xffffff, 0.9).setVisible(false);
    this.add(this.stickGlow);
    this.rightGlow = scene.add
      .circle(RIGHT_STICK.x, RIGHT_STICK.y, 23, 0xffffff, 0.9)
      .setVisible(false);
    this.add(this.rightGlow);

    const details = scene.add.graphics();
    // Left stick well
    details.fillStyle(WELL, 1);
    details.fillCircle(STICK.x, STICK.y, 17);
    // Right stick well (its cap is a separate object so it can move too)
    details.fillCircle(RIGHT_STICK.x, RIGHT_STICK.y, 17);
    // D-pad: round dish with a cross
    details.fillStyle(WELL, 1);
    details.fillCircle(DPAD.x, DPAD.y, 18);
    details.fillStyle(CAP, 1);
    details.fillRoundedRect(DPAD.x - 5, DPAD.y - 14, 10, 28, 3);
    details.fillRoundedRect(DPAD.x - 14, DPAD.y - 5, 28, 10, 3);
    // Round button at the top centre, and the three small centre buttons
    details.fillStyle(CAP, 1);
    details.fillCircle(0, -67, 9);
    details.lineStyle(2, CAP_EDGE, 1);
    details.strokeCircle(0, -67, 9);
    details.fillStyle(CAP, 1);
    details.fillCircle(-19, -40.5, 4.5);
    details.fillCircle(19, -40.5, 4.5);
    details.fillCircle(0, -26, 4.5);
    this.add(details);

    this.stickCap = scene.add.circle(STICK.x, STICK.y, 12, CAP);
    this.stickCap.setStrokeStyle(2, CAP_EDGE, 1);
    this.add(this.stickCap);
    this.rightCap = scene.add.circle(RIGHT_STICK.x, RIGHT_STICK.y, 12, CAP);
    this.rightCap.setStrokeStyle(2, CAP_EDGE, 1);
    this.add(this.rightCap);

    this.glow = scene.add.circle(0, 0, FACE_RADIUS + 5, 0xffffff, 0.9).setVisible(false);
    this.add(this.glow);

    this.buttonNodes = {} as Record<FaceButton, Phaser.GameObjects.Container>;
    for (const face of FACE_BUTTONS) {
      const off = theme.layout[face];
      const style = theme.buttons[face];
      const node = scene.add.container(
        FACE_CENTRE.x + off.x * FACE_SPREAD,
        FACE_CENTRE.y + off.y * FACE_SPREAD,
      );
      node.add(scene.add.circle(0, 0, FACE_RADIUS, 0x141416));
      node.add(
        addText(scene, 0, 1, style.label, {
          fontSize: '14px',
          fontStyle: 'bold',
          color: style.colourCss,
        }),
      );
      this.add(node);
      this.buttonNodes[face] = node;
    }
  }

  /** Light up one button (or none). */
  highlight(face: FaceButton | null): void {
    if (face === this.current) return;
    this.current = face;
    this.applyHighlights();
  }

  /**
   * Which step the child is on. 'move' pulses the left stick and keeps the
   * button lit but calm; 'press' pulses the button; 'look' pulses the
   * right stick (lamp mode).
   */
  setStep(step: Step): void {
    if (step === this.step) return;
    this.step = step;
    this.applyHighlights();
  }

  /** Mirror the real left stick (x, y in -1..1). */
  setStick(x: number, y: number): void {
    this.stickCap.setPosition(STICK.x + x * STICK_TRAVEL, STICK.y + y * STICK_TRAVEL);
    this.stickGlow.setPosition(this.stickCap.x, this.stickCap.y);
  }

  /** Mirror the real right stick (x, y in -1..1). */
  setLook(x: number, y: number): void {
    this.rightCap.setPosition(RIGHT_STICK.x + x * STICK_TRAVEL, RIGHT_STICK.y + y * STICK_TRAVEL);
    this.rightGlow.setPosition(this.rightCap.x, this.rightCap.y);
  }

  private applyHighlights(): void {
    this.pulse?.stop();
    this.pulse = null;
    this.stickPulse?.stop();
    this.stickPulse = null;
    this.stickGlow.setVisible(false).setScale(1);
    this.rightGlow.setVisible(false).setScale(1);
    const face = this.current;
    for (const b of FACE_BUTTONS) this.buttonNodes[b].setScale(1).setAlpha(face ? 0.55 : 1);

    if (this.step === 'look') {
      this.glow.setVisible(false);
      this.rightGlow.setVisible(true);
      this.stickPulse = this.scene.tweens.add({
        targets: this.rightGlow,
        scale: { from: 0.9, to: 1.15 },
        alpha: { from: 0.9, to: 0.5 },
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      return;
    }

    if (!face) {
      this.glow.setVisible(false);
      return;
    }
    const node = this.buttonNodes[face];
    node.setAlpha(1);
    this.glow.setPosition(node.x, node.y).setVisible(true).setScale(1);
    this.bringToTop(this.glow);
    this.bringToTop(node);

    if (this.step === 'press') {
      this.pulse = this.scene.tweens.add({
        targets: [node, this.glow],
        scale: { from: 1, to: 1.2 },
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.glow.setAlpha(0.5);
      this.stickGlow.setVisible(true);
      this.stickPulse = this.scene.tweens.add({
        targets: this.stickGlow,
        scale: { from: 0.9, to: 1.15 },
        alpha: { from: 0.9, to: 0.5 },
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }
}

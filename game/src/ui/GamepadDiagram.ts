import Phaser from 'phaser';
import type { FaceButton } from '../input/buttons';
import { FACE_BUTTONS } from '../input/buttons';
import type { SymbolTheme } from '../themes/types';
import { addText } from '../text';

/** Which part of the pad the child should use next. */
export type Step = 'move' | 'press';

/** Positions in the pad's local space, traced from an Xbox Series controller. */
const STICK = { x: -72, y: -47 };
const RIGHT_STICK = { x: 37, y: -6 };
const DPAD = { x: -38, y: -2 };
const FACE_CENTRE = { x: 72, y: -46 };
const FACE_SPREAD = 23;
const FACE_RADIUS = 13;
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
  private pulse: Phaser.Tweens.Tween | null = null;
  private stickPulse: Phaser.Tweens.Tween | null = null;
  private current: FaceButton | null = null;
  private step: Step = 'press';

  constructor(scene: Phaser.Scene, x: number, y: number, theme: SymbolTheme, scale = 1) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setScale(scale);

    // Bumpers peek out above the shoulders, tilted to follow their slope.
    for (const side of [-1, 1]) {
      const bumper = scene.add.graphics({ x: side * 60, y: -85 });
      bumper.fillStyle(BODY_EDGE, 1);
      bumper.fillRoundedRect(-32, -9, 64, 18, 8);
      bumper.setRotation(side * 0.1);
      this.add(bumper);
    }

    // One smooth silhouette traced from the real controller: wide
    // shoulders, long grips angled outward, a rounded crotch between them.
    // Traced from a straight-on photo of the Series controller: tall body,
    // outer edges that stay wide low down, stubby grips pointing down-and-out.
    const outline = new Phaser.Curves.Path(-48, -84);
    outline.lineTo(48, -84);
    outline.cubicBezierTo(128, -7, 100, -84, 128, -50);
    outline.cubicBezierTo(82, 86, 126, 40, 100, 72);
    outline.cubicBezierTo(48, 88, 72, 100, 56, 100);
    outline.cubicBezierTo(0, 40, 34, 64, 8, 40);
    outline.cubicBezierTo(-48, 88, -8, 40, -34, 64);
    outline.cubicBezierTo(-82, 86, -56, 100, -72, 100);
    outline.cubicBezierTo(-128, -7, -100, 72, -126, 40);
    outline.cubicBezierTo(-48, -84, -128, -50, -100, -84);
    const points = outline.getPoints(120);

    const body = scene.add.graphics();
    body.fillStyle(BODY, 1);
    body.fillPoints(points, true);
    body.lineStyle(4, BODY_EDGE, 1);
    body.strokePoints(points, true);
    this.add(body);

    this.stickGlow = scene.add.circle(STICK.x, STICK.y, 25, 0xffffff, 0.9).setVisible(false);
    this.add(this.stickGlow);

    const details = scene.add.graphics();
    // Left stick well
    details.fillStyle(WELL, 1);
    details.fillCircle(STICK.x, STICK.y, 19);
    // Right stick
    details.fillCircle(RIGHT_STICK.x, RIGHT_STICK.y, 19);
    details.fillStyle(CAP, 1);
    details.fillCircle(RIGHT_STICK.x, RIGHT_STICK.y, 13);
    details.lineStyle(2, CAP_EDGE, 1);
    details.strokeCircle(RIGHT_STICK.x, RIGHT_STICK.y, 13);
    // D-pad: round dish with a cross
    details.fillStyle(WELL, 1);
    details.fillCircle(DPAD.x, DPAD.y, 20);
    details.fillStyle(CAP, 1);
    details.fillRoundedRect(DPAD.x - 6, DPAD.y - 16, 12, 32, 3);
    details.fillRoundedRect(DPAD.x - 16, DPAD.y - 6, 32, 12, 3);
    // Round button at the top centre, and the three small centre buttons
    details.fillStyle(CAP, 1);
    details.fillCircle(0, -70, 10);
    details.lineStyle(2, CAP_EDGE, 1);
    details.strokeCircle(0, -70, 10);
    details.fillStyle(CAP, 1);
    details.fillCircle(-20, -47, 5);
    details.fillCircle(20, -47, 5);
    details.fillCircle(0, -32, 5);
    this.add(details);

    this.stickCap = scene.add.circle(STICK.x, STICK.y, 13, CAP);
    this.stickCap.setStrokeStyle(2, CAP_EDGE, 1);
    this.add(this.stickCap);

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
          fontSize: '17px',
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
   * Which step the child is on. 'move' pulses the stick and keeps the
   * button lit but calm; 'press' pulses the button.
   */
  setStep(step: Step): void {
    if (step === this.step) return;
    this.step = step;
    this.applyHighlights();
  }

  /** Mirror the real stick (x, y in -1..1). */
  setStick(x: number, y: number): void {
    this.stickCap.setPosition(STICK.x + x * STICK_TRAVEL, STICK.y + y * STICK_TRAVEL);
    this.stickGlow.setPosition(this.stickCap.x, this.stickCap.y);
  }

  private applyHighlights(): void {
    this.pulse?.stop();
    this.pulse = null;
    this.stickPulse?.stop();
    this.stickPulse = null;
    this.stickGlow.setVisible(false).setScale(1);
    const face = this.current;
    for (const b of FACE_BUTTONS) this.buttonNodes[b].setScale(1).setAlpha(face ? 0.55 : 1);

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

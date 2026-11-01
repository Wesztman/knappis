import Phaser from 'phaser';
import type { FaceButton } from '../input/buttons';
import { FACE_BUTTONS } from '../input/buttons';
import type { SymbolTheme } from '../themes/types';
import { addText } from '../text';

/** Which part of the pad the child should use next. */
export type Step = 'move' | 'press';

const STICK = { x: -78, y: -10 };
/** How far the drawn stick cap travels at full deflection. */
const STICK_TRAVEL = 8;

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

    // One smooth silhouette: body with two grips, drawn as a single path
    // so nothing pokes out and the outline follows the whole shape.
    const outline = new Phaser.Curves.Path(-80, -50);
    outline.lineTo(80, -50);
    outline.cubicBezierTo(115, 20, 120, -50, 128, -12);
    outline.cubicBezierTo(75, 85, 108, 58, 100, 85);
    outline.cubicBezierTo(45, 38, 52, 85, 45, 64);
    outline.lineTo(-45, 38);
    outline.cubicBezierTo(-75, 85, -45, 64, -52, 85);
    outline.cubicBezierTo(-115, 20, -100, 85, -108, 58);
    outline.cubicBezierTo(-80, -50, -128, -12, -120, -50);
    const points = outline.getPoints(96);

    const body = scene.add.graphics();
    body.fillStyle(0x4a4a52, 1);
    body.fillPoints(points, true);
    body.lineStyle(5, 0x2b2b30, 1);
    body.strokePoints(points, true);
    this.add(body);

    this.stickGlow = scene.add.circle(STICK.x, STICK.y, 28, 0xffffff, 0.9).setVisible(false);
    this.add(this.stickGlow);

    const details = scene.add.graphics();
    details.fillStyle(0x2b2b30, 1);
    details.fillCircle(STICK.x, STICK.y, 21); // left stick well
    details.fillStyle(0x2b2b30, 1);
    details.fillRoundedRect(-37, -6, 14, 40, 4); // d-pad vertical
    details.fillRoundedRect(-50, 7, 40, 14, 4); // d-pad horizontal
    details.fillCircle(30, 16, 13); // right stick well
    details.fillStyle(0x6e6e78, 1);
    details.fillCircle(30, 16, 9);
    this.add(details);

    this.stickCap = scene.add.circle(STICK.x, STICK.y, 14, 0x6e6e78);
    this.stickCap.setStrokeStyle(2, 0x8e8e98, 1);
    this.add(this.stickCap);

    this.glow = scene.add.circle(0, 0, 17, 0xffffff, 0.9).setVisible(false);
    this.add(this.glow);

    const spread = 23;
    const centre = { x: 74, y: -6 };
    this.buttonNodes = {} as Record<FaceButton, Phaser.GameObjects.Container>;
    for (const face of FACE_BUTTONS) {
      const off = theme.layout[face];
      const style = theme.buttons[face];
      const node = scene.add.container(centre.x + off.x * spread, centre.y + off.y * spread);
      node.add(scene.add.circle(0, 0, 13, 0x1d1d22));
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

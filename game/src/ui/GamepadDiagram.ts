import Phaser from 'phaser';
import type { FaceButton } from '../input/buttons';
import { FACE_BUTTONS } from '../input/buttons';
import type { SymbolTheme } from '../themes/types';
import { addText } from '../text';

/**
 * A simplified drawing of an Xbox-style gamepad. One face button can be
 * highlighted so the child can see which physical button to press.
 */
export class GamepadDiagram extends Phaser.GameObjects.Container {
  private readonly buttonNodes: Record<FaceButton, Phaser.GameObjects.Container>;
  private readonly glow: Phaser.GameObjects.Arc;
  private pulse: Phaser.Tweens.Tween | null = null;
  private current: FaceButton | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, theme: SymbolTheme, scale = 1) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setScale(scale);

    const body = scene.add.graphics();
    body.fillStyle(0x4a4a52, 1);
    body.fillRoundedRect(-120, -45, 240, 90, 40);
    body.fillEllipse(-85, 30, 70, 90);
    body.fillEllipse(85, 30, 70, 90);
    body.lineStyle(5, 0x2b2b30, 1);
    body.strokeRoundedRect(-120, -45, 240, 90, 40);
    this.add(body);

    const details = scene.add.graphics();
    details.fillStyle(0x2b2b30, 1);
    details.fillCircle(-70, -8, 22); // left stick well
    details.fillStyle(0x6e6e78, 1);
    details.fillCircle(-70, -8, 15); // left stick cap
    details.fillStyle(0x2b2b30, 1);
    details.fillRoundedRect(-42, 14, 14, 42, 4); // d-pad vertical
    details.fillRoundedRect(-56, 28, 42, 14, 4); // d-pad horizontal
    details.fillCircle(40, 32, 15); // right stick well
    details.fillStyle(0x6e6e78, 1);
    details.fillCircle(40, 32, 10);
    this.add(details);

    this.glow = scene.add.circle(0, 0, 22, 0xffffff, 0.9).setVisible(false);
    this.add(this.glow);

    const spread = 24;
    const centre = { x: 72, y: -8 };
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
    this.pulse?.stop();
    this.pulse = null;
    for (const b of FACE_BUTTONS) this.buttonNodes[b].setScale(1).setAlpha(face ? 0.55 : 1);

    if (!face) {
      this.glow.setVisible(false);
      return;
    }
    const node = this.buttonNodes[face];
    node.setAlpha(1);
    this.bringToTop(node);
    this.glow.setPosition(node.x, node.y).setVisible(true);
    this.bringToTop(this.glow);
    this.bringToTop(node);
    this.pulse = this.scene.tweens.add({
      targets: [node, this.glow],
      scale: { from: 1, to: 1.35 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

import Phaser from 'phaser';
import { addText } from '../text';

const INK = 0x3a2e2a;
const PAPER = 0xffffff;

/**
 * Rounded choice button for the settings panel. Selected pills are filled
 * with ink and show light text; unselected ones are pale with dark text.
 */
export class PillButton extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private selected = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly pillW: number,
    private readonly pillH: number,
    text: string,
    onClick: () => void,
  ) {
    super(scene, x, y);
    scene.add.existing(this);
    this.bg = scene.add.graphics();
    this.add(this.bg);
    this.label = addText(scene, 0, 1, text, { fontSize: '24px', fontStyle: 'bold' });
    this.add(this.label);
    this.redraw();

    this.setSize(pillW, pillH);
    this.setInteractive();
    this.input!.cursor = 'pointer';
    this.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
        onClick();
      },
    );
  }

  setSelected(on: boolean): this {
    if (on !== this.selected) {
      this.selected = on;
      this.redraw();
    }
    return this;
  }

  private redraw(): void {
    const g = this.bg;
    g.clear();
    g.fillStyle(this.selected ? INK : PAPER, this.selected ? 1 : 0.8);
    g.fillRoundedRect(-this.pillW / 2, -this.pillH / 2, this.pillW, this.pillH, this.pillH / 2);
    g.lineStyle(3, INK, this.selected ? 1 : 0.35);
    g.strokeRoundedRect(-this.pillW / 2, -this.pillH / 2, this.pillW, this.pillH, this.pillH / 2);
    this.label.setColor(this.selected ? '#fff3d6' : '#3a2e2a');
  }
}

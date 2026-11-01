import Phaser from 'phaser';

/** A drawing routine for the symbol inside the button, centred on (0, 0). */
export type IconDrawer = (g: Phaser.GameObjects.Graphics, ink: number) => void;

const INK = 0x3a2e2a;

/**
 * Round, clickable icon on a soft white disc: the family that the speaker,
 * gear and home buttons belong to. Clicks never fall through to the scene.
 */
export class IconButton extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, draw: IconDrawer, onClick: () => void) {
    super(scene, x, y);
    scene.add.existing(this);
    this.add(scene.add.circle(0, 0, 22, 0xffffff, 0.55));
    const g = scene.add.graphics();
    draw(g, INK);
    this.add(g);

    this.setSize(52, 52);
    // Container hit areas are in local space with (0, 0) at the top-left of setSize.
    this.setInteractive(new Phaser.Geom.Circle(26, 26, 26), Phaser.Geom.Circle.Contains);
    this.input!.cursor = 'pointer';
    this.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
        onClick();
      },
    );
  }
}

/** Cog wheel. */
export const drawGear: IconDrawer = (g, ink) => {
  g.lineStyle(5, ink, 1);
  g.strokeCircle(0, 0, 9);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.lineBetween(Math.cos(a) * 11, Math.sin(a) * 11, Math.cos(a) * 16, Math.sin(a) * 16);
  }
};

/** Little house: back to the start screen. */
export const drawHome: IconDrawer = (g, ink) => {
  g.fillStyle(ink, 1);
  g.fillTriangle(-17, -1, 0, -16, 17, -1);
  g.fillRect(-12, -2, 24, 16);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(-4, 4, 8, 10);
};

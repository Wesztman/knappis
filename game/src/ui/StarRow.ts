import Phaser from 'phaser';

const GOLD = 0xffc83d;

/**
 * Row of stars that fill in as the child earns them. A star can take a
 * colour of its own (the button it was earned with), so a full row in
 * "find the button" is also a picture of the whole gamepad.
 */
export class StarRow extends Phaser.GameObjects.Container {
  private readonly stars: Phaser.GameObjects.Star[] = [];
  private readonly colours: number[] = [];
  private filled = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, count: number, spacing = 60) {
    super(scene, x, y);
    scene.add.existing(this);
    const startX = (-(count - 1) * spacing) / 2;
    for (let i = 0; i < count; i++) {
      const star = scene.add.star(startX + i * spacing, 0, 5, 11, 24, 0xffffff, 1);
      star.setStrokeStyle(4, 0xd9c79a);
      this.add(star);
      this.stars.push(star);
    }
  }

  /** Fill the first `n` stars; newly earned ones take `colour` (gold by default). */
  setStars(n: number, colour: number = GOLD): void {
    const target = Math.max(0, Math.min(this.stars.length, n));
    for (let i = this.filled; i < target; i++) this.colours[i] = colour;
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      if (!star) continue;
      const on = i < target;
      const fill = this.colours[i] ?? GOLD;
      const edge = Phaser.Display.Color.ValueToColor(fill).darken(18).color;
      star.setFillStyle(on ? fill : 0xffffff);
      star.setStrokeStyle(4, on ? edge : 0xd9c79a);
    }
    if (target > this.filled) {
      const star = this.stars[target - 1];
      if (star) {
        this.scene.tweens.add({
          targets: star,
          scale: { from: 1.8, to: 1 },
          angle: { from: -30, to: 0 },
          duration: 450,
          ease: 'Back.easeOut',
        });
      }
    }
    this.filled = target;
  }
}

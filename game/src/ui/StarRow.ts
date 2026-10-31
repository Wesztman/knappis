import Phaser from 'phaser';

/** Row of stars that fill in as the child earns them. */
export class StarRow extends Phaser.GameObjects.Container {
  private readonly stars: Phaser.GameObjects.Star[] = [];
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

  setStars(n: number): void {
    const target = Math.max(0, Math.min(this.stars.length, n));
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      if (!star) continue;
      const on = i < target;
      star.setFillStyle(on ? 0xffc83d : 0xffffff);
      star.setStrokeStyle(4, on ? 0xe0a000 : 0xd9c79a);
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

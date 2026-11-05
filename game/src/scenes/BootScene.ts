import Phaser from 'phaser';

/** Generates the few textures the game needs, then hands over. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const dot = this.make.graphics({ x: 0, y: 0 }, false);
    dot.fillStyle(0xffffff, 1);
    dot.fillCircle(8, 8, 8);
    dot.generateTexture('dot', 16, 16);
    dot.destroy();

    const spark = this.make.graphics({ x: 0, y: 0 }, false);
    spark.fillStyle(0xffffff, 1);
    spark.fillRoundedRect(0, 0, 14, 22, 4);
    spark.generateTexture('confetti', 14, 22);
    spark.destroy();

    // A paint splat: one big blob with a few drips around it. White, so a
    // tint gives it the pressed button's colour; a random rotation per stamp
    // keeps a wall of splats from looking like a pattern.
    const splat = this.make.graphics({ x: 0, y: 0 }, false);
    splat.fillStyle(0xffffff, 1);
    splat.fillCircle(50, 50, 34);
    splat.fillCircle(84, 42, 9);
    splat.fillCircle(16, 60, 8);
    splat.fillCircle(58, 12, 7);
    splat.fillCircle(42, 90, 6);
    splat.generateTexture('splat', 100, 100);
    splat.destroy();

    // A footprint: a small rounded sole pointing up, tinted ink at use.
    const foot = this.make.graphics({ x: 0, y: 0 }, false);
    foot.fillStyle(0xffffff, 1);
    foot.fillRoundedRect(0, 0, 14, 22, 6);
    foot.generateTexture('footprint', 14, 22);
    foot.destroy();

    this.scene.start('Connect');
  }
}

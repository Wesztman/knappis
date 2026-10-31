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

    this.scene.start('Connect');
  }
}

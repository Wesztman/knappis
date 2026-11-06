import Phaser from 'phaser';
import { BEAM_HALF_ANGLE, BEAM_RADIUS } from '../entities/Dusk';

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

    this.makeFlashlightTextures();

    this.scene.start('Connect');
  }

  /**
   * Flashlight mode textures, white with soft edges, made with canvas gradients
   * since Phaser graphics have no gradients: 'cone' is the beam (a wedge
   * pointing right, erased out of the dusk), 'halo' the fireflies' glow.
   */
  private makeFlashlightTextures(): void {
    const R = BEAM_RADIUS;
    const cone = this.textures.createCanvas('cone', R * 2, R * 2);
    const ctx = cone?.getContext();
    if (cone && ctx) {
      const half = BEAM_HALF_ANGLE;
      const fade = ctx.createRadialGradient(R, R, 0, R, R, R);
      fade.addColorStop(0, 'rgba(255,255,255,1)');
      fade.addColorStop(0.55, 'rgba(255,255,255,0.85)');
      fade.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = fade;
      // Several wedges, each a little narrower and on top of the last, so
      // the sides of the beam feather out instead of ending in a hard line.
      for (let i = 0; i < 12; i += 1) {
        const h = half + Phaser.Math.DegToRad(10 - i * 1.5);
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.moveTo(R, R);
        ctx.arc(R, R, R, -h, h);
        ctx.closePath();
        ctx.fill();
      }
      cone.refresh();
    }

    const H = 80;
    const halo = this.textures.createCanvas('halo', H * 2, H * 2);
    const hctx = halo?.getContext();
    if (halo && hctx) {
      const fade = hctx.createRadialGradient(H, H, 0, H, H, H);
      fade.addColorStop(0, 'rgba(255,255,255,1)');
      fade.addColorStop(0.5, 'rgba(255,255,255,0.8)');
      fade.addColorStop(1, 'rgba(255,255,255,0)');
      hctx.fillStyle = fade;
      hctx.fillRect(0, 0, H * 2, H * 2);
      halo.refresh();
    }
  }
}

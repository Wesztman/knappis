import Phaser from 'phaser';
import type { Cone } from '../rules/cone';

/** Night-blue dusk over the room; dark enough to hide, not scary. */
const DUSK_COLOUR = 0x1a2140;
const DUSK_ALPHA = 0.82;
/** The beam, in pixels and radians. Matches the 'cone' texture from BootScene. */
export const BEAM_RADIUS = 340;
export const BEAM_HALF_ANGLE = Phaser.Math.DegToRad(32);
/** Knappis always stands in a little pool of light so the child never loses him. */
export const HALO_RADIUS = 80;
const FLASH_SCALE = 1.35;
const FLASH_MS = 320;

/**
 * Lamp mode's darkness. One RenderTexture over the room is filled with
 * dusk every frame, then the beam and a halo around Knappis are erased
 * out of it. Erasing a pre-drawn soft texture (instead of drawing a
 * wedge) gives the beam feathered edges for free.
 */
export class Dusk {
  private readonly texture: Phaser.GameObjects.RenderTexture;
  private flashUntil = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly top: number,
    width: number,
    height: number,
    depth: number,
  ) {
    this.texture = scene.add.renderTexture(0, top, width, height).setOrigin(0).setDepth(depth);
  }

  /** Flare the beam wider for a moment (any button press). */
  flash(): void {
    this.flashUntil = this.scene.time.now + FLASH_MS;
  }

  get flashing(): boolean {
    return this.scene.time.now < this.flashUntil;
  }

  /** The beam as the rules see it, flash included. */
  cone(x: number, y: number, angle: number): Cone {
    const scale = this.flashing ? FLASH_SCALE : 1;
    return {
      origin: { x, y },
      angle,
      halfAngle: BEAM_HALF_ANGLE * scale,
      radius: BEAM_RADIUS * scale,
    };
  }

  /** Redraw: dusk everywhere, then cut out the beam and the halo. */
  update(x: number, y: number, angle: number): void {
    const scale = this.flashing ? FLASH_SCALE : 1;
    this.texture.fill(DUSK_COLOUR, DUSK_ALPHA);
    this.texture.stamp('cone', undefined, x, y - this.top, {
      rotation: angle,
      scale,
      erase: true,
    });
    this.texture.stamp('halo', undefined, x, y - this.top, { erase: true });
  }
}

import Phaser from 'phaser';

const STEP_SPACING = 38;
const FOOT_OFFSET = 11;
const FADE_MS = 2600;
const INK = 0x3a2e2a;

/**
 * Footprints that Knappis leaves while walking, fading out over a few
 * seconds. Pure feedback for the stick: the child sees that moving did
 * something even before pressing anything. One print every STEP_SPACING
 * pixels of travel, alternating left and right of the path.
 */
export class Footprints {
  private travelled = 0;
  private lastX: number | null = null;
  private lastY: number | null = null;
  private leftFoot = true;
  private live = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly depth: number,
  ) {}

  /** How many prints are still fading. */
  get count(): number {
    return this.live;
  }

  /** Call every frame with where the feet are now. */
  update(x: number, y: number): void {
    if (this.lastX === null || this.lastY === null) {
      this.lastX = x;
      this.lastY = y;
      return;
    }
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    this.lastX = x;
    this.lastY = y;
    const moved = Math.hypot(dx, dy);
    if (moved === 0) return;
    this.travelled += moved;
    if (this.travelled < STEP_SPACING) return;
    this.travelled = 0;

    // Place the print beside the path, facing the way Knappis is going.
    const heading = Math.atan2(dy, dx);
    const side = this.leftFoot ? -1 : 1;
    this.leftFoot = !this.leftFoot;
    const px = x + Math.cos(heading + Math.PI / 2) * FOOT_OFFSET * side;
    const py = y + Math.sin(heading + Math.PI / 2) * FOOT_OFFSET * side;
    const print = this.scene.add
      .image(px, py, 'footprint')
      .setTint(INK)
      .setAlpha(0.35)
      .setRotation(heading + Math.PI / 2)
      .setDepth(this.depth);
    this.live += 1;
    this.scene.tweens.add({
      targets: print,
      alpha: 0,
      duration: FADE_MS,
      ease: 'Quad.easeIn',
      onComplete: () => {
        print.destroy();
        this.live -= 1;
      },
    });
  }
}

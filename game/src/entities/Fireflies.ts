import Phaser from 'phaser';
import { inCone, type Cone } from '../rules/cone';

const GLOW = 0xfff1a8;
const BODY = 0xfff8d0;
/** How long a firefly stays lit after the beam leaves it. */
const AFTERGLOW_MS = 2200;

interface Firefly {
  readonly homeX: number;
  readonly homeY: number;
  readonly phase: number;
  x: number;
  y: number;
  litUntil: number;
  readonly glow: Phaser.GameObjects.Image;
  readonly body: Phaser.GameObjects.Arc;
}

/**
 * Fireflies drifting about the dusk. Unlit they blink faintly, so the
 * child can tell something is out there; caught in the beam they light
 * up fully with a twinkle, and stay lit a moment after the beam moves on.
 */
export class Fireflies {
  private readonly flies: Firefly[] = [];

  constructor(
    scene: Phaser.Scene,
    private readonly sceneTime: Phaser.Time.Clock,
    private readonly onLight: () => void,
    area: Phaser.Geom.Rectangle,
    count: number,
    depth: number,
  ) {
    for (let i = 0; i < count; i += 1) {
      const x = Phaser.Math.Between(area.left, area.right);
      const y = Phaser.Math.Between(area.top, area.bottom);
      const glow = scene.add.image(x, y, 'halo').setTint(GLOW).setScale(0.45).setDepth(depth);
      const body = scene.add.circle(x, y, 5, BODY, 1).setDepth(depth + 1);
      this.flies.push({
        homeX: x,
        homeY: y,
        phase: Math.random() * Math.PI * 2,
        x,
        y,
        litUntil: 0,
        glow,
        body,
      });
    }
  }

  get positions(): { x: number; y: number }[] {
    return this.flies.map((f) => ({ x: f.x, y: f.y }));
  }

  get litCount(): number {
    const now = this.sceneTime.now;
    return this.flies.filter((f) => f.litUntil > now).length;
  }

  update(beam: Cone): void {
    const now = this.sceneTime.now;
    const t = now / 1000;
    for (const f of this.flies) {
      // Slow drift around home, each on its own rhythm.
      f.x = f.homeX + Math.sin(t * 0.6 + f.phase) * 22;
      f.y = f.homeY + Math.cos(t * 0.45 + f.phase * 1.7) * 14;

      if (inCone(beam, f)) {
        if (f.litUntil <= now) this.onLight();
        f.litUntil = now + AFTERGLOW_MS;
      }

      const lit = f.litUntil > now;
      // Fade from fully lit to a faint blink; unlit fireflies still wink.
      const remaining = lit ? Math.min(1, (f.litUntil - now) / AFTERGLOW_MS) : 0;
      const blink = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(t * 2.5 + f.phase * 3));
      const brightness = Math.max(blink, remaining);
      f.glow
        .setPosition(f.x, f.y)
        .setAlpha(brightness * 0.9)
        .setScale(0.3 + 0.35 * brightness);
      f.body.setPosition(f.x, f.y).setAlpha(0.35 + 0.65 * brightness);
    }
  }
}

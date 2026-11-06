import Phaser from 'phaser';

/** From the body centre to the flashlight lens. */
const FLASHLIGHT_LENGTH = 80;

/**
 * Knappis: a round little button with eyes and stubby legs.
 * Drawn entirely in code so the game is playable before any art exists.
 * `x, y` is the point between the feet, which is what we test against tiles.
 */
export class Knappis extends Phaser.GameObjects.Container {
  private readonly torso: Phaser.GameObjects.Container;
  private readonly face: Phaser.GameObjects.Container;
  private readonly legL: Phaser.GameObjects.Graphics;
  private readonly legR: Phaser.GameObjects.Graphics;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly flashlight: Phaser.GameObjects.Container;
  private walkPhase = 0;
  private facing = 1;
  private busy = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);

    this.shadow = scene.add.ellipse(0, 4, 90, 26, 0x000000, 0.12);
    this.add(this.shadow);

    this.legL = this.makeLeg(scene, -22);
    this.legR = this.makeLeg(scene, 22);
    this.add([this.legL, this.legR]);

    this.torso = scene.add.container(0, -62);
    const shell = scene.add.graphics();
    shell.fillStyle(0xff8a65, 1);
    shell.fillCircle(0, 0, 50);
    shell.lineStyle(6, 0x3a2e2a, 1);
    shell.strokeCircle(0, 0, 50);
    this.torso.add(shell);

    this.face = scene.add.container(0, 0);
    const eyes = scene.add.graphics();
    eyes.fillStyle(0xffffff, 1);
    eyes.fillCircle(-14, -6, 11);
    eyes.fillCircle(14, -6, 11);
    eyes.fillStyle(0x3a2e2a, 1);
    eyes.fillCircle(-11, -5, 5);
    eyes.fillCircle(17, -5, 5);
    eyes.fillStyle(0xff6f61, 0.5);
    eyes.fillCircle(-26, 10, 7); // cheeks
    eyes.fillCircle(26, 10, 7);
    eyes.lineStyle(4, 0x3a2e2a, 1);
    eyes.beginPath();
    eyes.arc(0, 8, 14, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
    eyes.strokePath();
    this.face.add(eyes);
    this.torso.add(this.face);

    this.flashlight = this.makeFlashlight(scene);
    this.torso.add(this.flashlight);

    this.add(this.torso);
  }

  /** Where the flashlight's lens is, in world space. */
  get flashlightTip(): { x: number; y: number } {
    const r = this.flashlight.rotation;
    return {
      x: this.x + this.torso.x + Math.cos(r) * FLASHLIGHT_LENGTH,
      y: this.y + this.torso.y + Math.sin(r) * FLASHLIGHT_LENGTH,
    };
  }

  /** Show the flashlight pointing this way (radians), or hide it with null. */
  setFlashlight(angle: number | null): void {
    this.flashlight.setVisible(angle !== null);
    if (angle !== null) this.flashlight.setRotation(angle);
  }

  /**
   * A little torch held out from the body, drawn pointing right and
   * rotated as a whole. Sits inside the torso so it bobs along with it.
   */
  private makeFlashlight(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const lamp = scene.add.container(0, 0).setVisible(false);
    const g = scene.add.graphics();
    // Hand on the body edge
    g.fillStyle(0xff8a65, 1);
    g.fillCircle(46, 0, 11);
    g.lineStyle(5, 0x3a2e2a, 1);
    g.strokeCircle(46, 0, 11);
    // Handle, then the wider head
    g.fillStyle(0x3a2e2a, 1);
    g.fillRoundedRect(40, -8, 30, 16, 6);
    g.fillStyle(0x5a5a62, 1);
    g.fillRoundedRect(64, -12, 16, 24, 4);
    g.lineStyle(3, 0x3a2e2a, 1);
    g.strokeRoundedRect(64, -12, 16, 24, 4);
    // Lens
    g.fillStyle(0xfff1a8, 1);
    g.fillRect(77, -9, 5, 18);
    lamp.add(g);
    return lamp;
  }

  private makeLeg(scene: Phaser.Scene, x: number): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();
    g.fillStyle(0x3a2e2a, 1);
    g.fillRoundedRect(-9, -26, 18, 30, 8);
    g.fillStyle(0x5a4a44, 1);
    g.fillRoundedRect(-14, -4, 28, 12, 6); // shoe
    g.setPosition(x, 0);
    return g;
  }

  /** Per-frame animation. `moving` is 0..1 speed, `dirX` the horizontal direction. */
  animate(deltaMs: number, moving: number, dirX: number): void {
    if (this.busy) return;
    if (dirX !== 0) {
      this.facing = dirX > 0 ? 1 : -1;
      this.face.setScale(this.facing, 1);
      this.face.setX(this.facing * 6);
    }
    if (moving > 0.05) {
      this.walkPhase += (deltaMs / 1000) * 14 * Math.max(0.5, moving);
      const bob = Math.abs(Math.sin(this.walkPhase)) * 8;
      this.torso.setY(-62 - bob);
      this.legL.setY(Math.max(0, Math.sin(this.walkPhase)) * -10);
      this.legR.setY(Math.max(0, -Math.sin(this.walkPhase)) * -10);
      this.torso.setAngle(Math.sin(this.walkPhase) * 4 * this.facing);
    } else {
      this.torso.setY(Phaser.Math.Linear(this.torso.y, -62, 0.2));
      this.legL.setY(Phaser.Math.Linear(this.legL.y, 0, 0.3));
      this.legR.setY(Phaser.Math.Linear(this.legR.y, 0, 0.3));
      this.torso.setAngle(Phaser.Math.Linear(this.torso.angle, 0, 0.2));
    }
  }

  /** Big happy jump. Resolves when done. */
  jump(): Promise<void> {
    return this.lock((done) => {
      this.scene.tweens.add({
        targets: this.torso,
        y: -62 - 110,
        duration: 280,
        ease: 'Quad.easeOut',
        yoyo: true,
        onComplete: done,
      });
      this.scene.tweens.add({
        targets: this.torso,
        angle: 360,
        duration: 560,
        onComplete: () => this.torso.setAngle(0),
      });
      this.scene.tweens.add({
        targets: this.shadow,
        scale: 0.6,
        alpha: 0.05,
        duration: 280,
        yoyo: true,
      });
    }, 700);
  }

  /** Quick happy hop: "yes, this pad!". Does not block walking for long. */
  hop(): Promise<void> {
    return this.lock((done) => {
      this.scene.tweens.add({
        targets: this.torso,
        y: -62 - 34,
        duration: 130,
        ease: 'Quad.easeOut',
        yoyo: true,
        onComplete: done,
      });
    }, 300);
  }

  /** Head shake: "no, not that button". Slides side to side, no tilting. */
  headShake(): Promise<void> {
    return this.lock((done) => {
      this.scene.tweens.add({
        targets: this.torso,
        x: { from: -12, to: 12 },
        duration: 70,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          this.torso.setX(0);
          done();
        },
      });
    }, 650);
  }

  /** Little squash: "hm, nothing here". */
  shrug(): Promise<void> {
    return this.lock((done) => {
      this.scene.tweens.add({
        targets: this.torso,
        scaleX: 1.15,
        scaleY: 0.85,
        duration: 110,
        yoyo: true,
        onComplete: done,
      });
    }, 300);
  }

  /** Wiggle dance for round complete. */
  dance(): Promise<void> {
    return this.lock((done) => {
      this.scene.tweens.add({
        targets: this.torso,
        angle: { from: -18, to: 18 },
        y: { from: -62, to: -84 },
        duration: 160,
        yoyo: true,
        repeat: 7,
        onComplete: () => {
          this.torso.setAngle(0).setY(-62);
          done();
        },
      });
    }, 2800);
  }

  private lock(run: (done: () => void) => void, fallbackMs: number): Promise<void> {
    // One reaction at a time; a second one while busy is simply skipped.
    if (this.busy) return Promise.resolve();
    this.busy = true;
    return new Promise((resolve) => {
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        this.busy = false;
        resolve();
      };
      run(done);
      this.scene.time.delayedCall(fallbackMs, done);
    });
  }
}

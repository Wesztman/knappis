import Phaser from 'phaser';
import { Sounds } from '../audio/Sounds';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { setDebug } from '../debug';
import type { FaceButton } from '../input/buttons';
import { InputService } from '../input/InputService';
import { Dusk, HALO_RADIUS } from '../entities/Dusk';
import { Fireflies } from '../entities/Fireflies';
import { Footprints } from '../entities/Footprints';
import { Knappis } from '../entities/Knappis';
import { PaintCanvas } from '../entities/PaintCanvas';
import { setupCamera } from '../render';
import { createRules } from '../rules/createRules';
import type { Rules, RulesEvent } from '../rules/types';
import { loadSettings, WALK_SPEEDS, type GameMode } from '../settings';
import { addText } from '../text';
import type { SymbolTheme } from '../themes/types';
import { xboxTheme } from '../themes/xbox';
import { GamepadDiagram } from '../ui/GamepadDiagram';
import { drawHome, IconButton } from '../ui/IconButton';
import { SoundToggle } from '../ui/SoundToggle';
import { StarRow } from '../ui/StarRow';
import { Tile } from '../ui/Tile';

const HUD_HEIGHT = 150;
const ROOM = new Phaser.Geom.Rectangle(
  70,
  HUD_HEIGHT + 60,
  GAME_WIDTH - 140,
  GAME_HEIGHT - HUD_HEIGHT - 80,
);

/**
 * The floor pads sit in the same diamond as the face buttons on the pad:
 * Y top, X left, B right, A bottom. The room is a giant button cluster.
 */
const PAD_CENTRE = { x: GAME_WIDTH / 2, y: 435 };
const PAD_SPREAD = 182;

/**
 * The room. Reads input, feeds the rules, renders events. All decisions
 * about what counts as correct live in the rules object, which is picked
 * from the settings: "find the button" asks for one pad at a time, "free
 * play" lets any pad count, "paint" has no pads and every press leaves a
 * splat of the button's colour where Knappis stands, "lamp" darkens the
 * room and the right stick points a beam that lights up fireflies.
 */
export class PlayScene extends Phaser.Scene {
  private theme: SymbolTheme = xboxTheme;
  private rules!: Rules;
  private mode: GameMode = 'find';
  private walkSpeed = WALK_SPEEDS.normal;
  private input2!: InputService;
  private sounds!: Sounds;
  private knappis!: Knappis;
  private tiles: Tile[] = [];
  private stars!: StarRow;
  private diagram!: GamepadDiagram;
  private targetBadge!: Phaser.GameObjects.Container;
  private targetLabel!: Phaser.GameObjects.Text;
  private targetDisc!: Phaser.GameObjects.Arc;
  private soundToggle!: SoundToggle;
  private confetti!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private standingOn: Tile | null = null;
  private animating = false;
  /** Paint mode only: the painting and the fading footprints. */
  private paint: PaintCanvas | null = null;
  private footprints: Footprints | null = null;
  private drops: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  /** Lamp mode only: the dusk with its beam, the fireflies, where the beam points. */
  private dusk: Dusk | null = null;
  private fireflies: Fireflies | null = null;
  private lookAngle = 0;

  constructor() {
    super('Play');
  }

  create(): void {
    setupCamera(this);
    // Scene objects live on between visits: reset per-visit state here.
    this.animating = false;
    this.standingOn = null;
    const settings = loadSettings();
    this.mode = settings.mode;
    this.walkSpeed = WALK_SPEEDS[settings.speed];
    this.rules = createRules(settings.mode);
    this.input2 = new InputService(this);
    this.sounds = (this.registry.get('sounds') as Sounds | undefined) ?? new Sounds();

    this.drawRoom();
    this.buildHud();
    this.buildPaintFloor();
    this.buildLampRoom();

    this.tiles = this.rules.state.tiles.map((face) => {
      const off = this.theme.layout[face];
      return new Tile(
        this,
        PAD_CENTRE.x + off.x * PAD_SPREAD,
        PAD_CENTRE.y + off.y * PAD_SPREAD,
        face,
        this.theme,
      );
    });

    this.knappis = new Knappis(this, PAD_CENTRE.x, PAD_CENTRE.y + 40);

    this.confetti = this.add.particles(0, 0, 'confetti', {
      speed: { min: 250, max: 650 },
      angle: { min: 200, max: 340 },
      gravityY: 900,
      lifespan: { min: 900, max: 1400 },
      scale: { start: 1, end: 0.4 },
      rotate: { start: 0, end: 720 },
      alpha: { start: 1, end: 0 },
      tint: [0x5cb85c, 0xe0453d, 0x3d8ee0, 0xf2c320, 0xffffff],
      emitting: false,
    });
    this.confetti.setDepth(10);

    // Little white sparkles that burst when Knappis steps onto the right pad.
    this.sparkles = this.add.particles(0, 0, 'dot', {
      speed: { min: 120, max: 260 },
      angle: { min: 0, max: 360 },
      gravityY: -60,
      lifespan: { min: 350, max: 600 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffffff, 0xfff3b0],
      emitting: false,
    });
    this.sparkles.setDepth(9);

    // Home: back to the start screen, where the settings live. Escape too.
    new IconButton(this, 40, 40, drawHome, () => this.goHome());
    this.input.keyboard?.on('keydown-ESC', () => this.goHome());

    // A mode without rounds has nothing to count: hide the star row.
    this.stars.setVisible(this.rules.state.starsPerRound > 0);

    this.input.on('pointerdown', () => {
      this.sounds.unlock();
      this.soundToggle.refresh();
    });

    this.showTarget(this.rules.state.target);
    this.exposeDebug();
  }

  private drawRoom(): void {
    const g = this.add.graphics();
    g.fillStyle(0xf6e3b8, 1);
    g.fillRect(0, 0, GAME_WIDTH, HUD_HEIGHT);
    g.lineStyle(4, 0xe6cf98, 1);
    g.lineBetween(0, HUD_HEIGHT, GAME_WIDTH, HUD_HEIGHT);

    // Soft floor dots so the room feels like a room, not a void.
    g.fillStyle(0xf3dfae, 1);
    for (let y = HUD_HEIGHT + 40; y < GAME_HEIGHT; y += 60) {
      for (let x = 40; x < GAME_WIDTH; x += 60) {
        g.fillCircle(x, y, 4);
      }
    }
  }

  /**
   * Paint mode floor: the painting below, footprints above it, both under
   * Knappis (whose depth is its y, well above these). Other modes get
   * neither; the footprints are tried here first so they can be judged
   * before spreading to the lessons.
   */
  private buildPaintFloor(): void {
    this.paint = null;
    this.footprints = null;
    this.drops = null;
    if (this.mode !== 'paint') return;
    this.paint = new PaintCanvas(this, this.theme, GAME_WIDTH, GAME_HEIGHT, 1);
    this.footprints = new Footprints(this, 2);
    // Coloured drops that fly up when a splat lands; tinted per press.
    this.drops = this.add.particles(0, 0, 'dot', {
      speed: { min: 140, max: 300 },
      angle: { min: 200, max: 340 },
      gravityY: 700,
      lifespan: { min: 350, max: 600 },
      scale: { start: 0.7, end: 0.1 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    this.drops.setDepth(9);
  }

  /**
   * Lamp mode: fireflies over the floor, dusk over everything in the room
   * (above Knappis too, whose depth is his y; the halo keeps him visible),
   * and the lit fireflies drawn above the dusk so they shine. The sound
   * toggle in the corner is lifted above the dusk as well.
   */
  private buildLampRoom(): void {
    this.dusk = null;
    this.fireflies = null;
    this.lookAngle = 0;
    if (this.mode !== 'lamp') return;
    this.dusk = new Dusk(this, HUD_HEIGHT, GAME_WIDTH, GAME_HEIGHT - HUD_HEIGHT, 50);
    // Keep fireflies off the far left so there is always room to stand west of one.
    const area = new Phaser.Geom.Rectangle(
      ROOM.left + 200,
      ROOM.top + 20,
      ROOM.width - 260,
      ROOM.height - 60,
    );
    this.fireflies = new Fireflies(this, this.time, () => this.sounds.firefly(), area, 12, 60);
    this.soundToggle.setDepth(70);
    this.diagram.setStep('look');
  }

  private buildHud(): void {
    this.stars = new StarRow(this, 230, HUD_HEIGHT / 2, this.rules.state.starsPerRound);

    this.targetBadge = this.add.container(GAME_WIDTH / 2, HUD_HEIGHT / 2);
    // No halo and no pulse on purpose: anything glowing up here reads as
    // "go here", and the floor pad is where the child should go. The badge
    // only pops when the target changes (see showTarget).
    this.targetDisc = this.add.circle(0, 0, 50, 0x1d1d22, 1);
    this.targetLabel = addText(this, 0, 3, '', { fontSize: '64px', fontStyle: 'bold' });
    this.targetBadge.add([this.targetDisc, this.targetLabel]);

    this.diagram = new GamepadDiagram(this, GAME_WIDTH - 120, HUD_HEIGHT / 2, this.theme, 0.8);

    this.soundToggle = new SoundToggle(this, GAME_WIDTH - 40, GAME_HEIGHT - 40, this.sounds);
  }

  private goHome(): void {
    this.scene.start('Connect');
  }

  override update(_time: number, delta: number): void {
    const frame = this.input2.update();
    if (frame.keyboardUsed && !this.sounds.unlocked) {
      this.sounds.unlock();
      this.soundToggle.refresh();
    } else if (frame.anyJustPressed && !this.sounds.unlocked) {
      // Chromium treats a polled gamepad press as a gesture; ask, and see.
      this.sounds.tryResume();
    }

    // Movement
    const dt = delta / 1000;
    const speed = Math.hypot(frame.move.x, frame.move.y);
    if (!this.animating && speed > 0) {
      this.knappis.x = Phaser.Math.Clamp(
        this.knappis.x + frame.move.x * this.walkSpeed * dt,
        ROOM.left,
        ROOM.right,
      );
      this.knappis.y = Phaser.Math.Clamp(
        this.knappis.y + frame.move.y * this.walkSpeed * dt,
        ROOM.top,
        ROOM.bottom,
      );
    }
    this.knappis.animate(delta, this.animating ? 0 : speed, frame.move.x);
    this.knappis.setDepth(this.knappis.y);
    this.footprints?.update(this.knappis.x, this.knappis.y);

    // Lamp: the beam follows the right stick and keeps its last direction
    // when the stick is let go, so the light never "disappears".
    if (this.dusk && this.fireflies) {
      if (Math.hypot(frame.look.x, frame.look.y) > 0) {
        this.lookAngle = Math.atan2(frame.look.y, frame.look.x);
      }
      this.diagram.setLook(frame.look.x, frame.look.y);
      this.dusk.update(this.knappis.x, this.knappis.y - 30, this.lookAngle);
      this.fireflies.update(
        this.dusk.cone(this.knappis.x, this.knappis.y - 30, this.lookAngle),
        HALO_RADIUS,
      );
    }

    this.updateStanding();

    // Teach in two steps: pulse the stick until Knappis is on the right
    // tile, then pulse the button. In free play the "right" tile is
    // whichever one Knappis stands on, so the pad in the corner follows.
    this.diagram.setStick(frame.move.x, frame.move.y);
    if (!this.animating && this.rules.state.phase === 'playing' && this.mode !== 'lamp') {
      if (this.mode === 'free') this.diagram.highlight(this.standingOn?.face ?? null);
      this.diagram.setStep(this.standingOn && this.isRight(this.standingOn) ? 'press' : 'move');
    }

    for (const face of frame.justPressed) this.handlePress(face);
  }

  /** Is standing on this pad the thing to do right now? */
  private isRight(tile: Tile): boolean {
    const target = this.rules.state.target;
    return target === null || tile.face === target;
  }

  private updateStanding(): void {
    const now = this.tiles.find((t) => t.contains(this.knappis.x, this.knappis.y)) ?? null;
    if (now === this.standingOn) return;
    this.standingOn?.setStanding('off');
    this.standingOn = now;
    if (!now) return;
    // Loud and clear, because a quiet highlight was lost on our first tester.
    if (this.isRight(now)) {
      now.setStanding('right');
      this.sparkles.explode(16, now.x, now.y - 10);
      this.sounds.onTarget();
      void this.knappis.hop();
    } else {
      now.setStanding('wrong');
      this.sounds.hmm();
      void this.knappis.shrug();
    }
  }

  /** After the target moved: re-judge the pad Knappis is still standing on, quietly. */
  private rejudgeStanding(): void {
    if (this.standingOn)
      this.standingOn.setStanding(this.isRight(this.standingOn) ? 'right' : 'wrong');
  }

  private handlePress(face: FaceButton): void {
    const events = this.rules.press(face, this.standingOn?.face ?? null);
    for (const e of events) void this.render(e);
  }

  private async render(e: RulesEvent): Promise<void> {
    switch (e.type) {
      case 'flash': {
        this.sounds.flash();
        this.dusk?.flash();
        this.diagram.highlight(e.button);
        this.time.delayedCall(300, () => this.diagram.highlight(null));
        void this.knappis.hop();
        return;
      }
      case 'paint': {
        const colour = this.theme.buttons[e.button].colour;
        this.sounds.paint(e.button);
        this.paint?.splat(this.knappis.x, this.knappis.y, e.button);
        this.drops?.setParticleTint(colour);
        this.drops?.explode(10, this.knappis.x, this.knappis.y - 10);
        // Light the pressed button on the corner gamepad for a moment.
        this.diagram.highlight(e.button);
        this.time.delayedCall(300, () => this.diagram.highlight(null));
        void this.knappis.hop();
        return;
      }
      case 'notOnTile':
        this.sounds.boing();
        this.flashTarget();
        await this.knappis.shrug();
        return;
      case 'wrongTile':
        this.sounds.gentleNo();
        this.tileFor(e.standingOn)?.wobble();
        this.flashTarget();
        void this.knappis.headShake();
        return;
      case 'wrongButton':
        this.sounds.gentleNo();
        this.flashTarget();
        void this.knappis.headShake();
        this.diagram.highlight(null);
        this.time.delayedCall(250, () => this.diagram.highlight(e.target));
        return;
      case 'correct': {
        this.animating = true;
        this.sounds.correct();
        const tile = this.tileFor(e.button);
        tile?.pop();
        tile?.setTarget(false);
        this.confetti.explode(40, this.knappis.x, this.knappis.y - 60);
        // One star per button: in "find the button" each star takes its button's colour.
        this.stars.setStars(
          e.stars,
          this.mode === 'find' ? this.theme.buttons[e.button].colour : undefined,
        );
        await this.knappis.jump();
        await this.wait(250);
        this.animating = false;
        for (const next of this.rules.advance()) void this.render(next);
        return;
      }
      case 'newTarget':
        this.showTarget(e.target);
        this.rejudgeStanding();
        return;
      case 'roundComplete': {
        this.animating = true;
        this.sounds.fanfare();
        for (const t of this.tiles) t.setTarget(false);
        this.diagram.highlight(null);
        this.time.addEvent({
          delay: 220,
          repeat: 8,
          callback: () =>
            this.confetti.explode(
              30,
              Phaser.Math.Between(200, GAME_WIDTH - 200),
              Phaser.Math.Between(HUD_HEIGHT + 60, GAME_HEIGHT - 200),
            ),
        });
        await this.knappis.dance();
        for (const next of this.rules.advance()) void this.render(next);
        return;
      }
      case 'newRound': {
        this.stars.setStars(0);
        await this.refreshTiles(e.tiles);
        this.animating = false;
        this.showTarget(e.target);
        return;
      }
    }
  }

  private showTarget(face: FaceButton | null): void {
    for (const t of this.tiles) t.setTarget(t.face === face);
    this.diagram.highlight(face);
    this.targetBadge.setVisible(face !== null);
    if (face === null) return;
    const style = this.theme.buttons[face];
    this.targetLabel.setText(style.label).setColor(style.colourCss);
    this.tweens.add({
      targets: this.targetBadge,
      scale: { from: 1.3, to: 1 },
      duration: 400,
      ease: 'Back.easeOut',
    });
  }

  /** Re-draw attention to the badge and the target tile. */
  private flashTarget(): void {
    this.tweens.add({
      targets: this.targetBadge,
      scale: { from: 1.25, to: 1 },
      duration: 350,
      ease: 'Back.easeOut',
    });
  }

  /** Between rounds: a quick bounce, and re-label if the rules shuffled. */
  private async refreshTiles(faces: readonly FaceButton[]): Promise<void> {
    this.tiles.forEach((t, i) => {
      t.setFace(faces[i] ?? 'A');
      t.setStanding('off');
    });
    this.standingOn = null;
    await new Promise<void>((resolve) =>
      this.tweens.add({
        targets: this.tiles,
        scale: { from: 0.8, to: 1 },
        duration: 450,
        ease: 'Back.easeOut',
        onComplete: () => resolve(),
      }),
    );
  }

  private tileFor(face: FaceButton): Tile | undefined {
    return this.tiles.find((t) => t.face === face);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  private exposeDebug(): void {
    setDebug({
      scene: 'Play',
      state: () => this.rules.state,
      teleport: (x, y) => {
        this.knappis.setPosition(x, y);
        this.updateStanding();
      },
      tilePosition: (face) => {
        const t = this.tileFor(face as FaceButton);
        return t ? { x: t.x, y: t.y } : null;
      },
      avatar: () => ({ x: this.knappis.x, y: this.knappis.y }),
      sound: () => ({ enabled: this.sounds.enabled, unlocked: this.sounds.unlocked }),
      settings: () => ({ mode: this.mode, walkSpeed: this.walkSpeed }),
      paint: () => ({
        splats: this.paint?.splats ?? 0,
        footprints: this.footprints?.count ?? 0,
      }),
      lamp: () => ({
        angle: this.lookAngle,
        lit: this.fireflies?.litCount ?? 0,
        fireflies: this.fireflies?.positions ?? [],
      }),
    });
  }
}

import Phaser from 'phaser';
import { Sounds } from '../audio/Sounds';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { setDebug } from '../debug';
import type { FaceButton } from '../input/buttons';
import { InputService } from '../input/InputService';
import { Knappis } from '../entities/Knappis';
import { setupCamera } from '../render';
import { FindTheButton } from '../rules/FindTheButton';
import type { RulesEvent } from '../rules/types';
import { addText } from '../text';
import type { SymbolTheme } from '../themes/types';
import { xboxTheme } from '../themes/xbox';
import { GamepadDiagram } from '../ui/GamepadDiagram';
import { SoundToggle } from '../ui/SoundToggle';
import { StarRow } from '../ui/StarRow';
import { Tile } from '../ui/Tile';

/** Pixels per second at full stick deflection. Slow on purpose. */
const WALK_SPEED = 230;

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
const PAD_SPREAD = 192;

/**
 * Mode 1: "Hitta knappen". Reads input, feeds the rules, renders events.
 * All decisions about what counts as correct live in `FindTheButton`.
 */
export class PlayScene extends Phaser.Scene {
  private theme: SymbolTheme = xboxTheme;
  private rules!: FindTheButton;
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
  private standingOn: Tile | null = null;
  private animating = false;

  constructor() {
    super('Play');
  }

  create(): void {
    setupCamera(this);
    this.rules = new FindTheButton({ starsPerRound: 5 });
    this.input2 = new InputService(this);
    this.sounds = (this.registry.get('sounds') as Sounds | undefined) ?? new Sounds();

    this.drawRoom();
    this.buildHud();

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

  private buildHud(): void {
    this.stars = new StarRow(this, 230, HUD_HEIGHT / 2, this.rules.state.starsPerRound);

    this.targetBadge = this.add.container(GAME_WIDTH / 2, HUD_HEIGHT / 2);
    const halo = this.add.circle(0, 0, 60, 0xffffff, 0.6);
    this.targetDisc = this.add.circle(0, 0, 50, 0x1d1d22, 1);
    this.targetLabel = addText(this, 0, 3, '', { fontSize: '64px', fontStyle: 'bold' });
    this.targetBadge.add([halo, this.targetDisc, this.targetLabel]);
    this.tweens.add({
      targets: halo,
      scale: { from: 1, to: 1.15 },
      alpha: { from: 0.6, to: 0.2 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.diagram = new GamepadDiagram(this, GAME_WIDTH - 120, HUD_HEIGHT / 2, this.theme, 0.8);

    this.soundToggle = new SoundToggle(this, GAME_WIDTH - 40, GAME_HEIGHT - 40, this.sounds);
  }

  override update(_time: number, delta: number): void {
    const frame = this.input2.update();
    if (frame.keyboardUsed && !this.sounds.unlocked) {
      this.sounds.unlock();
      this.soundToggle.refresh();
    }

    // Movement
    const dt = delta / 1000;
    const speed = Math.hypot(frame.move.x, frame.move.y);
    if (!this.animating && speed > 0) {
      this.knappis.x = Phaser.Math.Clamp(
        this.knappis.x + frame.move.x * WALK_SPEED * dt,
        ROOM.left,
        ROOM.right,
      );
      this.knappis.y = Phaser.Math.Clamp(
        this.knappis.y + frame.move.y * WALK_SPEED * dt,
        ROOM.top,
        ROOM.bottom,
      );
    }
    this.knappis.animate(delta, this.animating ? 0 : speed, frame.move.x);
    this.knappis.setDepth(this.knappis.y);

    this.updateStanding();

    // Teach in two steps: pulse the stick until Knappis is on the right
    // tile, then pulse the button.
    this.diagram.setStick(frame.move.x, frame.move.y);
    if (!this.animating && this.rules.state.phase === 'playing') {
      this.diagram.setStep(this.standingOn?.face === this.rules.state.target ? 'press' : 'move');
    }

    for (const face of frame.justPressed) this.handlePress(face);
  }

  private updateStanding(): void {
    const now = this.tiles.find((t) => t.contains(this.knappis.x, this.knappis.y)) ?? null;
    if (now === this.standingOn) return;
    this.standingOn?.setHighlighted(false);
    this.standingOn = now;
    if (now) {
      now.setHighlighted(true);
      this.sounds.step();
    }
  }

  private handlePress(face: FaceButton): void {
    const events = this.rules.press(face, this.standingOn?.face ?? null);
    for (const e of events) void this.render(e);
  }

  private async render(e: RulesEvent): Promise<void> {
    switch (e.type) {
      case 'notOnTile':
        this.sounds.boing();
        this.flashTarget();
        await this.knappis.shrug();
        return;
      case 'wrongTile':
        this.sounds.gentleNo();
        this.tileFor(e.standingOn)?.wobble();
        this.flashTarget();
        return;
      case 'wrongButton':
        this.sounds.gentleNo();
        this.flashTarget();
        this.diagram.highlight(null);
        this.time.delayedCall(250, () => this.diagram.highlight(this.rules.state.target));
        return;
      case 'correct': {
        this.animating = true;
        this.sounds.correct();
        const tile = this.tileFor(e.button);
        tile?.pop();
        tile?.setTarget(false);
        this.confetti.explode(40, this.knappis.x, this.knappis.y - 60);
        this.stars.setStars(e.stars);
        await this.knappis.jump();
        await this.wait(250);
        this.animating = false;
        for (const next of this.rules.advance()) void this.render(next);
        return;
      }
      case 'newTarget':
        this.showTarget(e.target);
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

  private showTarget(face: FaceButton): void {
    for (const t of this.tiles) t.setTarget(t.face === face);
    this.diagram.highlight(face);
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
    this.tiles.forEach((t, i) => t.setFace(faces[i] ?? 'A'));
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
    });
  }
}

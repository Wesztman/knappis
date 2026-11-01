import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  GAME_MODES,
  WALK_SPEED_NAMES,
  saveSettings,
  type GameMode,
  type Settings,
  type WalkSpeed,
} from '../settings';
import { strings } from '../strings';
import { addText } from '../text';
import { PillButton } from './PillButton';

const CARD_W = 760;
const CARD_H = 440;

/**
 * Card with the grown-up choices: walking speed and game mode. Mouse and
 * touch only; the gamepad stays the child's. Saves on every click so
 * closing the tab never loses a choice.
 */
export class SettingsPanel extends Phaser.GameObjects.Container {
  private settings: Settings;
  private readonly speedPills: Record<WalkSpeed, PillButton>;
  private readonly modePills: Record<GameMode, PillButton>;
  private readonly modeHint: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    settings: Settings,
    private readonly onChange: (settings: Settings) => void,
  ) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
    scene.add.existing(this);
    this.settings = settings;
    this.setDepth(100).setVisible(false);

    // Dim the start screen behind the card. Nothing here is interactive:
    // inside a Container an interactive backdrop steals clicks from the
    // pills, so the scene asks `containsPoint` and closes on outside clicks.
    this.add(scene.add.rectangle(0, -20, GAME_WIDTH, GAME_HEIGHT, 0x3a2e2a, 0.35));

    const card = scene.add.graphics();
    card.fillStyle(0xfff9ec, 1);
    card.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 28);
    card.lineStyle(4, 0xe6cf98, 1);
    card.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 28);
    this.add(card);

    this.add(
      addText(scene, 0, -180, strings.settingsTitle, { fontSize: '36px', fontStyle: 'bold' }),
    );

    this.add(
      addText(scene, -CARD_W / 2 + 40, -112, strings.speedLabel, {
        fontSize: '24px',
        color: '#7a6a60',
      }).setOrigin(0, 0.5),
    );
    const speedXs: Record<WalkSpeed, number> = { slow: -200, normal: 0, fast: 200 };
    this.speedPills = Object.fromEntries(
      WALK_SPEED_NAMES.map((speed) => [
        speed,
        new PillButton(scene, speedXs[speed], -60, 180, 56, strings.speeds[speed], () =>
          this.apply({ speed }),
        ),
      ]),
    ) as Record<WalkSpeed, PillButton>;
    this.add(Object.values(this.speedPills));

    this.add(
      addText(scene, -CARD_W / 2 + 40, 18, strings.modeLabel, {
        fontSize: '24px',
        color: '#7a6a60',
      }).setOrigin(0, 0.5),
    );
    const modeXs: Record<GameMode, number> = { find: -160, free: 160 };
    this.modePills = Object.fromEntries(
      GAME_MODES.map((mode) => [
        mode,
        new PillButton(scene, modeXs[mode], 70, 300, 56, strings.modes[mode], () =>
          this.apply({ mode }),
        ),
      ]),
    ) as Record<GameMode, PillButton>;
    this.add(Object.values(this.modePills));
    this.modeHint = addText(scene, 0, 122, '', { fontSize: '20px', color: '#7a6a60' });
    this.add(this.modeHint);

    this.add(
      new PillButton(scene, 0, 185, 200, 56, strings.done, () => this.close()).setSelected(true),
    );

    this.refresh();
  }

  get isOpen(): boolean {
    return this.visible;
  }

  /** Is this world point on the card? Clicks elsewhere close the panel. */
  containsPoint(x: number, y: number): boolean {
    return Math.abs(x - this.x) <= CARD_W / 2 && Math.abs(y - this.y) <= CARD_H / 2;
  }

  open(): void {
    this.setVisible(true);
  }

  close(): void {
    this.setVisible(false);
  }

  private apply(patch: Partial<Settings>): void {
    this.settings = { ...this.settings, ...patch };
    saveSettings(this.settings);
    this.refresh();
    this.onChange(this.settings);
  }

  private refresh(): void {
    for (const speed of WALK_SPEED_NAMES)
      this.speedPills[speed].setSelected(speed === this.settings.speed);
    for (const mode of GAME_MODES) this.modePills[mode].setSelected(mode === this.settings.mode);
    this.modeHint.setText(strings.modeHints[this.settings.mode]);
  }
}

import Phaser from 'phaser';
import { Sounds } from '../audio/Sounds';
import { GAME_WIDTH } from '../config';
import { setDebug } from '../debug';
import { classifyGamepad, FACE_BUTTONS, pickGamepad } from '../input/buttons';
import { InputService } from '../input/InputService';
import { setupCamera } from '../render';
import { strings } from '../strings';
import { addText } from '../text';
import { loadSettings, type Settings } from '../settings';
import { xboxTheme } from '../themes/xbox';
import { GamepadDiagram } from '../ui/GamepadDiagram';
import { drawGear, IconButton } from '../ui/IconButton';
import { SettingsPanel } from '../ui/SettingsPanel';
import { SoundToggle } from '../ui/SoundToggle';

/**
 * "Press any button". Exists because browsers only expose a gamepad after
 * the user presses something on it, and because a click or key press is
 * needed before audio may play.
 */
export class ConnectScene extends Phaser.Scene {
  private input2!: InputService;
  private diagram!: GamepadDiagram;
  private notice!: Phaser.GameObjects.Text;
  private padStatus!: Phaser.GameObjects.Text;
  private sounds!: Sounds;
  private settingsPanel!: SettingsPanel;
  private settingsSummary!: Phaser.GameObjects.Text;
  private starting = false;
  private cycleIndex = 0;

  constructor() {
    super('Connect');
  }

  create(): void {
    setupCamera(this);
    // Scene objects live on between visits, so per-visit state is reset here,
    // not at the field declaration. (The first bug the home button found.)
    this.starting = false;
    this.input2 = new InputService(this);
    this.sounds = (this.registry.get('sounds') as Sounds | undefined) ?? new Sounds();
    this.registry.set('sounds', this.sounds);

    addText(this, GAME_WIDTH / 2, 112, strings.title, { fontSize: '120px', fontStyle: 'bold' });
    const subtitle = addText(this, GAME_WIDTH / 2, 205, strings.subtitle, {
      fontSize: '26px',
      fontStyle: 'italic',
      color: '#a3886a',
      letterSpacing: 3,
    });
    const rules = this.add.graphics();
    rules.lineStyle(2, 0xd9bf8c, 1);
    const gap = subtitle.width / 2 + 22;
    rules.lineBetween(GAME_WIDTH / 2 - gap - 70, 205, GAME_WIDTH / 2 - gap, 205);
    rules.lineBetween(GAME_WIDTH / 2 + gap, 205, GAME_WIDTH / 2 + gap + 70, 205);

    this.diagram = new GamepadDiagram(this, GAME_WIDTH / 2, 362, xboxTheme, 1.4);
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.cycleHighlight() });
    this.cycleHighlight();

    addText(this, GAME_WIDTH / 2, 530, strings.pressAnyButton, { fontSize: '34px' });
    addText(this, GAME_WIDTH / 2, 576, strings.orKeyboard, { fontSize: '24px', color: '#7a6a60' });
    addText(this, GAME_WIDTH / 2, 692, strings.footer, {
      fontSize: '20px',
      color: '#9a8a80',
    });

    // Live readout of what the browser itself reports, independent of Phaser.
    // Doubles as the debugging tool promised in the design doc.
    this.padStatus = addText(this, GAME_WIDTH / 2, 640, '', {
      fontSize: '20px',
      color: '#9a8a80',
    });
    this.time.addEvent({ delay: 250, loop: true, callback: () => this.refreshPadStatus() });
    this.refreshPadStatus();

    this.notice = addText(this, GAME_WIDTH / 2, 640, strings.nonXboxNotice, {
      fontSize: '26px',
      color: '#b3261e',
      backgroundColor: '#ffe6e3',
      padding: { x: 16, y: 8 },
    }).setVisible(false);

    new SoundToggle(this, GAME_WIDTH - 40, 40, this.sounds);

    // Grown-up settings, top-left: gear plus a one-line summary of what is set.
    const settings = loadSettings();
    this.settingsPanel = new SettingsPanel(this, settings, (s) => this.showSummary(s));
    new IconButton(this, 40, 40, drawGear, () => this.settingsPanel.open());
    this.settingsSummary = addText(this, 74, 40, '', {
      fontSize: '20px',
      color: '#9a8a80',
    }).setOrigin(0, 0.5);
    this.showSummary(settings);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.sounds.unlock();
      if (this.settingsPanel.isOpen) {
        if (!this.settingsPanel.containsPoint(pointer.worldX, pointer.worldY)) {
          this.settingsPanel.close();
        }
        return;
      }
      this.begin();
    });

    setDebug({ scene: 'Connect' });
    // Lets the Playwright smoke test know Phaser finished booting.
    this.game.canvas.dataset.ready = 'true';
  }

  private refreshPadStatus(): void {
    if (!window.isSecureContext) {
      this.padStatus.setText(strings.padInsecure).setColor('#b3261e');
      return;
    }
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    const live = pickGamepad(pads);
    if (!live) {
      this.padStatus.setText(strings.padNone).setColor('#9a8a80');
      return;
    }
    const others = Array.from(pads).filter((p) => p && p.connected && p !== live).length;
    const kind = classifyGamepad(live.id, live.mapping);
    const suffix =
      (kind === 'xbox' ? '' : ' (not Xbox-style)') +
      (others > 0 ? ` · ${others} other device${others > 1 ? 's' : ''} ignored` : '');
    this.padStatus
      .setText(`${strings.padSeen}${live.id}${suffix}`)
      .setColor(kind === 'xbox' ? '#3c8c4a' : '#b3261e');
  }

  private showSummary(settings: Settings): void {
    this.settingsSummary.setText(
      strings.settingsSummary(strings.modes[settings.mode], strings.speeds[settings.speed]),
    );
  }

  private cycleHighlight(): void {
    this.diagram.highlight(FACE_BUTTONS[this.cycleIndex % FACE_BUTTONS.length] ?? 'A');
    this.cycleIndex += 1;
  }

  override update(): void {
    if (this.starting) return;
    const frame = this.input2.update();
    if (frame.keyboardUsed) this.sounds.unlock();
    // While the grown-up has the settings open, a stray pad press must not start the game.
    if (frame.anyJustPressed && !this.settingsPanel.isOpen) this.begin();
  }

  private begin(): void {
    if (this.starting) return;
    this.starting = true;
    const pad = this.input2.padInfo();
    this.registry.set('padKind', pad?.kind ?? 'none');

    if (pad && pad.kind === 'other') {
      // Only Xbox-style pads are supported right now; warn, then let them try.
      this.notice.setVisible(true);
      this.padStatus.setVisible(false);
      this.time.delayedCall(3000, () => this.scene.start('Play'));
      return;
    }
    this.scene.start('Play');
  }
}

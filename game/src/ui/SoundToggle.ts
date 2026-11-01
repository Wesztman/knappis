import Phaser from 'phaser';
import type { Sounds } from '../audio/Sounds';
import { strings } from '../strings';
import { addText } from '../text';

/**
 * Speaker icon that shows the real state of sound and toggles it.
 *
 * Three looks:
 *  - on:      speaker with sound waves
 *  - off:     speaker with a slash (the player turned it off)
 *  - blocked: speaker greyed, pulsing, with a "click for sound" label. Sound
 *             is on but the browser has not yet allowed audio; clicking the
 *             icon is exactly the user gesture that unlocks it.
 */
export class SoundToggle extends Phaser.GameObjects.Container {
  private readonly icon: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly ring: Phaser.GameObjects.Arc;
  private pulse: Phaser.Tweens.Tween | null = null;
  private look: 'on' | 'off' | 'blocked' | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly sounds: Sounds,
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    this.ring = scene.add.circle(0, 0, 26, 0xffffff, 0.7).setVisible(false);
    this.add(this.ring);
    this.add(scene.add.circle(0, 0, 22, 0xffffff, 0.55));
    this.icon = scene.add.graphics();
    this.add(this.icon);
    this.label = addText(scene, -32, 0, strings.clickForSound, {
      fontSize: '18px',
      color: '#7a6a60',
    }).setOrigin(1, 0.5);
    this.add(this.label);

    this.setSize(52, 52);
    // Container hit areas are in local space with (0, 0) at the top-left of setSize.
    this.setInteractive(new Phaser.Geom.Circle(26, 26, 26), Phaser.Geom.Circle.Contains);
    this.input!.cursor = 'pointer';
    this.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
        if (this.sounds.unlocked) {
          this.sounds.setEnabled(!this.sounds.enabled);
        }
        // A first click while blocked only unlocks and keeps the player's choice.
        this.sounds.unlock();
        this.refresh();
      },
    );

    this.refresh();
    scene.time.addEvent({ delay: 250, loop: true, callback: () => this.refresh() });
  }

  refresh(): void {
    const look = !this.sounds.enabled ? 'off' : this.sounds.unlocked ? 'on' : 'blocked';
    if (look === this.look) return;
    this.look = look;

    const ink = look === 'blocked' ? 0xb0a090 : 0x3a2e2a;
    const g = this.icon;
    g.clear();
    // Speaker body
    g.fillStyle(ink, 1);
    g.fillRect(-12, -5, 6, 10);
    g.fillTriangle(-6, -5, 3, -12, 3, 12);
    g.fillTriangle(-6, 5, 3, 12, -6, -5);
    if (look === 'on') {
      g.lineStyle(3, ink, 1);
      g.beginPath();
      g.arc(3, 0, 7, Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45));
      g.strokePath();
      g.beginPath();
      g.arc(3, 0, 13, Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45));
      g.strokePath();
    } else if (look === 'off') {
      g.lineStyle(3, 0xe0453d, 1);
      g.lineBetween(-14, -14, 16, 14);
    }

    this.label.setVisible(look === 'blocked');
    this.pulse?.stop();
    this.pulse = null;
    this.ring
      .setVisible(look === 'blocked')
      .setScale(1)
      .setAlpha(0.7);
    if (look === 'blocked') {
      this.pulse = this.scene.tweens.add({
        targets: this.ring,
        scale: { from: 1, to: 1.5 },
        alpha: { from: 0.7, to: 0 },
        duration: 1100,
        repeat: -1,
        ease: 'Sine.easeOut',
      });
    }
  }
}

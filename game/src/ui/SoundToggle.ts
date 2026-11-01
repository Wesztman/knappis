import Phaser from 'phaser';
import type { Sounds } from '../audio/Sounds';

/**
 * Speaker icon that shows the player's sound choice and toggles it.
 *
 *  - on:   speaker with sound waves
 *  - off:  speaker alone, no waves (no slash: the missing waves are enough,
 *          and red already means the B button in this game)
 *
 * While the browser has not yet allowed audio (it needs one click or key
 * press first), the icon keeps showing the player's choice, faded a little,
 * with a soft pulsing ring. Clicking it is exactly the gesture that unlocks
 * audio. No text: the choice is what the icon says, not the browser's state.
 */
export class SoundToggle extends Phaser.GameObjects.Container {
  private readonly icon: Phaser.GameObjects.Graphics;
  private readonly ring: Phaser.GameObjects.Arc;
  private pulse: Phaser.Tweens.Tween | null = null;
  private lookKey: string | null = null;

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
    const on = this.sounds.enabled;
    const blocked = on && !this.sounds.unlocked;
    const key = `${on}:${blocked}`;
    if (key === this.lookKey) return;
    this.lookKey = key;

    const ink = blocked || !on ? 0x8a7a70 : 0x3a2e2a;
    const g = this.icon;
    g.clear();
    // Speaker body
    g.fillStyle(ink, 1);
    g.fillRect(-12, -5, 6, 10);
    g.fillTriangle(-6, -5, 3, -12, 3, 12);
    g.fillTriangle(-6, 5, 3, 12, -6, -5);
    if (on) {
      g.lineStyle(3, ink, 1);
      g.beginPath();
      g.arc(3, 0, 7, Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45));
      g.strokePath();
      g.beginPath();
      g.arc(3, 0, 13, Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45));
      g.strokePath();
    }

    this.pulse?.stop();
    this.pulse = null;
    this.ring.setVisible(blocked).setScale(1).setAlpha(0.7);
    if (blocked) {
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

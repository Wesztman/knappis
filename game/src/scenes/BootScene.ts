import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { CRISP_TEXT, setupCamera } from '../render';

/**
 * First scene. For M0 it just proves the pipeline works: a coloured room
 * and the game's name. Later it will generate placeholder textures and
 * hand over to the Connect scene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    setupCamera(this);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Knappis', {
        ...CRISP_TEXT,
        fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
        fontSize: '96px',
        color: '#3a2e2a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Lets the Playwright smoke test know Phaser finished booting.
    this.game.canvas.dataset.ready = 'true';
  }
}

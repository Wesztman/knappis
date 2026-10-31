import Phaser from 'phaser';
import { BACKGROUND_COLOUR } from './config';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './render';
import { BootScene } from './scenes/BootScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: BACKGROUND_COLOUR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
  },
  input: {
    gamepad: true,
  },
  scene: [BootScene],
};

new Phaser.Game(config);

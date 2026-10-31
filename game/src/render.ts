import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';

/**
 * How many physical pixels one game unit should get.
 *
 * The game is designed in 1280x720 units. Scale.FIT stretches the canvas
 * to fill the window, and the browser then multiplies by devicePixelRatio
 * for high-DPI screens. If the canvas only had 1280x720 real pixels, that
 * stretch would make everything blurry. So we size the canvas to the
 * physical pixel count instead and zoom the camera back to 1280x720 units.
 *
 * Capped so a huge 4K window does not create an enormous canvas.
 */
export const RENDER_SCALE = computeRenderScale();

function computeRenderScale(): number {
  const dpr = window.devicePixelRatio || 1;
  const fit = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
  const scale = dpr * Math.max(1, fit);
  return Math.min(3, Math.round(scale * 100) / 100);
}

/** Canvas size in physical pixels. */
export const CANVAS_WIDTH = Math.round(GAME_WIDTH * RENDER_SCALE);
export const CANVAS_HEIGHT = Math.round(GAME_HEIGHT * RENDER_SCALE);

/**
 * Call at the top of every scene's create(). Makes the camera show exactly
 * 1280x720 game units regardless of the physical canvas size.
 */
export function setupCamera(scene: Phaser.Scene): void {
  const cam = scene.cameras.main;
  cam.setZoom(RENDER_SCALE);
  cam.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
}

/** Text style defaults so glyphs are rasterised at full physical resolution. */
export const CRISP_TEXT: Phaser.Types.GameObjects.Text.TextStyle = {
  resolution: RENDER_SCALE,
};

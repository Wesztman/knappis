import { expect, test, type Page } from '@playwright/test';
import { boot, enterGame } from './helpers';

// Viewport matches the game's 16:9 design, so page pixels equal game units.
test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

const sound = (page: Page) => page.evaluate(() => window.__knappis!.sound!());

test('the speaker icon toggles sound and the choice is remembered', async ({ page }) => {
  await boot(page);
  await enterGame(page);

  // Default: on. The key press above also counts as the browser's user gesture.
  await expect.poll(async () => (await sound(page)).enabled).toBe(true);

  // Icon sits in the bottom-right corner of the room.
  await page.mouse.click(1240, 680);
  await expect.poll(async () => (await sound(page)).enabled).toBe(false);
  await page.mouse.click(1240, 680);
  await expect.poll(async () => (await sound(page)).enabled).toBe(true);

  // Turn it off, reload, and it must still be off.
  await page.mouse.click(1240, 680);
  await expect.poll(async () => (await sound(page)).enabled).toBe(false);
  await page.reload();
  await expect(page.locator('#game canvas')).toHaveAttribute('data-ready', 'true');
  await enterGame(page);
  expect((await sound(page)).enabled).toBe(false);
});

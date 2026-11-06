import { expect, type Page } from '@playwright/test';

/** Wait for Phaser to boot to the start screen. */
export async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#game canvas')).toHaveAttribute('data-ready', 'true');
}

/**
 * Press Enter on the start screen until the room is up. Headless Chromium
 * runs the game at a low frame rate and now and then drops the first key
 * press (seen on main without any game changes), so one press is a flake;
 * a child at a real screen never hits this.
 */
export async function enterGame(page: Page): Promise<void> {
  const scene = () => page.evaluate(() => window.__knappis?.scene);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.keyboard.press('Enter');
    const deadline = Date.now() + 1500;
    while (Date.now() < deadline) {
      if ((await scene()) === 'Play') return;
      await page.waitForTimeout(100);
    }
  }
  expect(await scene()).toBe('Play');
}

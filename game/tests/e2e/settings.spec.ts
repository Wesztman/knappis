import { expect, test, type Page } from '@playwright/test';

// Viewport matches the game's 16:9 design, so page pixels equal game units.
test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

const state = (page: Page) => page.evaluate(() => window.__knappis!.state!());

async function boot(page: Page) {
  await page.goto('/');
  await expect(page.locator('#game canvas')).toHaveAttribute('data-ready', 'true');
}

async function enterGame(page: Page) {
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__knappis?.scene)).toBe('Play');
}

test('the gear opens settings; speed and mode are saved and used by the game', async ({ page }) => {
  await boot(page);
  // Gear sits top-left on the start screen.
  await page.mouse.click(40, 40);
  // Card is centred at (640, 380): speed pills on row y=320, mode pills on y=450
  // (find 400, free 640, paint 880), Done at y=565.
  await page.mouse.click(440, 320); // Slow
  await page.mouse.click(640, 450); // Free play
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('knappis.settings')))
    .toBe(JSON.stringify({ speed: 'slow', mode: 'free' }));

  // While the panel is open a key press must not start the game.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__knappis?.scene)).toBe('Connect');

  await page.mouse.click(640, 565); // Done
  await enterGame(page);
  const settings = await page.evaluate(() => window.__knappis!.settings!());
  expect(settings).toEqual({ mode: 'free', walkSpeed: 100 });
  expect((await state(page)).target).toBeNull();

  // The home button (top-left in the room) goes back to the start screen,
  // and the game must start again from there without a page reload.
  await page.mouse.click(40, 40);
  await expect.poll(() => page.evaluate(() => window.__knappis?.scene)).toBe('Connect');
  await enterGame(page);
  expect((await state(page)).stars).toBe(0);
  // Input must work on the second visit too (free play: stand on B, press B).
  await page.evaluate(() => {
    const pos = window.__knappis!.tilePosition!('B')!;
    window.__knappis!.teleport!(pos.x, pos.y);
  });
  await page.keyboard.press('B');
  await expect.poll(async () => (await state(page)).stars, { timeout: 5000 }).toBe(1);
});

test("free play: any pad counts and the pad's own button is the right one", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('knappis.settings', JSON.stringify({ speed: 'normal', mode: 'free' })),
  );
  await boot(page);
  await enterGame(page);

  await page.evaluate(() => {
    const pos = window.__knappis!.tilePosition!('B')!;
    window.__knappis!.teleport!(pos.x, pos.y);
  });
  await page.keyboard.press('A');
  await page.waitForTimeout(300);
  expect((await state(page)).stars).toBe(0);

  await page.keyboard.press('B');
  await expect.poll(async () => (await state(page)).stars, { timeout: 5000 }).toBe(1);
  await page.screenshot({ path: 'test-results/free-play.png' });
});

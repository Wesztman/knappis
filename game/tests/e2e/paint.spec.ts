import { expect, test, type Page } from '@playwright/test';
import { boot, enterGame } from './helpers';

test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

const paint = (page: Page) => page.evaluate(() => window.__knappis!.paint!());

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('knappis.settings', JSON.stringify({ speed: 'fast', mode: 'paint' })),
  );
  await boot(page);
  await enterGame(page);
});

test('paint mode has no pads; every button press leaves a splat', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  expect((await page.evaluate(() => window.__knappis!.state!())).tiles).toEqual([]);
  expect(await page.evaluate(() => window.__knappis!.tilePosition!('A'))).toBeNull();

  for (const key of ['A', 'B', 'X', 'Y']) await page.keyboard.press(key);
  await expect.poll(async () => (await paint(page)).splats).toBe(4);
  expect(errors).toEqual([]);
});

test('walking leaves footprints that fade away', async ({ page }) => {
  expect((await paint(page)).footprints).toBe(0);
  // Headless Chromium runs slowly, so walk by teleporting in step-sized hops.
  for (let i = 1; i <= 4; i += 1) {
    await page.evaluate((x) => window.__knappis!.teleport!(x, 500), 400 + i * 50);
    await page.waitForTimeout(100);
  }
  expect((await paint(page)).footprints).toBeGreaterThan(0);
  await expect.poll(async () => (await paint(page)).footprints, { timeout: 6000 }).toBe(0);
});

test('going home and back starts with a clean sheet', async ({ page }) => {
  await page.keyboard.press('A');
  await expect.poll(async () => (await paint(page)).splats).toBe(1);
  await page.mouse.click(40, 40); // home
  await expect.poll(() => page.evaluate(() => window.__knappis?.scene)).toBe('Connect');
  await enterGame(page);
  expect((await paint(page)).splats).toBe(0);
});

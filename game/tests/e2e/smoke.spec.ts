import { expect, test, type Page } from '@playwright/test';
import { boot, enterGame } from './helpers';

// Mimic a typical laptop: 150% Windows scaling on a 1920x1080 display.
test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test('game boots to the connect screen without console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  const canvas = page.locator('#game canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await page.screenshot({ path: 'test-results/connect.png' });

  // Canvas must have real pixels for every physical pixel it covers.
  const size = await canvas.evaluate((c: HTMLCanvasElement) => ({
    width: c.width,
    cssWidth: c.clientWidth,
    dpr: window.devicePixelRatio,
  }));
  expect(size.width).toBeGreaterThanOrEqual(Math.floor(size.cssWidth * size.dpr) - 1);

  expect(await page.evaluate(() => window.__knappis?.scene)).toBe('Connect');
  expect(errors).toEqual([]);
});

test('a key press starts the game', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page);
  await enterGame(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/play.png' });
  expect(errors).toEqual([]);
});

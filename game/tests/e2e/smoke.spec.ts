import { expect, test } from '@playwright/test';

// Mimic a typical laptop: 150% Windows scaling on a 1920x1080 display.
test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });

test('game boots without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  const canvas = page.locator('#game canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await page.screenshot({ path: 'test-results/boot.png' });

  // Canvas must have real pixels for every physical pixel it covers.
  const size = await canvas.evaluate((c: HTMLCanvasElement) => ({
    width: c.width,
    height: c.height,
    cssWidth: c.clientWidth,
    dpr: window.devicePixelRatio,
  }));
  expect(size.width).toBeGreaterThanOrEqual(Math.floor(size.cssWidth * size.dpr) - 1);

  expect(errors).toEqual([]);
});

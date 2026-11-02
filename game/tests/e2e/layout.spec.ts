import { expect, test } from '@playwright/test';

// A tall window forces letterboxing above and below the 16:9 canvas.
test.use({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });

test('canvas is centred with equal letterbox bars', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('#game canvas');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const top = box!.y;
  const bottom = 900 - (box!.y + box!.height);
  expect(Math.abs(top - bottom)).toBeLessThanOrEqual(2);
  expect(top).toBeGreaterThan(50);
});

test('a GitHub link sits in the bottom-right corner above the canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game canvas')).toHaveAttribute('data-ready', 'true');
  const link = page.locator('#source-link');
  await expect(link).toHaveAttribute('href', 'https://github.com/Wesztman/knappis');
  await expect(link).toHaveAttribute('target', '_blank');
  const box = await link.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x + box!.width).toBeGreaterThan(1000 - 20);
  expect(box!.y + box!.height).toBeGreaterThan(900 - 20);
});

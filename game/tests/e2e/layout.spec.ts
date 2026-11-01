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

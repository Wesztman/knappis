import { expect, test, type Page } from '@playwright/test';
import { boot, enterGame } from './helpers';

test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

const lamp = (page: Page) => page.evaluate(() => window.__knappis!.lamp!());

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('knappis.settings', JSON.stringify({ speed: 'normal', mode: 'lamp' })),
  );
  await boot(page);
  await enterGame(page);
});

test('the beam follows the look keys and keeps its direction when let go', async ({ page }) => {
  expect((await page.evaluate(() => window.__knappis!.state!())).tiles).toEqual([]);
  await page.keyboard.down('J'); // look left
  await expect.poll(async () => Math.abs((await lamp(page)).angle)).toBeCloseTo(Math.PI, 2);
  await page.keyboard.up('J');
  await page.waitForTimeout(300);
  expect(Math.abs((await lamp(page)).angle)).toBeCloseTo(Math.PI, 2);
});

test('a firefly lights up when the beam reaches it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const { fireflies } = await lamp(page);
  expect(fireflies.length).toBeGreaterThan(0);
  const fly = fireflies[0]!;
  // Stand west of it, out of the halo, with the beam pointing right (the default).
  await page.evaluate(({ x, y }) => window.__knappis!.teleport!(x, y), {
    x: fly.x - 180,
    y: fly.y + 30,
  });
  await expect.poll(async () => (await lamp(page)).lit, { timeout: 3000 }).toBeGreaterThan(0);
  // Any button flares the lamp; nothing should break.
  await page.keyboard.press('A');
  await page.waitForTimeout(200);
  expect(errors).toEqual([]);
});

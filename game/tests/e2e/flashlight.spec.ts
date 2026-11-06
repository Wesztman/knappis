import { expect, test, type Page } from '@playwright/test';
import { boot, enterGame } from './helpers';

test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

const flashlight = (page: Page) => page.evaluate(() => window.__knappis!.flashlight!());

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'knappis.settings',
      JSON.stringify({ speed: 'normal', mode: 'flashlight' }),
    ),
  );
  await boot(page);
  await enterGame(page);
});

test('the beam follows the look keys and keeps its direction when let go', async ({ page }) => {
  expect((await page.evaluate(() => window.__knappis!.state!())).tiles).toEqual([]);
  await page.keyboard.down('J'); // look left
  // The beam swings towards the stick rather than snapping, and headless
  // game time runs slow, so allow it a while and a little slack.
  await expect
    .poll(async () => Math.abs((await flashlight(page)).angle), { timeout: 10_000 })
    .toBeGreaterThan(Math.PI - 0.1);
  await page.keyboard.up('J');
  const atRelease = Math.abs((await flashlight(page)).angle);
  await page.waitForTimeout(500);
  // Still pointing left: it may settle further, but never swings back.
  expect(Math.abs((await flashlight(page)).angle)).toBeGreaterThanOrEqual(atRelease - 0.01);
});

test('a firefly lights up when the beam reaches it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const { fireflies } = await flashlight(page);
  expect(fireflies.length).toBeGreaterThan(0);
  const fly = fireflies[0]!;
  // Stand west of it, out of the halo, with the beam pointing right (the default).
  await page.evaluate(({ x, y }) => window.__knappis!.teleport!(x, y), {
    x: fly.x - 180,
    y: fly.y + 30,
  });
  await expect.poll(async () => (await flashlight(page)).lit, { timeout: 3000 }).toBeGreaterThan(0);
  // Any button flares the lamp; nothing should break.
  await page.keyboard.press('A');
  await page.waitForTimeout(200);
  expect(errors).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

async function startGame(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/');
  await expect(page.locator('#game canvas')).toHaveAttribute('data-ready', 'true');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__knappis?.scene)).toBe('Play');
  return errors;
}

const state = (page: Page) => page.evaluate(() => window.__knappis!.state!());

async function standOn(page: Page, face: string) {
  await page.evaluate((f) => {
    const pos = window.__knappis!.tilePosition!(f)!;
    window.__knappis!.teleport!(pos.x, pos.y);
  }, face);
}

test('arrow keys move Knappis and the room clamps movement', async ({ page }) => {
  const errors = await startGame(page);
  const before = await page.evaluate(() => window.__knappis!.avatar!());
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(800);
  await page.keyboard.up('ArrowRight');
  const after = await page.evaluate(() => window.__knappis!.avatar!());
  // Headless Chromium runs at a low frame rate, so only assert direction and some distance.
  expect(after.x).toBeGreaterThan(before.x + 20);
  expect(after.y).toBeCloseTo(before.y, 0);

  // Put Knappis just inside the right wall and keep walking: must not leave the room.
  await page.evaluate(() => window.__knappis!.teleport!(1200, 470));
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(800);
  await page.keyboard.up('ArrowRight');
  const clamped = await page.evaluate(() => window.__knappis!.avatar!());
  expect(clamped.x).toBeLessThanOrEqual(1210);
  expect(clamped.x).toBeGreaterThanOrEqual(1200);
  expect(errors).toEqual([]);
});

test('pressing off a tile or on the wrong tile gives no star', async ({ page }) => {
  const errors = await startGame(page);
  const s0 = await state(page);
  await page.keyboard.press(s0.target);
  await page.waitForTimeout(300);
  expect((await state(page)).stars).toBe(0);

  const other = ['A', 'B', 'X', 'Y'].find((b) => b !== s0.target)!;
  await standOn(page, other);
  await page.keyboard.press(other);
  await page.waitForTimeout(300);
  expect((await state(page)).stars).toBe(0);
  expect(errors).toEqual([]);
});

test('standing on the target and pressing it earns stars and completes a round', async ({
  page,
}) => {
  const errors = await startGame(page);
  const starsPerRound = (await state(page)).starsPerRound;

  for (let i = 1; i <= starsPerRound; i++) {
    const s = await state(page);
    expect(s.phase).toBe('playing');
    await standOn(page, s.target);
    await page.keyboard.press(s.target);
    // Input is handled on the next game frame; wait for it rather than reading at once.
    await expect.poll(async () => (await state(page)).stars, { timeout: 5000 }).toBe(i);
    if (i === 1) {
      await page.waitForTimeout(200);
      await page.screenshot({ path: 'test-results/celebrate.png' });
    }
    if (i < starsPerRound) {
      await expect.poll(async () => (await state(page)).phase, { timeout: 5000 }).toBe('playing');
    }
  }

  await expect.poll(async () => (await state(page)).phase, { timeout: 5000 }).toBe('roundComplete');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/round-complete.png' });
  await expect.poll(async () => (await state(page)).round, { timeout: 8000 }).toBe(2);
  const fresh = await state(page);
  expect(fresh.stars).toBe(0);
  expect(fresh.phase).toBe('playing');
  expect(errors).toEqual([]);
});

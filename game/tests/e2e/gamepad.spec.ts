import { expect, test, type Page } from '@playwright/test';

/**
 * Playwright cannot drive a real gamepad, so we install a fake one behind
 * navigator.getGamepads() that mimics an Xbox pad with the standard mapping.
 * Phaser polls that function every frame, so this exercises the real
 * Phaser -> InputService -> scene path.
 */
const FAKE_PAD = `
  (() => {
    const pad = {
      id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 02fd)',
      index: 0,
      connected: false,
      mapping: 'standard',
      timestamp: 0,
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
    };
    window.__pad = {
      connect() { pad.connected = true; pad.timestamp = performance.now(); },
      press(i, down) {
        pad.buttons[i] = { pressed: down, touched: down, value: down ? 1 : 0 };
        pad.timestamp = performance.now();
      },
      axes(x, y) { pad.axes = [x, y, 0, 0]; pad.timestamp = performance.now(); },
    };
    navigator.getGamepads = () => (pad.connected ? [pad, null, null, null] : [null, null, null, null]);
  })();
`;

type PadApi = {
  connect(): void;
  press(i: number, down: boolean): void;
  axes(x: number, y: number): void;
};
const pad = (page: Page, fn: (p: PadApi) => void) =>
  page.evaluate(fn, undefined as never) as unknown as Promise<void>;

async function tap(page: Page, index: number) {
  await page.evaluate((i) => (window as unknown as { __pad: PadApi }).__pad.press(i, true), index);
  await page.waitForTimeout(120);
  await page.evaluate((i) => (window as unknown as { __pad: PadApi }).__pad.press(i, false), index);
  await page.waitForTimeout(120);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(FAKE_PAD);
});

test('an Xbox-style gamepad starts the game and plays a round', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/');
  await expect(page.locator('#game canvas')).toHaveAttribute('data-ready', 'true');

  await page.evaluate(() => (window as unknown as { __pad: PadApi }).__pad.connect());
  await page.waitForTimeout(300);

  // A (index 0) starts the game.
  await tap(page, 0);
  await expect.poll(() => page.evaluate(() => window.__knappis?.scene)).toBe('Play');

  // Left stick moves Knappis right.
  const before = await page.evaluate(() => window.__knappis!.avatar!());
  await page.evaluate(() => (window as unknown as { __pad: PadApi }).__pad.axes(1, 0));
  await page.waitForTimeout(800);
  await page.evaluate(() => (window as unknown as { __pad: PadApi }).__pad.axes(0, 0));
  const after = await page.evaluate(() => window.__knappis!.avatar!());
  expect(after.x).toBeGreaterThan(before.x + 20);

  // Small stick wobble inside the dead zone must not move.
  const still = await page.evaluate(() => window.__knappis!.avatar!());
  await page.evaluate(() => (window as unknown as { __pad: PadApi }).__pad.axes(0.15, 0.1));
  await page.waitForTimeout(400);
  await page.evaluate(() => (window as unknown as { __pad: PadApi }).__pad.axes(0, 0));
  const stillAfter = await page.evaluate(() => window.__knappis!.avatar!());
  expect(stillAfter.x).toBeCloseTo(still.x, 0);

  // Stand on the target tile and press the matching face button.
  const s = await page.evaluate(() => window.__knappis!.state!());
  await page.evaluate((f) => {
    const pos = window.__knappis!.tilePosition!(f)!;
    window.__knappis!.teleport!(pos.x, pos.y);
  }, s.target);
  const index = { A: 0, B: 1, X: 2, Y: 3 }[s.target as 'A' | 'B' | 'X' | 'Y'];
  await tap(page, index);
  expect((await page.evaluate(() => window.__knappis!.state!())).stars).toBe(1);
  expect(errors).toEqual([]);
  void pad;
});

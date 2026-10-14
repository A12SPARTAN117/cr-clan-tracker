import { expect, test } from '@playwright/test';
import { CLAN, noHorizontalScroll, watchErrors } from './helpers';

/** Every main page loads, shows its heading, logs no errors and never scrolls sideways. */
const ROUTES = [
  '/',
  '/decks',
  '/decks?mode=ladder',
  '/players',
  '/clans',
  '/my-clan',
  '/leaderboards',
  '/cards',
  '/cards/hog-rider',
  '/news',
  '/search?q=rosa',
  `/clan/${CLAN}`,
  `/clan/${CLAN}/manage`,
];

for (const route of ROUTES) {
  test(`loads ${route}`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1:visible').first()).toBeVisible({ timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {});
    await noHorizontalScroll(page);
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

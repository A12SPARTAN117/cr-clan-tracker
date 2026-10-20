import { expect, test, type Page } from '@playwright/test';
import { CLAN, watchErrors } from './helpers';

/**
 * Pages must sit still once loaded: no reload loops, no polling, no refetching. This is the check
 * that catches a page "refreshing every second". Also: typing in a search box costs one lookup,
 * not one per key, and retyping an answer we already have costs none.
 */

/** Records what a page does after it has finished loading. */
function watchIdle(page: Page) {
  const seen = { navigations: 0, documents: 0, api: [] as string[], data: 0 };
  let on = false;
  page.on('framenavigated', (f) => on && f === page.mainFrame() && seen.navigations++);
  page.on('request', (r) => {
    if (!on) return;
    const u = r.url();
    if (/_next\/webpack-hmr|__nextjs|\/_next\/hmr/.test(u)) return; // dev-server plumbing
    if (r.resourceType() === 'document') seen.documents++;
    else if (u.includes('/api/')) seen.api.push(new URL(u).pathname);
    else if (u.includes('_rsc=') && r.headers()['next-router-prefetch'] !== '1') seen.data++;
  });
  return { seen, start: () => (on = true) };
}

const PAGES = ['/', '/players', '/clans', '/decks', '/leaderboards', '/cards', '/news', '/help', '/support', `/clan/${CLAN}`];

for (const route of PAGES) {
  test(`${route} sits still once loaded`, async ({ page }) => {
    const errors = watchErrors(page);
    const w = watchIdle(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {});
    w.start();
    await page.waitForTimeout(6000);
    expect(w.seen.navigations, 'page reloaded or navigated by itself').toBe(0);
    expect(w.seen.documents, 'page reloaded').toBe(0);
    expect(w.seen.api, 'API calls while idle').toEqual([]);
    expect(w.seen.data, 'route data refetched while idle').toBe(0);
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('the search box asks the server once per word, and not again for a word it already has', async ({ page }) => {
  const calls: string[] = [];
  page.on('request', (r) => r.url().includes('/api/search') && calls.push(new URL(r.url()).searchParams.get('q') ?? ''));
  await page.goto('/players');
  const box = page.locator('input[role="combobox"]:visible').first();
  await box.click();
  await box.pressSequentially('rosa', { delay: 40 });
  await page.waitForTimeout(800);
  expect(calls).toEqual(['rosa']);
  // Backspace and retype: "ros" is new, "rosa" comes from the browser's cache.
  await box.press('Backspace');
  await page.waitForTimeout(600);
  await box.press('a');
  await page.waitForTimeout(800);
  expect(calls).toEqual(['rosa', 'ros']);
});

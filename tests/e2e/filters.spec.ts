import { expect, test } from '@playwright/test';
import { visible } from './helpers';

/** Filters apply as soon as they change, on a fresh page load, with no manual refresh. */
test.describe('filters refresh results immediately', () => {
  test('clans: location, type and minimum members', async ({ page }) => {
    await page.goto('/clans');
    const loc = visible(page, 'select').first();
    await expect(loc).toBeVisible({ timeout: 60_000 });
    await loc.selectOption({ label: 'South Africa' });
    await expect(page).toHaveURL(/loc=57000215/, { timeout: 30_000 });
    await expect(visible(page, 'main a[href^="/clan/"]').first()).toContainText(/South Africa/i, { timeout: 30_000 });

    await page.getByRole('button', { name: 'Invite', exact: true }).click();
    await expect(page).toHaveURL(/type=inviteOnly/);
    await expect(page.getByRole('button', { name: 'Invite', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('clans: typing a name searches without pressing Enter', async ({ page }) => {
    await page.goto('/clans');
    const box = visible(page, 'input[aria-label="Clan name or tag"]');
    await expect(box).toBeVisible({ timeout: 60_000 });
    await box.pressSequentially('rosa', { delay: 50 });
    await expect(page).toHaveURL(/q=rosa/, { timeout: 30_000 });
    await expect(page.locator('span.label:visible', { hasText: 'Clans named "rosa"' })).toBeVisible({ timeout: 30_000 });
  });

  test('decks: include and exclude cards filter the list at once', async ({ page }) => {
    await page.goto('/decks');
    const decks = visible(page, 'article[aria-label$=" deck"]');
    await expect(decks.first()).toBeVisible({ timeout: 60_000 });
    const all = await decks.count();
    const [inc, exc] = [visible(page, 'select').nth(0), visible(page, 'select').nth(1)];
    await inc.selectOption({ label: 'Hog Rider' });
    await expect.poll(() => decks.count()).toBeLessThan(all);
    for (const d of await decks.all()) await expect(d.locator('[data-card="hog-rider"]')).toHaveCount(1);
    await exc.selectOption({ label: 'The Log' });
    for (const d of await decks.all()) await expect(d.locator('[data-card="the-log"]')).toHaveCount(0);
  });

  test('search page controls work after a full load', async ({ page }) => {
    await page.goto('/search?q=rosa');
    await page.locator('button.chip:visible', { hasText: /^Clans/ }).click({ timeout: 60_000 });
    await expect(page).toHaveURL(/type=clan/);
  });
});

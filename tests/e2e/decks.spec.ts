import { expect, test } from '@playwright/test';
import { visible } from './helpers';

test.describe('home top decks', () => {
  test('decks start right under the section heading (no big gap)', async ({ page }) => {
    await page.goto('/');
    const label = page.getByText('02 · Meta decks', { exact: false });
    const firstDeck = visible(page, 'article[aria-label$=" deck"]').first();
    await expect(firstDeck).toBeVisible({ timeout: 60_000 });
    const gap = (await firstDeck.boundingBox())!.y - (await label.boundingBox())!.y;
    expect(gap).toBeLessThan(260);
  });

  test('each deck shows 8 plain card arts, no elixir badges, and a Deck stats link', async ({ page }) => {
    await page.goto('/');
    const deck = visible(page, 'article[aria-label$=" deck"]').first();
    await expect(deck).toBeVisible({ timeout: 60_000 });
    await expect(deck.locator('[data-card] img')).toHaveCount(8 + 1); // + tower troop
    await expect(deck.locator('[aria-label$="elixir"]')).toHaveCount(0);
    await expect(deck.getByRole('link', { name: /Deck stats/ })).toHaveAttribute('href', /^\/decks\//);
  });

  test('the game-mode filter switches the decks', async ({ page }) => {
    await page.goto('/');
    const group = page.getByRole('radiogroup', { name: 'Game mode' });
    await expect(group).toBeVisible({ timeout: 60_000 });
    await expect(group.getByRole('radio', { name: /Ranked/ })).toHaveAttribute('aria-checked', 'true');
    for (const name of [/Ultimate Champion/, /Ladder/, /Clan War/]) await expect(group.getByRole('radio', { name })).toBeVisible();
    const before = await visible(page, 'article[aria-label$=" deck"]').first().getAttribute('aria-label');
    await group.getByRole('radio', { name: /Ladder/ }).click();
    await expect(group.getByRole('radio', { name: /Ladder/ })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText(/^Ladder · from/)).toBeVisible();
    const after = await visible(page, 'article[aria-label$=" deck"]').first().getAttribute('aria-label');
    expect(after).not.toBe(before);
  });
});

test.describe('deck stats page', () => {
  test('opens from a deck and its numbers add up', async ({ page }) => {
    await page.goto('/decks');
    const link = visible(page, 'article[aria-label$=" deck"]').first().getByRole('link', { name: /Deck stats/ });
    await expect(link).toBeVisible({ timeout: 60_000 });
    await link.click();
    await expect(page).toHaveURL(/\/decks\/[^?]+/);
    await expect(page.getByRole('tab', { name: /Overview/ })).toBeVisible({ timeout: 60_000 });

    // Wins + draws + losses = total, and the crown results also sum to the total.
    const cells = async (label: string) => Number((await page.getByRole('row', { name: new RegExp(`^${label}\\b`) }).locator('td').nth(1).innerText()).replace(/,/g, ''));
    const [w, d, l, t] = [await cells('Wins'), await cells('Draws'), await cells('Losses'), await cells('Total')];
    expect(w + d + l).toBe(t);
    const crowns = page.locator('table').nth(1).locator('tr');
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += Number((await crowns.nth(i).locator('td').nth(2).innerText()).replace(/,/g, ''));
    expect(sum).toBe(t);

    // Tabs work.
    for (const tab of ['Players', 'Similar', 'Matchups', 'Overview']) {
      await page.getByRole('tab', { name: new RegExp(tab) }).click();
      await expect(page.getByRole('tab', { name: new RegExp(tab) })).toHaveAttribute('aria-selected', 'true');
    }
    await expect(page.locator('[data-fx="card-fan"] canvas')).toHaveCount(1);
  });

  test('old ?deck= links redirect to the stats page', async ({ page }) => {
    await page.goto('/decks');
    const href = await visible(page, 'article[aria-label$=" deck"]').first().getByRole('link', { name: /Deck stats/ }).getAttribute('href', { timeout: 60_000 });
    const key = decodeURIComponent(href!.replace('/decks/', '').split('?')[0]);
    await page.goto(`/decks?deck=${encodeURIComponent(key)}`);
    await expect(page).toHaveURL(new RegExp(`/decks/${key}`), { timeout: 30_000 });
  });
});

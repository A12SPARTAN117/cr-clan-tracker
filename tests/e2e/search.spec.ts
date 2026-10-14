import { expect, test } from '@playwright/test';
import { api, CLAN, enc, HAS_KEY, visible } from './helpers';

test.describe('search', () => {
  test.skip(!HAS_KEY, 'needs CR_API_KEY');

  test('home search suggests clans by name and opens the results page', async ({ page }) => {
    const clan = await api<{ name: string }>(`/clans/${enc(CLAN)}`);
    await page.goto('/');
    const box = visible(page, 'input[role="combobox"]').first();
    await box.click();
    await box.pressSequentially(clan.name, { delay: 40 });
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list).toBeVisible({ timeout: 30_000 });
    await expect(list.getByText(`#${CLAN}`, { exact: false })).toBeVisible();
    await box.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/search\\?q=${encodeURIComponent(clan.name)}`));
    await expect(visible(page, `a[href="/clan/${CLAN}"]`).first()).toBeVisible({ timeout: 60_000 });
  });

  test('a clan tag opens the clan', async ({ page }) => {
    await page.goto('/');
    const box = visible(page, 'input[role="combobox"]').first();
    await box.click();
    await box.fill(`#${CLAN}`);
    await box.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/clan/${CLAN}$`), { timeout: 60_000 });
  });

  test('the players page searches players, not clans', async ({ page }) => {
    const clan = await api<{ memberList: { tag: string; name: string }[] }>(`/clans/${enc(CLAN)}`);
    // Make sure the directory knows this clan's members, then search one by name.
    await page.goto(`/clan/${CLAN}`);
    await expect(page.locator('h1:visible')).toBeVisible({ timeout: 60_000 });
    const m = clan.memberList[0];
    await page.goto('/players');
    const box = visible(page, 'input[role="combobox"]').first();
    await box.fill(m.name);
    await box.press('Enter');
    // Results stay on the players page and only list players.
    await expect(page).toHaveURL(/\/players\?q=/);
    await expect(visible(page, `a[href="/player/${m.tag.replace('#', '')}"]`).first()).toBeVisible({ timeout: 60_000 });
    await expect(visible(page, 'a[href^="/clan/"]')).toHaveCount(0);
  });

  test('my clan searches clans and opens their dashboard', async ({ page }) => {
    const clan = await api<{ name: string }>(`/clans/${enc(CLAN)}`);
    await page.goto('/my-clan');
    const box = visible(page, 'input[role="combobox"]').first();
    await box.fill(clan.name);
    await box.press('Enter');
    await expect(page).toHaveURL(/\/search\?.*type=clan.*then=manage/);
    await expect(visible(page, `a[href="/clan/${CLAN}/manage"]`).first()).toBeVisible({ timeout: 60_000 });
  });

  test('the clans page follows a new ?q= instead of the previous search', async ({ page }) => {
    await page.goto('/clans?q=nrt');
    await expect(visible(page, 'input[aria-label="Clan name or tag"]')).toHaveValue('nrt', { timeout: 60_000 });
    // Leave and come back with a different query through client-side navigation.
    await page.goto('/search?q=rosa&type=clan');
    const filter = page.getByRole('link', { name: /Filter these clans/ });
    await expect(filter).toBeVisible({ timeout: 60_000 });
    await filter.click();
    await expect(page).toHaveURL(/\/clans\?q=rosa/);
    await expect(visible(page, 'input[aria-label="Clan name or tag"]')).toHaveValue('rosa');
    await page.waitForTimeout(1500); // longer than the search debounce
    await expect(page).toHaveURL(/\/clans\?q=rosa/);
    await expect(page.locator('span.label:visible', { hasText: 'Clans named "rosa"' })).toBeVisible();
  });
});

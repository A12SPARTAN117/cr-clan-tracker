import { expect, test } from '@playwright/test';
import { api, CLAN, enc, fmt, HAS_KEY } from './helpers';
import type { Clan } from '../../src/lib/cr/types';

test.describe('compare', () => {
  test.skip(!HAS_KEY, 'needs CR_API_KEY');

  test('compares two clans with the API numbers and highlights the leader', async ({ page }) => {
    const top = await api<{ items: { tag: string }[] }>('/locations/global/rankings/clanwars?limit=1');
    const other = top.items[0].tag.replace('#', '');
    const [a, b] = await Promise.all([api<Clan>(`/clans/${enc(CLAN)}`), api<Clan>(`/clans/${enc(other)}`)]);
    await page.goto(`/compare?type=clan&tags=${CLAN},${other}`);
    const row = page.getByRole('row', { name: /War trophies/ });
    await expect(row).toContainText(fmt(a.clanWarTrophies), { timeout: 60_000 });
    await expect(row).toContainText(fmt(b.clanWarTrophies));
    if (a.clanWarTrophies !== b.clanWarTrophies) await expect(row.locator('td[data-lead="true"]')).toHaveCount(1);
  });

  test('adds a player from the search box and removes one', async ({ page }) => {
    const c = await api<Clan>(`/clans/${enc(CLAN)}`);
    const [m1, m2] = c.memberList.map((m) => m.tag.replace('#', ''));
    await page.goto(`/compare?type=player&tags=${m1}`);
    const box = page.locator('input[role="combobox"]:visible').first();
    await box.fill(`#${m2}`);
    await box.press('Enter');
    await expect(page).toHaveURL(new RegExp(`tags=${m1}%2C${m2}|tags=${m1},${m2}`), { timeout: 60_000 });
    await expect(page.getByRole('row', { name: /Collection level/ })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: /^Remove / }).first().click();
    await expect(page).not.toHaveURL(new RegExp(m1));
  });
});

import { expect, test } from '@playwright/test';
import type { Clan, CurrentRiverRace, Player, PolRankedPlayer } from '../../src/lib/cr/types';
import { api, CLAN, enc, fmt, HAS_KEY, visible } from './helpers';

/** What the browser shows must match the raw Clash Royale API. */
test.describe('data shown on screen matches the API', () => {
  test.skip(!HAS_KEY, 'needs CR_API_KEY');

  test('clan profile header and member rows', async ({ page }) => {
    const c = await api<Clan>(`/clans/${enc(CLAN)}`);
    await page.goto(`/clan/${CLAN}`);
    const stat = (k: string) => page.locator(`[data-stat="${k}"] .sr-only`).first();
    await expect(stat('CLAN SCORE')).toHaveText(fmt(c.clanScore), { timeout: 60_000 });
    await expect(stat('WAR TROPHIES')).toHaveText(fmt(c.clanWarTrophies));
    await expect(stat('REQUIRED')).toHaveText(fmt(c.requiredTrophies));
    await expect(stat('DONATIONS / WK')).toHaveText(fmt(c.donationsPerWeek));
    await expect(stat('MEMBERS')).toHaveText(String(c.memberList.length));
    // Every stat has its icon.
    for (const k of ['CLAN SCORE', 'WAR TROPHIES', 'REQUIRED', 'DONATIONS / WK', 'MEMBERS']) await expect(page.locator(`[data-stat="${k}"] svg`)).toHaveCount(1);

    for (const m of c.memberList) {
      const row = page.locator(`tr[data-member="${m.tag.replace('#', '')}"]`);
      await expect(row).toContainText(m.name);
      await expect(row.locator('td').nth(3)).toHaveText(fmt(m.trophies));
      await expect(row.locator('td').nth(5)).toHaveText(fmt(m.donations));
      // King level comes from the player profile, never the roster's 0.
      await expect(row.locator('td').nth(4)).not.toHaveText('0');
    }
  });

  test('river race tab follows the race state', async ({ page }) => {
    const race = await api<CurrentRiverRace>(`/clans/${enc(CLAN)}/currentriverrace`);
    await page.goto(`/clan/${CLAN}`);
    await page.getByRole('tab', { name: 'War' }).click({ timeout: 60_000 });
    await expect(page.locator('[data-fx="river"]')).toBeVisible();
    const note = page.getByText(/Training battles are practice/);
    if (race.periodType === 'training') await expect(note).toBeVisible();
    else await expect(note).toHaveCount(0);
    for (const rc of race.clans) await expect(page.getByRole('link', { name: rc.name }).first()).toBeVisible();
  });

  test('dashboard never counts training decks as war', async ({ page }) => {
    const race = await api<CurrentRiverRace>(`/clans/${enc(CLAN)}/currentriverrace`);
    await page.goto(`/clan/${CLAN}/manage`);
    const tile = page.locator('text=Decks today').first().locator('xpath=..');
    await expect(tile).toBeVisible({ timeout: 90_000 });
    if (race.periodType === 'training') {
      const practice = race.clan.participants.reduce((a, p) => a + p.decksUsedToday, 0);
      await expect(tile).toContainText(`Training · ${practice} practice decks, not counted`);
    } else {
      const today = (race.clans.find((x) => x.tag === race.clan.tag) ?? race.clan).participants.reduce((a, p) => a + p.decksUsedToday, 0);
      await expect(tile.locator('.sr-only')).toHaveText(String(today));
    }
  });

  test('player header facts', async ({ page }) => {
    const c = await api<Clan>(`/clans/${enc(CLAN)}`);
    const tag = c.memberList[0].tag.replace('#', '');
    const p = await api<Player>(`/players/${enc(tag)}`);
    await page.goto(`/player/${tag}`);
    await expect(page.locator('h1:visible')).toHaveText(p.name, { timeout: 60_000 });
    // Above 14,000 the header shows the seasonal trophy road, which lives in `progress`.
    const seasonal = Object.entries(p.progress ?? {}).find(([k]) => k.startsWith('seasonal-trophy-road'))?.[1];
    const body = page.locator('body');
    await expect(body).toContainText(fmt(seasonal?.trophies ?? p.trophies));
    await expect(body).toContainText(`BEST ${fmt(seasonal?.bestTrophies ?? p.bestTrophies)}`);
  });

  test('Path of Legends top 5 on the home page, with medals', async ({ page }) => {
    const top = await api<{ items: PolRankedPlayer[] }>('/locations/global/pathoflegend/players?limit=5');
    await page.goto('/');
    for (const p of top.items) {
      const row = visible(page, `a[href="/player/${p.tag.replace('#', '')}"]`).first();
      await expect(row).toContainText(fmt(p.eloRating), { timeout: 60_000 });
      await expect(row.getByTitle(/Ultimate Champion medals/)).toBeVisible();
    }
  });
});

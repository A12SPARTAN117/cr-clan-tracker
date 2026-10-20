import { describe, expect, it } from 'vitest';
import { CARDS, cardById } from '@/lib/cards';
import { getDashboard } from '@/lib/clan/dashboard';
import { getClanProfile } from '@/lib/clan/profile';
import type { Clan, CurrentRiverRace, Player, PolRankedPlayer } from '@/lib/cr/types';
import { deckStats } from '@/lib/decks';
import { getMeta } from '@/lib/meta';
import { getPlayerProfile } from '@/lib/player/profile';
import { search } from '@/lib/search';

/**
 * Live accuracy checks: everything the site shows is recomputed through our code and compared
 * with the raw Clash Royale API. Run with `npm run test:data` (needs CR_API_KEY in .env).
 * TEST_CLAN / TEST_PLAYER pick the clan and player (default: NRT and its top member).
 */
const KEY = process.env.CR_API_KEY;
const BASE = process.env.CR_API_BASE || 'https://proxy.royaleapi.dev/v1';
const CLAN = (process.env.TEST_CLAN ?? 'Q9YLY80P').replace('#', '').toUpperCase();
const bare = (t: string) => t.replace('#', '').toUpperCase();

async function raw<T>(path: string): Promise<T> {
  const r = await fetch(BASE + path, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return (await r.json()) as T;
}
const enc = (t: string) => encodeURIComponent(`#${bare(t)}`);

describe.skipIf(!KEY)('live data accuracy', () => {
  describe('clan profile', async () => {
    const [api, ours] = await Promise.all([raw<Clan>(`/clans/${enc(CLAN)}`), getClanProfile(CLAN)]);

    it('matches the clan header numbers', () => {
      expect(ours).not.toBeNull();
      expect(ours!.name).toBe(api.name);
      expect(ours!.clanScore).toBe(api.clanScore);
      expect(ours!.clanWarTrophies).toBe(api.clanWarTrophies);
      expect(ours!.requiredTrophies).toBe(api.requiredTrophies);
      expect(ours!.donationsPerWeek).toBe(api.donationsPerWeek);
      expect(ours!.members.length).toBe(api.memberList.length);
      expect(ours!.type).toBe(api.type);
    });

    it('matches every member row', () => {
      const byTag = new Map(api.memberList.map((m) => [bare(m.tag), m]));
      for (const m of ours!.members) {
        const a = byTag.get(m.tag);
        expect(a, m.tag).toBeDefined();
        expect(m.name).toBe(a!.name);
        expect(m.role).toBe(a!.role);
        expect(m.trophies).toBe(a!.trophies);
        expect(m.donations).toBe(a!.donations);
      }
    });

    it('shows each member’s real King level (never the roster’s 0) and collection level', async () => {
      for (const m of ours!.members.slice(0, 5)) {
        const p = await raw<Player>(`/players/${enc(m.tag)}`);
        expect(m.expLevel, m.name).toBe(p.expLevel);
        expect(m.expLevel).toBeGreaterThan(0);
        expect(m.collectionLevel, m.name).toBe(p.collectionLevel ?? null);
      }
    });
  });

  describe('clan dashboard war numbers', async () => {
    const [race, d] = await Promise.all([raw<CurrentRiverRace>(`/clans/${enc(CLAN)}/currentriverrace`), getDashboard(CLAN)]);
    const ours = race.clans.find((c) => bare(c.tag) === CLAN) ?? race.clan;
    const sum = (k: 'decksUsed' | 'decksUsedToday') => ours.participants.reduce((a, p) => a + p[k], 0);

    it('reports the right river race state', () => {
      expect(d!.war).not.toBeNull();
      expect(d!.war!.kind).toBe(race.periodType === 'training' ? 'training' : race.periodType === 'colosseum' ? 'colosseum' : 'war');
    });

    it('counts decks the way the game does, ignoring training', () => {
      expect(d!.war!.decksWeek).toBe(sum('decksUsed'));
      if (race.periodType === 'training') {
        expect(d!.war!.decksToday).toBe(0);
        expect(d!.war!.trainingDecksToday).toBe(sum('decksUsedToday'));
      } else {
        expect(d!.war!.decksToday).toBe(sum('decksUsedToday'));
        expect(d!.war!.trainingDecksToday).toBe(0);
      }
    });

    it('matches fame for every clan in the race and every member', () => {
      for (const c of race.clans) expect(d!.war!.clans.find((x) => x.tag === bare(c.tag))?.fame, c.name).toBe(c.fame);
      const fames = d!.war!.clans.map((c) => c.fame);
      expect(fames).toEqual([...fames].sort((a, b) => b - a));
      const parts = new Map(ours.participants.map((p) => [bare(p.tag), p]));
      for (const m of d!.members) expect(m.fame, m.name).toBe(parts.get(m.tag)?.fame ?? 0);
    });
  });

  describe('player profile', async () => {
    const clan = await raw<Clan>(`/clans/${enc(CLAN)}`);
    const tag = bare(process.env.TEST_PLAYER ?? clan.memberList[0].tag);
    const [api, ours] = await Promise.all([raw<Player>(`/players/${enc(tag)}`), getPlayerProfile(tag)]);

    it('matches the header facts', () => {
      expect(ours).not.toBeNull();
      expect(ours!.name).toBe(api.name);
      expect(ours!.trophies).toBe(api.trophies);
      expect(ours!.bestTrophies).toBe(api.bestTrophies);
      expect(ours!.expLevel).toBe(api.expLevel);
      expect(ours!.kingTower).toBe(api.kingTowerLevel ?? null);
      expect(ours!.clan?.tag ?? null).toBe(api.clan ? bare(api.clan.tag) : null);
    });

    it('matches Path of Legends', () => {
      const cur = api.currentPathOfLegendSeasonResult;
      expect(ours!.pol.current?.league ?? null).toBe(cur?.leagueNumber ?? null);
      expect(ours!.pol.current?.rating ?? null).toBe(cur?.trophies ?? null);
    });

    it('shows the current deck in slot order with correct elixir stats', () => {
      expect(ours!.deck?.cards.map((c) => c.id)).toEqual(api.currentDeck.map((c) => c.id));
      const st = deckStats(api.currentDeck.map((c) => ({ elixir: cardById(c.id)?.elixir ?? c.elixirCost ?? null })));
      expect(ours!.deck?.avgElixir).toBeCloseTo(st.avgElixir, 10);
      expect(ours!.deck?.cycle).toBe(st.cycle);
    });
  });

  describe('meta decks', async () => {
    const meta = (await getMeta())!;

    it('builds every core mode', () => {
      expect(meta).not.toBeNull();
      for (const k of ['pol', 'uc', 'ladder', 'war', '2v2']) expect(meta.modes[k], k).toBeDefined();
      expect(meta.modes.pol.decks.length).toBeGreaterThan(0);
    });

    it('every deck’s numbers add up', () => {
      for (const k of meta.order) {
        const m = meta.modes[k];
        let games = 0;
        for (const d of m.decks) {
          games += d.games;
          expect(d.cards).toHaveLength(8);
          expect(d.wins + d.draws).toBeLessThanOrEqual(d.games);
          expect(d.crowns.reduce((a, b) => a + b, 0)).toBe(d.games);
          expect(d.crowns[3]).toBe(d.draws);
          expect(d.use).toBeCloseTo((d.games / m.sides) * 100, 8);
          expect(d.win).toBeCloseTo((d.wins / d.games) * 100, 8);
          const st = deckStats(d.cards);
          expect(d.avgElixir).toBeCloseTo(st.avgElixir, 10);
          expect(d.cycle).toBe(st.cycle);
          for (const p of d.players) expect(p.wins).toBeLessThanOrEqual(p.games);
        }
        expect(games, k).toBeLessThanOrEqual(m.sides);
        // Every side plays 8 cards.
        expect(m.cards.reduce((a, c) => a + c.games, 0), k).toBe(8 * m.sides);
      }
    });

    it('only uses known cards', () => {
      for (const k of meta.order) for (const d of meta.modes[k].decks) for (const c of d.cards) expect(cardById(c.id), `${k}: ${c.name}`).toBeDefined();
    });
  });

  describe('static card data', async () => {
    const api = await raw<{ items: { id: number; name: string; elixirCost?: number; rarity: string }[] }>('/cards');

    it('has every card in the game with the right elixir and rarity', () => {
      for (const c of api.items) {
        const ours = cardById(c.id);
        expect(ours, c.name).toBeDefined();
        if (c.elixirCost != null) expect(ours!.elixir, c.name).toBe(c.elixirCost);
        expect(ours!.rarity, c.name).toBe(c.rarity);
      }
      expect(CARDS.length).toBeGreaterThanOrEqual(api.items.length);
    });
  });

  describe('leaderboard and search', async () => {
    const top = await raw<{ items: PolRankedPlayer[] }>('/locations/global/pathoflegend/players?limit=5');

    it('Path of Legends top 5 is ranked by rating', () => {
      expect(top.items.map((p) => p.rank)).toEqual([1, 2, 3, 4, 5]);
      const r = top.items.map((p) => p.eloRating);
      expect(r).toEqual([...r].sort((a, b) => b - a));
    });

    it('finds the clan by tag and by name', async () => {
      const clan = await raw<Clan>(`/clans/${enc(CLAN)}`);
      const byTag = await search(`#${CLAN}`);
      expect(byTag.tagClan?.name).toBe(clan.name);
      const byName = await search(clan.name, 'clan');
      expect(byName.clans.some((c) => c.tag === CLAN)).toBe(true);
    });

    it('finds a top player by name', async () => {
      const p = top.items[0];
      const r = await search(p.name, 'player');
      expect(r.players.some((x) => x.tag === bare(p.tag))).toBe(true);
    });
  });
});

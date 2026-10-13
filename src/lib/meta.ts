import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getBattleLog, getPolLeaderboard } from './cr/api';
import type { Battle, BattleSide } from './cr/types';
import { cardById, slugify, type Rarity } from './cards';
import { deckKey, deckName, deckStats, toDeckCard, winConOf, type DeckCard } from './decks';

export type { DeckCard };
import { parseApiDate } from './format';

/**
 * Meta decks and card stats. The official API has no meta endpoint, so this samples the
 * battle logs of the global Path of Legends top players and aggregates every deck seen
 * (both sides of each battle) over the last 24 hours.
 */

export type MetaMode = 'pol' | 'ladder' | 'war';
export const MODE_LABEL: Record<MetaMode, string> = { pol: 'Path of Legends', ladder: 'Trophy Road', war: 'Clan War' };

export type Matchup = { vs: string; vsSlug: string; games: number; wins: number };

export type DeckStat = {
  key: string;
  name: string;
  winCon: string | null;
  cards: DeckCard[];
  tower: { slug: string; name: string; img: string | null } | null;
  games: number;
  wins: number;
  use: number;
  win: number;
  avgElixir: number;
  cycle: number;
  matchups: Matchup[];
};

export type CardStat = { id: number; slug: string; name: string; rarity: Rarity; elixir: number | null; img: string | null; games: number; wins: number; use: number; win: number; evoGames: number; heroGames: number };

export type ModeMeta = { mode: MetaMode; sides: number; decks: DeckStat[]; cards: CardStat[] };

export type MetaSnapshot = {
  generatedAt: string;
  windowHours: number;
  players: number;
  battles: number;
  modes: Record<MetaMode, ModeMeta>;
};

const MODE_OF = (b: Battle): MetaMode | null => {
  if (b.type === 'pathOfLegend') return 'pol';
  if (b.type === 'PvP' && /ladder/i.test(b.gameMode?.name ?? '')) return 'ladder';
  if (b.type === 'riverRacePvP' || b.type === 'riverRaceDuel' || b.type === 'riverRaceDuelColosseum') return 'war';
  return null;
};

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

type DeckAcc = { cards: DeckCard[]; tower: DeckStat['tower']; games: number; wins: number; vs: Map<string, { name: string; games: number; wins: number }> };
type CardAcc = { c: DeckCard; games: number; wins: number; evo: number; hero: number };

function emptyMode(): { sides: number; decks: Map<string, DeckAcc>; cards: Map<number, CardAcc> } {
  return { sides: 0, decks: new Map(), cards: new Map() };
}

export async function getMeta(sampleSize = 100): Promise<MetaSnapshot | null> {
  'use cache';
  cacheTag('meta');

  const top = await getPolLeaderboard('global', sampleSize);
  if (!top.ok || !top.data.items.length) {
    cacheLife('crError');
    return null;
  }
  const logs = await pool(top.data.items, 8, (p) => getBattleLog(p.tag.replace('#', '')));

  const windowHours = 24;
  const now = Date.now();
  const cutoff = now - windowHours * 3600_000;
  const seen = new Set<string>();
  const acc: Record<MetaMode, ReturnType<typeof emptyMode>> = { pol: emptyMode(), ladder: emptyMode(), war: emptyMode() };
  let battles = 0;

  const addSide = (m: ReturnType<typeof emptyMode>, side: BattleSide, opp: BattleSide) => {
    if (!side?.cards || side.cards.length !== 8) return;
    const won = side.crowns > opp.crowns;
    const cards = side.cards.map(toDeckCard);
    const key = deckKey(cards);
    const t = side.supportCards?.[0];
    const tower = t ? { slug: cardById(t.id)?.slug ?? slugify(t.name), name: t.name, img: t.iconUrls.medium ?? null } : null;
    const d = m.decks.get(key) ?? { cards, tower, games: 0, wins: 0, vs: new Map() };
    d.games++;
    if (won) d.wins++;
    const oppWc = winConOf(opp.cards.map(toDeckCard));
    if (oppWc) {
      const v = d.vs.get(oppWc.slug) ?? { name: oppWc.name, games: 0, wins: 0 };
      v.games++;
      if (won) v.wins++;
      d.vs.set(oppWc.slug, v);
    }
    m.decks.set(key, d);
    for (const c of cards) {
      const ca = m.cards.get(c.id) ?? { c: { ...c, evo: false, hero: false, img: cardById(c.id)?.icons.normal ?? c.img }, games: 0, wins: 0, evo: 0, hero: 0 };
      ca.games++;
      if (won) ca.wins++;
      if (c.evo) ca.evo++;
      if (c.hero) ca.hero++;
      m.cards.set(c.id, ca);
    }
    m.sides++;
  };

  for (const log of logs) {
    if (!log.ok) continue;
    for (const b of log.data) {
      const mode = MODE_OF(b);
      const t = parseApiDate(b.battleTime)?.getTime() ?? 0;
      if (!mode || t < cutoff || b.team.length !== 1 || b.opponent.length !== 1) continue;
      // The same battle shows up in both players' logs when two top players meet.
      const id = `${b.battleTime}|${[b.team[0].tag, b.opponent[0].tag].sort().join('|')}`;
      if (seen.has(id)) continue;
      seen.add(id);
      battles++;
      addSide(acc[mode], b.team[0], b.opponent[0]);
      addSide(acc[mode], b.opponent[0], b.team[0]);
    }
  }

  const build = (mode: MetaMode): ModeMeta => {
    const m = acc[mode];
    const decks: DeckStat[] = [...m.decks.entries()]
      .filter(([, d]) => d.games >= 2)
      .map(([key, d]) => {
        const wc = winConOf(d.cards);
        const st = deckStats(d.cards);
        // Show the deck in its played order: evo / hero slots first.
        return {
          key,
          name: deckName(d.cards, wc),
          winCon: wc?.slug ?? null,
          cards: d.cards,
          tower: d.tower,
          games: d.games,
          wins: d.wins,
          use: (d.games / Math.max(1, m.sides)) * 100,
          win: (d.wins / d.games) * 100,
          avgElixir: st.avgElixir,
          cycle: st.cycle,
          matchups: [...d.vs.entries()].map(([vsSlug, v]) => ({ vs: v.name, vsSlug, games: v.games, wins: v.wins })).sort((a, b) => b.games - a.games).slice(0, 8),
        };
      })
      .sort((a, b) => b.games - a.games || b.win - a.win)
      .slice(0, 60);
    const cards: CardStat[] = [...m.cards.values()]
      .map(({ c, games, wins, evo, hero }) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        rarity: c.rarity,
        elixir: c.elixir,
        img: c.img,
        games,
        wins,
        use: (games / Math.max(1, m.sides)) * 100,
        win: (wins / games) * 100,
        evoGames: evo,
        heroGames: hero,
      }))
      .sort((a, b) => b.games - a.games);
    return { mode, sides: m.sides, decks, cards };
  };

  cacheLife('hours');
  return {
    generatedAt: new Date(now).toISOString(),
    windowHours,
    players: top.data.items.length,
    battles,
    modes: { pol: build('pol'), ladder: build('ladder'), war: build('war') },
  };
}

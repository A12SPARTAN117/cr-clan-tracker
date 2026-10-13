import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getBattleLog, getPolLeaderboard } from './cr/api';
import type { ApiCard, Battle, BattleSide } from './cr/types';
import { cardById, playedAsEvo, playedAsHero, slugify, type Rarity } from './cards';
import { parseApiDate } from './format';

/**
 * Meta decks and card stats. The official API has no meta endpoint, so this samples the
 * battle logs of the global Path of Legends top players and aggregates every deck seen
 * (both sides of each battle) over the last 24 hours.
 */

export type MetaMode = 'pol' | 'ladder' | 'war';
export const MODE_LABEL: Record<MetaMode, string> = { pol: 'Path of Legends', ladder: 'Trophy Road', war: 'Clan War' };

export type DeckCard = {
  id: number;
  slug: string;
  name: string;
  rarity: Rarity;
  elixir: number | null;
  evo: boolean;
  hero: boolean;
  img: string | null;
};

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

/** Cards that win games on their own; used to name decks and group matchups. */
const WIN_CONS = [
  'golem', 'lava-hound', 'electro-giant', 'giant', 'royal-giant', 'goblin-giant', 'pekka', 'mega-knight', 'elixir-golem',
  'hog-rider', 'ram-rider', 'battle-ram', 'royal-hogs', 'balloon', 'graveyard', 'x-bow', 'mortar', 'miner',
  'goblin-barrel', 'goblin-drill', 'wall-breakers', 'three-musketeers', 'skeleton-barrel', 'sparky', 'goblin-machine',
  'royal-recruits', 'rocket', 'monk', 'boss-bandit', 'goblinstein', 'rune-giant', 'suspicious-bush', 'skeleton-king', 'mighty-miner', 'archer-queen',
  'golden-knight', 'little-prince', 'giant-skeleton', 'cannon-cart', 'phoenix', 'electro-dragon', 'prince', 'dark-prince',
];
const WIN_RANK = new Map(WIN_CONS.map((s, i) => [s, i]));

const MODE_OF = (b: Battle): MetaMode | null => {
  if (b.type === 'pathOfLegend') return 'pol';
  if (b.type === 'PvP' && /ladder/i.test(b.gameMode?.name ?? '')) return 'ladder';
  if (b.type === 'riverRacePvP' || b.type === 'riverRaceDuel' || b.type === 'riverRaceDuelColosseum') return 'war';
  return null;
};

function toDeckCard(c: ApiCard): DeckCard {
  const info = cardById(c.id);
  const evo = playedAsEvo(c.evolutionLevel);
  const hero = playedAsHero(c.evolutionLevel);
  const slug = info?.slug ?? slugify(c.name);
  return {
    id: c.id,
    slug,
    name: c.name,
    rarity: (info?.rarity ?? c.rarity) as Rarity,
    elixir: info?.elixir ?? c.elixirCost ?? null,
    evo,
    hero,
    img: (evo ? c.iconUrls.evolutionMedium : hero ? c.iconUrls.heroMedium : null) ?? c.iconUrls.medium ?? info?.icons.normal ?? null,
  };
}

function winConOf(cards: DeckCard[]): DeckCard | null {
  let best: DeckCard | null = null;
  for (const c of cards) {
    const r = WIN_RANK.get(c.slug);
    if (r != null && (best == null || r < (WIN_RANK.get(best.slug) ?? 99))) best = c;
  }
  return best;
}

/**
 * "Hog Rider · Boss Bandit": the win condition plus the most distinctive support card
 * (champion > legendary > … , heavier first). Without a win condition: two support cards.
 */
function deckName(cards: DeckCard[], wc: DeckCard | null): string {
  const order: Rarity[] = ['champion', 'legendary', 'epic', 'rare', 'common', 'tower'];
  const rest = cards
    .filter((c) => c !== wc)
    .sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity) || (b.elixir ?? 0) - (a.elixir ?? 0));
  const names = wc ? [wc.name, rest[0]?.name] : [rest[0]?.name, rest[1]?.name];
  return names.filter(Boolean).join(' · ');
}

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
    const key = cards
      .map((c) => `${c.id}${c.evo ? 'e' : ''}${c.hero ? 'h' : ''}`)
      .sort()
      .join('-');
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
        const els = d.cards.map((c) => c.elixir ?? 0);
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
          avgElixir: els.reduce((a, b) => a + b, 0) / 8,
          cycle: [...els].sort((a, b) => a - b).slice(0, 4).reduce((a, b) => a + b, 0),
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

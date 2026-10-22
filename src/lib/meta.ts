import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getBattleLog, getClan, getClanWarRankings, getPolLeaderboard } from './cr/api';
import type { BattleSide } from './cr/types';
import { cardArt, cardById, slugify, type Rarity } from './cards';
import { deckKey, deckName, deckStats, toDeckCard, winConOf, type DeckCard } from './decks';

export type { DeckCard };
import { parseApiDate } from './format';
import { pool } from './pool';
import { readSnapshot, saveSnapshot } from './snapshots';
import { CORE_MODES, modesOfBattle, type ModeInfo, type ModeKind } from './modes';
import { outcome } from './battle';

/**
 * Meta decks and card stats. The official API has no meta endpoint, so this samples the
 * battle logs of the global Path of Legends top players plus the members of the top war
 * clans, and aggregates every deck seen (both sides of each battle) per game mode. Ranked
 * modes use the last 24 hours; the thinner modes (ladder, war, events) the last 72.
 */

/** A mode key: 'pol' (Ranked), 'uc', 'ladder', 'war', '2v2' or 'ev<gameModeId>' for live events. */
export type MetaMode = string;

export type Matchup = { vs: string; vsSlug: string; games: number; wins: number };

/** A player seen with a deck; rating is their Path of Legends rating when the battle was ranked. */
export type DeckPlayer = { tag: string; name: string; rating: number | null; games: number; wins: number };

export type DeckStat = {
  key: string;
  name: string;
  winCon: string | null;
  cards: DeckCard[];
  tower: { slug: string; name: string; img?: string | null } | null;
  games: number;
  wins: number;
  draws: number;
  /** Games by crown difference, index 0 = -3 … index 6 = +3. */
  crowns: number[];
  use: number;
  win: number;
  avgElixir: number;
  cycle: number;
  matchups: Matchup[];
  /** Most active players with this deck (up to 12), highest rating first. */
  players: DeckPlayer[];
};

export type CardStat = {
  id: number;
  slug: string;
  name: string;
  rarity: Rarity;
  elixir: number | null;
  /** Only when the card table has no art for it (see cardArt). */
  img?: string | null;
  games: number;
  wins: number;
  use: number;
  win: number;
  evoGames: number;
  evoWins: number;
  heroGames: number;
  heroWins: number;
};

export type ModeMeta = { mode: MetaMode; label: string; kind: ModeKind; windowHours: number; battles: number; sides: number; decks: DeckStat[]; cards: CardStat[] };

export type MetaSnapshot = {
  generatedAt: string;
  /** Window of the ranked modes; each mode carries its own windowHours. */
  windowHours: number;
  players: number;
  battles: number;
  /** Mode keys in display order: core modes first, then live events by popularity. */
  order: MetaMode[];
  modes: Record<MetaMode, ModeMeta>;
};

const RANKED_HOURS = 24;
const OTHER_HOURS = 72;
const windowOf = (key: string) => (key === 'pol' || key === 'uc' ? RANKED_HOURS : OTHER_HOURS);


type DeckAcc = {
  cards: DeckCard[];
  tower: DeckStat['tower'];
  games: number;
  wins: number;
  draws: number;
  crowns: number[];
  vs: Map<string, { name: string; games: number; wins: number }>;
  players: Map<string, DeckPlayer>;
};
type CardAcc = { c: DeckCard; games: number; wins: number; evo: number; evoW: number; hero: number; heroW: number };

function emptyMode(): { sides: number; decks: Map<string, DeckAcc>; cards: Map<number, CardAcc> } {
  return { sides: 0, decks: new Map(), cards: new Map() };
}

/**
 * The meta every page shows: the newest snapshot the cron job stored (/api/cron/shared), so a page
 * view never calls the API for it. With no database, or before the first snapshot is stored (a
 * fresh database), it is built here once and saved.
 */
export async function getMeta(): Promise<MetaSnapshot | null> {
  'use cache';
  cacheTag('meta');
  const stored = await readSnapshot<MetaSnapshot>('meta');
  if (stored) {
    cacheLife('meta');
    return stored.data;
  }
  const built = await buildMeta();
  if (!built) {
    cacheLife('crError');
    return null;
  }
  await saveSnapshot('meta', built, new Date(built.generatedAt));
  cacheLife('hours');
  return built;
}

/**
 * Builds a fresh snapshot from about 250 battle logs. Only the cron job (and getMeta's first run
 * on an empty database) calls this.
 */
export async function buildMeta(sampleSize = 100): Promise<MetaSnapshot | null> {
  const [top, warTop] = await Promise.all([getPolLeaderboard('global', sampleSize), getClanWarRankings('global', 3)]);
  if (!top.ok || !top.data.items.length) return null;
  // Members of the top war clans play ladder, war and events far more than the ranked top 100.
  const clans = warTop.ok ? await Promise.all(warTop.data.items.map((c) => getClan(c.tag.replace('#', '')))) : [];
  const tags = [...new Set([...top.data.items.map((p) => p.tag), ...clans.flatMap((c) => (c.ok ? c.data.memberList.map((m) => m.tag) : []))])];
  // The shared API gate (cr/limiter) paces these; 10 at a time leaves room for visitors' pages.
  const logs = await pool(tags, 10, (t) => getBattleLog(t.replace('#', '')));

  const now = Date.now();
  const seen = new Set<string>();
  type Acc = ReturnType<typeof emptyMode> & { info: ModeInfo; battles: number };
  const acc = new Map<string, Acc>();
  const accFor = (info: ModeInfo): Acc => {
    let m = acc.get(info.key);
    if (!m) acc.set(info.key, (m = { ...emptyMode(), info, battles: 0 }));
    return m;
  };
  let battles = 0;

  const addSide = (m: Acc, side: BattleSide, opp: BattleSide | undefined, ranked: boolean, crowns: [number, number], result: -1 | 0 | 1) => {
    if (!side?.cards || side.cards.length !== 8) return;
    const won = result > 0;
    const diff = Math.max(-3, Math.min(3, crowns[0] - crowns[1]));
    const cards = side.cards.map(toDeckCard);
    const key = deckKey(cards);
    const t = side.supportCards?.[0];
    const tSlug = t ? (cardById(t.id)?.slug ?? slugify(t.name)) : '';
    const tImg = t?.iconUrls.medium ?? null;
    const tower = t ? { slug: tSlug, name: t.name, ...(tImg !== cardArt(tSlug) ? { img: tImg } : {}) } : null;
    const d = m.decks.get(key) ?? { cards, tower, games: 0, wins: 0, draws: 0, crowns: [0, 0, 0, 0, 0, 0, 0], vs: new Map(), players: new Map() };
    d.games++;
    if (won) d.wins++;
    if (result === 0) d.draws++;
    d.crowns[diff + 3]++;
    const pl = d.players.get(side.tag) ?? { tag: side.tag.replace('#', ''), name: side.name, rating: null, games: 0, wins: 0 };
    pl.games++;
    if (won) pl.wins++;
    // In ranked battles startingTrophies is the Path of Legends rating.
    if (ranked && side.startingTrophies) pl.rating = Math.max(pl.rating ?? 0, side.startingTrophies);
    d.players.set(side.tag, pl);
    const oppWc = opp?.cards?.length ? winConOf(opp.cards.map(toDeckCard)) : null;
    if (oppWc) {
      const v = d.vs.get(oppWc.slug) ?? { name: oppWc.name, games: 0, wins: 0 };
      v.games++;
      if (won) v.wins++;
      d.vs.set(oppWc.slug, v);
    }
    m.decks.set(key, d);
    for (const c of cards) {
      const ca = m.cards.get(c.id) ?? { c: { ...c, evo: false, hero: false, img: cardById(c.id)?.icons.normal ? undefined : (c.img ?? null) }, games: 0, wins: 0, evo: 0, evoW: 0, hero: 0, heroW: 0 };
      ca.games++;
      if (won) ca.wins++;
      if (c.evo) {
        ca.evo++;
        if (won) ca.evoW++;
      }
      if (c.hero) {
        ca.hero++;
        if (won) ca.heroW++;
      }
      m.cards.set(c.id, ca);
    }
    m.sides++;
  };

  for (const log of logs) {
    if (!log.ok) continue;
    for (const b of log.data) {
      const modes = modesOfBattle(b);
      if (!modes.length) continue;
      const t = parseApiDate(b.battleTime)?.getTime() ?? 0;
      // The same battle shows up in every participant's log when sampled players meet.
      const id = `${b.battleTime}|${[...b.team, ...b.opponent].map((x) => x.tag).sort().join('|')}`;
      if (seen.has(id)) continue;
      seen.add(id);
      let counted = false;
      for (const info of modes) {
        if (t < now - windowOf(info.key) * 3600_000) continue;
        const m = accFor(info);
        m.battles++;
        counted = true;
        const ranked = b.type === 'pathOfLegend';
        const crowns: [number, number] = [b.team[0].crowns, b.opponent[0].crowns];
        const result = outcome(b);
        for (const side of b.team) addSide(m, side, b.opponent[0], ranked, crowns, result);
        for (const side of b.opponent) addSide(m, side, b.team[0], ranked, [crowns[1], crowns[0]], -result as -1 | 0 | 1);
      }
      if (counted) battles++;
    }
  }

  const build = (key: string): ModeMeta => {
    const m = acc.get(key)!;
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
          draws: d.draws,
          crowns: d.crowns,
          use: (d.games / Math.max(1, m.sides)) * 100,
          win: (d.wins / d.games) * 100,
          avgElixir: st.avgElixir,
          cycle: st.cycle,
          matchups: [...d.vs.entries()].map(([vsSlug, v]) => ({ vs: v.name, vsSlug, games: v.games, wins: v.wins })).sort((a, b) => b.games - a.games).slice(0, 8),
          players: [...d.players.values()].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.games - a.games).slice(0, 12),
        };
      })
      .sort((a, b) => b.games - a.games || b.win - a.win)
      .slice(0, 60);
    const cards: CardStat[] = [...m.cards.values()]
      .map(({ c, games, wins, evo, evoW, hero, heroW }) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        rarity: c.rarity,
        elixir: c.elixir,
        ...(c.img !== undefined ? { img: c.img } : {}),
        games,
        wins,
        use: (games / Math.max(1, m.sides)) * 100,
        win: (wins / games) * 100,
        evoGames: evo,
        evoWins: evoW,
        heroGames: hero,
        heroWins: heroW,
      }))
      .sort((a, b) => b.games - a.games);
    return { mode: key, label: m.info.label, kind: m.info.kind, windowHours: windowOf(key), battles: m.battles, sides: m.sides, decks, cards };
  };

  // Core modes always exist (possibly empty); events need enough decks to be worth a filter.
  for (const info of CORE_MODES) accFor(info);
  const isCore = (key: string) => CORE_MODES.some((c) => c.key === key);
  const modes: Record<MetaMode, ModeMeta> = {};
  for (const key of acc.keys()) {
    const m = build(key);
    if (isCore(key) || m.decks.length >= 3) modes[key] = m;
  }
  const events = Object.values(modes)
    .filter((m) => !isCore(m.mode))
    .sort((a, b) => b.battles - a.battles)
    .map((m) => m.mode);

  return {
    generatedAt: new Date(now).toISOString(),
    windowHours: RANKED_HOURS,
    players: tags.length,
    battles,
    order: [...CORE_MODES.map((c) => c.key), ...events],
    modes,
  };
}

/** A deck by key: in the requested mode first, then any mode. */
export function findDeck(meta: MetaSnapshot, key: string, prefer: MetaMode = 'pol'): { deck: DeckStat; mode: MetaMode; rank: number } | null {
  const order = [prefer, ...meta.order.filter((m) => m !== prefer)];
  for (const mode of order) {
    const i = meta.modes[mode].decks.findIndex((d) => d.key === key);
    if (i >= 0) return { deck: meta.modes[mode].decks[i], mode, rank: i + 1 };
  }
  return null;
}

/** Decks in the same mode that share at least `min` cards (evo / hero state ignored). */
export function similarDecks(meta: MetaSnapshot, deck: DeckStat, mode: MetaMode, min = 6, limit = 6): (DeckStat & { shared: number })[] {
  const ids = new Set(deck.cards.map((c) => c.id));
  return meta.modes[mode].decks
    .filter((d) => d.key !== deck.key)
    .map((d) => ({ ...d, shared: d.cards.filter((c) => ids.has(c.id)).length }))
    .filter((d) => d.shared >= min)
    .sort((a, b) => b.shared - a.shared || b.games - a.games)
    .slice(0, limit);
}

import { CARDS, TOWER_TROOPS, cardById, cardBySlug, type CardInfo } from './cards';
import { deckKey, deckName, deckStats, winConOf, type DeckCard } from './decks';
import type { DeckStat, Matchup, MetaSnapshot } from './meta';
import type { ModeKind } from './modes';

// Deck builder logic: slots and forms, share links, and counter decks from the meta sample.
// Client-safe (no server imports), so the builder page can rank decks as you edit.

/** A filled builder slot: the card and whether it plays as its evolution or hero. */
export type Slot = { id: number; evo: boolean; hero: boolean } | null;

export const DECK_SIZE = 8;

/**
 * In the game only the first three slots take a special form: slot 1 the evolution, slot 2 the
 * hero and slot 3 either (see currentDeckCards in player/profile.ts).
 */
export function slotForms(info: Pick<CardInfo, 'hasEvolution' | 'hasHero'>, slot: number): { evo: boolean; hero: boolean } {
  if (slot === 0) return { evo: info.hasEvolution, hero: false };
  if (slot === 1) return { evo: false, hero: info.hasHero };
  if (slot === 2) return { evo: info.hasEvolution, hero: info.hasHero };
  return { evo: false, hero: false };
}

/**
 * The form a card takes when it lands in `slot`: its evolution or hero where the slot allows
 * one (slot 3 prefers the evolution, as in the game), unless `unlocked` says the player hasn't
 * unlocked it.
 */
export function defaultForm(id: number, slot: number, unlocked?: { evo: boolean; hero: boolean }): { evo: boolean; hero: boolean } {
  const info = cardById(id);
  if (!info) return { evo: false, hero: false };
  const can = slotForms(info, slot);
  const evo = can.evo && (unlocked?.evo ?? true);
  const hero = !evo && can.hero && (unlocked?.hero ?? true);
  return { evo, hero };
}

/**
 * Where a new card goes: the special slot it can use (evo slot, hero slot, then the slot that
 * takes either) if that is empty, else the first empty plain slot, else any empty slot.
 */
export function slotFor(slots: Slot[], id: number): number {
  const info = cardById(id);
  const empty = (i: number) => !slots[i];
  if (info) {
    if (info.hasEvolution && empty(0)) return 0;
    if (info.hasHero && empty(1)) return 1;
    if ((info.hasEvolution || info.hasHero) && empty(2)) return 2;
  }
  for (let i = 3; i < DECK_SIZE; i++) if (empty(i)) return i;
  for (let i = 0; i < DECK_SIZE; i++) if (empty(i)) return i;
  return -1;
}

/** Re-applies slot rules after cards move: forms only stay where the slot allows them. */
export function fixForms(slots: Slot[]): Slot[] {
  return slots.map((s, i) => {
    if (!s) return s;
    const info = cardById(s.id);
    const can = info ? slotForms(info, i) : { evo: false, hero: false };
    const evo = s.evo && can.evo;
    return { id: s.id, evo, hero: s.hero && can.hero && !evo };
  });
}

/** Builder slots as deck cards, with the art for each card's form. */
export function slotCards(slots: Slot[]): DeckCard[] {
  return slots.flatMap((s) => {
    const info = s ? cardById(s.id) : undefined;
    if (!s || !info) return [];
    return [
      {
        id: info.id,
        slug: info.slug,
        name: info.name,
        rarity: info.rarity,
        elixir: info.elixir,
        evo: s.evo,
        hero: s.hero,
        img: (s.evo ? info.icons.evolution : s.hero ? info.icons.hero : null) ?? info.icons.normal,
      },
    ];
  });
}

/** A meta deck as builder slots, in the order it was played (evo / hero slots first). */
export function deckSlots(cards: Pick<DeckCard, 'id' | 'evo' | 'hero'>[]): Slot[] {
  const slots: Slot[] = cards.slice(0, DECK_SIZE).map((c) => ({ id: c.id, evo: c.evo, hero: c.hero }));
  while (slots.length < DECK_SIZE) slots.push(null);
  return fixForms(slots);
}

/** "26000021e.26000000.-.…" in slot order: e = evolution, h = hero, - = empty slot. */
export function encodeSlots(slots: (Pick<DeckCard, 'id' | 'evo' | 'hero'> | null)[]): string {
  return slots.map((s) => (s ? `${s.id}${s.evo ? 'e' : ''}${s.hero ? 'h' : ''}` : '-')).join('.');
}

/** Reads a share link's deck back; unknown cards, duplicates and bad forms are dropped. */
export function decodeSlots(raw: string | null | undefined): Slot[] {
  const slots: Slot[] = Array(DECK_SIZE).fill(null);
  if (!raw) return slots;
  const seen = new Set<number>();
  raw
    .split('.')
    .slice(0, DECK_SIZE)
    .forEach((part, i) => {
      const m = /^(\d+)(e?)(h?)$/.exec(part);
      const id = m ? Number(m[1]) : NaN;
      if (!m || !cardById(id) || cardById(id)!.rarity === 'tower' || seen.has(id)) return;
      seen.add(id);
      slots[i] = { id, evo: !!m[2], hero: !!m[3] };
    });
  return fixForms(slots);
}

export const towerById = (id: number | null | undefined) => TOWER_TROOPS.find((t) => t.id === id) ?? null;

/** The game allows one champion per deck. */
export const championCount = (slots: Slot[]) => slots.filter((s) => s && cardById(s.id)?.rarity === 'champion').length;

/** Cards for the picker: by elixir, then name. */
export const PICKABLE: CardInfo[] = [...CARDS].sort((a, b) => (a.elixir ?? 0) - (b.elixir ?? 0) || a.name.localeCompare(b.name));

/** The built deck's name, average elixir and 4-card cycle (as DeckBlock shows them). */
export function deckSummary(cards: DeckCard[]) {
  const wc = winConOf(cards);
  return { name: cards.length ? deckName(cards, wc) : 'New deck', winCon: wc, key: cards.length === DECK_SIZE ? deckKey(cards) : null, ...deckStats(cards) };
}

// --- Counters --------------------------------------------------------------------------------

/** Below this many games a matchup is noise and stays hidden. */
export const MIN_MATCHUP_GAMES = 5;

/** Decks sharing at least this many cards with the built one count as "decks like yours". */
export const CLOSE_SHARED = 6;

/**
 * Wilson score lower bound (95%) of a win rate: ranks 30 wins in 40 games above 5 in 5, so a
 * lucky handful of games can't top the list. Only used to order; the page shows wins / games.
 */
export function wilson(wins: number, games: number, z = 1.96): number {
  if (!games) return 0;
  const p = wins / games;
  const z2 = z * z;
  return (p + z2 / (2 * games) - z * Math.sqrt((p * (1 - p) + z2 / (4 * games)) / games)) / (1 + z2 / games);
}

const sharedCards = (a: Pick<DeckCard, 'id'>[], ids: Set<number>) => a.filter((c) => ids.has(c.id)).length;

export type WinLoss = { games: number; wins: number };

export type CloseDeck = { deck: DeckStat; shared: number; exact: boolean };

export type Counter = {
  deck: DeckStat;
  /** The counter deck's record against decks with the built deck's win condition. */
  vs: WinLoss;
  win: number;
  /** Cards it shares with the built deck. */
  shared: number;
  /** How decks like yours did against this deck's win condition, when the sample has it. */
  likeYours: WinLoss | null;
};

export type ToughMatchup = { vs: string; vsSlug: string; games: number; wins: number; decks: number };

export type CounterReport = {
  /** The built deck's win condition: matchups are recorded against the opponent's. */
  winCon: { slug: string; name: string } | null;
  /** Meta decks with the built deck's exact cards (any evo / hero form) or close to them. */
  close: CloseDeck[];
  /** The built deck itself in the sample (same cards and forms), if it was played. */
  exact: DeckStat | null;
  /** Win conditions decks like yours lost to most, summed over the close decks' matchups. */
  tough: ToughMatchup[];
  counters: Counter[];
};

/**
 * Hard counters for a built deck from one mode's meta decks. Each meta deck records its games
 * and wins against every opposing win condition it met (its 8 most common). A counter is a
 * meta deck with at least `minGames` games against the built deck's win condition, ranked by
 * the Wilson lower bound of that win rate. Decks sharing `CLOSE_SHARED`+ cards with the built
 * deck are variants of it, not counters: they feed "decks like yours" instead, whose matchups
 * show which win conditions beat this style of deck, and annotate each counter with how decks
 * like yours did against its win condition.
 */
export function counterReport(decks: DeckStat[], built: DeckCard[], opts: { minGames?: number; limit?: number } = {}): CounterReport {
  const minGames = opts.minGames ?? MIN_MATCHUP_GAMES;
  const limit = opts.limit ?? 12;
  const wc = winConOf(built);
  const ids = new Set(built.map((c) => c.id));
  const key = built.length === DECK_SIZE ? deckKey(built) : null;

  const close: CloseDeck[] =
    built.length >= CLOSE_SHARED
      ? decks
          .map((d) => ({ deck: d, shared: sharedCards(d.cards, ids), exact: d.key === key }))
          .filter((d) => d.shared >= CLOSE_SHARED)
          .sort((a, b) => Number(b.exact) - Number(a.exact) || b.shared - a.shared || b.deck.games - a.deck.games)
    : [];

  // Matchups of the decks like yours, summed per opposing win condition.
  const vs = new Map<string, ToughMatchup>();
  for (const { deck } of close)
    for (const m of deck.matchups) {
      const t = vs.get(m.vsSlug) ?? { vs: m.vs, vsSlug: m.vsSlug, games: 0, wins: 0, decks: 0 };
      t.games += m.games;
      t.wins += m.wins;
      t.decks++;
      vs.set(m.vsSlug, t);
    }
  const tough = [...vs.values()]
    .filter((t) => t.games >= minGames && t.wins / t.games < 0.5)
    .sort((a, b) => wilson(a.wins, a.games) - wilson(b.wins, b.games) || b.games - a.games);

  const closeKeys = new Set(close.map((c) => c.deck.key));
  const counters: Counter[] = [];
  if (wc)
    for (const d of decks) {
      if (closeKeys.has(d.key)) continue;
      const m: Matchup | undefined = d.matchups.find((x) => x.vsSlug === wc.slug);
      if (!m || m.games < minGames) continue;
      const theirs = winConOf(d.cards);
      const like = theirs ? vs.get(theirs.slug) : undefined;
      counters.push({
        deck: d,
        vs: { games: m.games, wins: m.wins },
        win: (m.wins / m.games) * 100,
        shared: sharedCards(d.cards, ids),
        likeYours: like && like.games >= minGames ? { games: like.games, wins: like.wins } : null,
      });
    }
  counters.sort((a, b) => wilson(b.vs.wins, b.vs.games) - wilson(a.vs.wins, a.vs.games) || b.vs.games - a.vs.games || b.deck.games - a.deck.games);

  return {
    winCon: wc ? { slug: wc.slug, name: wc.name } : null,
    close,
    exact: close.find((c) => c.exact)?.deck ?? null,
    tough,
    counters: counters.filter((c) => c.win > 50).slice(0, limit),
  };
}

// --- A player's collection -------------------------------------------------------------------

/** What the builder needs from a player's cards: in-game levels and unlocked forms. */
export type OwnedCard = { level: number; evo: boolean; hero: boolean };
export type Collection = { tag: string; name: string; cards: Record<number, OwnedCard>; towers: Record<number, number> };

// --- The meta sample, packed for the browser ---------------------------------------------------

/**
 * A meta deck without its art URLs, players and crown split: the builder ranks counters across
 * every mode in the browser, and card art comes from cards.json there. Cards use the share-link
 * format; matchups are [win condition slug, games, wins].
 */
export type PackedDeck = { key: string; cards: string; tower: number | null; games: number; wins: number; draws: number; use: number; matchups: [string, number, number][] };
export type PackedMode = { mode: string; label: string; kind: ModeKind; windowHours: number; battles: number; decks: PackedDeck[] };
export type PackedMeta = { generatedAt: string; players: number; order: string[]; modes: Record<string, PackedMode> };

export function packMeta(meta: MetaSnapshot): PackedMeta {
  const modes: Record<string, PackedMode> = {};
  for (const [k, m] of Object.entries(meta.modes))
    modes[k] = {
      mode: m.mode,
      label: m.label,
      kind: m.kind,
      windowHours: m.windowHours,
      battles: m.battles,
      decks: m.decks.map((d) => ({
        key: d.key,
        cards: encodeSlots(d.cards),
        tower: (d.tower && cardBySlug(d.tower.slug)?.id) || null,
        games: d.games,
        wins: d.wins,
        draws: d.draws,
        use: d.use,
        matchups: d.matchups.map((x) => [x.vsSlug, x.games, x.wins]),
      })),
    };
  return { generatedAt: meta.generatedAt, players: meta.players, order: meta.order, modes };
}

/** A packed deck back as a DeckStat, cards in played order with the forms they were played in. */
export function unpackDeck(p: PackedDeck): DeckStat {
  const slots: Slot[] = p.cards.split('.').map((part) => {
    const m = /^(\d+)(e?)(h?)$/.exec(part);
    return m ? { id: Number(m[1]), evo: !!m[2], hero: !!m[3] } : null;
  });
  const cards = slotCards(slots);
  const wc = winConOf(cards);
  const t = towerById(p.tower);
  return {
    key: p.key,
    name: deckName(cards, wc),
    winCon: wc?.slug ?? null,
    cards,
    tower: t ? { slug: t.slug, name: t.name, img: t.icons.normal } : null,
    games: p.games,
    wins: p.wins,
    draws: p.draws,
    crowns: [],
    use: p.use,
    win: (p.wins / p.games) * 100,
    ...deckStats(cards),
    matchups: p.matchups.map(([vsSlug, games, wins]) => ({ vs: cardBySlug(vsSlug)?.name ?? vsSlug, vsSlug, games, wins })),
    players: [],
  };
}

/** The builder with a deck loaded (from a meta deck's page, say). */
export function builderHref(cards: Pick<DeckCard, 'id' | 'evo' | 'hero'>[], opts: { tower?: number | null; mode?: string | null } = {}): string {
  const q = new URLSearchParams({ deck: encodeSlots(deckSlots(cards)) });
  if (opts.tower) q.set('tower', String(opts.tower));
  if (opts.mode && opts.mode !== 'pol') q.set('mode', opts.mode);
  return `/decks/builder?${q}`;
}

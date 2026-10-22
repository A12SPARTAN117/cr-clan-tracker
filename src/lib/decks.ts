import type { ApiCard } from './cr/types';
import { cardArt, cardById, playedAsEvo, playedAsHero, slugify, type Rarity } from './cards';

// Shared deck helpers: card conversion, win conditions, naming, copy links.

export type DeckCard = {
  id: number;
  slug: string;
  name: string;
  rarity: Rarity;
  elixir: number | null;
  evo: boolean;
  hero: boolean;
  /** Left out when it's the card's own art (cardArt), which the browser looks up itself. */
  img?: string | null;
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

export function toDeckCard(c: ApiCard): DeckCard {
  const info = cardById(c.id);
  const evo = playedAsEvo(c.evolutionLevel);
  const hero = playedAsHero(c.evolutionLevel);
  const slug = info?.slug ?? slugify(c.name);
  const img = (evo ? c.iconUrls.evolutionMedium : hero ? c.iconUrls.heroMedium : null) ?? c.iconUrls.medium ?? info?.icons.normal ?? null;
  // Pages carry thousands of these cards (meta decks, battles), so the URL only travels when
  // it differs from the art the card table already has.
  return {
    id: c.id,
    slug,
    name: c.name,
    rarity: (info?.rarity ?? c.rarity) as Rarity,
    elixir: info?.elixir ?? c.elixirCost ?? null,
    evo,
    hero,
    ...(img !== cardArt(slug, evo, hero) ? { img } : {}),
  };
}

export function winConOf(cards: DeckCard[]): DeckCard | null {
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
export function deckName(cards: DeckCard[], wc: DeckCard | null): string {
  const order: Rarity[] = ['champion', 'legendary', 'epic', 'rare', 'common', 'tower'];
  const rest = cards
    .filter((c) => c !== wc)
    .sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity) || (b.elixir ?? 0) - (a.elixir ?? 0));
  const names = wc ? [wc.name, rest[0]?.name] : [rest[0]?.name, rest[1]?.name];
  return names.filter(Boolean).join(' · ');
}


/** A link that opens the deck in the game ("Copy deck"). */
export const deckLink = (ids: number[]) => `https://link.clashroyale.com/deck/en?deck=${ids.join(';')}`;

export function deckStats(cards: { elixir: number | null }[]) {
  const els = cards.map((c) => c.elixir ?? 0);
  return {
    avgElixir: els.reduce((a, b) => a + b, 0) / Math.max(1, els.length),
    cycle: [...els].sort((a, b) => a - b).slice(0, 4).reduce((a, b) => a + b, 0),
  };
}

export const deckKey = (cards: DeckCard[]) =>
  cards
    .map((c) => `${c.id}${c.evo ? 'e' : ''}${c.hero ? 'h' : ''}`)
    .sort()
    .join('-');

/** The deck stats page for a meta deck (optionally pinned to a game mode). */
export const deckHref = (key: string, mode?: string | null) => `/decks/${encodeURIComponent(key)}${mode && mode !== 'pol' ? `?mode=${mode}` : ''}`;

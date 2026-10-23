import data from '../../data/cards.json';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'champion' | 'tower';

export type CardInfo = {
  id: number;
  name: string;
  slug: string;
  type: string;
  rarity: Rarity;
  elixir: number | null;
  maxLevel: number;
  hasEvolution: boolean;
  hasHero: boolean;
  icons: { normal: string | null; evolution: string | null; hero: string | null };
};

type RawTower = { id: number; name: string; slug: string; maxLevel: number; icon: string | null };
type Raw = { cards: CardInfo[]; towerTroops?: RawTower[] };
const raw = data as unknown as Raw;

// Every card uses the official art, so all of them share one style and shape. (Electro Giant's
// evolution and Electro Wizard's hero art were missing from the CDN for a while and borrowed
// RoyaleAPI's differently drawn copies; the official images are back.)
export const CARDS: CardInfo[] = raw.cards;
export const TOWER_TROOPS: CardInfo[] = (raw.towerTroops ?? []).map((t) => ({
  id: t.id,
  name: t.name,
  slug: t.slug,
  type: 'Tower Troop',
  rarity: 'tower',
  elixir: null,
  maxLevel: t.maxLevel,
  hasEvolution: false,
  hasHero: false,
  icons: { normal: t.icon, evolution: null, hero: null },
}));

const byId = new Map<number, CardInfo>([...CARDS, ...TOWER_TROOPS].map((c) => [c.id, c]));
const bySlug = new Map<string, CardInfo>([...CARDS, ...TOWER_TROOPS].map((c) => [c.slug, c]));

// Official art URL → our copy in public/cards/art (scripts/card-art.mjs): 5-8 KB AVIF instead
// of the CDN's ~165 KB PNG.
const local = new Map<string, string>();
for (const c of [...CARDS, ...TOWER_TROOPS]) {
  if (c.icons.normal) local.set(c.icons.normal, `/cards/art/${c.slug}`);
  if (c.icons.evolution) local.set(c.icons.evolution, `/cards/art/${c.slug}-evo`);
  if (c.icons.hero) local.set(c.icons.hero, `/cards/art/${c.slug}-hero`);
}

/** Our copy of an official card image: `full` is 288 px wide, `small` 192 px; null when we have none. */
export function localArt(url: string | null | undefined): { full: string; small: string } | null {
  const base = url ? local.get(url) : undefined;
  return base ? { full: `${base}.avif`, small: `${base}.s.avif` } : null;
}

export const cardById = (id: number) => byId.get(id);
export const cardBySlug = (slug: string) => bySlug.get(slug);

/** The art a card is drawn with when nothing else is given: its evolution or hero art when played that way. */
export function cardArt(slug: string, evo = false, hero = false): string | null {
  const i = bySlug.get(slug);
  return (evo ? i?.icons.evolution : hero ? i?.icons.hero : i?.icons.normal) ?? null;
}

export const slugify = (n: string) =>
  n.toLowerCase().replace(/\./g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Cards the design kit ships locally; used as the last image fallback. */
export const LOCAL_CARD_ART = new Set([
  'archers', 'arrows', 'baby-dragon', 'barbarian-barrel', 'barbarian-hut', 'barbarians',
  'battle-healer', 'battle-ram', 'berserker', 'bomber', 'bomb-tower', 'boss-bandit',
]);

/** The API reports rarity-relative levels (a max Champion is 6); convert to in-game levels. */
export const realLevel = (level: number, maxLevel: number) => level + (16 - maxLevel);

/** In a battle-log or current deck, evolutionLevel marks a card played in an evo/hero slot. */
export const playedAsEvo = (evolutionLevel?: number) => evolutionLevel === 1 || evolutionLevel === 3;
export const playedAsHero = (evolutionLevel?: number) => evolutionLevel === 2 || evolutionLevel === 3;

import type { ApiCard, Battle, BattleSide } from '@/lib/cr/types';
import { cardBySlug } from '@/lib/cards';

/** Builds API-shaped cards from slugs; `evo` / `hero` mark the played evo / hero slots. */
export function cards(slugs: string[], opts: { evo?: string[]; hero?: string[] } = {}): ApiCard[] {
  return slugs.map((slug) => {
    const c = cardBySlug(slug);
    if (!c) throw new Error(`unknown card ${slug}`);
    const evo = opts.evo?.includes(slug);
    const hero = opts.hero?.includes(slug);
    return {
      name: c.name,
      id: c.id,
      level: 14,
      maxLevel: 16,
      rarity: c.rarity as ApiCard['rarity'],
      elixirCost: c.elixir ?? undefined,
      evolutionLevel: evo && hero ? 3 : hero ? 2 : evo ? 1 : undefined,
      iconUrls: { medium: `https://api-assets.clashroyale.com/cards/300/${slug}.png` },
    };
  });
}

/** API timestamp, e.g. 20261016T080000.000Z */
export const apiTime = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, '.000Z');

export function side(tag: string, deck: ApiCard[], crowns: number, extra: Partial<BattleSide> = {}): BattleSide {
  return {
    tag: `#${tag}`,
    name: `Player ${tag}`,
    crowns,
    cards: deck,
    supportCards: [{ name: 'Tower Princess', id: 159000000, level: 16, maxLevel: 16, rarity: 'common', iconUrls: { medium: 'https://api-assets.clashroyale.com/cardstower/300/tp.png' } }],
    ...extra,
  };
}

export function battle(type: string, mode: { id: number; name: string }, at: Date, team: BattleSide[], opponent: BattleSide[], extra: Partial<Battle> = {}): Battle {
  return { type, battleTime: apiTime(at), gameMode: mode, team, opponent, ...extra };
}

export const MODES = {
  ranked: { id: 72000450, name: 'Ranked1v1_NewArena' },
  ladder: { id: 72000006, name: 'Ladder' },
  war: { id: 72000267, name: 'CW_Battle_1v1' },
  twoVtwo: { id: 72000014, name: 'TeamVsTeam' },
  chess: { id: 72000533, name: '202610_Event_Spooky_Chess' },
  challenge: { id: 72000474, name: 'Challenge_AllCards_EventDeck_NoSet' },
  friendly: { id: 72000007, name: 'Friendly' },
};

export const DECKS = {
  hog: ['hog-rider', 'the-log', 'fireball', 'musketeer', 'ice-golem', 'cannon', 'skeletons', 'ice-spirit'],
  pekka: ['pekka', 'golden-knight', 'bandit', 'electro-wizard', 'royal-ghost', 'furnace', 'battle-ram', 'arrows'],
  golem: ['golem', 'night-witch', 'baby-dragon', 'lumberjack', 'tornado', 'lightning', 'barbarian-barrel', 'mega-minion'],
  knight: ['knight', 'valkyrie', 'wizard', 'mini-pekka', 'arrows', 'skeletons', 'ice-spirit', 'cannon'],
};

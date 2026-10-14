import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getBattleLog, getClan, getPlayer, getRiverRaceLog, tags } from '../cr/api';
import type { ApiBadge, ApiCard, Battle, Player, PolResult } from '../cr/types';
import { CARDS, TOWER_TROOPS, cardById, realLevel, type Rarity } from '../cards';
import { characterFor } from '../characters';
import { deckKey, deckLink, deckName, deckStats, toDeckCard, winConOf, type DeckCard } from '../decks';
import { parseApiDate } from '../format';
import { riverBattleKind, warWeekKey } from '../war';
import { modesOfBattle, type ModeKind } from '../modes';
import cardKeys from '../../../data/card-keys.json';
import upgradeTable from '../../../data/upgrades.json';

export type LeveledCard = DeckCard & { level: number | null };

export type CollectionCard = {
  id: number;
  slug: string;
  name: string;
  rarity: Rarity;
  elixir: number | null;
  owned: boolean;
  level: number | null;
  stars: number;
  count: number;
  canEvo: boolean;
  canHero: boolean;
  evoUnlocked: boolean;
  heroUnlocked: boolean;
  img: string | null;
  evoImg: string | null;
  heroImg: string | null;
  /** Cards (and gold) for the next level; null when maxed. */
  next: { cards: number | null; gold: number | null } | null;
  /** Cards still needed to reach max level. */
  toMax: number;
  /** Copies collected so far for this card, counting the ones spent on upgrades. */
  collected: number;
  mastery: number | null;
};

export type Mastery = { slug: string; name: string; level: number; maxLevel: number; progress: number | null; target: number | null; img: string | null };

/** Battle-log mode kinds for icons; the extra kinds cover games outside the public meta. */
export type BattleKind = ModeKind | 'friendly' | 'boat' | 'training' | 'tournament';

export type BadgeGroup = 'Mastery' | 'Seasonal' | 'Collection' | 'Tournament & events' | 'Milestones';
export type Badge = { id: string; label: string; group: BadgeGroup; level: number | null; maxLevel: number | null; progress: number | null; target: number | null; img: string | null };

export type BattleSideInfo = { name: string; tag: string; clan: string | null; cards: LeveledCard[]; tower: { slug: string; name: string; img: string | null; level: number | null } | null; avgElixir: number; cycle: number };

export type BattleRow = {
  id: string;
  mode: string;
  kind: BattleKind;
  time: string;
  hours: number;
  result: 'win' | 'loss' | 'draw';
  crowns: [number, number];
  trophyChange: number | null;
  opp: { name: string; tag: string; clan: string | null };
  mine: LeveledCard[];
  theirs: LeveledCard[];
  me: BattleSideInfo;
  them: BattleSideInfo;
};

/** Opponent cards the player loses to most often in the battle log. */
export type Enemy = { slug: string; name: string; img: string | null; games: number; losses: number };

export type PlayerDeck = { key: string; name: string; cards: LeveledCard[]; games: number; wins: number; lastHours: number; avgElixir: number; cycle: number };

type Pol = { league: number; rating: number; rank: number | null } | null;

export type PlayerProfile = {
  generatedAt: string;
  tag: string;
  name: string;
  expLevel: number;
  collectionLevel: number | null;
  kingTower: number | null;
  /** The current season's trophy road (above 14,000 trophies) and the legacy high score. */
  seasonal: { arena: string; trophies: number; best: number } | null;
  legacyHigh: number | null;
  arena: string | null;
  trophies: number;
  bestTrophies: number;
  /** The API's own win/lose counter (positive = wins). */
  streak: number;
  /** The current streak from the battle log (friendlies, boat battles and draws skipped). */
  streakRun: { kind: 'win' | 'loss' | null; count: number; ids: string[] };
  role: Player['role'] | null;
  clan: { tag: string; name: string; badgeId: number } | null;
  lastSeenHours: number | null;
  favourite: { slug: string; name: string; render: string | null } | null;
  pol: { current: Pol; last: Pol; best: Pol };
  totals: {
    wins: number;
    losses: number;
    threeCrown: number;
    battleCount: number;
    challengeMaxWins: number;
    challengeCardsWon: number;
    tournamentBattles: number;
    tournamentCardsWon: number;
    totalDonations: number;
    donationsWeek: number;
    receivedWeek: number;
    warDayWins: number;
    clanCardsCollected: number;
    starPoints: number | null;
    totalExp: number | null;
  };
  deck: { name: string; cards: LeveledCard[]; tower: (LeveledCard & { rarity: 'tower' }) | null; avgElixir: number; cycle: number; link: string } | null;
  collection: CollectionCard[];
  towers: { slug: string; name: string; img: string | null; owned: boolean; level: number | null }[];
  badges: Badge[];
  mastery: Mastery[];
  enemies: Enemy[];
  achievements: { name: string; info: string; stars: number; value: number; target: number }[];
  battles: BattleRow[];
  decks: PlayerDeck[];
  war: { label: string; week: string | null; decks: number; fame: number }[] | null;
};

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();

const KEYS = cardKeys as Record<string, string>;
type Upg = { cards: number[]; gold: number[] };
type Modern = { gold: Record<string, number>; cards: Record<string, Record<string, number>> };
const UPG = upgradeTable as unknown as Record<string, Upg> & { modern: Modern };

/**
 * Copies and gold to take a card from API level `lvl` (rarity-relative) to the next one.
 * Real levels 11–16 use the post-November-2025 costs; lower levels the classic table.
 */
function step(rarity: string, lvl: number, maxLevel: number): { cards: number; gold: number } | null {
  const target = lvl + 1 + (16 - maxLevel);
  if (lvl >= maxLevel) return null;
  if (target >= 11) return { cards: UPG.modern.cards[rarity]?.[target] ?? 0, gold: UPG.modern.gold[target] ?? 0 };
  const t = UPG[rarity];
  return t ? { cards: t.cards[lvl - 1] ?? 0, gold: t.gold[lvl - 1] ?? 0 } : null;
}

/** Upgrade progress from the API's rarity-relative level and card count. */
export function upgrades(rarity: string, level: number, maxLevel: number, count: number) {
  // RoyaleAPI's "collected" counts the copies spent on upgrades plus the ones in hand.
  let spent = 0;
  for (let l = 1; l < level; l++) spent += step(rarity, l, maxLevel)?.cards ?? 0;
  let toMax = 0;
  for (let l = level; l < maxLevel; l++) toMax += step(rarity, l, maxLevel)?.cards ?? 0;
  const n = step(rarity, level, maxLevel);
  return { next: n ? { cards: n.cards || null, gold: n.gold || null } : null, toMax: Math.max(0, toMax - count), collected: spent + count };
}

function masteryOf(b: ApiBadge): Mastery | null {
  if (!b.name.startsWith('Mastery')) return null;
  const slug = KEYS[b.name.slice(7).replace(/\s+/g, '')];
  const info = slug ? CARDS.find((c) => c.slug === slug) : undefined;
  if (!info) return null;
  return { slug, name: info.name, level: b.level ?? 0, maxLevel: b.maxLevel ?? 10, progress: b.progress ?? null, target: b.target ?? null, img: b.iconUrls?.large ?? null };
}

function battleKind(b: Battle): BattleKind {
  if (b.type === 'boatBattle') return 'boat';
  if (b.type.startsWith('riverRace') && riverBattleKind(b.type, parseApiDate(b.battleTime)) === 'training') return 'training';
  if (b.type === 'friendly' || b.type === 'clanMate') return 'friendly';
  if (b.type === 'tournament') return 'tournament';
  return modesOfBattle(b)[1]?.kind ?? modesOfBattle(b)[0]?.kind ?? 'event';
}

function runOf(battles: BattleRow[]): PlayerProfile['streakRun'] {
  const counted = battles.filter((b) => b.kind !== 'friendly' && b.kind !== 'boat' && b.result !== 'draw');
  const first = counted[0]?.result;
  if (!first || first === 'draw') return { kind: null, count: 0, ids: [] };
  const ids: string[] = [];
  for (const b of counted) {
    if (b.result !== first) break;
    ids.push(b.id);
  }
  return { kind: first, count: ids.length, ids };
}

/** The seasonal trophy road entry of `progress` ("seasonal-trophy-road-YYYYMM"). */
function seasonalOf(p: Player): PlayerProfile['seasonal'] {
  const e = Object.entries(p.progress ?? {}).find(([k]) => k.startsWith('seasonal-trophy-road'))?.[1];
  return e ? { arena: e.arena?.name ?? 'Seasonal arena', trophies: e.trophies, best: e.bestTrophies } : null;
}

function pol(r?: PolResult): Pol {
  return r ? { league: r.leagueNumber, rating: r.trophies, rank: r.rank ?? null } : null;
}

function leveled(c: ApiCard): LeveledCard {
  return { ...toDeckCard(c), level: c.level && c.maxLevel ? realLevel(c.level, c.maxLevel) : null };
}

export function modeLabel(b: Battle): string {
  if (b.team.length > 1) return '2v2';
  if (b.type === 'pathOfLegend') return 'Path of Legends';
  if (b.type.startsWith('riverRace')) return riverBattleKind(b.type, parseApiDate(b.battleTime)) === 'training' ? 'War training' : 'Clan War';
  if (b.type === 'boatBattle') return 'Boat battle';
  if (b.type === 'clanMate') return 'Friendly';
  if (b.type === 'PvP') return /ladder/i.test(b.gameMode?.name ?? '') ? 'Ladder' : 'Event';
  return 'Event';
}

/** "MasteryGoblinGiant" → "Goblin Giant", "SeasonalBadge_202510" → "Season Oct 2026". */
function badgeLabel(name: string): string {
  const season = /^SeasonalBadge_(\d{4})(\d{2})$/.exec(name);
  if (season) {
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+season[2] - 1];
    return `Season ${mon} ${season[1]}`;
  }
  return name
    .replace(/^Mastery/, '')
    .replace(/_v\d+$/, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .trim();
}

function badgeGroup(name: string): BadgeGroup {
  if (name.startsWith('Mastery')) return 'Mastery';
  if (/Seasonal|YearBadge|Season/i.test(name)) return 'Seasonal';
  if (/^(YearsPlayed|BattleWins|ClanWarsVeteran|ClanWarWins|ClanDonations|Classic12Wins|Grand12Wins)$/.test(name)) return 'Milestones';
  if (/Collection|Banner|Emote/i.test(name)) return 'Collection';
  return 'Tournament & events';
}

function toBadge(b: ApiBadge): Badge {
  return {
    id: b.name,
    label: badgeLabel(b.name),
    group: badgeGroup(b.name),
    level: b.level ?? null,
    maxLevel: b.maxLevel ?? null,
    progress: b.progress ?? null,
    target: b.target ?? null,
    img: b.iconUrls?.large ?? null,
  };
}

async function build(tag: string): Promise<PlayerProfile | null> {
  const r = await getPlayer(tag);
  if (!r.ok) return null;
  const p = r.data;
  const now = new Date();
  const clanTag = p.clan ? bare(p.clan.tag) : null;
  const [log, clan, raceLog] = await Promise.all([
    getBattleLog(tag),
    clanTag ? getClan(clanTag) : Promise.resolve(null),
    clanTag ? getRiverRaceLog(clanTag, 10) : Promise.resolve(null),
  ]);

  const member = clan?.ok ? clan.data.memberList.find((m) => bare(m.tag) === bare(p.tag)) : undefined;
  const seen = member ? parseApiDate(member.lastSeen) : null;
  const hoursAgo = (iso: string) => Math.max(0, (now.getTime() - (parseApiDate(iso)?.getTime() ?? now.getTime())) / 3600_000);

  const fav = p.currentFavouriteCard ? cardById(p.currentFavouriteCard.id) : undefined;

  // Current deck, in slot order (evo/hero slots first).
  let deck: PlayerProfile['deck'] = null;
  if (p.currentDeck?.length) {
    const cards = p.currentDeck.map(leveled);
    const t = p.currentDeckSupportCards?.[0];
    const st = deckStats(cards);
    deck = {
      name: deckName(cards, winConOf(cards)),
      cards,
      tower: t
        ? { id: t.id, slug: cardById(t.id)?.slug ?? 'tower-princess', name: t.name, rarity: 'tower', elixir: null, evo: false, hero: false, img: t.iconUrls.medium ?? null, level: realLevel(t.level, t.maxLevel) }
        : null,
      avgElixir: st.avgElixir,
      cycle: st.cycle,
      link: deckLink(p.currentDeck.map((c) => c.id)),
    };
  }

  const mastery = p.badges.map(masteryOf).filter((m): m is Mastery => !!m);
  const masteryBySlug = new Map(mastery.map((m) => [m.slug, m.level]));
  const owned = new Map(p.cards.map((c) => [c.id, c]));
  const collection: CollectionCard[] = CARDS.map((info) => {
    const c = owned.get(info.id);
    const evoLv = c?.evolutionLevel ?? 0;
    return {
      id: info.id,
      slug: info.slug,
      name: info.name,
      rarity: info.rarity,
      elixir: info.elixir,
      owned: !!c,
      level: c ? realLevel(c.level, c.maxLevel) : null,
      stars: c?.starLevel ?? 0,
      count: c?.count ?? 0,
      canEvo: info.hasEvolution,
      canHero: info.hasHero,
      // On a player's card, evolutionLevel says what is unlocked: 1 evo, 2 hero, 3 both.
      evoUnlocked: info.hasEvolution && (evoLv === 1 || evoLv === 3 || (!info.hasHero && evoLv > 0)),
      heroUnlocked: info.hasHero && (evoLv === 2 || evoLv === 3 || (!info.hasEvolution && evoLv > 0)),
      img: c?.iconUrls.medium ?? info.icons.normal,
      evoImg: c?.iconUrls.evolutionMedium ?? info.icons.evolution,
      heroImg: c?.iconUrls.heroMedium ?? info.icons.hero,
      ...(c ? upgrades(c.rarity, c.level, c.maxLevel, c.count ?? 0) : { next: null, toMax: 0, collected: 0 }),
      mastery: masteryBySlug.get(info.slug) ?? null,
    };
  });

  const ownedTowers = new Map((p.supportCards ?? []).map((c) => [c.id, c]));
  const towers = TOWER_TROOPS.map((t) => {
    const c = ownedTowers.get(t.id);
    return { slug: t.slug, name: t.name, img: c?.iconUrls.medium ?? t.icons.normal, owned: !!c, level: c ? realLevel(c.level, c.maxLevel) : null };
  });

  const battlesRaw = log.ok ? log.data : [];
  const battles: BattleRow[] = battlesRaw.map((b, i) => {
    const me = b.team.find((t) => bare(t.tag) === bare(p.tag)) ?? b.team[0];
    const opp = b.opponent[0];
    const sideInfo = (x: typeof me | undefined, nameOverride?: string): BattleSideInfo => {
      const cards = (x?.cards ?? []).map(leveled);
      const t = x?.supportCards?.[0];
      return {
        name: nameOverride ?? x?.name ?? '',
        tag: x ? bare(x.tag) : '',
        clan: x?.clan?.name ?? null,
        cards,
        tower: t ? { slug: cardById(t.id)?.slug ?? 'tower-princess', name: t.name, img: t.iconUrls.medium ?? null, level: realLevel(t.level, t.maxLevel) } : null,
        ...deckStats(cards),
      };
    };
    const us = b.team.reduce((a, t) => Math.max(a, t.crowns), 0);
    const them = b.opponent.reduce((a, t) => Math.max(a, t.crowns), 0);
    return {
      id: `${b.battleTime}-${i}`,
      mode: modeLabel(b),
      kind: battleKind(b),
      time: parseApiDate(b.battleTime)?.toISOString() ?? '',
      hours: hoursAgo(b.battleTime),
      result: us > them ? 'win' : us < them ? 'loss' : 'draw',
      crowns: [us, them],
      trophyChange: me?.trophyChange ?? null,
      opp: { name: b.opponent.map((o) => o.name).join(' & '), tag: opp ? bare(opp.tag) : '', clan: opp?.clan?.name ?? null },
      mine: (me?.cards ?? []).map(leveled),
      theirs: (opp?.cards ?? []).map(leveled),
      me: sideInfo(me),
      them: sideInfo(opp, b.opponent.map((o) => o.name).join(' & ')),
    };
  });

  // Worst enemies: opponent cards in the most lost games (2+ appearances), then by loss rate.
  const foes = new Map<number, Enemy & { id: number }>();
  for (const b of battles) {
    if (b.kind === 'friendly' || b.kind === 'boat' || b.result === 'draw') continue;
    for (const c of b.theirs) {
      const e = foes.get(c.id) ?? { id: c.id, slug: c.slug, name: c.name, img: cardById(c.id)?.icons.normal ?? c.img, games: 0, losses: 0 };
      e.games++;
      if (b.result === 'loss') e.losses++;
      foes.set(c.id, e);
    }
  }
  const enemies = [...foes.values()]
    .filter((e) => e.games >= 2 && e.losses > 0)
    .sort((a, b) => b.losses - a.losses || b.losses / b.games - a.losses / a.games)
    .slice(0, 3)
    .map(({ slug, name, img, games, losses }) => ({ slug, name, img, games, losses }));

  // Decks used in the battle log, most played first.
  const deckMap = new Map<string, PlayerDeck>();
  for (const b of battles) {
    if (b.mine.length !== 8 || b.mode === 'Boat battle') continue;
    const k = deckKey(b.mine);
    const d = deckMap.get(k) ?? { key: k, name: deckName(b.mine, winConOf(b.mine)), cards: b.mine, games: 0, wins: 0, lastHours: b.hours, ...deckStats(b.mine) };
    d.games++;
    if (b.result === 'win') d.wins++;
    d.lastHours = Math.min(d.lastHours, b.hours);
    deckMap.set(k, d);
  }

  let war: PlayerProfile['war'] = null;
  if (raceLog?.ok && clanTag) {
    war = raceLog.data.items.flatMap((e) => {
      const st = e.standings.find((s) => bare(s.clan.tag) === clanTag);
      const me = st?.clan.participants.find((x) => bare(x.tag) === bare(p.tag));
      const end = parseApiDate(e.createdDate);
      return me ? [{ label: `S${e.seasonId} · W${e.sectionIndex + 1}`, week: end ? warWeekKey(end) : null, decks: me.decksUsed, fame: me.fame }] : [];
    });
  }

  return {
    generatedAt: now.toISOString(),
    tag: bare(p.tag),
    name: p.name,
    expLevel: p.expLevel,
    collectionLevel: p.collectionLevel ?? null,
    kingTower: p.kingTowerLevel ?? null,
    seasonal: seasonalOf(p),
    legacyHigh: p.legacyTrophyRoadHighScore ?? null,
    arena: p.arena?.name ?? null,
    trophies: p.trophies,
    bestTrophies: p.bestTrophies,
    streak: p.currentWinLoseStreak ?? 0,
    streakRun: runOf(battles),
    role: p.role ?? null,
    clan: p.clan ? { tag: bare(p.clan.tag), name: p.clan.name, badgeId: p.clan.badgeId } : null,
    lastSeenHours: seen ? Math.max(0, (now.getTime() - seen.getTime()) / 3600_000) : null,
    favourite: fav ? { slug: fav.slug, name: fav.name, render: characterFor(fav.slug) } : null,
    pol: { current: pol(p.currentPathOfLegendSeasonResult), last: pol(p.lastPathOfLegendSeasonResult), best: pol(p.bestPathOfLegendSeasonResult) },
    totals: {
      wins: p.wins,
      losses: p.losses,
      threeCrown: p.threeCrownWins,
      battleCount: p.battleCount,
      challengeMaxWins: p.challengeMaxWins,
      challengeCardsWon: p.challengeCardsWon,
      tournamentBattles: p.tournamentBattleCount,
      tournamentCardsWon: p.tournamentCardsWon,
      totalDonations: p.totalDonations,
      donationsWeek: p.donations,
      receivedWeek: p.donationsReceived,
      warDayWins: p.warDayWins,
      clanCardsCollected: p.clanCardsCollected,
      starPoints: p.starPoints ?? null,
      totalExp: p.totalExpPoints ?? null,
    },
    deck,
    collection,
    towers,
    badges: p.badges.map(toBadge),
    mastery: mastery.sort((a, b) => b.level - a.level || (b.progress ?? 0) - (a.progress ?? 0)),
    enemies,
    achievements: p.achievements.map((a) => ({ name: a.name, info: a.info, stars: a.stars, value: a.value, target: a.target })),
    battles,
    decks: [...deckMap.values()].sort((a, b) => b.games - a.games || a.lastHours - b.lastHours),
    war,
  };
}

export async function getPlayerProfile(tag: string): Promise<PlayerProfile | null> {
  'use cache';
  cacheTag(tags.player(tag));
  const d = await build(bare(tag));
  if (d) cacheLife('crLive');
  else cacheLife('crError');
  return d;
}

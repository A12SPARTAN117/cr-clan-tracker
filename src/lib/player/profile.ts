import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getBattleLog, getClan, getPlayer, getRiverRaceLog, tags } from '../cr/api';
import type { ApiBadge, ApiCard, Battle, Player, PolResult } from '../cr/types';
import { CARDS, TOWER_TROOPS, cardById, realLevel, type Rarity } from '../cards';
import { characterFor } from '../characters';
import { deckKey, deckLink, deckName, deckStats, toDeckCard, winConOf, type DeckCard } from '../decks';
import { parseApiDate } from '../format';
import { warWeekKey } from '../war';

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
};

export type BadgeGroup = 'Mastery' | 'Seasonal' | 'Collection' | 'Tournament & events' | 'Milestones';
export type Badge = { id: string; label: string; group: BadgeGroup; level: number | null; maxLevel: number | null; progress: number | null; target: number | null; img: string | null };

export type BattleRow = {
  id: string;
  mode: string;
  time: string;
  hours: number;
  result: 'win' | 'loss' | 'draw';
  crowns: [number, number];
  trophyChange: number | null;
  opp: { name: string; tag: string; clan: string | null };
  mine: LeveledCard[];
  theirs: LeveledCard[];
};

export type PlayerDeck = { key: string; name: string; cards: LeveledCard[]; games: number; wins: number; lastHours: number };

type Pol = { league: number; rating: number; rank: number | null } | null;

export type PlayerProfile = {
  generatedAt: string;
  tag: string;
  name: string;
  expLevel: number;
  kingTower: number | null;
  arena: string | null;
  trophies: number;
  bestTrophies: number;
  streak: number;
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
  achievements: { name: string; info: string; stars: number; value: number; target: number }[];
  battles: BattleRow[];
  decks: PlayerDeck[];
  war: { label: string; week: string | null; decks: number; fame: number }[] | null;
};

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();

function pol(r?: PolResult): Pol {
  return r ? { league: r.leagueNumber, rating: r.trophies, rank: r.rank ?? null } : null;
}

function leveled(c: ApiCard): LeveledCard {
  return { ...toDeckCard(c), level: c.level && c.maxLevel ? realLevel(c.level, c.maxLevel) : null };
}

export function modeLabel(b: Battle): string {
  if (b.team.length > 1) return '2v2';
  if (b.type === 'pathOfLegend') return 'Path of Legends';
  if (b.type.startsWith('riverRace')) return 'Clan War';
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
  if (/Collection|YearsPlayed|Banner|Emote/i.test(name)) return 'Collection';
  if (/Tournament|League|2v2|Draft|Touchdown|Crazy|SuddenDeath|Challenge|Trail|Arena/i.test(name)) return 'Tournament & events';
  return 'Milestones';
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
    const us = b.team.reduce((a, t) => Math.max(a, t.crowns), 0);
    const them = b.opponent.reduce((a, t) => Math.max(a, t.crowns), 0);
    return {
      id: `${b.battleTime}-${i}`,
      mode: modeLabel(b),
      time: parseApiDate(b.battleTime)?.toISOString() ?? '',
      hours: hoursAgo(b.battleTime),
      result: us > them ? 'win' : us < them ? 'loss' : 'draw',
      crowns: [us, them],
      trophyChange: me?.trophyChange ?? null,
      opp: { name: b.opponent.map((o) => o.name).join(' & '), tag: opp ? bare(opp.tag) : '', clan: opp?.clan?.name ?? null },
      mine: (me?.cards ?? []).map(leveled),
      theirs: (opp?.cards ?? []).map(leveled),
    };
  });

  // Decks used in the battle log, most played first.
  const deckMap = new Map<string, PlayerDeck>();
  for (const b of battles) {
    if (b.mine.length !== 8 || b.mode === 'Boat battle') continue;
    const k = deckKey(b.mine);
    const d = deckMap.get(k) ?? { key: k, name: deckName(b.mine, winConOf(b.mine)), cards: b.mine, games: 0, wins: 0, lastHours: b.hours };
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
    kingTower: p.kingTowerLevel ?? null,
    arena: p.arena?.name ?? null,
    trophies: p.trophies,
    bestTrophies: p.bestTrophies,
    streak: p.currentWinLoseStreak ?? 0,
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

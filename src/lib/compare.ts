import 'server-only';
import { getClanProfile, getMemberLevels, withLevels, type ClanProfile } from './clan/profile';
import { leagueName } from './leagues';
import { checkTag } from './tags';
import { getPlayerProfile, type PlayerProfile } from './player/profile';

/**
 * Side-by-side comparison of up to four players or four clans. Each row knows which way is
 * better so the page can highlight the leader.
 */

export type CompareKind = 'player' | 'clan';
export type CompareIcon = 'trophy' | 'medal' | 'crown' | 'swords' | 'cards' | 'star' | 'donation' | 'war' | 'members' | 'winrate' | 'streak' | 'clock' | 'chest' | 'fame' | 'badge' | 'tower' | 'alert';
export type CompareRow = { label: string; icon: CompareIcon; values: (number | string | null)[]; better: 'high' | 'low' | null; unit?: string; digits?: number; /** Text to show instead of the number. */ labels?: (string | null)[] };
export type CompareEntity = {
  tag: string;
  name: string;
  sub: string;
  badgeId?: number;
  /** War trophies of the clan (players: of their clan), for the league frame. */
  warTrophies?: number;
  deck?: PlayerProfile['deck'];
};
export type Comparison = { kind: CompareKind; entities: CompareEntity[]; missing: string[]; sections: { title: string; rows: CompareRow[] }[] };

export const MAX_COMPARE = 4;

const pct = (a: number, b: number) => (a + b ? (a / (a + b)) * 100 : null);

function players(ps: PlayerProfile[]): Comparison['sections'] {
  const row = (label: string, icon: CompareIcon, f: (p: PlayerProfile) => number | string | null, better: CompareRow['better'] = 'high', extra: Partial<CompareRow> = {}): CompareRow => ({
    label,
    icon,
    values: ps.map(f),
    better,
    ...extra,
  });
  const owned = (p: PlayerProfile) => p.collection.filter((c) => c.owned);
  const last = (p: PlayerProfile) => p.battles.filter((b) => b.kind !== 'friendly');
  return [
    {
      title: 'Progress',
      rows: [
        row('King tower', 'tower', (p) => p.kingTower),
        row('Collection level', 'cards', (p) => p.collectionLevel),
        row('Trophies', 'trophy', (p) => p.seasonal?.trophies ?? p.trophies),
        // Seasonal road: this season's best (all the API keeps); below 14,000: the Trophy Road best.
        row('Best trophies', 'trophy', (p) => p.seasonal?.best ?? p.bestTrophies),
        row('Path of Legends league', 'medal', (p) => p.pol.current?.league ?? null, 'high', { labels: ps.map((p) => (p.pol.current ? leagueName(p.pol.current.league) : null)) }),
        row('Ultimate Champion medals', 'medal', (p) => (p.pol.current && p.pol.current.league >= 7 ? p.pol.current.rating : null)),
        row('Best season rank', 'trophy', (p) => p.pol.best?.rank ?? null, 'low'),
        row('Star points', 'star', (p) => p.totals.starPoints),
      ],
    },
    {
      title: 'Battles',
      rows: [
        row('Wins', 'crown', (p) => p.totals.wins),
        row('Losses', 'swords', (p) => p.totals.losses, null),
        row('Win %', 'winrate', (p) => pct(p.totals.wins, p.totals.losses), 'high', { unit: '%', digits: 1 }),
        row('Three-crown wins', 'crown', (p) => p.totals.threeCrown),
        row('Battles', 'swords', (p) => p.totals.battleCount, null),
        row('Win % · last 30', 'winrate', (p) => (last(p).length ? (last(p).filter((b) => b.result === 'win').length / last(p).length) * 100 : null), 'high', { unit: '%', digits: 0 }),
        row('Current streak', 'streak', (p) => (p.streakRun.kind ? (p.streakRun.kind === 'win' ? p.streakRun.count : -p.streakRun.count) : 0)),
        row('Worst enemy', 'alert', (p) => (p.enemies[0] ? `${p.enemies[0].name} (${p.enemies[0].losses}/${p.enemies[0].games})` : null), null),
        row('Max challenge wins', 'chest', (p) => p.totals.challengeMaxWins),
      ],
    },
    {
      title: 'Collection',
      rows: [
        row('Cards found', 'cards', (p) => owned(p).length),
        row('Max-level cards', 'cards', (p) => owned(p).filter((c) => c.level === 16).length),
        row('Average card level', 'cards', (p) => (owned(p).length ? owned(p).reduce((a, c) => a + (c.level ?? 0), 0) / owned(p).length : null), 'high', { digits: 2 }),
        row('Evolutions unlocked', 'cards', (p) => p.collection.filter((c) => c.evoUnlocked).length),
        row('Heroes unlocked', 'cards', (p) => p.collection.filter((c) => c.heroUnlocked).length),
        row('Card mastery (sum)', 'badge', (p) => p.mastery.reduce((a, m) => a + m.level, 0)),
        row('Badges', 'badge', (p) => p.badges.length),
      ],
    },
    {
      title: 'Clan',
      rows: [
        row('Clan', 'members', (p) => p.clan?.name ?? null, null),
        row('Donations (total)', 'donation', (p) => p.totals.totalDonations),
        row('Donated this week', 'donation', (p) => p.totals.donationsWeek),
        row('War wins', 'war', (p) => p.totals.warWins),
        row('Clan cards collected', 'cards', (p) => p.totals.clanCardsCollected),
      ],
    },
  ];
}

function clans(cs: ClanProfile[]): Comparison['sections'] {
  const row = (label: string, icon: CompareIcon, f: (c: ClanProfile) => number | string | null, better: CompareRow['better'] = 'high', extra: Partial<CompareRow> = {}): CompareRow => ({
    label,
    icon,
    values: cs.map(f),
    better,
    ...extra,
  });
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const finishes = (c: ClanProfile) => c.past.filter((p) => p.rank != null).map((p) => p.rank!);
  return [
    {
      title: 'Clan',
      rows: [
        row('Clan score', 'trophy', (c) => c.clanScore),
        row('War trophies', 'war', (c) => c.clanWarTrophies),
        row('Members', 'members', (c) => c.members.length),
        row('Required trophies', 'trophy', (c) => c.requiredTrophies, null),
        row('Donations / week', 'donation', (c) => c.donationsPerWeek),
        row('Type', 'members', (c) => ({ open: 'Open', inviteOnly: 'Invite only', closed: 'Closed' })[c.type], null),
        row('Location', 'members', (c) => c.location, null),
      ],
    },
    {
      title: 'Members',
      rows: [
        row('Average trophies', 'trophy', (c) => avg(c.members.map((m) => m.trophies)), 'high', { digits: 0 }),
        row('Average king level', 'star', (c) => avg(c.members.map((m) => m.expLevel).filter(Boolean)), 'high', { digits: 1 }),
        row('Average collection level', 'cards', (c) => avg(c.members.map((m) => m.collectionLevel ?? 0).filter(Boolean)), 'high', { digits: 0 }),
        row('Active in 24 h', 'clock', (c) => c.members.filter((m) => m.hours < 24).length),
        row('Inactive 3+ days', 'alert', (c) => c.members.filter((m) => m.hours >= 72).length, 'low'),
        row('Donations this week', 'donation', (c) => c.members.reduce((a, m) => a + m.donations, 0)),
      ],
    },
    {
      title: 'River race',
      rows: [
        row('Races won (last 10)', 'crown', (c) => c.past.filter((p) => p.rank === 1).length),
        row('Average finish', 'trophy', (c) => avg(finishes(c)), 'low', { digits: 1 }),
        row('Average weekly fame', 'fame', (c) => avg(c.past.map((p) => p.fame)), 'high', { digits: 0 }),
        row('Average decks per race', 'cards', (c) => avg(c.past.map((p) => p.decksUsed)), 'high', { digits: 0 }),
        row('Current race fame', 'fame', (c) => c.race?.clans.find((x) => x.us)?.fame ?? null),
      ],
    },
  ];
}

export async function compare(kind: CompareKind, tags: string[]): Promise<Comparison> {
  // Only well-formed tags cost an API call; anything else is reported as missing.
  const wanted = [...new Set(tags.map((t) => t.replace('#', '').toUpperCase().slice(0, 15)).filter(Boolean))].slice(0, MAX_COMPARE);
  const list = wanted.filter((t) => checkTag(t).kind === 'valid');
  const invalid = wanted.filter((t) => !list.includes(t));
  if (kind === 'player') {
    const got = await Promise.all(list.map((t) => getPlayerProfile(t)));
    const ps = got.filter((p): p is PlayerProfile => !!p);
    return {
      kind,
      // A player's picture is their clan's badge, framed by the clan's league.
      entities: ps.map((p) => ({ tag: p.tag, name: p.name, sub: p.clan?.name ?? 'No clan', badgeId: p.clan?.badgeId, warTrophies: p.clan?.warTrophies, deck: p.deck })),
      missing: [...invalid, ...list.filter((_, i) => !got[i])],
      sections: ps.length ? players(ps) : [],
    };
  }
  // Compare needs member averages, so it waits for the member levels too.
  const got = await Promise.all(list.map(async (t) => {
    const [c, lv] = await Promise.all([getClanProfile(t), getMemberLevels(t)]);
    return c && withLevels(c, lv);
  }));
  const cs = got.filter((c): c is ClanProfile => !!c);
  return {
    kind,
    entities: cs.map((c) => ({ tag: c.tag, name: c.name, sub: c.location ?? `#${c.tag}`, badgeId: c.badgeId, warTrophies: c.clanWarTrophies })),
    missing: [...invalid, ...list.filter((_, i) => !got[i])],
    sections: cs.length ? clans(cs) : [],
  };
}

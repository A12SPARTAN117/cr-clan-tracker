/**
 * A clan's River Race league from its clan war trophies. Legendary II (4000) and III (5000) are
 * from Supercell's release notes; the lower thresholds are the in-game league screen's, worth
 * re-checking if Supercell moves them.
 */

export type LeagueKind = 'bronze' | 'silver' | 'gold' | 'legendary';
export type ClanLeague = { kind: LeagueKind; tier: 1 | 2 | 3; name: string; /** Frame colours, light to dark. */ colors: [string, string, string] };

const STEPS: [number, LeagueKind, 1 | 2 | 3][] = [
  [5000, 'legendary', 3],
  [4000, 'legendary', 2],
  [3000, 'legendary', 1],
  [2500, 'gold', 3],
  [2000, 'gold', 2],
  [1500, 'gold', 1],
  [1200, 'silver', 3],
  [900, 'silver', 2],
  [600, 'silver', 1],
  [400, 'bronze', 3],
  [200, 'bronze', 2],
  [0, 'bronze', 1],
];

const LABEL: Record<LeagueKind, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', legendary: 'Legendary' };
const COLORS: Record<LeagueKind, [string, string, string]> = {
  bronze: ['#f0b98a', '#c47a3e', '#6e3c16'],
  silver: ['#f4f7fb', '#a9b3c1', '#525c6a'],
  gold: ['#fff1b8', '#e6b34a', '#8a5a08'],
  legendary: ['#ffd6ff', '#b46cff', '#3d1478'],
};
const ROMAN = ['', 'I', 'II', 'III'];

export function clanLeague(warTrophies: number | null | undefined): ClanLeague | null {
  if (warTrophies == null || warTrophies < 0) return null;
  const [, kind, tier] = STEPS.find(([min]) => warTrophies >= min)!;
  return { kind, tier, name: `${LABEL[kind]} ${ROMAN[tier]}`, colors: COLORS[kind] };
}

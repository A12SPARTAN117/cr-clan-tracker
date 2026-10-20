/**
 * History from before a player was first looked up. The API has no history endpoint, but some
 * badges carry the past: YearsPlayed counts days since the account was made, seasonal badges
 * name the month they were earned, and event badges carry their year. Pure (no server code),
 * so the History tab can run it on the profile it already has.
 */

type BadgeLike = { id: string; level: number | null; maxLevel: number | null; progress: number | null };

export type Reconstructed = {
  /** From YearsPlayed: progress is the account's age in days (level is whole years). */
  playingSince: { date: string | null; days: number | null; years: number } | null;
  /** Seasonal trophy road badges, newest first. month = YYYY-MM. */
  seasons: { month: string; level: number | null; maxLevel: number | null }[];
  /** Years with a yearly badge (e.g. 2025YearBadge), newest first. */
  years: number[];
  /** Other badges whose name carries a year (events, CRL challenges), newest first. */
  dated: { year: number; label: string }[];
  /** Season-end leaderboard finishes counted by badges. */
  finishes: { label: string; count: number }[];
};

const FINISHES: Record<string, string> = {
  LadderTop1000: 'Ladder top 1,000 finishes',
  LadderTournamentTop1000: 'Global tournament top 1,000 finishes',
};

/** "Crl20Wins2022" → "CRL 20 Wins", "Royals2v2_2024" → "Royals 2v2", "GoblinJourney2024" → "Goblin Journey". */
export function datedBadgeLabel(id: string): string {
  return id
    .replace(/_?20\d\d_?/, ' ')
    .replace(/_v\d+$/, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])(?=[A-Z])/g, '$1 ')
    .replace(/([a-z])(?=\d)(?<!\dv)/g, '$1 ')
    .replace(/(\d)(?=[A-Z])/g, '$1 ')
    .replace(/^Crl\b/, 'CRL')
    .replace(/\s+/g, ' ')
    .trim();
}

export function reconstructFromBadges(badges: BadgeLike[], now: Date): Reconstructed {
  let playingSince: Reconstructed['playingSince'] = null;
  const seasons: Reconstructed['seasons'] = [];
  const years: number[] = [];
  const dated: Reconstructed['dated'] = [];
  const finishes: Reconstructed['finishes'] = [];

  for (const b of badges) {
    if (b.id === 'YearsPlayed') {
      const days = b.progress ?? null;
      playingSince = {
        date: days != null ? new Date(now.getTime() - days * 86400_000).toISOString() : null,
        days,
        years: days != null ? Math.floor(days / 365) : (b.level ?? 0),
      };
      continue;
    }
    const season = /^SeasonalBadge_(\d{4})(\d{2})(?:_v\d+)?$/.exec(b.id);
    if (season) {
      seasons.push({ month: `${season[1]}-${season[2]}`, level: b.level, maxLevel: b.maxLevel });
      continue;
    }
    const year = /^(20\d\d)YearBadge$/.exec(b.id);
    if (year) {
      years.push(+year[1]);
      continue;
    }
    if (FINISHES[b.id]) {
      if (b.progress) finishes.push({ label: FINISHES[b.id], count: b.progress });
      continue;
    }
    if (b.id.startsWith('Mastery')) continue;
    const y = /(?:^|\D)(20\d\d)(?!\d)/.exec(b.id);
    if (y) dated.push({ year: +y[1], label: datedBadgeLabel(b.id) });
  }

  return {
    playingSince,
    seasons: seasons.sort((a, b) => b.month.localeCompare(a.month)),
    years: years.sort((a, b) => b - a),
    dated: dated.sort((a, b) => b.year - a.year || a.label.localeCompare(b.label)),
    finishes,
  };
}

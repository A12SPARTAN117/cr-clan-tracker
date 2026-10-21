/**
 * Rising, falling and new decks: today's meta against a stored day a few days back. Pure, so
 * it's testable; src/lib/metaHistory.ts loads and stores the days.
 */

export type DeckNow = { key: string; name: string; games: number; use: number };
export type DeckThen = { deckKey: string; name: string; games: number; use: number };
export type Trend = { key: string; name: string; kind: 'rising' | 'falling' | 'new'; useNow: number; useThen: number | null; gamesNow: number; gamesThen: number };
export type ModeTrends = { since: string; rising: Trend[]; falling: Trend[]; fresh: Trend[] };

/** A deck needs this many games (now for rising and new, then for falling) to count. */
export const MIN_GAMES = 5;
/** And its share must move by at least this many percentage points… */
const MIN_POINTS = 0.5;
/** …and by at least this much relative to where it was. */
const MIN_RATIO = 1.4;

/** `since`: the day `then` was stored. */
export function trendsOf(now: DeckNow[], then: DeckThen[], since: string, limit = 6): ModeTrends {
  const before = new Map(then.map((d) => [d.deckKey, d]));
  const current = new Map(now.map((d) => [d.key, d]));
  const rising: Trend[] = [];
  const fresh: Trend[] = [];
  for (const d of now) {
    const b = before.get(d.key);
    if (!b) {
      if (d.games >= MIN_GAMES * 2) fresh.push({ key: d.key, name: d.name, kind: 'new', useNow: d.use, useThen: null, gamesNow: d.games, gamesThen: 0 });
    } else if (d.games >= MIN_GAMES && d.use - b.use >= MIN_POINTS && d.use >= b.use * MIN_RATIO) {
      rising.push({ key: d.key, name: d.name, kind: 'rising', useNow: d.use, useThen: b.use, gamesNow: d.games, gamesThen: b.games });
    }
  }
  const falling: Trend[] = [];
  for (const b of then) {
    const d = current.get(b.deckKey);
    const useNow = d?.use ?? 0;
    if (b.games >= MIN_GAMES && b.use - useNow >= MIN_POINTS && useNow * MIN_RATIO <= b.use) {
      falling.push({ key: b.deckKey, name: d?.name ?? b.name, kind: 'falling', useNow, useThen: b.use, gamesNow: d?.games ?? 0, gamesThen: b.games });
    }
  }
  const gain = (t: Trend) => t.useNow - (t.useThen ?? 0);
  return {
    since,
    rising: rising.sort((a, b) => gain(b) - gain(a)).slice(0, limit),
    falling: falling.sort((a, b) => gain(a) - gain(b)).slice(0, limit),
    fresh: fresh.sort((a, b) => b.gamesNow - a.gamesNow || b.useNow - a.useNow).slice(0, limit),
  };
}

/**
 * Which stored day to compare with: the one closest to three days before `today`, from the
 * stored days at least one day back and at most eight.
 */
export function compareDay(days: string[], today: string): string | null {
  const t = Date.parse(today);
  const ok = days.filter((d) => {
    const ago = (t - Date.parse(d)) / 86_400_000;
    return ago >= 1 && ago <= 8;
  });
  if (!ok.length) return null;
  return ok.sort((a, b) => Math.abs((t - Date.parse(a)) / 86_400_000 - 3) - Math.abs((t - Date.parse(b)) / 86_400_000 - 3))[0];
}

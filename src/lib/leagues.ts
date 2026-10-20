/** Path of Legends leagues as the live API numbers them (1–7); 7 is Ultimate Champion. */
export const POL_LEAGUES = ['Master I', 'Master II', 'Master III', 'Champion', 'Grand Champion', 'Royal Champion', 'Ultimate Champion'];
/**
 * Seasons before the current ladder had 10 leagues, Challenger I to Ultimate Champion. Those
 * convert to the live scale as n − 3, so the three Challenger leagues become −2, −1 and 0.
 */
const OLD_CHALLENGER = ['Challenger I', 'Challenger II', 'Challenger III'];
export const leagueName = (n: number | null | undefined) =>
  n == null ? 'No league' : n <= 0 ? (OLD_CHALLENGER[n + 2] ?? `League ${n}`) : (POL_LEAGUES[n - 1] ?? `League ${n}`);

/** A season result on the live scale. `atLeast`: the API's number fits two leagues; this is the lower. */
export type PolLeague = { league: number; atLeast: boolean };

/** "Champion", or "Champion or higher" when the API's number can't say which of two leagues. */
export const polLabel = (x: PolLeague) => `${leagueName(x.league)}${x.atLeast ? ' or higher' : ''}`;

/**
 * Puts a season result from the API on the live 1–7 scale. The API sends the league number in
 * whichever scale that season used and never says which:
 * - above 7 only exists on the old 10-league scale;
 * - a rating means Ultimate Champion on either scale (only the top league has one);
 * - the current and previous seasons are on the live scale;
 * - a best season of league 7 without a rating is the old scale's Champion (a live Ultimate
 *   Champion season always ends with a rating);
 * - an older best season is read on the live scale when the old reading would rank below a
 *   season the player has played since (a best can't be lower). When both readings fit, the
 *   result is the old (lower) one, marked `atLeast`, which is true either way.
 */
export function polLeague(league: number, rating: number, which: 'current' | 'last' | 'best', since: (number | null)[] = []): PolLeague {
  if (league > 7) return { league: league - 3, atLeast: false };
  if (rating > 0) return { league: 7, atLeast: false };
  if (which !== 'best') return { league, atLeast: false };
  if (league === 7) return { league: 4, atLeast: false };
  const floor = Math.max(...since.filter((x): x is number => x != null), -Infinity);
  return league - 3 < floor ? { league, atLeast: false } : { league: league - 3, atLeast: true };
}

// River race calendar. Each day resets at about 09:40 UTC (game "day" boundary).
// Monday–Wednesday are training days; Thursday–Sunday are war days 1–4.
const RESET_MIN = 9 * 60 + 40;

export type WarDay = { kind: 'training' | 'war'; day: number; label: string; nextReset: Date };

export function warDay(now: Date): WarDay {
  const shifted = new Date(now.getTime() - RESET_MIN * 60_000);
  const dow = shifted.getUTCDay(); // 0 = Sunday
  const nextReset = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() + 1, 0, RESET_MIN));
  const warIdx = { 4: 1, 5: 2, 6: 3, 0: 4 } as Record<number, number>;
  if (warIdx[dow]) return { kind: 'war', day: warIdx[dow], label: `River race day ${warIdx[dow]}`, nextReset };
  const trainIdx = { 1: 1, 2: 2, 3: 3 } as Record<number, number>;
  return { kind: 'training', day: trainIdx[dow] ?? 1, label: `River race · training day ${trainIdx[dow] ?? 1}`, nextReset };
}

export const WAR_DAYS = ['THU', 'FRI', 'SAT', 'SUN'] as const;

/**
 * The race week a moment belongs to, as the UTC date (YYYY-MM-DD) of its first war day
 * (Thursday). Works for "now" during a race and for a race-log entry's end time (Monday).
 */
export function warWeekKey(at: Date): string {
  const shifted = new Date(at.getTime() - RESET_MIN * 60_000 - 60_000);
  const back = (shifted.getUTCDay() - 4 + 7) % 7;
  const thu = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() - back));
  return thu.toISOString().slice(0, 10);
}

/** Battle types the river race produces. On training days these are practice and don't count. */
export const RIVER_TYPES = new Set(['riverRacePvP', 'riverRaceDuel', 'riverRaceDuelColosseum', 'boatBattle']);

/**
 * Whether a battle counts as war: a river race battle played on a war day (Thu–Sun).
 * River race battles on Mon–Wed are training and return 'training'; anything else null.
 */
export function riverBattleKind(type: string, at: Date | null): 'war' | 'training' | null {
  if (!RIVER_TYPES.has(type)) return null;
  if (!at) return 'war';
  return warDay(at).kind === 'war' ? 'war' : 'training';
}

/** When the next war day (Thursday reset) begins; `now` itself if a war day is running. */
export function nextWarStart(now: Date): Date {
  const d = warDay(now);
  if (d.kind === 'war') return now;
  // Training day N ends at nextReset; war day 1 starts after the remaining training days.
  return new Date(d.nextReset.getTime() + (3 - d.day) * 86400_000);
}

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
  return { kind: 'training', day: trainIdx[dow] ?? 1, label: `Training day ${trainIdx[dow] ?? 1}`, nextReset };
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

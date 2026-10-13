// Asset Score: each factor is 0–100; the score is their weighted average.
// Pure functions, shared by server (defaults) and client (editable weights).

export const FACTORS = ['war', 'don', 'act', 'bat', 'ten'] as const;
export type Factor = (typeof FACTORS)[number];
export type Weights = Record<Factor, number>;
export type FactorScores = Record<Factor, number>;

export const DEFAULT_WEIGHTS: Weights = { war: 35, don: 20, act: 20, bat: 15, ten: 10 };

export const FACTOR_INFO: Record<Factor, { label: string; color: string; hint: string }> = {
  war: { label: 'War', color: 'var(--blue)', hint: 'Decks used this week + tracked races' },
  don: { label: 'Donations', color: 'var(--text-1)', hint: 'Cards donated this week' },
  act: { label: 'Activity', color: 'var(--text-2)', hint: 'Hours since last seen' },
  bat: { label: 'Win rate', color: 'var(--text-3)', hint: 'War battle win % (tracked battles)' },
  ten: { label: 'Tenure', color: '#4a4e57', hint: 'Days in clan, maxes at 1 year' },
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export type ScoreInputs = {
  /** Decks used this week. */
  decks: number;
  /** Decks possible so far this week (4 per war day elapsed), 0 on training days. */
  decksPossible: number;
  /** Decks used / possible in the last completed race, used on training days. */
  lastRaceRatio: number | null;
  /** Total decks / (16 × races present) over tracked races; null if none. */
  participation: number | null;
  donations: number;
  hoursSinceSeen: number;
  /** War battle win rate 0–100 from the battle log; null if no war battles. */
  warWin: number | null;
  tenureDays: number;
};

export function activityScore(h: number): number {
  if (h < 24) return 100;
  if (h < 72) return Math.round(100 - (h - 24) * 0.8);
  return Math.max(0, Math.round(58 - (h - 72) / 5));
}

export function factorScores(m: ScoreInputs): FactorScores {
  const week = m.decksPossible > 0 ? m.decks / m.decksPossible : (m.lastRaceRatio ?? 0);
  const hist = m.participation ?? week;
  return {
    war: Math.round(clamp(week * 60 + hist * 40)),
    don: Math.round(clamp(m.donations / 7.5)),
    act: activityScore(m.hoursSinceSeen),
    // No tracked war battles: neutral 50 so the member is neither helped nor hurt.
    bat: m.warWin == null ? 50 : Math.round(clamp(((m.warWin - 30) / 45) * 100)),
    ten: Math.round(clamp(m.tenureDays / 3.65)),
  };
}

export function weightSum(w: Weights): number {
  return FACTORS.reduce((a, k) => a + w[k], 0) || 1;
}

export function assetScore(f: FactorScores, w: Weights): number {
  const s = weightSum(w);
  return Math.round(FACTORS.reduce((a, k) => a + f[k] * w[k], 0) / s);
}

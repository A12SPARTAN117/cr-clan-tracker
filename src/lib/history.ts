import 'server-only';

/**
 * Clan history built from our own snapshots (the official API is current-state only).
 * Backed by Postgres once DATABASE_URL is set; until then every reader gets null and
 * pages show their "Data since" / partial states.
 */

export type RosterEventKind = 'joined' | 'left' | 'kicked' | 'promoted' | 'demoted';

export type RosterEvent = {
  at: string; // ISO
  tag: string;
  name: string;
  kind: RosterEventKind;
  /** e.g. "to Elder" for promotions. */
  detail?: string;
};

export type ClanHistory = {
  /** When this clan was first snapshotted. */
  trackedSince: string;
  /** Member tag → first time we saw them in the clan (ISO). */
  firstSeen: Record<string, string>;
  rosterEvents: RosterEvent[];
  /** Race key "season:section" → member tag → decks per war day (null = not tracked). */
  dailyDecks: Record<string, Record<string, (number | null)[]>>;
  /** Member tag → trophies at the start of the last 7 days (for the trend column). */
  trophiesWeekAgo: Record<string, number>;
};

export async function getClanHistory(tag: string): Promise<ClanHistory | null> {
  void tag;
  return null;
}

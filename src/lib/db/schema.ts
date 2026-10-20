import { date, index, integer, pgTable, primaryKey, serial, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * History the official API cannot give us, built from our own snapshots.
 * Tags are stored without the leading '#', upper case.
 */

/** Clans we snapshot. A clan is tracked from the first time its dashboard is opened. */
export const trackedClans = pgTable('tracked_clans', {
  tag: text('tag').primaryKey(),
  name: text('name').notNull(),
  trackedSince: timestamp('tracked_since', { withTimezone: true }).notNull().defaultNow(),
  lastSnapshotAt: timestamp('last_snapshot_at', { withTimezone: true }),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Everyone we have seen in a tracked clan. leftAt is set once they disappear from the roster. */
export const clanMembers = pgTable(
  'clan_members',
  {
    clanTag: text('clan_tag').notNull(),
    playerTag: text('player_tag').notNull(),
    name: text('name').notNull(),
    role: text('role').notNull(),
    /** True only for members already present at the clan's first snapshot (join date unknown). */
    baseline: integer('baseline').notNull().default(0),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenInClanAt: timestamp('last_seen_in_clan_at', { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp('left_at', { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.clanTag, t.playerTag] })],
);

/** Joins, leaves and role changes, newest first when read. */
export const rosterEvents = pgTable(
  'roster_events',
  {
    id: serial('id').primaryKey(),
    clanTag: text('clan_tag').notNull(),
    playerTag: text('player_tag').notNull(),
    name: text('name').notNull(),
    kind: text('kind').notNull(), // joined | left | kicked | promoted | demoted
    detail: text('detail'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('roster_events_clan_at').on(t.clanTag, t.at)],
);

/** One row per member per UTC day: trophies and weekly donations at the last snapshot of the day. */
export const memberDaily = pgTable(
  'member_daily',
  {
    clanTag: text('clan_tag').notNull(),
    playerTag: text('player_tag').notNull(),
    day: date('day').notNull(),
    trophies: integer('trophies').notNull(),
    donations: integer('donations').notNull(),
  },
  (t) => [primaryKey({ columns: [t.clanTag, t.playerTag, t.day] }), index('member_daily_player').on(t.playerTag, t.day)],
);

/**
 * Players we snapshot on their own, whatever clan they are in. A player is tracked from the
 * first time their profile is opened; the cron keeps a daily snapshot while it keeps being viewed.
 */
export const trackedPlayers = pgTable('tracked_players', {
  tag: text('tag').primaryKey(),
  name: text('name').notNull(),
  trackedSince: timestamp('tracked_since', { withTimezone: true }).notNull().defaultNow(),
  lastSnapshotAt: timestamp('last_snapshot_at', { withTimezone: true }),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }).notNull().defaultNow(),
});

/** One row per tracked player per UTC day: their profile at the last snapshot of the day. */
export const playerDaily = pgTable(
  'player_daily',
  {
    playerTag: text('player_tag').notNull(),
    day: date('day').notNull(),
    trophies: integer('trophies').notNull(),
    /** The month's seasonal trophy road (above 14,000); null when they haven't reached it. */
    seasonalTrophies: integer('seasonal_trophies'),
    polLeague: integer('pol_league'),
    polRating: integer('pol_rating'),
    polRank: integer('pol_rank'),
    wins: integer('wins').notNull(),
    battleCount: integer('battle_count').notNull(),
    collectionLevel: integer('collection_level'),
  },
  (t) => [primaryKey({ columns: [t.playerTag, t.day] })],
);

/**
 * War decks per member per war day. week = date (YYYY-MM-DD) of the race week's first war
 * day (Thursday). Each snapshot keeps the highest decksUsedToday seen for that day.
 */
export const warDays = pgTable(
  'war_days',
  {
    clanTag: text('clan_tag').notNull(),
    playerTag: text('player_tag').notNull(),
    week: date('week').notNull(),
    day: integer('day').notNull(), // 1–4
    decks: integer('decks').notNull(),
  },
  (t) => [primaryKey({ columns: [t.clanTag, t.playerTag, t.week, t.day] })],
);

/**
 * Player directory for name search (the API can only look players up by tag). Filled from
 * every roster and profile the site fetches, so it grows with use.
 */
export const players = pgTable(
  'players',
  {
    tag: text('tag').primaryKey(),
    name: text('name').notNull(),
    /** Lower-cased name for case-insensitive search. */
    nameLower: text('name_lower').notNull(),
    clanTag: text('clan_tag'),
    clanName: text('clan_name'),
    trophies: integer('trophies'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  // Name search ("contains") uses the trigram index players_name_trgm, created by hand in
  // drizzle/0002_players_name_trigram.sql because drizzle can't declare gin_trgm_ops.
  (t) => [index('players_name_lower').on(t.nameLower)],
);

/**
 * Player badge art seen on profiles: each badge has its own image per level, and the API only
 * hands out the level a player owns, so this fills in as players are looked up. The asset
 * checklist (scripts/asset-checklist.mjs) reads it and saves copies of the levels we still need.
 */
export const badgeArt = pgTable(
  'badge_art',
  {
    name: text('name').notNull(),
    level: integer('level').notNull(),
    maxLevel: integer('max_level'),
    url: text('url').notNull(),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.name, t.level] })],
);

/**
 * Event leaderboards and when their standings last moved. The API lists boards from events that
 * ended long ago next to live ones, with nothing to tell them apart, so a board counts as live
 * while its standings keep changing (see src/lib/events.ts).
 */
export const eventBoards = pgTable('event_boards', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  /** The top of the board (tag:score…) when last checked. */
  sig: text('sig').notNull(),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  /** Null until the standings are seen to change. */
  changedAt: timestamp('changed_at', { withTimezone: true }),
});

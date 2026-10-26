import { date, index, integer, jsonb, pgTable, primaryKey, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * History the official API cannot give us, built from our own snapshots.
 * Tags are stored without the leading '#', upper case.
 */

/** Clans we snapshot. A clan is tracked from the first time its dashboard is opened. */
export const trackedClans = pgTable(
  'tracked_clans',
  {
    tag: text('tag').primaryKey(),
    name: text('name').notNull(),
    trackedSince: timestamp('tracked_since', { withTimezone: true }).notNull().defaultNow(),
    lastSnapshotAt: timestamp('last_snapshot_at', { withTimezone: true }),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  // The snapshot job picks clans viewed recently.
  (t) => [index('tracked_clans_viewed').on(t.lastViewedAt)],
);

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
  // The second index serves a player's clan history (getPlayerHistory), which has no clan tag.
  (t) => [primaryKey({ columns: [t.clanTag, t.playerTag] }), index('clan_members_player').on(t.playerTag)],
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
export const trackedPlayers = pgTable(
  'tracked_players',
  {
    tag: text('tag').primaryKey(),
    name: text('name').notNull(),
    trackedSince: timestamp('tracked_since', { withTimezone: true }).notNull().defaultNow(),
    lastSnapshotAt: timestamp('last_snapshot_at', { withTimezone: true }),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  // The snapshot job picks players viewed recently and not snapshotted today.
  (t) => [index('tracked_players_viewed').on(t.lastViewedAt, t.lastSnapshotAt)],
);

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
    /** River race battle wins (the Clan War Wins badge), for war-win goals. Null on older rows. */
    warWins: integer('war_wins'),
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
  (t) => [primaryKey({ columns: [t.clanTag, t.playerTag, t.week, t.day] }), index('war_days_player').on(t.playerTag, t.week)],
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

/**
 * 1v1 battles of players whose profile has been opened, kept past the API's ~40-battle log so
 * head-to-head records (Rivals) can grow. Saved on each profile view and by the daily snapshot.
 */
export const playerBattles = pgTable(
  'player_battles',
  {
    playerTag: text('player_tag').notNull(),
    battleTime: timestamp('battle_time', { withTimezone: true }).notNull(),
    oppTag: text('opp_tag').notNull(),
    oppName: text('opp_name').notNull(),
    oppClan: text('opp_clan'),
    /** The player page's battle kind: ladder, ranked, friendly, war, training… */
    kind: text('kind').notNull(),
    /** 1 win, 0 draw, -1 loss (duels by rounds). */
    result: integer('result').notNull(),
    crowns: integer('crowns').notNull(),
    oppCrowns: integer('opp_crowns').notNull(),
    // The rest is null on games stored before these were kept.
    /** Elixir the player wasted at full elixir. */
    elixirLeaked: real('elixir_leaked'),
    /** Hit points left on each side's surviving towers, king first ("7728,4337,4629"); "" when none. */
    towers: text('towers'),
    oppTowers: text('opp_towers'),
    /** The player's deck: card ids, "e" after an evo slot, "h" after a hero slot. */
    deck: text('deck'),
    /** Opponent's average card level minus the player's (in-game levels; + means out-levelled). */
    levelGap: real('level_gap'),
  },
  (t) => [primaryKey({ columns: [t.playerTag, t.battleTime] }), index('player_battles_opp').on(t.playerTag, t.oppTag)],
);

/**
 * A player's names and clans over time: one row per stretch with the same name and clan, from
 * every profile, daily snapshot and tracked-clan roster the site sees.
 */
export const playerIdentity = pgTable(
  'player_identity',
  {
    id: serial('id').primaryKey(),
    tag: text('tag').notNull(),
    name: text('name').notNull(),
    clanTag: text('clan_tag'),
    clanName: text('clan_name'),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('player_identity_tag').on(t.tag, t.lastSeenAt)],
);

/**
 * Each day's meta (the last snapshot of the UTC day): every deck's games, wins and share of its
 * mode, so the Decks page can show what's rising, falling and new.
 */
export const metaDaily = pgTable(
  'meta_daily',
  {
    day: date('day').notNull(),
    mode: text('mode').notNull(),
    deckKey: text('deck_key').notNull(),
    name: text('name').notNull(),
    games: integer('games').notNull(),
    wins: integer('wins').notNull(),
    /** Share of the mode's decks, in percent (the Decks page's "use"). */
    use: real('use').notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.mode, t.deckKey] })],
);

/**
 * The decks the top Path of Legends players carry, one row per stretch with the same deck, so the
 * Pro tracker could show when a pro switched. The Pro tracker was removed (2026-10-23) and nothing
 * writes here any more; the table and its history are kept.
 */
export const proDecks = pgTable(
  'pro_decks',
  {
    id: serial('id').primaryKey(),
    tag: text('tag').notNull(),
    name: text('name').notNull(),
    deckKey: text('deck_key').notNull(),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    rank: integer('rank'),
    rating: integer('rating'),
  },
  (t) => [index('pro_decks_tag').on(t.tag, t.lastSeenAt)],
);

/**
 * Snapshots that are the same for every visitor (the meta decks, …), built by the cron job and
 * read by pages, so a page view never calls the Clash Royale API for them. `kind` names the
 * snapshot; pages read the newest row of their kind.
 */
export const sharedSnapshots = pgTable(
  'shared_snapshots',
  {
    id: serial('id').primaryKey(),
    kind: text('kind').notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull(),
    data: jsonb('data').notNull(),
  },
  (t) => [index('shared_snapshots_kind').on(t.kind, t.generatedAt)],
);

/**
 * The last good slim profile (lib/player/lite) of each player whose page was opened, so the page
 * can still show them, marked with its age, while the Clash Royale API is busy or failing.
 * Rows untouched for 30 days are pruned by the snapshot job.
 */
export const playerSnapshots = pgTable('player_snapshots', {
  tag: text('tag').primaryKey(),
  data: jsonb('data').notNull(),
  savedAt: timestamp('saved_at', { withTimezone: true }).notNull(),
});

/**
 * Kill switches (lib/switches): a row here turns that feature off within about 30 seconds,
 * without a redeploy. Delete the row to turn it back on.
 */
export const siteSwitches = pgTable('site_switches', {
  name: text('name').primaryKey(),
  note: text('note'),
  switchedOffAt: timestamp('switched_off_at', { withTimezone: true }).notNull().defaultNow(),
});

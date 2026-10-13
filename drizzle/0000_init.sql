CREATE TABLE "clan_members" (
	"clan_tag" text NOT NULL,
	"player_tag" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"baseline" integer DEFAULT 0 NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_in_clan_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	CONSTRAINT "clan_members_clan_tag_player_tag_pk" PRIMARY KEY("clan_tag","player_tag")
);
--> statement-breakpoint
CREATE TABLE "member_daily" (
	"clan_tag" text NOT NULL,
	"player_tag" text NOT NULL,
	"day" date NOT NULL,
	"trophies" integer NOT NULL,
	"donations" integer NOT NULL,
	CONSTRAINT "member_daily_clan_tag_player_tag_day_pk" PRIMARY KEY("clan_tag","player_tag","day")
);
--> statement-breakpoint
CREATE TABLE "roster_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"clan_tag" text NOT NULL,
	"player_tag" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"detail" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracked_clans" (
	"tag" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tracked_since" timestamp with time zone DEFAULT now() NOT NULL,
	"last_snapshot_at" timestamp with time zone,
	"last_viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "war_days" (
	"clan_tag" text NOT NULL,
	"player_tag" text NOT NULL,
	"week" date NOT NULL,
	"day" integer NOT NULL,
	"decks" integer NOT NULL,
	CONSTRAINT "war_days_clan_tag_player_tag_week_day_pk" PRIMARY KEY("clan_tag","player_tag","week","day")
);
--> statement-breakpoint
CREATE INDEX "member_daily_player" ON "member_daily" USING btree ("player_tag","day");--> statement-breakpoint
CREATE INDEX "roster_events_clan_at" ON "roster_events" USING btree ("clan_tag","at");
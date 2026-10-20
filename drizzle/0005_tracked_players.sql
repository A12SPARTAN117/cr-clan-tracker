CREATE TABLE "player_daily" (
	"player_tag" text NOT NULL,
	"day" date NOT NULL,
	"trophies" integer NOT NULL,
	"seasonal_trophies" integer,
	"pol_league" integer,
	"pol_rating" integer,
	"pol_rank" integer,
	"wins" integer NOT NULL,
	"battle_count" integer NOT NULL,
	"collection_level" integer,
	CONSTRAINT "player_daily_player_tag_day_pk" PRIMARY KEY("player_tag","day")
);
--> statement-breakpoint
CREATE TABLE "tracked_players" (
	"tag" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tracked_since" timestamp with time zone DEFAULT now() NOT NULL,
	"last_snapshot_at" timestamp with time zone,
	"last_viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);

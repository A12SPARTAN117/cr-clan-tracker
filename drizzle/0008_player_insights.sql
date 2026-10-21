CREATE TABLE "player_identity" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag" text NOT NULL,
	"name" text NOT NULL,
	"clan_tag" text,
	"clan_name" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "player_battles" ADD COLUMN "elixir_leaked" real;--> statement-breakpoint
ALTER TABLE "player_battles" ADD COLUMN "towers" text;--> statement-breakpoint
ALTER TABLE "player_battles" ADD COLUMN "opp_towers" text;--> statement-breakpoint
ALTER TABLE "player_battles" ADD COLUMN "deck" text;--> statement-breakpoint
ALTER TABLE "player_battles" ADD COLUMN "level_gap" real;--> statement-breakpoint
ALTER TABLE "player_daily" ADD COLUMN "war_wins" integer;--> statement-breakpoint
CREATE INDEX "player_identity_tag" ON "player_identity" USING btree ("tag","last_seen_at");
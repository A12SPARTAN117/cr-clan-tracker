CREATE TABLE "player_battles" (
	"player_tag" text NOT NULL,
	"battle_time" timestamp with time zone NOT NULL,
	"opp_tag" text NOT NULL,
	"opp_name" text NOT NULL,
	"opp_clan" text,
	"kind" text NOT NULL,
	"result" integer NOT NULL,
	"crowns" integer NOT NULL,
	"opp_crowns" integer NOT NULL,
	CONSTRAINT "player_battles_player_tag_battle_time_pk" PRIMARY KEY("player_tag","battle_time")
);
--> statement-breakpoint
CREATE INDEX "player_battles_opp" ON "player_battles" USING btree ("player_tag","opp_tag");
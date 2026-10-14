CREATE TABLE "players" (
	"tag" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_lower" text NOT NULL,
	"clan_tag" text,
	"clan_name" text,
	"trophies" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "players_name_lower" ON "players" USING btree ("name_lower");
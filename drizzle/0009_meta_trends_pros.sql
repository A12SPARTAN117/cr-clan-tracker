CREATE TABLE "meta_daily" (
	"day" date NOT NULL,
	"mode" text NOT NULL,
	"deck_key" text NOT NULL,
	"name" text NOT NULL,
	"games" integer NOT NULL,
	"wins" integer NOT NULL,
	"use" real NOT NULL,
	CONSTRAINT "meta_daily_day_mode_deck_key_pk" PRIMARY KEY("day","mode","deck_key")
);
--> statement-breakpoint
CREATE TABLE "pro_decks" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag" text NOT NULL,
	"name" text NOT NULL,
	"deck_key" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rank" integer,
	"rating" integer
);
--> statement-breakpoint
CREATE INDEX "pro_decks_tag" ON "pro_decks" USING btree ("tag","last_seen_at");
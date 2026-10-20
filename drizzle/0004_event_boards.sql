CREATE TABLE "event_boards" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sig" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_at" timestamp with time zone
);

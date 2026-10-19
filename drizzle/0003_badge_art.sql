CREATE TABLE "badge_art" (
	"name" text NOT NULL,
	"level" integer NOT NULL,
	"max_level" integer,
	"url" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badge_art_name_level_pk" PRIMARY KEY("name","level")
);

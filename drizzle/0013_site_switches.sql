CREATE TABLE "site_switches" (
	"name" text PRIMARY KEY NOT NULL,
	"note" text,
	"switched_off_at" timestamp with time zone DEFAULT now() NOT NULL
);

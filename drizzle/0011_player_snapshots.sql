CREATE TABLE "player_snapshots" (
	"tag" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"saved_at" timestamp with time zone NOT NULL
);

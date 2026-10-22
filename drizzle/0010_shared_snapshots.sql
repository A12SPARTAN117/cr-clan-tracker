CREATE TABLE "shared_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "shared_snapshots_kind" ON "shared_snapshots" USING btree ("kind","generated_at");
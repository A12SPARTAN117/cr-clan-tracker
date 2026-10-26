CREATE INDEX "clan_members_player" ON "clan_members" USING btree ("player_tag");--> statement-breakpoint
CREATE INDEX "tracked_clans_viewed" ON "tracked_clans" USING btree ("last_viewed_at");--> statement-breakpoint
CREATE INDEX "tracked_players_viewed" ON "tracked_players" USING btree ("last_viewed_at","last_snapshot_at");--> statement-breakpoint
CREATE INDEX "war_days_player" ON "war_days" USING btree ("player_tag","week");
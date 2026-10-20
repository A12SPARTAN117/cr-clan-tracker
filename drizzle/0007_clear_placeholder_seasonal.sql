-- The API sends players below 14,000 Trophy Road trophies a placeholder seasonal-road entry
-- (14,000, best 0). Early daily snapshots saved it as their seasonal trophies; clear those rows.
UPDATE "player_daily" SET "seasonal_trophies" = NULL WHERE "trophies" < 14000 AND "seasonal_trophies" IS NOT NULL;

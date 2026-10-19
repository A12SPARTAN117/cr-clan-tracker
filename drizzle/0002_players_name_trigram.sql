-- Trigram index for name search: the directory matches names that *contain* the text
-- (LIKE '%…%'), which a btree index can't help with, so search slowed as the table grew
-- (about 0.8 s at 3 million players). With this it stays around a millisecond.
-- Written by hand (drizzle can't declare gin_trgm_ops). Hosts that don't allow the pg_trgm
-- extension skip the index instead of failing; search still works there, just slower.
DO $$
BEGIN
	CREATE EXTENSION IF NOT EXISTS pg_trgm;
	CREATE INDEX IF NOT EXISTS "players_name_trgm" ON "players" USING gin ("name_lower" gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
	RAISE NOTICE 'pg_trgm unavailable (%), name search will scan the players table', SQLERRM;
END
$$;

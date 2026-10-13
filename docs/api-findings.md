# Clash Royale API — verified findings

Tested against the live API through the RoyaleAPI proxy (`https://proxy.royaleapi.dev/v1`) on 2026-10-13.

## Works

| Endpoint | Notes |
|---|---|
| `GET /cards` | 123 cards in `items`, 4 tower troops in `supportItems` |
| `GET /players/{tag}` | Full profile: stats, badges (~140+), achievements, cards, tower troops, current deck, Path of Legends results, game-mode `progress` |
| `GET /players/{tag}/battlelog` | Last **~30 battles** only |
| `GET /players/{tag}/upcomingchests` | Works |
| `GET /clans/{tag}` | Clan info + `memberList` (role, lastSeen, trophies, donations, clanChestPoints) |
| `GET /clans/{tag}/currentriverrace` | Per-participant `fame`, `repairPoints`, `boatAttacks`, `decksUsed`, `decksUsedToday` |
| `GET /clans/{tag}/riverracelog` | Last ~10 river races (may be empty for some clans) |
| `GET /locations/{id}/pathoflegend/players` | Ranked (Path of Legends) leaderboard |
| `GET /locations/{id}/rankings/clans` | Clan trophy leaderboard |
| `GET /locations/{id}/rankings/clanwars` | Clan war leaderboard |
| `GET /leaderboards` | Event leaderboards (2v2 League, Merge Tactics, etc.) |
| `GET /globaltournaments` | Works (often empty) |

## Doesn't work / not available

| Item | Status |
|---|---|
| `GET /locations/{id}/rankings/players` (trophy ladder) | Returns empty `items` — trophy leaderboard is gone; use Path of Legends instead |
| `GET /clans/{tag}/warlog` (Clan Wars 1) | 404 — CW1 history is not possible |
| `GET /challenges` | 404 |
| Emotes | Not in the API. Only the `EmoteCollection` badge (count of emotes owned) is available |
| Any historical data | API is current-state only. Clan/trophy/PoL/war history must be built from our own snapshots |

## Tags

Player and clan tags share one character set (`0289PYLQGRJCUV`) **and can collide**: `#GJ8R2Q8U` is both a player and a clan. Tag length does not tell them apart either. The site's search (`/t/{tag}`) asks both endpoints and shows a chooser when both exist.

## Evolutions & Heroes

Each card has `maxEvolutionLevel` and (on a player's card) `evolutionLevel`. Values:

| Value | Meaning | Example |
|---|---|---|
| `1` | Evolution only | Archers, P.E.K.K.A, Zap |
| `2` | Hero only | Giant, Mini P.E.K.K.A, Goblins, Ice Golem |
| `3` | Evolution **and** Hero | Knight, Valkyrie, Musketeer, Wizard |

Icon URLs: `iconUrls.medium` (normal), `iconUrls.evolutionMedium`, `iconUrls.heroMedium`.

## Battle types relevant to clan tracking

Battle log entries have a `type` (e.g. `pathOfLegend`, `PvP`, `clanMate`, `riverRacePvP`, `riverRaceDuel`, `boatBattle`). `clanMate` = friendly 1v1 inside the clan; `riverRace*` / `boatBattle` = war battles. Because the log only keeps ~30 battles, members must be polled regularly (every 30–60 min) to build complete stats.

## RoyaleAPI open-source resources

Fetched by `node scripts/fetch-royaleapi-assets.mjs` into `vendor/` (gitignored). RoyaleAPI asks that the repo is cloned, not hotlinked as a CDN.

| Source | What we use it for |
|---|---|
| [cr-api-assets](https://github.com/RoyaleAPI/cr-api-assets) `chr/`, `chr_champions/` | Transparent troop character renders for page scenes |
| `arenas/` (`league0`–`league10`, `arenaN`) | Path of Legends league icons, arena icons |
| `badges/` | Clan badge images. API `badgeId` → file via `data/clan-badges.json` |
| `cards/` | Card art incl. combined hero + evolution (`*-hero-ev1.png`). Missing some newer heroes, so official API art stays primary |
| `chests/`, `trade-tokens/` | Misc UI art |
| [cr-api-data](https://github.com/RoyaleAPI/cr-api-data) `alliance_badges.json` | Badge id → image name |
| `game_modes.json` | Battle log `gameMode` ids → readable mode names (Ladder, 2v2, Challenges…) |
| `arenas.json`, `rarities.json` | Arena/league metadata, rarity level offsets |
| `cards.json` | Card descriptions (last updated 2023, so newer cards are missing) |
| `emotes.json` | Emote list (no emote images available) |

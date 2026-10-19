# Clash Royale asset checklist

_Generated 2026-10-19 by `node scripts/asset-checklist.mjs` from 3,252 real players in 196 clans, the official API and RoyaleAPI's game data. Re-run it each season._

✅ = the site already has this art (nothing to do). ⬜ = please find it. Save transparent PNGs (256 px or larger) **at the exact path shown**, and tell me when a batch is in. The same list is in `docs/asset-checklist.csv` for ticking off in a spreadsheet.

**Best sources:** the Supercell Fan Kit (fankit.supercell.com → Clash Royale) for official art, and the Clash Royale Fandom wiki galleries for badges, emotes, arenas and cosmetics.

## Summary

| What | Total | Already have | To find |
|---|---|---|---|
| Player badge | 1612 | 1122 | 490 |
| Emote | 236 | 0 | 236 |
| Magic item | 17 | 0 | 17 |
| Chest | 31 | 19 | 12 |
| Arena | 106 | 28 | 78 |
| Game mode icon | 22 | 0 | 22 |
| Card | 123 | 123 | 0 |
| Card evolution | 43 | 43 | 0 |
| Card hero | 18 | 18 | 0 |
| Tower troop | 4 | 4 | 0 |
| Clan badge | 180 | 180 | 0 |
| Currencies & resources | 16 | 2 | 14 |
| Site icons (drawn by us today) | 7 | 0 | 7 |
| Clan roles | 4 | 0 | 4 |
| Clan war leagues (frames) | 12 | 0 | 12 |
| Card frames & levels | 5 | 0 | 5 |

**2,436 assets in total: 1,539 already on the site, 897 to find.**

## 1. Player badges

Every badge held by the 3,252 players sampled. **Each level has its own art** (mastery frames, the ×10 → ×100 laurels…), so a badge with 10 levels is 10 images. "Have" lists the levels we already load from the official API or have saved a copy of. **These fill in by themselves:** whenever anyone opens a profile, the site records each badge level's art, and the next run of this script saves a copy of every level still missing (172 levels recorded so far). Badges nobody has shown yet (very old or very rare ones) aren't listed; add any you know of as `<Name>_L<level>.png`.

### Achievements & milestones (15)

| Badge | Internal name | Levels | Have | Need | Save as |
|---|---|---|---|---|---|
| 2v2 | `2v2` | 7 | 1, 2, 3, 4, 5, 6, 7 | — | all set |
| 2x Elixir | `2xElixir` | 7 | 1, 2, 3, 4, 5 | 6, 7 | `public/player-badges/2xElixir_L<level>.png` |
| Banner Collection | `BannerCollection` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | — | all set |
| Battle Wins | `BattleWins` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | — | all set |
| Clan Donations | `ClanDonations` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | — | all set |
| Clan Wars Veteran | `ClanWarsVeteran` | 3 | 1, 2, 3 | — | all set |
| Clan War Wins | `ClanWarWins` | 8 | 1, 2, 3, 4, 5, 6, 7 | 8 | `public/player-badges/ClanWarWins_L<level>.png` |
| Classic 12 Wins | `Classic12Wins` | 8 | 1, 2, 3, 4, 5, 6 | 7, 8 | `public/player-badges/Classic12Wins_L<level>.png` |
| Collection Level | `CollectionLevel` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | — | all set |
| Draft | `Draft` | 7 | 1, 2, 3, 4, 5, 6, 7 | — | all set |
| Emote Collection | `EmoteCollection` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | — | all set |
| Grand 12 Wins | `Grand12Wins` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | — | all set |
| Ramp Up | `RampUp` | 7 | 1, 2, 3, 4, 5 | 6, 7 | `public/player-badges/RampUp_L<level>.png` |
| Sudden Death | `SuddenDeath` | 7 | 1, 2, 3, 4, 5, 6, 7 | — | all set |
| Years Played | `YearsPlayed` | 11 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | 11 | `public/player-badges/YearsPlayed_L<level>.png` |

### Card mastery (123)

| Badge | Internal name | Levels | Have | Need | Save as |
|---|---|---|---|---|---|
| Mastery: Angry Barbarians | `MasteryAngryBarbarians` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryAngryBarbarians_L<level>.png` |
| Mastery: Archer | `MasteryArcher` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryArcher_L<level>.png` |
| Mastery: Archer Queen | `MasteryArcherQueen` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryArcherQueen_L<level>.png` |
| Mastery: Arrows | `MasteryArrows` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Assassin | `MasteryAssassin` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryAssassin_L<level>.png` |
| Mastery: Axe Man | `MasteryAxeMan` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryAxeMan_L<level>.png` |
| Mastery: Baby Dragon | `MasteryBabyDragon` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Balloon | `MasteryBalloon` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Barbarian Hut | `MasteryBarbarianHut` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryBarbarianHut_L<level>.png` |
| Mastery: Barbarians | `MasteryBarbarians` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryBarbarians_L<level>.png` |
| Mastery: Barb Log | `MasteryBarbLog` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryBarbLog_L<level>.png` |
| Mastery: Bats | `MasteryBats` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryBats_L<level>.png` |
| Mastery: Battle Healer | `MasteryBattleHealer` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Battle Ram | `MasteryBattleRam` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Berserker | `MasteryBerserker` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryBerserker_L<level>.png` |
| Mastery: Blowdart Goblin | `MasteryBlowdartGoblin` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Bomber | `MasteryBomber` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryBomber_L<level>.png` |
| Mastery: Bomb Tower | `MasteryBombTower` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryBombTower_L<level>.png` |
| Mastery: Boss Bandit | `MasteryBossBandit` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryBossBandit_L<level>.png` |
| Mastery: Bowler | `MasteryBowler` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Cannon | `MasteryCannon` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryCannon_L<level>.png` |
| Mastery: Clone | `MasteryClone` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryClone_L<level>.png` |
| Mastery: Dark Magic | `MasteryDarkMagic` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryDarkMagic_L<level>.png` |
| Mastery: Dark Prince | `MasteryDarkPrince` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryDarkPrince_L<level>.png` |
| Mastery: Dark Witch | `MasteryDarkWitch` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryDarkWitch_L<level>.png` |
| Mastery: Dart Barrell | `MasteryDartBarrell` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Earthquake | `MasteryEarthquake` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Electro Dragon | `MasteryElectroDragon` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryElectroDragon_L<level>.png` |
| Mastery: Electro Giant | `MasteryElectroGiant` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryElectroGiant_L<level>.png` |
| Mastery: Electro Spirit | `MasteryElectroSpirit` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Electro Wizard | `MasteryElectroWizard` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Elite Archer | `MasteryEliteArcher` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryEliteArcher_L<level>.png` |
| Mastery: Elixir Collector | `MasteryElixir Collector` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryElixir Collector_L<level>.png` |
| Mastery: Elixir Golem | `MasteryElixirGolem` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryElixirGolem_L<level>.png` |
| Mastery: Fireball | `MasteryFireball` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryFireball_L<level>.png` |
| Mastery: Firecracker | `MasteryFirecracker` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Firespirit Hut | `MasteryFirespiritHut` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryFirespiritHut_L<level>.png` |
| Mastery: Fire Spirits | `MasteryFireSpirits` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Fisherman | `MasteryFisherman` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Freeze | `MasteryFreeze` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryFreeze_L<level>.png` |
| Mastery: Ghost | `MasteryGhost` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGhost_L<level>.png` |
| Mastery: Giant | `MasteryGiant` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGiant_L<level>.png` |
| Mastery: Giant Buffer | `MasteryGiantBuffer` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGiantBuffer_L<level>.png` |
| Mastery: Giant Skeleton | `MasteryGiantSkeleton` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGiantSkeleton_L<level>.png` |
| Mastery: Goblin Barrel | `MasteryGoblinBarrel` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGoblinBarrel_L<level>.png` |
| Mastery: Goblin Cage | `MasteryGoblinCage` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGoblinCage_L<level>.png` |
| Mastery: Goblin Curse | `MasteryGoblinCurse` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGoblinCurse_L<level>.png` |
| Mastery: Goblin Demolisher | `MasteryGoblinDemolisher` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGoblinDemolisher_L<level>.png` |
| Mastery: Goblin Drill | `MasteryGoblinDrill` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGoblinDrill_L<level>.png` |
| Mastery: Goblin Gang | `MasteryGoblinGang` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGoblinGang_L<level>.png` |
| Mastery: Goblin Giant | `MasteryGoblinGiant` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGoblinGiant_L<level>.png` |
| Mastery: Goblin Hut | `MasteryGoblinHut` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGoblinHut_L<level>.png` |
| Mastery: Goblin Machine | `MasteryGoblinMachine` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGoblinMachine_L<level>.png` |
| Mastery: Goblins | `MasteryGoblins` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGoblins_L<level>.png` |
| Mastery: Goblinstein | `MasteryGoblinstein` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGoblinstein_L<level>.png` |
| Mastery: Golden Knight | `MasteryGoldenKnight` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGoldenKnight_L<level>.png` |
| Mastery: Golem | `MasteryGolem` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryGolem_L<level>.png` |
| Mastery: Graveyard | `MasteryGraveyard` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Heal | `MasteryHeal` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryHeal_L<level>.png` |
| Mastery: Hog Rider | `MasteryHogRider` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Hunter | `MasteryHunter` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryHunter_L<level>.png` |
| Mastery: Ice Golemite | `MasteryIceGolemite` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryIceGolemite_L<level>.png` |
| Mastery: Ice Spirits | `MasteryIceSpirits` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryIceSpirits_L<level>.png` |
| Mastery: Ice Wizard | `MasteryIceWizard` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryIceWizard_L<level>.png` |
| Mastery: Inferno Dragon | `MasteryInfernoDragon` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryInfernoDragon_L<level>.png` |
| Mastery: Inferno Tower | `MasteryInfernoTower` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryInfernoTower_L<level>.png` |
| Mastery: Knight | `MasteryKnight` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryKnight_L<level>.png` |
| Mastery: Lava Hound | `MasteryLavaHound` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryLavaHound_L<level>.png` |
| Mastery: Lightning | `MasteryLightning` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryLightning_L<level>.png` |
| Mastery: Little Prince | `MasteryLittlePrince` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryLittlePrince_L<level>.png` |
| Mastery: Log | `MasteryLog` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Mega Knight | `MasteryMegaKnight` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Mega Minion | `MasteryMegaMinion` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryMegaMinion_L<level>.png` |
| Mastery: Merge Maiden | `MasteryMergeMaiden` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryMergeMaiden_L<level>.png` |
| Mastery: Mighty Miner | `MasteryMightyMiner` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryMightyMiner_L<level>.png` |
| Mastery: Miner | `MasteryMiner` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryMiner_L<level>.png` |
| Mastery: Minion Giant | `MasteryMinionGiant` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/MasteryMinionGiant_L<level>.png` |
| Mastery: Minion Horde | `MasteryMinionHorde` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryMinionHorde_L<level>.png` |
| Mastery: Minions | `MasteryMinions` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryMinions_L<level>.png` |
| Mastery: Mini Pekka | `MasteryMiniPekka` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Mini Sparkys | `MasteryMiniSparkys` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryMiniSparkys_L<level>.png` |
| Mastery: Mirror | `MasteryMirror` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryMirror_L<level>.png` |
| Mastery: Monk | `MasteryMonk` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryMonk_L<level>.png` |
| Mastery: Mortar | `MasteryMortar` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Moving Cannon | `MasteryMovingCannon` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryMovingCannon_L<level>.png` |
| Mastery: Musketeer | `MasteryMusketeer` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Pekka | `MasteryPekka` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Phoenix | `MasteryPhoenix` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryPhoenix_L<level>.png` |
| Mastery: Poison | `MasteryPoison` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryPoison_L<level>.png` |
| Mastery: Prince | `MasteryPrince` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryPrince_L<level>.png` |
| Mastery: Princess | `MasteryPrincess` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Rage | `MasteryRage` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryRage_L<level>.png` |
| Mastery: Rage Barbarian | `MasteryRageBarbarian` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryRageBarbarian_L<level>.png` |
| Mastery: Ram Rider | `MasteryRamRider` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryRamRider_L<level>.png` |
| Mastery: Rascals | `MasteryRascals` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryRascals_L<level>.png` |
| Mastery: Rocket | `MasteryRocket` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryRocket_L<level>.png` |
| Mastery: Ronin | `MasteryRonin` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/MasteryRonin_L<level>.png` |
| Mastery: Royal Delivery | `MasteryRoyalDelivery` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryRoyalDelivery_L<level>.png` |
| Mastery: Royal Giant | `MasteryRoyalGiant` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Royal Hogs | `MasteryRoyalHogs` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryRoyalHogs_L<level>.png` |
| Mastery: Royal Recruits | `MasteryRoyalRecruits` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryRoyalRecruits_L<level>.png` |
| Mastery: Skeleton Army | `MasterySkeletonArmy` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasterySkeletonArmy_L<level>.png` |
| Mastery: Skeleton Balloon | `MasterySkeletonBalloon` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasterySkeletonBalloon_L<level>.png` |
| Mastery: Skeleton Dragons | `MasterySkeletonDragons` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasterySkeletonDragons_L<level>.png` |
| Mastery: Skeleton King | `MasterySkeletonKing` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasterySkeletonKing_L<level>.png` |
| Mastery: Skeletons | `MasterySkeletons` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasterySkeletons_L<level>.png` |
| Mastery: Skeleton Warriors | `MasterySkeletonWarriors` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasterySkeletonWarriors_L<level>.png` |
| Mastery: Snowball | `MasterySnowball` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasterySnowball_L<level>.png` |
| Mastery: Spear Goblins | `MasterySpearGoblins` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasterySpearGoblins_L<level>.png` |
| Mastery: Suspicious Bush | `MasterySuspiciousBush` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasterySuspiciousBush_L<level>.png` |
| Mastery: Tesla | `MasteryTesla` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryTesla_L<level>.png` |
| Mastery: Three Musketeers | `MasteryThreeMusketeers` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryThreeMusketeers_L<level>.png` |
| Mastery: Tombstone | `MasteryTombstone` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryTombstone_L<level>.png` |
| Mastery: Tornado | `MasteryTornado` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryTornado_L<level>.png` |
| Mastery: Valkyrie | `MasteryValkyrie` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Vines | `MasteryVines` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Wallbreakers | `MasteryWallbreakers` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Witch | `MasteryWitch` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryWitch_L<level>.png` |
| Mastery: Witch Mother | `MasteryWitchMother` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryWitchMother_L<level>.png` |
| Mastery: Wizard | `MasteryWizard` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mastery: Xbow | `MasteryXbow` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryXbow_L<level>.png` |
| Mastery: Zap | `MasteryZap` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryZap_L<level>.png` |
| Mastery: Zap Machine | `MasteryZapMachine` | 10 | 1, 2, 3, 4, 5, 6, 7 | 8, 9, 10 | `public/player-badges/MasteryZapMachine_L<level>.png` |

### Events, leagues & tournaments (34)

| Badge | Internal name | Levels | Have | Need | Save as |
|---|---|---|---|---|---|
| 2v2 League Completion | `2v2LeagueCompletion` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/2v2LeagueCompletion_L<level>.png` |
| 2v2 League Rank | `2v2LeagueRank` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/2v2LeagueRank_L<level>.png` |
| Anarchy League Completion | `AnarchyLeagueCompletion` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/AnarchyLeagueCompletion_L<level>.png` |
| Anarchy League Rank | `AnarchyLeagueRank` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/AnarchyLeagueRank_L<level>.png` |
| Beating Death Badge | `BeatingDeathBadge` | 1 | 1 | — | all set |
| Chaos S2 | `Chaos_S2` | 1 | — | 1 | `public/player-badges/Chaos_S2.png` |
| Chaos S3 | `Chaos_S3` | 1 | — | 1 | `public/player-badges/Chaos_S3.png` |
| Chaos Draft League Completion | `ChaosDraftLeagueCompletion` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/ChaosDraftLeagueCompletion_L<level>.png` |
| Chaos Draft League Rank | `ChaosDraftLeagueRank` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/ChaosDraftLeagueRank_L<level>.png` |
| Classic Royale 2025 | `ClassicRoyale_2025` | 2 | 1, 2 | — | all set |
| Classic Royale Tournament Completion | `ClassicRoyaleTournamentCompletion` | 10 | 1 | 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/ClassicRoyaleTournamentCompletion_L<level>.png` |
| Classic Royale Tournament Rank | `ClassicRoyaleTournamentRank_v2` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/ClassicRoyaleTournamentRank_v2_L<level>.png` |
| Crazy Arena Badge 1 | `CrazyArenaBadge1` | 1 | 1 | — | all set |
| Crazy Arena Badge 2 | `CrazyArenaBadge2` | 1 | 1 | — | all set |
| Crazy Arena Badge 3 | `CrazyArenaBadge3` | 1 | 1 | — | all set |
| Crazy Arena Completion | `CrazyArenaCompletion` | 10 | 1 | 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/CrazyArenaCompletion_L<level>.png` |
| Crazy Arena Rank | `CrazyArenaRank` | 10 | 1 | 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/CrazyArenaRank_L<level>.png` |
| Easter Egg | `EasterEgg` | 1 | 1 | — | all set |
| Goblin Journey 2024 | `GoblinJourney2024` | 5 | 1, 2, 3, 4, 5 | — | all set |
| Ladder Top 1000 | `LadderTop1000` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Ladder Tournament Top 1000 | `LadderTournamentTop1000` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | — | all set |
| Mega Draft League Badge | `MegaDraftLeagueBadge` | 2 | 1, 2 | — | all set |
| Merge Tactics Badge 202506 | `MergeTacticsBadge_202506` | 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | — | all set |
| Roulette All Modes | `RouletteAllModes` | 1 | — | 1 | `public/player-badges/RouletteAllModes.png` |
| Royals 2v2 2024 | `Royals2v2_2024` | 2 | 1, 2 | — | all set |
| Royal Tournament Completion | `RoyalTournamentCompletion` | 10 | 1, 2, 3, 4 | 5, 6, 7, 8, 9, 10 | `public/player-badges/RoyalTournamentCompletion_L<level>.png` |
| Royal Tournament Rank | `RoyalTournamentRank_v2` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/RoyalTournamentRank_v2_L<level>.png` |
| Spooky Chess Trail Completion | `SpookyChessTrailCompletion` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/SpookyChessTrailCompletion_L<level>.png` |
| Spooky Chess Trail Rank | `SpookyChessTrailRank` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/SpookyChessTrailRank_L<level>.png` |
| Sudden Death Trail Completion | `SuddenDeathTrailCompletion` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/SuddenDeathTrailCompletion_L<level>.png` |
| Sudden Death Trail Rank | `SuddenDeathTrailRank` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/SuddenDeathTrailRank_L<level>.png` |
| Touchdown League Badge | `TouchdownLeagueBadge` | 2 | 1, 2 | — | all set |
| Triple Draft League Completion | `TripleDraftLeagueCompletion` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/TripleDraftLeagueCompletion_L<level>.png` |
| Triple Draft League Rank | `TripleDraftLeagueRank` | 10 | — | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | `public/player-badges/TripleDraftLeagueRank_L<level>.png` |

### Seasonal & yearly (7)

| Badge | Internal name | Levels | Have | Need | Save as |
|---|---|---|---|---|---|
| 2025 Year Badge | `2025YearBadge` | 1 | 1 | — | all set |
| 2026 Year Badge | `2026YearBadge` | 6 | — | 1, 2, 3, 4, 5, 6 | `public/player-badges/2026YearBadge_L<level>.png` |
| Season Jul 2025 | `SeasonalBadge_202507_v2` | 3 | 1, 2, 3 | — | all set |
| Season Aug 2025 | `SeasonalBadge_202508` | 3 | 1, 2, 3 | — | all set |
| Season Sep 2025 | `SeasonalBadge_202509` | 3 | 1, 2, 3 | — | all set |
| Season Oct 2025 | `SeasonalBadge_202510` | 3 | 1, 2, 3 | — | all set |
| Season Nov 2025 | `SeasonalBadge_202511` | 3 | 1, 2, 3 | — | all set |

### Esports & special (17)

| Badge | Internal name | Levels | Have | Need | Save as |
|---|---|---|---|---|---|
| Creator | `Creator` | 1 | 1 | — | all set |
| Crl 20 Wins | `Crl20Wins` | 1 | 1 | — | all set |
| Crl 20 Wins 2019 | `Crl20Wins2019` | 1 | 1 | — | all set |
| Crl 20 Wins 2021 | `Crl20Wins2021` | 1 | 1 | — | all set |
| Crl 20 Wins 2022 | `Crl20Wins2022` | 1 | 1 | — | all set |
| Crl 20 Wins 2023 | `Crl20Wins2023` | 1 | 1 | — | all set |
| Crl 20 Wins 2024 | `Crl20Wins2024` | 1 | 1 | — | all set |
| Crl 20 Wins 2025 | `Crl20Wins2025` | 1 | 1 | — | all set |
| Crl Champion 2024 | `CrlChampion2024` | 1 | 1 | — | all set |
| Crl Champion 2025 | `CrlChampion2025` | 1 | 1 | — | all set |
| Crl Competitor 2022 | `CrlCompetitor2022` | 1 | 1 | — | all set |
| Crl Finalist 2024 | `CrlFinalist2024` | 1 | 1 | — | all set |
| Crl Finalist 2025 | `CrlFinalist2025` | 1 | 1 | — | all set |
| Crl Spectator 2022 | `CrlSpectator2022` | 1 | 1 | — | all set |
| Crl Spectator 2024 | `CrlSpectator2024` | 1 | 1 | — | all set |
| Crl Spectator 2025 | `CrlSpectator2025` | 1 | 1 | — | all set |
| Supercell Pancake | `SupercellPancake` | 1 | — | 1 | `public/player-badges/SupercellPancake.png` |

## 2. Emotes (236)

From the game data, which stops in 2023: emotes added since then (2024+) are not in any public list, so add those from the wiki. Internal names only: the pack and sound name tell you which emote it is (e.g. `king_01` · `king_laughter` = the laughing King).

| Emote | Pack | Sound (which emote) | Retired | Exclusive | Save as |
|---|---|---|---|---|---|
| Emote0 | king_01 | king_happy_01 |  |  | `public/emotes/emote_1_0.png` |
| Emote1 | king_01 | king_mad_01 |  |  | `public/emotes/emote_1_1.png` |
| Emote2 | king_01 | king_crying_01 |  |  | `public/emotes/emote_1_2.png` |
| Emote3 | king_01 | king_laughter_01 |  |  | `public/emotes/emote_1_3.png` |
| Emote4 | goblin_01 | goblin_01_01 |  |  | `public/emotes/emote_2_0.png` |
| Emote5 | goblin_01 | goblin_01_02 |  |  | `public/emotes/emote_2_1.png` |
| Emote6 | goblin_01 | goblin_01_03 |  |  | `public/emotes/emote_2_2.png` |
| Emote7 | goblin_01 | goblin_01_04 |  |  | `public/emotes/emote_2_3.png` |
| Emote8 | goblin_02 | goblin_02_01 |  |  | `public/emotes/emote_3_0.png` |
| Emote9 | goblin_02 | goblin_02_02 |  |  | `public/emotes/emote_3_1.png` |
| Emote10 | goblin_02 | goblin_02_03 |  |  | `public/emotes/emote_3_2.png` |
| Emote11 | goblin_02 | goblin_02_04 |  |  | `public/emotes/emote_3_3.png` |
| Emote12 | goblin_03 | goblin_03_01 |  |  | `public/emotes/emote_4_0.png` |
| Emote13 | goblin_03 | goblin_03_02 |  |  | `public/emotes/emote_4_1.png` |
| Emote14 | goblin_03 | goblin_03_03 |  |  | `public/emotes/emote_4_2.png` |
| Emote15 | goblin_03 | goblin_03_04 |  |  | `public/emotes/emote_4_3.png` |
| Emote16 | goblin_04 | goblin_04_01 |  |  | `public/emotes/emote_5_0.png` |
| Emote17 | goblin_04 | goblin_04_02 |  |  | `public/emotes/emote_5_1.png` |
| Emote18 | goblin_04 | goblin_04_03 |  |  | `public/emotes/emote_5_2.png` |
| Emote19 | goblin_04 | goblin_04_04 |  |  | `public/emotes/emote_5_3.png` |
| Emote20 | princess_01 | princess_01_01 |  |  | `public/emotes/emote_6_0.png` |
| Emote21 | princess_01 | princess_01_02 |  |  | `public/emotes/emote_6_1.png` |
| Emote22 | princess_01 | princess_01_03 |  |  | `public/emotes/emote_6_2.png` |
| Emote23 | princess_01 | princess_01_04 |  |  | `public/emotes/emote_6_3.png` |
| Emote24 | giant_01 | giant_emote_01 |  |  | `public/emotes/emote_7_0.png` |
| Emote25 | giant_01 | giant_emote_02 |  |  | `public/emotes/emote_7_1.png` |
| Emote26 | giant_01 | giant_emote_03 |  |  | `public/emotes/emote_7_2.png` |
| Emote27 | giant_01 | giant_emote_05 |  |  | `public/emotes/emote_7_3.png` |
| Emote28 | princess_02 | princess_emote_01 |  |  | `public/emotes/emote_8_0.png` |
| Emote29 | princess_02 | princess_emote_02 |  |  | `public/emotes/emote_8_1.png` |
| Emote30 | princess_02 | princess_emote_03 |  |  | `public/emotes/emote_8_2.png` |
| Emote31 | princess_02 | princess_emote_04 |  |  | `public/emotes/emote_8_3.png` |
| Emote32 | hogrider_01 | hr_emote_01 |  |  | `public/emotes/emote_9_0.png` |
| Emote33 | hogrider_01 | hr_emote_02 |  |  | `public/emotes/emote_9_1.png` |
| Emote34 | hogrider_01 | hr_emote_03 |  |  | `public/emotes/emote_9_2.png` |
| Emote35 | hogrider_01 | hr_emote_04 |  |  | `public/emotes/emote_9_3.png` |
| Emote36 | hog_01 | hog_01_01 |  |  | `public/emotes/emote_10_0.png` |
| Emote37 | hog_01 | hog_01_02 |  |  | `public/emotes/emote_10_1.png` |
| Emote38 | hog_01 | hog_01_03 |  |  | `public/emotes/emote_10_2.png` |
| Emote39 | hog_01 | hog_01_04 |  |  | `public/emotes/emote_10_3.png` |
| Emote40 | barbarian_01 | barbarian_01_01 |  |  | `public/emotes/emote_11_0.png` |
| Emote41 | barbarian_01 | barbarian_01_02 |  |  | `public/emotes/emote_11_1.png` |
| Emote42 | barbarian_01 | barbarian_01_03 |  |  | `public/emotes/emote_11_2.png` |
| Emote43 | barbarian_01 | barbarian_01_04 |  |  | `public/emotes/emote_11_3.png` |
| Emote44 | skeleton_01 | skeleton_01_01 |  |  | `public/emotes/emote_12_0.png` |
| Emote45 | skeleton_01 | skeleton_01_02 |  |  | `public/emotes/emote_12_1.png` |
| Emote46 | skeleton_01 | skeleton_01_03 |  |  | `public/emotes/emote_12_2.png` |
| Emote47 | skeleton_01 | skeleton_01_04 |  |  | `public/emotes/emote_12_3.png` |
| Emote48 | wizard_01 | wizard_01_01 |  |  | `public/emotes/emote_13_0.png` |
| Emote49 | wizard_01 | wizard_01_02 |  |  | `public/emotes/emote_13_1.png` |
| Emote50 | wizard_01 | wizard_01_03 |  |  | `public/emotes/emote_13_2.png` |
| Emote51 | wizard_01 | wizard_01_04 |  |  | `public/emotes/emote_13_3.png` |
| Emote52 | ewiz_01 | ewiz_01_01 |  |  | `public/emotes/emote_14_0.png` |
| Emote53 | ewiz_01 | ewiz_01_02 |  |  | `public/emotes/emote_14_1.png` |
| Emote54 | ewiz_01 | ewiz_01_03 |  |  | `public/emotes/emote_14_2.png` |
| Emote55 | ewiz_01 | ewiz_01_04 |  |  | `public/emotes/emote_14_3.png` |
| Emote56 | crl_01 | crl_01_01 |  |  | `public/emotes/emote_15_0.png` |
| Emote57 | crl_01 | crl_01_02 |  |  | `public/emotes/emote_15_1.png` |
| Emote58 | crl_01 | crl_01_03 |  |  | `public/emotes/emote_15_2.png` |
| Emote59 | crl_01 | crl_01_04 |  |  | `public/emotes/emote_15_3.png` |
| Emote60 | black_friday_01 | black_friday_01_01 |  |  | `public/emotes/emote_16_0.png` |
| Emote61 | black_friday_01 | black_friday_01_02 |  |  | `public/emotes/emote_16_1.png` |
| Emote62 | black_friday_01 | black_friday_01_03 |  |  | `public/emotes/emote_16_2.png` |
| Emote63 | black_friday_01 | black_friday_01_04 |  |  | `public/emotes/emote_16_3.png` |
| Emote64 | black_friday_02 | black_friday_02_01 |  |  | `public/emotes/emote_17_0.png` |
| Emote65 | black_friday_02 | black_friday_02_02 |  |  | `public/emotes/emote_17_1.png` |
| Emote66 | black_friday_02 | black_friday_02_03 |  |  | `public/emotes/emote_17_2.png` |
| Emote67 | black_friday_02 | black_friday_02_04 |  |  | `public/emotes/emote_17_3.png` |
| Emote68 | royal_ghost_01 | royal_ghost_01_01 |  | exclusive | `public/emotes/emote_18_0.png` |
| Emote69 | royal_ghost_01 | royal_ghost_01_02 | retired |  | `public/emotes/emote_18_1.png` |
| Emote70 | royal_ghost_01 | royal_ghost_01_03 |  | exclusive | `public/emotes/emote_18_2.png` |
| Emote71 | royal_ghost_01 | royal_ghost_01_04 |  |  | `public/emotes/emote_18_3.png` |
| Emote76 | crl_03 | crl_03_01 |  | exclusive | `public/emotes/emote_20_0.png` |
| Emote77 | xmas_01 | xmas_01_01 |  | exclusive | `public/emotes/emote_21_0.png` |
| Emote78 | xmas_01 | xmas_01_02 |  | exclusive | `public/emotes/emote_21_1.png` |
| Emote79 | ram_rider_01 | ram_emote_01 |  | exclusive | `public/emotes/emote_22_0.png` |
| Emote80 | ram_rider_01 | ram_emote_02 |  |  | `public/emotes/emote_22_1.png` |
| Emote81 | hog_02 | hog_02_01 |  |  | `public/emotes/emote_23_0.png` |
| Emote82 | hog_02 | hog_02_02 |  |  | `public/emotes/emote_23_1.png` |
| Emote83 | hog_02 | hog_02_03 |  | exclusive | `public/emotes/emote_23_2.png` |
| Emote84 | hog_02 | hog_02_04 |  |  | `public/emotes/emote_23_3.png` |
| Emote85 | minipekka_02 | minipekka_02_01 |  |  | `public/emotes/emote_24_0.png` |
| Emote86 | minipekka_02 | minipekka_02_02 |  |  | `public/emotes/emote_24_1.png` |
| Emote87 | minipekka_02 | minipekka_02_03 |  |  | `public/emotes/emote_24_2.png` |
| Emote88 | minipekka_02 | minipekka_02_04 |  |  | `public/emotes/emote_24_3.png` |
| Emote89 | bday_03 | bday_03_01 |  |  | `public/emotes/emote_25_0.png` |
| Emote90 | bday_03 | bday_03_02 |  |  | `public/emotes/emote_25_1.png` |
| Emote91 | bday_03 | bday_03_03 |  | exclusive | `public/emotes/emote_25_2.png` |
| Emote92 | womens_month_01 | Strong_princess_emote_01 |  |  | `public/emotes/emote_26_0.png` |
| Emote93 | womens_month_01 | musketeer_emo_01 |  |  | `public/emotes/emote_26_1.png` |
| Emote94 | womens_month_01 | ramRider_paint_emote_01 |  |  | `public/emotes/emote_26_2.png` |
| Emote95 | crl_20win_01 | crl_02_01 |  | exclusive | `public/emotes/emote_27_0.png` |
| Emote96 | april_fools_01 | log_emote_kiss_01 |  |  | `public/emotes/emote_28_0.png` |
| Emote97 | april_fools_01 | log_emote_cry_01 |  |  | `public/emotes/emote_28_1.png` |
| Emote98 | spring_01 | pig_eat_01 |  |  | `public/emotes/emote_29_0.png` |
| Emote99 | spring_01 | pekka_butterfly_01 |  |  | `public/emotes/emote_29_1.png` |
| Emote100 | spring_01 | dragon_egg |  |  | `public/emotes/emote_29_2.png` |
| Emote101 | spring_01 | miner_pop_01 |  |  | `public/emotes/emote_29_3.png` |
| Emote102 | goblin_brawler_01 | gobccage_emo_bars_01 |  |  | `public/emotes/emote_30_0.png` |
| Emote103 | goblin_brawler_01 | gobccage_emo_arm_01 |  |  | `public/emotes/emote_30_1.png` |
| Emote104 | prince_01 | prince_emo_01 |  |  | `public/emotes/emote_31_0.png` |
| Emote105 | prince_01 | prince_emo_02 |  |  | `public/emotes/emote_31_1.png` |
| Emote106 | prince_01 | prince_emo_03 |  |  | `public/emotes/emote_31_2.png` |
| Emote107 | prince_01 | prince_emo_04 |  |  | `public/emotes/emote_31_3.png` |
| Emote108 | dragon_boat_01 | sfx_1_lick |  |  | `public/emotes/emote_32_0.png` |
| Emote109 | dragon_boat_01 | sfx_2_smoke |  |  | `public/emotes/emote_32_1.png` |
| Emote110 | dragon_boat_01 | sfx_3_sneeze |  |  | `public/emotes/emote_32_2.png` |
| Emote111 | dragon_boat_01 | sfx_4_shock |  |  | `public/emotes/emote_32_3.png` |
| Emote112 | clashnights_01 | clashnights_01_01 |  |  | `public/emotes/emote_33_0.png` |
| Emote113 | clashnights_01 |  | retired |  | `public/emotes/emote_33_1.png` |
| Emote114 | fish_slap_01 | fishSlap_FightingFish |  | exclusive | `public/emotes/emote_34_0.png` |
| Emote115 | fisherman_01 | theFisherman_01_fishFlail |  |  | `public/emotes/emote_36_0.png` |
| Emote116 | fisherman_01 | theFisherman_02_surprise |  |  | `public/emotes/emote_36_1.png` |
| Emote117 | fisherman_01 | theFisherman_03_downpour |  |  | `public/emotes/emote_36_2.png` |
| Emote118 | fisherman_01 | theFisherman_04_hook |  |  | `public/emotes/emote_36_3.png` |
| Emote119 | shipwreck_kingPirate | shipwreck_01_01 |  | exclusive | `public/emotes/emote_37_0.png` |
| Emote120 | shipwreck_02 | shipwreck_02_01 |  |  | `public/emotes/emote_39_0.png` |
| Emote121 | shipwreck_03 | shipwreck_03_01 |  |  | `public/emotes/emote_40_0.png` |
| Emote122 | shipwreck_03 | shipwreck_03_02 |  |  | `public/emotes/emote_40_1.png` |
| Emote123 | shipwreck_03 | shipwreck_03_03 |  |  | `public/emotes/emote_40_2.png` |
| Emote124 | miner_01 | miner_01_01 |  |  | `public/emotes/emote_41_0.png` |
| Emote125 | miner_01 | miner_01_02 |  |  | `public/emotes/emote_41_1.png` |
| Emote126 | princess_glasses_01 | princess_glasses_01 |  | exclusive | `public/emotes/emote_42_0.png` |
| Emote127 | night_witch_01 | night_witch_01_01 |  |  | `public/emotes/emote_44_0.png` |
| Emote128 | night_witch_clap_01 | night_witch_clap_01_01 |  |  | `public/emotes/emote_45_0.png` |
| Emote129 | scid_chicken_01 | emochicken_01 |  | exclusive | `public/emotes/emote_46_0.png` |
| Emote130 | golden_week_01 | bandit_coin |  |  | `public/emotes/emote_47_0.png` |
| Emote131 | elixir_golem_01 | ElixirGolem_Emote_Morph |  |  | `public/emotes/emote_49_0.png` |
| Emote132 | elixir_golem_01 | ElixirGolem_Emote_Glow |  |  | `public/emotes/emote_49_1.png` |
| Emote133 | halloween_01 | halloween_01_01 |  | exclusive | `public/emotes/emote_50_0.png` |
| Emote134 | halloween_01 | halloween_01_02 |  |  | `public/emotes/emote_50_1.png` |
| Emote135 | halloween_01 | halloween_01_03 |  |  | `public/emotes/emote_50_2.png` |
| Emote136 | halloween_01 | halloween_01_04 |  |  | `public/emotes/emote_50_3.png` |
| Emote137 | halloween_02 | Halloween_emote_prisongoblnwig |  |  | `public/emotes/emote_51_0.png` |
| Emote138 | goblin_feast_01 | goblin_feast_01_emote1 |  | exclusive | `public/emotes/emote_52_0.png` |
| Emote139 | goblin_feast_01 | goblin_feast_01_emote2 |  |  | `public/emotes/emote_52_1.png` |
| Emote140 | goblin_feast_01 | goblin_feast_01_emote3 |  |  | `public/emotes/emote_52_2.png` |
| Emote141 | xmass_hog_lights | xmass_hog_lights |  | exclusive | `public/emotes/emote_54_0.png` |
| Emote142 | xmass_santa_giant | xmass_santa_giant |  |  | `public/emotes/emote_55_0.png` |
| Emote143 | xmass_barb_nutcracker | xmass_barb_nutcracker |  |  | `public/emotes/emote_56_0.png` |
| Emote144 | crl_king_headset | crl_king_headset |  | exclusive | `public/emotes/emote_60_0.png` |
| Emote145 | lny_01 | lny_01 |  | exclusive | `public/emotes/emote_62_0.png` |
| Emote146 | lny_02 | lny_02_sfx1 |  | exclusive | `public/emotes/emote_63_0.png` |
| Emote147 | lny_02 | lny_02_sfx2 |  |  | `public/emotes/emote_63_1.png` |
| Emote148 | lny_02 | lny_02_sfx3 |  |  | `public/emotes/emote_63_2.png` |
| Emote149 | king_02 | king_02_sfx_01_trophy_king |  | exclusive | `public/emotes/emote_64_0.png` |
| Emote150 | log_02 | log_02_Angry_sfx1 |  |  | `public/emotes/emote_65_0.png` |
| Emote151 | log_02 | log_02_Glorious_sfx2 |  |  | `public/emotes/emote_65_1.png` |
| Emote152 | ramRiderFeb2020_01 | ramRiderFeb2020_01_sfx1 |  |  | `public/emotes/emote_66_0.png` |
| Emote153 | 4th_bday_pekka | 4th_bday_pekka |  | exclusive | `public/emotes/emote_69_0.png` |
| Emote154 | 4th_bday_sparky | 4th_bday_sparky |  |  | `public/emotes/emote_70_0.png` |
| Emote155 | 4th_bday_battleHealer | 4th_bday_battleHealer |  | exclusive | `public/emotes/emote_71_0.png` |
| Emote156 | 4th_bday_fish | 4th_bday_fish |  |  | `public/emotes/emote_72_0.png` |
| Emote157 | 4th_bday_royalGiant | 4th_bday_royalGiant |  | exclusive | `public/emotes/emote_73_0.png` |
| Emote158 | heist_magicArcher | heist_magicArcher_01 |  | exclusive | `public/emotes/emote_74_0.png` |
| Emote159 | heist_hunter | heist_hunter_01 |  |  | `public/emotes/emote_75_0.png` |
| Emote160 | heist_bandit | heist_bandit_01 |  |  | `public/emotes/emote_77_0.png` |
| Emote161 | feb2020_01 | feb2020_01_sfx1 |  |  | `public/emotes/emote_78_0.png` |
| Emote162 | feb2020_01 | feb2020_01_sfx2 | retired |  | `public/emotes/emote_78_2.png` |
| Emote163 | 10yr_king | 10yr_king |  | exclusive | `public/emotes/emote_80_0.png` |
| Emote164 | 10yr_knight | 10yr_knight |  | exclusive | `public/emotes/emote_81_0.png` |
| Emote165 | 10yr_infernoDragon | 10yr_infernoDragon |  |  | `public/emotes/emote_82_0.png` |
| Emote166 | 10yr_lavaHound | 10yr_lavaHound |  |  | `public/emotes/emote_83_0.png` |
| Emote167 | s12_prince | s12_prince |  | exclusive | `public/emotes/emote_85_0.png` |
| Emote168 | s12_pony | s12_pony |  |  | `public/emotes/emote_86_0.png` |
| Emote169 | s12_darkPrince | s12_darkPrince_01 |  |  | `public/emotes/emote_87_0.png` |
| Emote170 | PEKKA_boombox | PEKKA_boombox |  |  | `public/emotes/emote_89_0.png` |
| Emote171 | PEKKA_coconut | PEKKA_coconut |  | exclusive | `public/emotes/emote_90_0.png` |
| Emote172 | skeleton_snorkel | skeleton_snorkel |  |  | `public/emotes/emote_91_0.png` |
| Emote173 | archers_01 | archer_01_01 |  | exclusive | `public/emotes/emote_93_0.png` |
| Emote174 | archers_01 | archer_01_02 |  |  | `public/emotes/emote_93_1.png` |
| Emote175 | archers_01 | archer_01_03 |  |  | `public/emotes/emote_93_2.png` |
| Emote176 | royalGuards_01 | royalGuards_01 |  | exclusive | `public/emotes/emote_96_0.png` |
| Emote177 | cw_golem_boat | cw_golem_boat |  |  | `public/emotes/emote_97_0.png` |
| Emote178 | cw_goblinDance | cw_goblinDance |  |  | `public/emotes/emote_98_0.png` |
| Emote179 | cw_goblinThumb | cw_goblinThumb |  | exclusive | `public/emotes/emote_99_0.png` |
| Emote180 | electroGiant_01 | electroGiant_01_01 |  | exclusive | `public/emotes/emote_100_0.png` |
| Emote181 | electroGiant_01 | electroGiant_01_02 |  |  | `public/emotes/emote_100_1.png` |
| Emote182 | electroGiant_01 | electroGiant_01_03 |  |  | `public/emotes/emote_100_2.png` |
| Emote183 | electroGiant_01 | electroGiant_01_04 |  |  | `public/emotes/emote_100_3.png` |
| Emote184 | skeleton_dragon_01 | skeleton_dragon_01 |  |  | `public/emotes/emote_101_0.png` |
| Emote185 | megaKnight_01 | megaKnight_01_01 |  |  | `public/emotes/emote_102_0.png` |
| Emote186 | megaKnight_01 | megaKnight_01_02 |  |  | `public/emotes/emote_102_1.png` |
| Emote187 | megaKnight_01 | megaKnight_01_03 |  | exclusive | `public/emotes/emote_102_2.png` |
| Emote188 | logmas2020_01 | logmas2020_01 |  | exclusive | `public/emotes/emote_103_0.png` |
| Emote189 | logmas2020_02 | logmas2020_02_01 |  |  | `public/emotes/emote_104_0.png` |
| Emote190 | logmas2020_02 | logmas2020_02_02 |  | exclusive | `public/emotes/emote_104_1.png` |
| Emote191 | logmas2020_03 | logmas2020_03 |  |  | `public/emotes/emote_105_0.png` |
| Emote192 | logmas2020_04 | logmas2020_04 |  |  | `public/emotes/emote_106_0.png` |
| Emote193 | icewizard_01 | icewizard_01_01 | retired |  | `public/emotes/emote_107_0.png` |
| Emote194 | icewizard_01 | icewizard_01_02 |  | exclusive | `public/emotes/emote_107_1.png` |
| Emote195 | icewizard_01 | icewizard_01_03 |  |  | `public/emotes/emote_107_2.png` |
| Emote196 | LNY_2021_01 | LNY_2021_01_01 |  |  | `public/emotes/emote_108_0.png` |
| Emote197 | LNY_2021_01 | LNY_2021_01_02 |  | exclusive | `public/emotes/emote_108_1.png` |
| Emote198 | LNY_2021_02 | LNY_2021_02 |  |  | `public/emotes/emote_109_0.png` |
| Emote199 | LNY_2021_03 | LNY_2021_03 |  |  | `public/emotes/emote_110_0.png` |
| Emote200 | battlehealer_cakethrow | battlehealer_cakethrow |  | exclusive | `public/emotes/emote_111_0.png` |
| Emote201 | elixirgolem_candlehead | elixirgolem_candlehead |  |  | `public/emotes/emote_112_0.png` |
| Emote202 | lumberjack_cakerun | lumberjack_cakerun |  |  | `public/emotes/emote_113_0.png` |
| Emote203 | sparky_surprise | sparky_surprise |  | exclusive | `public/emotes/emote_114_0.png` |
| Emote204 | king_book | king_book |  |  | `public/emotes/emote_115_0.png` |
| Emote205 | pekka_blossom | pekka_blossom |  | exclusive | `public/emotes/emote_116_0.png` |
| Emote206 | mortar_01 | mortar_01_01 |  |  | `public/emotes/emote_117_0.png` |
| Emote207 | mortar_01 | mortar_01_02 |  | exclusive | `public/emotes/emote_117_1.png` |
| Emote208 | skeletondragon_jawdrop | skeletondragon_jawdrop |  |  | `public/emotes/emote_118_0.png` |
| Emote209 | dartgoblin_backfire | dartgoblin_backfire |  | exclusive | `public/emotes/emote_119_0.png` |
| EmoteChronos1 | goblindrill_drive | goblindrill_drive |  |  | `public/emotes/emote_120_0.png` |
| EmoteChronos2 | bowler_basketball | bowler_basketball |  | exclusive | `public/emotes/emote_121_0.png` |
| EmoteChronos3 | icewizard_meltsweat | icewizard_meltsweat |  | exclusive | `public/emotes/emote_122_0.png` |
| EmoteChronos4 | executioner_chefskiss | executioner_chefskiss |  | exclusive | `public/emotes/emote_123_0.png` |
| EmoteChronos5 | executioner_fruitcake | executioner_fruitcake |  |  | `public/emotes/emote_124_0.png` |
| EmoteChronos6 | bat_embrace | bat_embrace |  | exclusive | `public/emotes/emote_125_0.png` |
| EmoteChronos7 | bat_jackobat | bat_jackobat |  |  | `public/emotes/emote_126_0.png` |
| EmoteChronos8 | arrows_3crowns | arrows_3crowns |  | exclusive | `public/emotes/emote_127_0.png` |
| EmoteChronos9 | skeletonking_victory | skeletonking_victory |  |  | `public/emotes/emote_128_0.png` |
| EmoteChronos10 | goldenknight_gorgeous | goldenknight_gorgeous |  |  | `public/emotes/emote_129_0.png` |
| EmoteChronos11 | archerqueen_crown | archerqueen_crown |  |  | `public/emotes/emote_130_0.png` |
| EmoteChronos12 |  |  | retired |  | `public/emotes/emote_131_0.png` |
| EmoteChronos13 |  |  | retired |  | `public/emotes/emote_132_0.png` |
| EmoteChronos14 |  |  | retired |  | `public/emotes/emote_133_0.png` |
| EmoteChronos15 |  |  | retired |  | `public/emotes/emote_134_0.png` |
| EmoteChronos16 |  |  | retired |  | `public/emotes/emote_135_0.png` |
| EmoteChronos17 |  |  | retired |  | `public/emotes/emote_136_0.png` |
| EmoteChronos18 |  |  | retired |  | `public/emotes/emote_137_0.png` |
| EmoteChronos19 |  |  | retired |  | `public/emotes/emote_138_0.png` |
| EmoteChronos20 |  |  | retired |  | `public/emotes/emote_139_0.png` |
| EmoteChronos21 |  |  | retired |  | `public/emotes/emote_140_0.png` |
| EmoteChronos22 |  |  | retired |  | `public/emotes/emote_141_0.png` |
| EmoteChronos23 |  |  | retired |  | `public/emotes/emote_142_0.png` |
| EmoteChronos24 |  |  | retired |  | `public/emotes/emote_143_0.png` |
| EmoteChronos25 |  |  | retired |  | `public/emotes/emote_144_0.png` |
| EmoteChronos26 |  |  | retired |  | `public/emotes/emote_145_0.png` |
| EmoteChronos27 |  |  | retired |  | `public/emotes/emote_146_0.png` |
| EmoteChronos28 |  |  | retired |  | `public/emotes/emote_147_0.png` |
| EmoteChronos29 |  |  | retired |  | `public/emotes/emote_148_0.png` |
| EmoteChronos30 |  |  | retired |  | `public/emotes/emote_149_0.png` |

## 3. Magic items (17)

| Item | Internal name | Save as |
|---|---|---|
| Common Wild Card | `WildcardCommon` | `public/ui/items/WildcardCommon.png` |
| Rare Wild Card | `WildcardRare` | `public/ui/items/WildcardRare.png` |
| Epic Wild Card | `WildcardEpic` | `public/ui/items/WildcardEpic.png` |
| Legendary Wild Card | `WildcardLegendary` | `public/ui/items/WildcardLegendary.png` |
| Common Book | `BookCardCommon` | `public/ui/items/BookCardCommon.png` |
| Rare Book | `BookCardRare` | `public/ui/items/BookCardRare.png` |
| Epic Book | `BookCardEpic` | `public/ui/items/BookCardEpic.png` |
| Legendary Book | `BookCardLegendary` | `public/ui/items/BookCardLegendary.png` |
| Magic Coin | `GoldCoin` | `public/ui/items/GoldCoin.png` |
| Chest Key | `ChestKey` | `public/ui/items/ChestKey.png` |
| Book of Books | `BookCardAll` | `public/ui/items/BookCardAll.png` |
| Cosmetics token (internal name) | `CosmeticsToken` | `public/ui/items/CosmeticsToken.png` |
| Champion Wild Card | `WildcardChampion` | `public/ui/items/WildcardChampion.png` |
| Card boost (internal name) | `BoostSingleCard` | `public/ui/items/BoostSingleCard.png` |
| Season Tokens | `SeasonalToken` | `public/ui/items/SeasonalToken.png` |
| Elite Wild Card | `WildcardElite` | `public/ui/items/WildcardElite.png` |
| Wild Card shard (internal name) | `WildcardShard` | `public/ui/items/WildcardShard.png` |

Also worth having (not in the data file): Evolution Shard, Banner Token, Lucky Drop boxes (every rarity tier) and the current shop offers. See section 9.

## 4. Chests (31)

|  | Chest | Save as |
|---|---|---|
| ✅ | Wooden | have |
| ✅ | Silver | have |
| ✅ | Gold | have |
| ✅ | Giant | have |
| ✅ | Magical | have |
| ✅ | Super Magical | have |
| ✅ | Epic | have |
| ✅ | Legendary | have |
| ✅ | King | have |
| ✅ | Legendary King | have |
| ✅ | Lightning | have |
| ✅ | Mega Lightning | have |
| ✅ | Fortune | have |
| ✅ | Gold Fortune | have |
| ✅ | Royal Wild | have |
| ✅ | Draft | have |
| ✅ | Gold Crate | have |
| ✅ | Plentiful Gold Crate | have |
| ✅ | Overflowing Gold Crate | have |
| ⬜ | Champion | `public/ui/chests/champion.png` |
| ⬜ | Star | `public/ui/chests/star.png` |
| ⬜ | Clan War | `public/ui/chests/clan-war.png` |
| ⬜ | Crown | `public/ui/chests/crown.png` |
| ⬜ | Clan | `public/ui/chests/clan.png` |
| ⬜ | Season Pass tier 1 | `public/ui/chests/season-pass-tier-1.png` |
| ⬜ | Season Pass tier 2 | `public/ui/chests/season-pass-tier-2.png` |
| ⬜ | Season Pass tier 3 | `public/ui/chests/season-pass-tier-3.png` |
| ⬜ | Season Pass tier 4 | `public/ui/chests/season-pass-tier-4.png` |
| ⬜ | Shop small | `public/ui/chests/shop-small.png` |
| ⬜ | Shop large legendary | `public/ui/chests/shop-large-legendary.png` |
| ⬜ | Lucky Drop | `public/ui/chests/lucky-drop.png` |

## 5. Arenas & leagues (106)

Trophy Road arenas from the game data plus every arena players in the sample are in right now (which includes the new arenas and the seasonal / mode ladder leagues like Bronze I → Diamond). Path of Legends league icons are already on the site.

|  | Arena | Kind | Arena id | Save as |
|---|---|---|---|---|
| ✅ | Arena 15 | Path of Legends | 54000012 | have |
| ✅ | Arena 16 | Path of Legends | 54000013 | have |
| ✅ | Arena 17 | Path of Legends | 54000014 | have |
| ✅ | Arena 18 | Path of Legends | 54000015 | have |
| ✅ | Arena 19 | Path of Legends | 54000016 | have |
| ✅ | Arena 20 | Path of Legends | 54000017 | have |
| ✅ | Arena 21 | Path of Legends | 54000018 | have |
| ✅ | Arena 22 | Path of Legends | 54000019 | have |
| ✅ | Arena 23 | Path of Legends | 54000020 | have |
| ✅ | Ultimate Champion | Path of Legends | 54000031 | have |
| ⬜ | Lumberlove Cabin | Trophy Road (new) | 54000117 | `public/arenas/54000117.png` |
| ⬜ | Royal Road | Trophy Road (new) | 54000130 | `public/arenas/54000130.png` |
| ⬜ | Musketeer Street | Trophy Road (new) | 54000131 | `public/arenas/54000131.png` |
| ⬜ | Summit of Heroes | Trophy Road (new) | 54000132 | `public/arenas/54000132.png` |
| ⬜ | Magic Academy | Trophy Road (new) | 54000141 | `public/arenas/54000141.png` |
| ⬜ | Ultimate Clash Pit | Trophy Road (new) | 54000142 | `public/arenas/54000142.png` |
| ⬜ | Little Prince's Tavern | Trophy Road (new) | 54000143 | `public/arenas/54000143.png` |
| ⬜ | Spirit Square | Trophy Road (new) | 54000144 | `public/arenas/54000144.png` |
| ⬜ | Training Camp | Trophy Road / event | 54000000 | `public/arenas/54000000.png` |
| ✅ | Arena 1 | Trophy Road / event | 54000001 | have |
| ✅ | Arena 2 | Trophy Road / event | 54000002 | have |
| ✅ | Arena 3 | Trophy Road / event | 54000003 | have |
| ✅ | Arena 4 | Trophy Road / event | 54000004 | have |
| ✅ | Arena 5 | Trophy Road / event | 54000005 | have |
| ✅ | Arena 6 | Trophy Road / event | 54000006 | have |
| ✅ | Arena 10 | Trophy Road / event | 54000007 | have |
| ✅ | Arena 7 | Trophy Road / event | 54000008 | have |
| ✅ | Arena 8 | Trophy Road / event | 54000009 | have |
| ✅ | Arena 9 | Trophy Road / event | 54000010 | have |
| ✅ | Arena 12 | Trophy Road / event | 54000011 | have |
| ⬜ | Training Camp | Trophy Road / event | 54000021 | `public/arenas/54000021.png` |
| ⬜ | Training Camp | Trophy Road / event | 54000022 | `public/arenas/54000022.png` |
| ⬜ | Arena_TouchdownTest | Trophy Road / event | 54000023 | `public/arenas/54000023.png` |
| ✅ | Arena 11 | Trophy Road / event | 54000024 | have |
| ⬜ | King of the Hill Arena | Trophy Road / event | 54000025 | `public/arenas/54000025.png` |
| ⬜ | King of the Hill Arena | Trophy Road / event | 54000026 | `public/arenas/54000026.png` |
| ✅ | Clan League | Trophy Road / event | 54000027 | have |
| ✅ | Clan League | Trophy Road / event | 54000028 | have |
| ✅ | Clan League | Trophy Road / event | 54000029 | have |
| ✅ | Clan League | Trophy Road / event | 54000030 | have |
| ⬜ | Arena_Obstacles | Trophy Road / event | 54000032 | `public/arenas/54000032.png` |
| ⬜ | Fisherman's Float | Trophy Road / event | 54000033 | `public/arenas/54000033.png` |
| ⬜ | Fisherman's Float | Trophy Road / event | 54000034 | `public/arenas/54000034.png` |
| ⬜ | Shipwreck Island | Trophy Road / event | 54000035 | `public/arenas/54000035.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000036 | `public/arenas/54000036.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000037 | `public/arenas/54000037.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000038 | `public/arenas/54000038.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000039 | `public/arenas/54000039.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000040 | `public/arenas/54000040.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000041 | `public/arenas/54000041.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000042 | `public/arenas/54000042.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000043 | `public/arenas/54000043.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000044 | `public/arenas/54000044.png` |
| ⬜ | Shipwreck Island | Trophy Road / event | 54000045 | `public/arenas/54000045.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000046 | `public/arenas/54000046.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000047 | `public/arenas/54000047.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000048 | `public/arenas/54000048.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000049 | `public/arenas/54000049.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000050 | `public/arenas/54000050.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000051 | `public/arenas/54000051.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000052 | `public/arenas/54000052.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000053 | `public/arenas/54000053.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000054 | `public/arenas/54000054.png` |
| ✅ | Arena 13 | Trophy Road / event | 54000055 | have |
| ✅ | Arena 14 | Trophy Road / event | 54000056 | have |
| ⬜ | Legendary Arena | Trophy Road / event | 54000057 | `public/arenas/54000057.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000058 | `public/arenas/54000058.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000059 | `public/arenas/54000059.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000060 | `public/arenas/54000060.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000061 | `public/arenas/54000061.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000062 | `public/arenas/54000062.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000063 | `public/arenas/54000063.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000064 | `public/arenas/54000064.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000065 | `public/arenas/54000065.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000066 | `public/arenas/54000066.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000067 | `public/arenas/54000067.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000068 | `public/arenas/54000068.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000069 | `public/arenas/54000069.png` |
| ⬜ | Battleground Arena | Trophy Road / event | 54000070 | `public/arenas/54000070.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000071 | `public/arenas/54000071.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000072 | `public/arenas/54000072.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000073 | `public/arenas/54000073.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000074 | `public/arenas/54000074.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000075 | `public/arenas/54000075.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000076 | `public/arenas/54000076.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000077 | `public/arenas/54000077.png` |
| ⬜ | Legendary Arena | Trophy Road / event | 54000078 | `public/arenas/54000078.png` |
| ⬜ | Bronze I | Mode / seasonal ladder league | 9 ids | `public/arenas/ladder-bronze-i.png` |
| ⬜ | Bronze II | Mode / seasonal ladder league | 168000016, 168000051, 168000181 | `public/arenas/ladder-bronze-ii.png` |
| ⬜ | Bronze III | Mode / seasonal ladder league | 168000052, 168000182 | `public/arenas/ladder-bronze-iii.png` |
| ⬜ | Casual | Mode / seasonal ladder league | 10 ids | `public/arenas/ladder-casual.png` |
| ⬜ | Competitive | Mode / seasonal ladder league | 168000200 | `public/arenas/ladder-competitive.png` |
| ⬜ | Diamond | Mode / seasonal ladder league | 168000059, 168000192 | `public/arenas/ladder-diamond.png` |
| ⬜ | Goblins 5 | Mode / seasonal ladder league | 168000004 | `public/arenas/ladder-goblins-5.png` |
| ⬜ | Gold I | Mode / seasonal ladder league | 168000056, 168000187 | `public/arenas/ladder-gold-i.png` |
| ⬜ | Gold II | Mode / seasonal ladder league | 168000057, 168000188 | `public/arenas/ladder-gold-ii.png` |
| ⬜ | Gold III | Mode / seasonal ladder league | 168000058, 168000189 | `public/arenas/ladder-gold-iii.png` |
| ⬜ | Gold IV | Mode / seasonal ladder league | 168000190 | `public/arenas/ladder-gold-iv.png` |
| ⬜ | Gold V | Mode / seasonal ladder league | 168000191 | `public/arenas/ladder-gold-v.png` |
| ⬜ | Seasonal Arena 1 | Mode / seasonal ladder league | 168000040, 168000045 | `public/arenas/ladder-seasonal-arena-1.png` |
| ⬜ | Seasonal Arena I | Mode / seasonal ladder league | 5 ids | `public/arenas/ladder-seasonal-arena-i.png` |
| ⬜ | Seasonal Arena II | Mode / seasonal ladder league | 168000198 | `public/arenas/ladder-seasonal-arena-ii.png` |
| ⬜ | Silver I | Mode / seasonal ladder league | 168000053, 168000183 | `public/arenas/ladder-silver-i.png` |
| ⬜ | Silver II | Mode / seasonal ladder league | 168000054, 168000184 | `public/arenas/ladder-silver-ii.png` |
| ⬜ | Silver III | Mode / seasonal ladder league | 168000055, 168000185 | `public/arenas/ladder-silver-iii.png` |
| ⬜ | Silver IV | Mode / seasonal ladder league | 168000186 | `public/arenas/ladder-silver-iv.png` |

## 6. Game mode icons (22)

The game data defines 380 modes that share these 22 icons. Current modes the API shows (Merge Tactics, Touchdown, Spooky Chess, Royals 2v2, Mega Draft, Goblin Road…) may have newer icons: add them as `public/ui/modes/<mode>.png`.

| Icon | Internal name | Save as |
|---|---|---|
| clan wars | `icon_clan_wars` | `public/ui/modes/clan_wars.png` |
| mega draft | `icon_mega_draft` | `public/ui/modes/mega_draft.png` |
| 1v1 | `icon_mode_1v1` | `public/ui/modes/mode_1v1.png` |
| 2v2 | `icon_mode_2v2` | `public/ui/modes/mode_2v2.png` |
| 2x elixir | `icon_mode_2x_elixir` | `public/ui/modes/mode_2x_elixir.png` |
| 2x elixir draft | `icon_mode_2x_elixir_draft` | `public/ui/modes/mode_2x_elixir_draft.png` |
| 3x elixir | `icon_mode_3x_elixir` | `public/ui/modes/mode_3x_elixir.png` |
| 7x elixir | `icon_mode_7x_elixir` | `public/ui/modes/mode_7x_elixir.png` |
| cw battle | `icon_mode_cw_battle` | `public/ui/modes/mode_cw_battle.png` |
| cw duel | `icon_mode_cw_duel` | `public/ui/modes/mode_cw_duel.png` |
| cw trainer | `icon_mode_cw_trainer` | `public/ui/modes/mode_cw_trainer.png` |
| draft | `icon_mode_draft` | `public/ui/modes/mode_draft.png` |
| elixir storage | `icon_mode_elixir_storage` | `public/ui/modes/mode_elixir_storage.png` |
| mirror | `icon_mode_mirror` | `public/ui/modes/mode_mirror.png` |
| popdeck | `icon_mode_popdeck` | `public/ui/modes/mode_popdeck.png` |
| rage | `icon_mode_rage` | `public/ui/modes/mode_rage.png` |
| ramp up | `icon_mode_ramp_up` | `public/ui/modes/mode_ramp_up.png` |
| retro | `icon_mode_retro` | `public/ui/modes/mode_retro.png` |
| suddendeath | `icon_mode_suddendeath` | `public/ui/modes/mode_suddendeath.png` |
| touchdown | `icon_mode_touchdown` | `public/ui/modes/mode_touchdown.png` |
| tournament bronze | `icon_tournament_bronze` | `public/ui/modes/tournament_bronze.png` |
| tournament heist | `icon_tournament_heist` | `public/ui/modes/tournament_heist.png` |

## 7. Cards, evolutions, heroes and tower troops (123 cards)

✅ All art comes from the official API, nothing to find: 123 cards, 43 evolutions, 18 heroes, 4 tower troops (Tower Princess, Cannoneer, Dagger Duchess, Royal Chef).

## 8. Clan badges (180)

✅ 180 of 180 are already in `public/badges`.

## 9. Currencies, icons, roles, frames


### Currencies & resources

|  | Asset | Save as |
|---|---|---|
| ⬜ | Gold | `public/ui/gold.png` |
| ⬜ | Gems | `public/ui/gems.png` |
| ⬜ | Elite Wild Cards | `public/ui/elite-wild-card.png` |
| ⬜ | Star Points | `public/ui/star-points.png` |
| ⬜ | Trophy | `public/ui/trophy.png` |
| ⬜ | Clan war trophy | `public/ui/war-trophy.png` |
| ⬜ | Path of Legends / Ultimate Champion medal | `public/ui/medal.png` |
| ⬜ | River Race medal (fame) | `public/ui/river-medal.png` |
| ⬜ | Crown (blue) | `public/ui/crown-blue.png` |
| ⬜ | Crown (red) | `public/ui/crown-red.png` |
| ⬜ | Elixir | `public/ui/elixir.png` |
| ⬜ | Evolution Shard | `public/ui/items/evolution-shard.png` |
| ⬜ | Season Tokens | `public/ui/items/SeasonalToken.png` |
| ⬜ | Banner Tokens | `public/ui/items/banner-token.png` |
| ✅ | Trade Tokens (common / rare / epic / legendary) | have (vendor/cr-api-assets/trade-tokens) |
| ✅ | Experience (king level) star | have (public/ui/experience.png) |

### Site icons (drawn by us today)

|  | Asset | Save as |
|---|---|---|
| ⬜ | Donations given | `public/ui/donations.png` |
| ⬜ | Donations received | `public/ui/donations-received.png` |
| ⬜ | Members | `public/ui/members.png` |
| ⬜ | Battle (crossed swords) | `public/ui/battle.png` |
| ⬜ | Cards / collection | `public/ui/cards.png` |
| ⬜ | King tower | `public/ui/king-tower.png` |
| ⬜ | Clan war | `public/ui/clan-war.png` |

### Clan roles

|  | Asset | Save as |
|---|---|---|
| ⬜ | Leader | `public/ui/roles/leader.png` |
| ⬜ | Co-leader | `public/ui/roles/co-leader.png` |
| ⬜ | Elder | `public/ui/roles/elder.png` |
| ⬜ | Member | `public/ui/roles/member.png` |

### Clan war leagues (frames)

|  | Asset | Save as |
|---|---|---|
| ⬜ | Bronze I | `public/ui/clan-leagues/bronze-1.png` |
| ⬜ | Bronze II | `public/ui/clan-leagues/bronze-2.png` |
| ⬜ | Bronze III | `public/ui/clan-leagues/bronze-3.png` |
| ⬜ | Silver I | `public/ui/clan-leagues/silver-1.png` |
| ⬜ | Silver II | `public/ui/clan-leagues/silver-2.png` |
| ⬜ | Silver III | `public/ui/clan-leagues/silver-3.png` |
| ⬜ | Gold I | `public/ui/clan-leagues/gold-1.png` |
| ⬜ | Gold II | `public/ui/clan-leagues/gold-2.png` |
| ⬜ | Gold III | `public/ui/clan-leagues/gold-3.png` |
| ⬜ | Legendary I | `public/ui/clan-leagues/legendary-1.png` |
| ⬜ | Legendary II | `public/ui/clan-leagues/legendary-2.png` |
| ⬜ | Legendary III | `public/ui/clan-leagues/legendary-3.png` |

### Card frames & levels

|  | Asset | Save as |
|---|---|---|
| ⬜ | Card star level 1 | `public/ui/stars/star-1.png` |
| ⬜ | Card star level 2 | `public/ui/stars/star-2.png` |
| ⬜ | Card star level 3 | `public/ui/stars/star-3.png` |
| ⬜ | Card level frame | `public/ui/stars/level-frame.png` |
| ⬜ | Card mastery frames (silver → gold → diamond) | `public/ui/mastery-frames/<tier>.png` |

## 10. Cosmetics with no public list

No data source lists these, so they can only be collected from the wiki galleries or in-game. We don't show any of them yet, so they're nice-to-have:

- **Tower skins** (every princess and king tower skin) → `public/cosmetics/tower-skins/<name>.png`
- **Banners**: frames, decorations and the banner badge pieces → `public/cosmetics/banners/<name>.png`
- **Emotes added since 2024** → `public/emotes/<name>.png`
- **King / champion skins and card skins** → `public/cosmetics/skins/<name>.png`
- **Pass Royale and seasonal art** (season logos, pass tiers) → `public/cosmetics/seasons/<season>.png`

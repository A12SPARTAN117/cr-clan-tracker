# Art we don't have yet

Everything below is currently **drawn by us** (SVG/CSS) because no source we have includes the real game art.
The best source is the official **Supercell Fan Kit** (fankit.supercell.com → Clash Royale); it needs a login and accepting their terms, so it's a download for you to do.

**How to save them:** transparent PNGs, at least 128×128 px (256 is better), with the exact file names below. Once they're in place, tell me and I'll swap them in everywhere.

Already real (no action needed): card art, evolutions, heroes, tower troops (official API); clan badges, Path of Legends league icons 0–10, chests, character renders, the experience (king level) star (RoyaleAPI's asset repo).

---

## 1. Stat icons → `public/ui/`

Drawn today in `src/components/ui/icons.tsx` and used across every page.

| Save as | What it is in the game | Where it shows on the site |
|---|---|---|
| `trophy.png` | Trophy (Trophy Road / ladder) | Player trophies, best trophies, clan required trophies, clan score |
| `war-trophy.png` | Clan War trophy | Clan war trophies everywhere, Clans list |
| `medal.png` | Ultimate Champion / Path of Legends medal | PoL rating next to players, leaderboards, Compare |
| `crown-blue.png` | Blue crown (your side) | Wins, three-crown wins, battle results |
| `crown-red.png` | Red crown (opponent) | Battle results (opponent crowns) |
| `elixir.png` | Elixir drop | Average elixir on every deck |
| `river-medal.png` | River Race medal (fame) | Clan war fame, boat battles, home pinned clan |
| `donations.png` | Cards donated (clan donation icon) | Donations on clans, dashboard, players |
| `donations-received.png` | Cards received | Dashboard "Recv." column |
| `members.png` | Clan members (people) icon | Member counts |
| `battle.png` | Battle / crossed swords | Battles, losses |
| `cards.png` | Cards / collection icon | Cards found, collection level, war decks |
| `star-points.png` | Star points | Player star points |
| `king-tower.png` | King tower | King tower level on player pages |
| `clan-war.png` | Clan War / River Race | War tab, war participation |
| `gold.png` | Gold coin | Upgrade costs on the Collection tab |
| `gems.png` | Gems | (spare, for future use) |

## 2. Game mode icons → `public/ui/modes/`

Drawn today in `ModeFilter` and the battle log (`BattleKindIcon`). Ranked and Ultimate Champion already use real league art.

| Save as | Mode |
|---|---|
| `ladder.png` | Trophy Road / Ladder |
| `2v2.png` | 2v2 |
| `clan-war.png` | Clan War (River Race battle) |
| `boat-battle.png` | Boat battle |
| `challenge.png` | Challenges (Classic / Grand) |
| `draft.png` | Draft modes (Triple Draft, Chaos Draft…) |
| `event.png` | Special events (generic) |
| `chess.png` | Spooky Chess / board-style event |
| `friendly.png` | Friendly battle |
| `tournament.png` | Tournament |

## 3. Clan roles → `public/ui/roles/`

Drawn today in `RoleIcon` / `RoleChip` (member lists, dashboard, player pages).

`leader.png`, `co-leader.png`, `elder.png`, `member.png`

## 4. Clan league frames → `public/ui/clan-leagues/`

New on Compare, clan pages and the Clans list (drawn in `ClanFrame` for now). One per league and tier, 12 in total:

`bronze-1.png`, `bronze-2.png`, `bronze-3.png`,
`silver-1.png`, `silver-2.png`, `silver-3.png`,
`gold-1.png`, `gold-2.png`, `gold-3.png`,
`legendary-1.png`, `legendary-2.png`, `legendary-3.png`

While you're in the game, please also check the clan war trophy where each league starts. We use Bronze 0 / 200 / 400, Silver 600 / 900 / 1200, Gold 1500 / 2000 / 2500, Legendary 3000 / 4000 / 5000 (Legendary II and III are confirmed by Supercell's release notes; the rest are from memory of the in-game screen). They live in `src/lib/clanLeague.ts`.

## 5. Card star levels → `public/ui/stars/`

Drawn today on the Collection tab.

`star-1.png`, `star-2.png`, `star-3.png` (the gold star-level badge for 1, 2 and 3 stars), and optionally `level-frame.png` (the frame the card level sits in).

## 6. Arenas → `public/arenas/`

Our arena data stops in 2023, so current arenas (e.g. Spirit Square) have no picture. Save each arena's icon named by the arena **id** the API returns (for example Spirit Square is `54000144.png`); the player page will then show it next to the arena name. Any you can get are useful; the current Trophy Road arenas matter most.

## 7. Player badges the official CDN doesn't serve → `data/badge-art/`

These 8 badges have official image links that Supercell's server no longer answers. They show a stand-in today (card art, the XP star or a chest). Save the real badge art with these names:

- `TripleDraftLeagueCompletion.png`
- `ChaosDraftLeagueCompletion.png`
- `AnarchyLeagueCompletion.png`
- `2v2LeagueCompletion.png`
- `SuddenDeathTrailCompletion.png`
- `2026YearBadge.png`
- `MasteryMinionGiant.png`
- `MasteryRonin.png`

New badges appear with every season, so this list will grow; the Badges tab shows a stand-in for any badge whose image fails.

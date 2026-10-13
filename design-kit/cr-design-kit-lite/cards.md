# Clash Royale card reference

Pulled from the official Clash Royale API on 2026-10-13.

**123 cards** (87 troops, 13 buildings, 23 spells), **43 evolutions**, **18 heroes**, **4 tower troops**.

## Rules for the UI

- Rarities: Common, Rare, Epic, Legendary, Champion. Each has its own frame colour.
- In-game, every card levels up to **16**. The API reports levels on an older per-rarity scale, so the site adds an offset: Common +0 (max 16), Rare +2 (max 14→16), Epic +5 (max 11→16), Legendary +8 (max 8→16), Champion +10 (max 6→16). Always display the in-game level.
- A card can have an **Evolution** (alternate art, purple/magenta frame), a **Hero** (alternate art, gold frame), or **both** (Knight, Valkyrie, Musketeer, Wizard).
- A deck is 8 cards + 1 tower troop. Average elixir is shown to 1 decimal place.
- Elixir "—" means variable cost (e.g. Mirror = last card played +1).
- Images are in `images/cards`, `images/evolutions`, `images/heroes` and `images/tower-troops`, named by card slug (e.g. `mini-pekka.png`).

## Common (29)

| Card | Type | Elixir | Evo | Hero |
|---|---|---|---|---|
| Electro Spirit | Troop | 1 |  |  |
| Fire Spirit | Troop | 1 |  |  |
| Ice Spirit | Troop | 1 | ✅ |  |
| Skeletons | Troop | 1 | ✅ |  |
| Bats | Troop | 2 | ✅ |  |
| Berserker | Troop | 2 |  | ✅ |
| Bomber | Troop | 2 | ✅ |  |
| Giant Snowball | Spell | 2 | ✅ |  |
| Goblins | Troop | 2 |  | ✅ |
| Spear Goblins | Troop | 2 |  |  |
| Zap | Spell | 2 | ✅ |  |
| Archers | Troop | 3 | ✅ |  |
| Arrows | Spell | 3 |  |  |
| Cannon | Building | 3 | ✅ |  |
| Firecracker | Troop | 3 | ✅ |  |
| Goblin Gang | Troop | 3 |  |  |
| Knight | Troop | 3 | ✅ | ✅ |
| Minions | Troop | 3 |  |  |
| Royal Delivery | Spell | 3 |  |  |
| Skeleton Barrel | Troop | 3 | ✅ |  |
| Mortar | Building | 4 | ✅ |  |
| Skeleton Dragons | Troop | 4 |  |  |
| Tesla | Building | 4 | ✅ |  |
| Barbarians | Troop | 5 | ✅ |  |
| Minion Horde | Troop | 5 | ✅ |  |
| Rascals | Troop | 5 |  |  |
| Elite Barbarians | Troop | 6 | ✅ |  |
| Royal Giant | Troop | 6 | ✅ |  |
| Royal Recruits | Troop | 7 | ✅ |  |

## Rare (31)

| Card | Type | Elixir | Evo | Hero |
|---|---|---|---|---|
| Heal Spirit | Spell | 1 |  |  |
| Ice Golem | Troop | 2 |  | ✅ |
| Suspicious Bush | Troop | 2 |  |  |
| Dart Goblin | Troop | 3 | ✅ |  |
| Earthquake | Spell | 3 |  |  |
| Elixir Golem | Troop | 3 |  |  |
| Mega Minion | Troop | 3 |  | ✅ |
| Tombstone | Building | 3 |  | ✅ |
| Battle Healer | Troop | 4 |  |  |
| Battle Ram | Troop | 4 | ✅ |  |
| Bomb Tower | Building | 4 |  |  |
| Fireball | Spell | 4 |  |  |
| Flying Machine | Troop | 4 |  |  |
| Furnace | Building | 4 | ✅ |  |
| Goblin Cage | Building | 4 | ✅ |  |
| Goblin Demolisher | Troop | 4 |  |  |
| Goblin Hut | Building | 4 |  |  |
| Hog Rider | Troop | 4 |  |  |
| Mini P.E.K.K.A | Troop | 4 |  | ✅ |
| Minion Giant | Troop | 4 |  |  |
| Musketeer | Troop | 4 | ✅ | ✅ |
| Valkyrie | Troop | 4 | ✅ | ✅ |
| Zappies | Troop | 4 |  |  |
| Giant | Troop | 5 |  | ✅ |
| Inferno Tower | Building | 5 |  |  |
| Royal Hogs | Troop | 5 | ✅ |  |
| Wizard | Troop | 5 | ✅ | ✅ |
| Barbarian Hut | Building | 6 |  |  |
| Elixir Collector | Building | 6 |  |  |
| Rocket | Spell | 6 |  |  |
| Three Musketeers | Troop | 9 |  |  |

## Epic (33)

| Card | Type | Elixir | Evo | Hero |
|---|---|---|---|---|
| Barbarian Barrel | Spell | 2 |  | ✅ |
| Goblin Curse | Spell | 2 |  |  |
| Rage | Spell | 2 |  |  |
| Wall Breakers | Troop | 2 | ✅ |  |
| Clone | Spell | 3 |  |  |
| Goblin Barrel | Spell | 3 | ✅ |  |
| Guards | Troop | 3 |  |  |
| Skeleton Army | Troop | 3 | ✅ |  |
| Tornado | Spell | 3 |  |  |
| Vines | Spell | 3 |  |  |
| Baby Dragon | Troop | 4 | ✅ |  |
| Dark Prince | Troop | 4 |  | ✅ |
| Freeze | Spell | 4 |  |  |
| Goblin Drill | Building | 4 | ✅ |  |
| Hunter | Troop | 4 | ✅ |  |
| Poison | Spell | 4 |  |  |
| Rune Giant | Troop | 4 |  |  |
| Balloon | Troop | 5 |  | ✅ |
| Bowler | Troop | 5 |  | ✅ |
| Cannon Cart | Troop | 5 |  |  |
| Electro Dragon | Troop | 5 | ✅ |  |
| Executioner | Troop | 5 | ✅ |  |
| Prince | Troop | 5 |  |  |
| Void | Spell | 5 |  |  |
| Witch | Troop | 5 | ✅ |  |
| Giant Skeleton | Troop | 6 |  |  |
| Goblin Giant | Troop | 6 | ✅ |  |
| Lightning | Spell | 6 |  |  |
| X-Bow | Building | 6 |  |  |
| Electro Giant | Troop | 7 | ✅ |  |
| P.E.K.K.A | Troop | 7 | ✅ |  |
| Golem | Troop | 8 |  |  |
| Mirror | Spell | — |  |  |

## Legendary (22)

| Card | Type | Elixir | Evo | Hero |
|---|---|---|---|---|
| The Log | Spell | 2 |  |  |
| Bandit | Troop | 3 |  |  |
| Fisherman | Troop | 3 |  |  |
| Ice Wizard | Troop | 3 |  | ✅ |
| Miner | Troop | 3 |  |  |
| Princess | Troop | 3 | ✅ |  |
| Royal Ghost | Troop | 3 | ✅ |  |
| Electro Wizard | Troop | 4 |  | ✅ |
| Inferno Dragon | Troop | 4 | ✅ |  |
| Lumberjack | Troop | 4 | ✅ |  |
| Magic Archer | Troop | 4 |  | ✅ |
| Mother Witch | Troop | 4 |  |  |
| Night Witch | Troop | 4 |  |  |
| Phoenix | Troop | 4 |  |  |
| Goblin Machine | Troop | 5 |  |  |
| Graveyard | Spell | 5 |  |  |
| Ram Rider | Troop | 5 |  |  |
| Ronin | Troop | 5 |  |  |
| Sparky | Troop | 6 |  |  |
| Spirit Empress | Spell | 6 |  |  |
| Lava Hound | Troop | 7 |  |  |
| Mega Knight | Troop | 7 | ✅ |  |

## Champion (8)

| Card | Type | Elixir | Evo | Hero |
|---|---|---|---|---|
| Little Prince | Troop | 3 |  |  |
| Golden Knight | Troop | 4 |  |  |
| Mighty Miner | Troop | 4 |  |  |
| Skeleton King | Troop | 4 |  |  |
| Archer Queen | Troop | 5 |  |  |
| Goblinstein | Troop | 5 |  |  |
| Monk | Troop | 5 |  |  |
| Boss Bandit | Troop | 6 |  |  |

## Evolutions

Ice Spirit, Skeletons, Bats, Bomber, Giant Snowball, Zap, Archers, Cannon, Firecracker, Knight, Skeleton Barrel, Mortar, Tesla, Barbarians, Minion Horde, Elite Barbarians, Royal Giant, Royal Recruits, Dart Goblin, Battle Ram, Furnace, Goblin Cage, Musketeer, Valkyrie, Royal Hogs, Wizard, Wall Breakers, Goblin Barrel, Skeleton Army, Baby Dragon, Goblin Drill, Hunter, Electro Dragon, Executioner, Witch, Goblin Giant, Electro Giant, P.E.K.K.A, Princess, Royal Ghost, Inferno Dragon, Lumberjack, Mega Knight

## Heroes

Berserker, Goblins, Knight, Ice Golem, Mega Minion, Tombstone, Mini P.E.K.K.A, Musketeer, Valkyrie, Giant, Wizard, Barbarian Barrel, Dark Prince, Balloon, Bowler, Ice Wizard, Electro Wizard, Magic Archer

## Tower troops

| Tower troop | Rarity |
|---|---|
| Tower Princess | Common |
| Cannoneer | Epic |
| Dagger Duchess | Legendary |
| Royal Chef | Legendary |

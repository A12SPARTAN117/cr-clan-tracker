# Handoff: CR Clan Tracker — "Obsidian Arena" theme

## Overview
CR Clan Tracker is a free, fan-made Clash Royale stats site with two jobs:
1. **Player & game stats**: look up any player (profile, collection, badges, stats, battles, decks, history), meta decks, leaderboards, news, card encyclopedia.
2. **Clan management (headline feature)**: leaders see who is active, who plays war, who left, and an **Asset Score** (0–100) per member, with editable weights.

Audience: players aged 13–35, mostly mobile. Leaders also use desktop for rosters. Tone: cinematic and premium, but data-dense and easy to scan.

Fan-site rules: no Supercell logo, Clash Royale wordmark, character faces or exact game UI. The footer disclaimer is **required on every page**, verbatim:
> This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it. For more information see Supercell's Fan Content Policy.

## About the design files
The files in `design/` are **design references built in HTML**: working prototypes that show the intended look and behaviour. They are **not production code to ship**. Recreate them in the target codebase's environment (React/Next, Vue, SvelteKit, etc.) using its own patterns. If there is no codebase yet, Next.js + TypeScript + Tailwind (or CSS variables) + GSAP + three.js is a good fit for this design.

How to open them: serve the `design/` folder with any static server (e.g. `npx serve design`) and open `Home.dc.html`. Each `*.dc.html` file is a self-contained page. Its markup sits between `<x-dc>` tags, and its logic lives in a `class Component` inside `<script data-dc-script>`. That logic is plain JS and works like a React class component: `renderVals()` returns the template's values. `support.js` is only the prototype runtime, so don't port it.

## Fidelity
**High fidelity.** Colours, type, spacing, radii, motion timings and copy are final. Recreate them pixel-accurately. All data is **mock data** and needs to be replaced with the real Clash Royale API plus the site's own tracking database.

## Files
| File | What it is |
|---|---|
| `design/Home.dc.html` | Home. Two hero options: **1a Crown** (centred particle crown + champion) and **1b Tower** (split layout, dotted King Tower, stat ticker). Switch with the top-right toggle. The `showLayers` prop shows annotated layers. **The user has not picked one yet; ask them.** |
| `design/Clan Dashboard.dc.html` | **Most important page.** `/clan/{tag}/manage`: summary tiles, members table, member drawer, War / Roster / Score settings tabs, compare modal, CSV export. |
| `design/Player Profile.dc.html` | `/player/{tag}` with 7 tabs: Overview, Collection, Badges, Stats, Battles, Decks, History. |
| `design/Clan Profile.dc.html` | `/clan/{tag}` public page: Members / War / Roster changes / Stats tabs, "Manage this clan" CTA. |
| `design/Clans.dc.html` | Clan search / directory. |
| `design/Decks.dc.html` | `/decks`: mode tabs, deck rows, card stats view, deck detail with matchups. |
| `design/Leaderboards.dc.html` | `/leaderboards`: podium scene, 4 tabs, location dropdown. |
| `design/News.dc.html` | `/news` list + article view (balance posts with buff/nerf). |
| `design/Cards.dc.html` | `/cards` encyclopedia + detail (normal / evo / hero / split art). |
| `design/Not Found.dc.html` | 404 "Route Lost" + "player not found" state (`variant` prop). |
| `design/Design System.dc.html` | Tokens, type scale, spacing/radii/elevation, component sheet, **motion spec table**, **background scene list**. |
| `design/Interaction Notes.dc.html` | Sorting, filtering, drawer, tabs, search routing, theme, accessibility rules. |
| `design/Mobile Screens.dc.html` | Every page live at 390×844 in phone frames. |
| `design/CardTile.dc.html` | Reusable card tile component (see Components). |
| `design/SiteNav.dc.html`, `SiteFooter.dc.html` | Global nav (desktop + mobile bottom bar) and footer. |
| `design/arena-fx.js` | All atmosphere/motion: film grain, fog, particle crown, portal loader, number decode, reveals, cursor light, tilt, magnetic buttons, page transitions, theme persistence. Port it as hooks/components. |
| `design/cards.js` | Loads `data/cards.csv` and normalises it (slug, rarity, elixir, evo/hero flags, image URLs). |
| `design/data/cards.csv`, `cards.md` | Every card (123), 43 evolutions, 18 heroes, 4 tower troops, with official image URLs. |
| `design/images/cards/` | 12 local card PNGs the user supplied. |

## Design tokens

### Colour: dark "Obsidian" (default)
| Token | Value | Use |
|---|---|---|
| void | `#07080A` | page background, behind scenes |
| charcoal | `#121316` | main surface |
| obsidian | `#1A1C20` | raised panels, rows |
| slate | `#262930` | hover surfaces, inputs |
| well | `#0B0C0E` | recessed slots (heatmap 0, bar tracks) |
| hairline | `rgba(255,255,255,.10)` | borders, dividers |
| frame | `rgba(255,255,255,.55)` | inset white frames, 12–16px inside edges |
| text-1 | `#F3F4F6` | primary |
| text-2 | `#A4A9B4` | secondary |
| text-3 | `#80868F` | muted labels (**raised from the brief's #62676F to pass AA**) |
| glow-blue | `#3AA0FF` | accent, links, focus, active, wins |
| glow-blue-hi | `#8CCBFF` | highlights, light tubes |
| glow-blue-deep | `#0A48C9` | pressed, fills behind glow |
| glass | `rgba(18,19,22,.72)` + `backdrop-filter: blur(16px)` | nav, sticky headers, drawer header |

Semantic accents (always small, always paired with an icon or label): **evolution** `#A35BFF` (light strip `#C79BFF`), **hero / #1** `#E6B34A` (light strip `#F5D58A`), **loss / inactive / danger** `#FF5464` (text and icons only, never large fills). **Wins are blue, never green.**

Glow recipe (focus, hover, active, "best" only): `0 0 0 1px rgba(58,160,255,.6), 0 0 18px rgba(58,160,255,.45), 0 0 48px rgba(58,160,255,.18)`.

### Colour: light "Marble Day"
void `#E7E7E4`, charcoal `#F4F4F2`, obsidian `#FFFFFF`, slate `#ECECE9`, well `#DCDCD8`, hairline `rgba(12,13,15,.12)`, frame `rgba(12,13,15,.35)`, text-1 `#0C0D0F`, text-2 `#3E4249`, text-3 `#5F646C`, blue and blue-hi `#0A6BDB`, ember `#C8283A`, gold `#946508`, evo `#7A2FE0`, glass `rgba(244,244,242,.8)`. Primary button inverts: bg `#0C0D0F`, text `#F4F4F2`. **Header scenes stay dark in both themes** because they are images, so their text stays white.

The theme is stored in `localStorage['oa-theme']` and applied before first paint (`html[data-theme=light]`).

### Typography
- **Display / numbers / labels:** JetBrains Mono (400/500/700/800). **UI / body:** Space Grotesk (400–700). Google Fonts.
- Display XL: Mono 800, `clamp(48px, 9vw, 160px)`, line-height .84, letter-spacing −0.065em.
- Display L: Mono 800, up to 96px / .88 / −0.06em. Display M: Mono 800, up to 56px / .95 / −0.05em.
- Stat number: Mono 800, 34–52px / 1 / −0.05em, `font-variant-numeric: tabular-nums`.
- Heading: Grotesk 600, 22–26px / 1.2. Body: Grotesk 400, 15–18px / 1.55. UI name: Grotesk 600, 14px.
- Data cells: Mono 500, 12–13px, tabular-nums.
- Label: Mono 500, 9–11px, uppercase, letter-spacing .12–.16em, often with a status dot: `● LIVE · RIVER RACE DAY 3`, `TAG #9Q2LUY`, `LAST SYNC 04:12`.

### Spacing, radii, elevation
- Spacing: 4px base (4, 8, 12, 16, 24, 32, 48, 64). Page gutters `clamp(16px, 3vw, 40px)`. Max content width 1440px.
- Radii: 4 chips/cells · 6 buttons/inputs · 8 panels · 10 modals. Stone-cut, never bubbly.
- Elevation: flat (charcoal) · raised (obsidian + `inset 0 1px 0 rgba(255,255,255,.08)`, `0 8px 20px rgba(0,0,0,.4)`) · float (glass + `0 30px 80px rgba(0,0,0,.6)`).
- Key panels get **corner ticks**: 10×10px L-shapes (1px `frame` colour) at the top-left and bottom-right corners.
- Faint marble veins: an SVG `feTurbulence` texture at 3–5% opacity (see the `--vein` variable in Clan Dashboard).
- Film grain: an animated noise canvas, fixed full-screen, **opacity .015** (lowered at the user's request), blend `screen`, ~12fps.

## Components
- **Card tile** (`CardTile.dc.html`). Props: `slug, label, img, img2, split, rarity (common|rare|epic|legendary|champion|tower), size S 44 / M 68 / L 104 / XL 150px wide (aspect 95:140), level, elixir, evo, hero, owned, active, showLabel`.
  - The frame is a 2px gradient "material" by rarity:
    - common = brushed steel `linear-gradient(135deg,#a9aeb6,#5b6068 30%,#c4c8ce 52%,#50555c 75%,#9aa0a8)`
    - rare = white marble
    - epic = black marble with violet vein `#A35BFF`
    - legendary = iridescent glass
    - champion = obsidian with gold corners
  - Evo adds a violet glowing 2px strip at the bottom; hero adds a gold one; both = half/half. Split mode shows evo art on the left and hero art on the right, with a gold diagonal seam.
  - Not owned = greyscale at 30% opacity. The rarity is also written in the label text.
  - Elixir drop sits top-left (`#0A48C9` with a glow). The level shows as "LV 14" on a bottom gradient.
  - Hover: 3D tilt up to 8° plus a glare overlay.
  - **Image fallback chain:** `img` → `fallback` → the same URL with `/cardheroes/` or `/cardevolutions/` replaced by `/cards/` → local `images/cards/{slug}.png` → striped placeholder with the name. Some official hero URLs in the CSV return 404.
- **Primary button:** white bg, black Mono 700 11px uppercase, letter-spacing .14em, 44–56px tall, radius 6. Hover adds the glow plus a light sweep (`linear-gradient(110deg, …)` with background-position animated over 700ms) and a magnetic pull. **Secondary:** hairline outline. **Tertiary:** Mono text link with →.
- **Search input:** obsidian, inset 1px frame 4–5px inside, `#` prefix chip (slate, blue-hi), blinking block cursor when empty, blue glow ring on focus. Tag validation: characters `0289PYLQGRJCUV` only, `#` optional. An invalid character turns the border ember and the hint names the character.
- **Tabs:** Mono 11px uppercase. Active = text-1 + `inset 0 -2px 0 #8CCBFF, 0 8px 16px -10px rgba(58,160,255,.9)` (the light-tube underline). They scroll sideways on mobile.
- **Data table:** obsidian/charcoal rows with hairline dividers and a sticky glass header (Mono 10px). The sorted header turns text-1 with a blue ▼/▲ arrow. Row hover/focus = `linear-gradient(90deg, blue 0 2px, slate 2px)` (left light strip). Rows have tabindex 0; Enter opens detail.
- **Stat tile:** tiny label, huge Mono number (decodes on view), delta in blue ▲ or ember ▼, and an optional 64×20 sparkline (1px text-2 polyline).
- **Role chips:**
  - Leader = gold crown outline icon, gold text, gold border.
  - Co-Leader = double chevron, frame border.
  - Elder = shield outline.
  - Member = dot, text-2.
- **Last seen:**
  - <24h: filled blue dot, "ACTIVE".
  - 1–3 days: hollow text-2 dot, "AT RISK".
  - >3 days: hollow ember dot, "INACTIVE".
  - Colour is never the only signal.
- **Asset Score gauge:** SVG ring (r=15 in a 36 viewBox for the table, 120px in the drawer), stroke blue with opacity `.35 + score/100 × .65`. A drop-shadow glow is added when the score is ≥70. The number sits in the centre.
- **War heatmap cell:**
  - 0 decks = recessed well with an inner shadow and the text "0".
  - 1–4 decks = blue at alpha .22 / .42 / .66 / 1; 4 also gets a glow and an inner hi border.
  - Pending day = dashed outline with "·".
  - Not in clan = hatched.
  - The cell always prints its count.
- **Badge trophy:** 72×84 glass box (`linear-gradient(160deg, rgba(255,255,255,.16), …)`, 1px white/22% border, inner highlight) on a shelf with a light-strip bottom border. Shows level "LV 8 / 10" and a 2px light-tube progress bar with "143 / 150".
- **States:** skeleton shimmer, portal-ring loader (SVG circle, stroke-dashoffset loop 1.8s), "Data since {date}" dashed blue banner, empty state with chest art, error ("PLAYER NOT FOUND · CHECK THE TAG"), and a live dot + LAST SYNC.

## Motion spec
The full table is in `Design System.dc.html` §04. In summary:

| Animation | Trigger | Duration | Easing | Reduced motion |
|---|---|---|---|---|
| Title mask reveal | enters viewport (15%) | 900ms | `cubic-bezier(.16,1,.3,1)` | fade |
| Number decode | stat enters viewport | 420ms | left→right settle | final value |
| Hairline draw-in | enters viewport | 1100ms | `cubic-bezier(.65,0,.35,1)` | drawn |
| Cursor light | pointer over panel | follows | — | off |
| Card tilt + glare | hover | 80ms follow / 500ms return | `(.16,1,.3,1)` | off |
| Magnetic CTA | hover | 200ms in / 600ms out | `(.16,1,.3,1)` | off |
| Character "comes alive" | hover / focus | 600ms colour in | ease-out | stays grey |
| Hero push-in | load | 22s alternate scale 1.02→1.10 | ease-in-out | static poster |
| Particle crown | always; scatters with scroll | 0.0035 rad/frame, 8% lerp | — | static |
| Drawer | open | 450ms slide | `(.16,1,.3,1)` | fade |
| Page transition | link click | fog wipe 350–500ms; portal loader if >800ms | `(.65,0,.35,1)` | cross-fade |
| Rune pulse (dashboard) | idle / syncing | 4s / 0.8s | ease-in-out | static |

All motion must respect `prefers-reduced-motion`.

## Header scenes (layer stack)
Each layer, bottom to top:
1. Void.
2. Scene still or muted 8–12s loop (≤3 MB, poster = still), rendered greyscale, contrast 1.1, brightness .5–.7, with parallax.
3. Fog + dust motes (canvas).
4. Character render: greyscale with a blue rim (`drop-shadow(-2px 0 0 rgba(140,203,255,.75)) drop-shadow(0 0 30px rgba(58,160,255,.45))`); colour returns on hover.
5. WebGL/particle element.
6. Scrim: gradient into void over the bottom 40%, plus a vignette.
7. Inset white frame, 14px inside the edge.
8. Copy.

Sizes: Home is 100vh; inner pages are 40–55vh bands. **Nothing busy behind tables.** Per-page scene briefs are in Design System §05.

The particle crown (`arena-fx.js` → `Crown`) is 2.8k dots sampled on a crown (band + 5 spikes + orbs) or a King Tower. It rotates, tilts with the cursor, and scatters into a sphere as the hero scrolls out. Port it to three.js `Points` for production.

## Screens: key behaviour

### Clan management dashboard (highest priority)
- **Summary strip** (6 tiles, 1px gaps on a hairline grid): Members 47/50 · Active 24h (with 3d / 7d) · War participation % · Decks today x/200 · Avg asset score · Flagged inactive.
- **Members table** (min-width 1480px, own scroll pane with max-height 72vh and a sticky header). Columns: select, #, Member + tag (+ NEW chip if <7 days), Role, Trophies, PoL league + rating, Last seen, Donations, Received, Fame, War decks (4 mini day cells + x/16), War W%, 1v1 (win % + games), Asset (gauge + 5-segment breakdown bar), In clan, Trend.
  - Every column sorts.
  - Filters: search, role, activity, war (all / partial / none), trophy floor (cycles), new <7 days.
  - **Below 760px it becomes cards** with sort chips.
- **Bulk bar:** Compare (2–4 → modal), Export CSV, Copy names, Clear.
- **Drawer** (560px, full width on mobile):
  - Large gauge.
  - Breakdown bars per factor with their weight %.
  - 10-week × 4-day heatmap; hatched weeks = not in clan yet.
  - Friendlies vs clanmates (W/L bars).
  - Role history.
  - ↑/↓ moves to the previous/next member; Esc closes.
- **Asset Score:** each factor is 0–100, combined as a weighted average.
  - **war** = decks this week / 12 × 60 + 10-week participation × 40.
  - **donations** = min(100, donations / 7.5).
  - **activity** = 100 if <24h, then −0.8 per hour up to 72h, then decays.
  - **win rate** = (warWin − 30) / 45.
  - **tenure** = days / 3.65, capped at 100.
  - Default weights: war 35, donations 20, activity 20, win rate 15, tenure 10. Sliders run 0–50, are saved in `localStorage['oa-weights']`, and the live preview shows rank movement against the defaults.
- **War tab:** day indicator (THU FRI SAT SUN, current one glowing) and a live countdown. Five-clan standings show a boat position bar, fame and decks/200. The participation grid has members as rows and days as columns, with a "✕ NO DECKS" flag. Past 10 races expand to show per-member decks and fame.
- **Roster tab:** filterable timeline (+ joined, − left, × kicked, ▲ promoted, ▼ demoted) with the banner "Data since 02 Jun 2026", plus a Former members table.
- **Recommendations:**
  - "Promotion candidates": Members, sorted by score, active.
  - "At risk": 3+ days away or 0 war decks.
  - Wording stays neutral: "Suggestions only. The leader decides."

### Data constraints to respect
- History (clan, trophy, PoL, war beyond ~10 weeks) only exists from when tracking started. Always show partial/empty states.
- The battle log holds about 30 battles. Win rates must say "based on N games".
- Emotes are shown only as a count.
- There is no Clan Wars 1 data.
- Ranked leaderboards are Path of Legends only.

## Assets
- **Card art:** official URLs in `data/cards.csv` (`image`, `evolution_image`, `hero_image`) plus 12 local PNGs in `images/cards/`. Art that is data stays full colour.
- **Not yet supplied:** the user's mood board (`01-ruined-arena.jpg`, `02-marble-objects-light.jpg`, `03-obsidian-objects-dark.jpg`, `04-scenes-blue-glow.jpg`), `royaleapi/characters` renders, `royaleapi/leagues` (league0–10), `royaleapi/arenas`, `royaleapi/clan-badges` (map the API's `badgeId` to a file), `royaleapi/chests` and `royaleapi/misc`. In the prototypes these are labelled `<image-slot>` drop zones; replace them with the real assets. League icons currently show as numbered circles.
- **Brand mark:** a placeholder monogram of two overlapping outlined crowns (steel `#A4A9B4` + blue `#8CCBFF` with a glow). The final version should be brushed steel + white marble crowns, per the brief.

## State to implement
- Pinned player tag and clan tag (stored locally); when set, Home and My Clan open straight to that data.
- Theme preference.
- Score weights per clan.
- Table sort and filters (per session).
- Selected rows and the open drawer member (put the member in the URL, e.g. `?member=TAG`, for deep links).
- Cached API data with a refresh action and a LAST SYNC timestamp.

## Open items for the user
- Choose Home hero **1a (Crown)** or **1b (Tower)**.
- Supply the missing assets above, plus scene stills/loops (briefs are in Design System §05).
- Smooth inertia scroll (Lenis or similar) has not been prototyped.

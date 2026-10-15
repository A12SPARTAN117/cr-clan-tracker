# CR Clan Tracker

A free, fan-made Clash Royale stats site with a focus on **clan management**: look up any player, browse meta decks and leaderboards, and see who in your clan is active, who plays war and who's the most valuable member.

Built with Next.js 16 (App Router, Cache Components), TypeScript and three.js, in the "Obsidian Arena" theme. The design reference lives in [design-kit/handoff](design-kit/handoff/README.md).

## What's in it

| Page | Route | Data |
|---|---|---|
| Home | `/` | Particle-crown hero, tag search, pinned player/clan, top decks, Path of Legends top 5, news |
| Clan dashboard | `/clan/{tag}/manage` | Members table with Asset Score, filters, compare, CSV, member drawer, war, roster changes, score weights |
| Clan profile | `/clan/{tag}` | Public clan page: members, war, roster changes, stats |
| Clans | `/clans` | Clan search with location / members / war trophies / type filters |
| Player profile | `/player/{tag}` | Overview, collection, badges, stats, battles, decks, history |
| Decks | `/decks` | Meta decks and card stats per mode, deck detail with matchups |
| Leaderboards | `/leaderboards` | Path of Legends, clans, clan wars, events |
| Cards | `/cards`, `/cards/{slug}` | Every card, evolution, hero and tower troop with live meta stats |
| News | `/news` | Site updates and guides (`src/content/news.ts`) |
| My clan | `/my-clan` | Opens your pinned clan's dashboard |

Search routes through `/t/{tag}`, which works out whether a tag is a player or a clan (they can collide; see [docs/api-findings.md](docs/api-findings.md)).

**Meta decks** are not in the official API. They are built every hour from the battle logs of the global Path of Legends top 100 (`src/lib/meta.ts`).

**History** (who left, role changes, per-day war decks, trophy trends, join dates) is not in the API either. It comes from our own snapshots, stored in Postgres. Without a database the site still works and those parts show their "Data since" / partial states.

## Development setup

1. Get an API key from [developer.clashroyale.com](https://developer.clashroyale.com) with allowed IP `45.79.218.79` (the [RoyaleAPI proxy](https://docs.royaleapi.com/proxy.html)).
2. Copy `.env.example` to `.env` and paste in your key. **Never commit `.env`.**
3. Optional, for history: set `DATABASE_URL`. For local development no server is needed:
   ```
   DATABASE_URL=pglite:./.data/pg
   CRON_SECRET=any-long-random-string
   ```
4. Install and run (http://localhost:3000):
   ```bash
   npm install
   npm run dev
   ```
5. Optional: download extra game art and lookup data (~150 MB into `vendor/`), or test the API connection:
   ```bash
   node scripts/fetch-cards.mjs
   node scripts/fetch-royaleapi-assets.mjs
   node scripts/probe.mjs "#YOURTAG"
   ```

Useful scripts: `npm run build`, `npm run lint`, `npm run typecheck`.

## Tests

| Command | What it checks |
|---|---|
| `npm test` | Unit tests (tags, river race calendar, game modes, decks, Asset Score, exact meta aggregation on fixture battles, training-day war rules) and React component tests in jsdom |
| `npm run test:data` | Live accuracy: recomputes clan, dashboard, player, meta and search data through our code and compares every number with the raw API (needs `CR_API_KEY`) |
| `npm run test:e2e` | Playwright in your installed Chrome (or Edge): every page loads without errors or sideways scroll (desktop + phone), decks / deck stats / search flows, and the numbers on screen match the API |

`TEST_CLAN` and `TEST_PLAYER` choose which clan / player the live tests use; `E2E_BASE_URL` points the UI tests at another server (default: the dev server on :3000, started if needed).

## History and snapshots

- A clan is **tracked** from the first time someone opens its dashboard. The first snapshot is a baseline (everyone present, no events).
- `GET /api/cron/snapshot` with `Authorization: Bearer $CRON_SECRET` snapshots every clan viewed in the last 30 days: roster diff (joins, leaves, promotions, demotions), each member's trophies and donations for the day, and decks used on the current war day. Opening a dashboard also refreshes it if the last snapshot is over 30 minutes old.
- Call the endpoint **every 30 minutes**. War days need a snapshot shortly before each reset (~09:40 UTC) to capture complete per-day deck counts. The included GitHub Actions workflow ([.github/workflows/snapshot.yml](.github/workflows/snapshot.yml)) does this once you add the `SITE_URL` and `CRON_SECRET` repository secrets.
- Migrations live in `drizzle/` and run automatically on first database use. After changing `src/lib/db/schema.ts`, run `npx drizzle-kit generate`.
- The API can't tell a kick from a leave, so every exit is recorded as "left".

## Deploying

Any Node host works (Vercel, Render, Fly, a VPS). Set `CR_API_KEY`, `CR_API_BASE`, `DATABASE_URL` (a hosted Postgres such as Neon or Supabase) and `CRON_SECRET`, then schedule the snapshot endpoint as above. The RoyaleAPI proxy means your host's IP doesn't need to be on the API key's allowlist.

### Outages, error pages and donations

- **Donate button.** Set `NEXT_PUBLIC_DONATE_URL` (an `https://` Ko-fi / Buy Me a Coffee / PayPal.me link) and redeploy. The button appears on the error pages and the site-down page, next to a note that the site runs on free hosting. Supercell's Fan Content Policy allows donations only if they unlock nothing, so keep them that way.
- **Page errors** show `src/app/error.tsx` (a crash inside the layout) or `src/app/global-error.tsx` (the layout itself failed).
- **Server unreachable.** `public/down.html` is a self-contained page generated from `scripts/down-page/` before every `dev` and `build`. A small service worker (`public/sw.js`, production only) shows it to returning visitors when the host is down or answers 502/503/504. It also works as a host's custom 5xx page (Cloudflare, nginx, Render...). It checks `/api/up` and tells the visitor when the site is back.
- **Maintenance mode.** `SITE_DOWN=1` (then redeploy) serves the site-down page on every page; cron endpoints keep working.
- **Service worker off switch.** If the worker ever misbehaves, see the two lines at the top of `scripts/down-page/sw.js`.

### Security and speed

- Security headers (CSP, HSTS, no framing, no sniffing, strict referrer, permissions policy) are set in `next.config.ts`. A new image host must be added to `img-src` there.
- `/api/search`, `/api/summary/*`, `/api/art`, `/t/*` and the Refresh buttons are rate-limited per IP (`src/lib/ratelimit.ts`) so nobody can burn through the shared API key. For page-level limits, add a rate-limit rule at the host or CDN.
- The three.js effects load in their own chunk once the browser is idle (`src/components/fx/gl/`), so pages don't wait for 135 KB of 3D code.
- After adding art to `public/`, run `node scripts/optimize-images.mjs` (palette PNGs, mozjpeg; only replaces a file when it saves 10%+).

## Disclaimer

This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it. For more information see [Supercell's Fan Content Policy](https://www.supercell.com/fan-content-policy).

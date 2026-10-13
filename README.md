# CR Clan Tracker

A free, fan-made Clash Royale stats site with a focus on **clan management**: look up any player, browse meta decks and leaderboards, and see who in your clan is active, who plays war and who's the most valuable member.

> 🚧 Early development. Built with Next.js 16 (App Router, Cache Components) and TypeScript. The design reference lives in [design-kit/handoff](design-kit/handoff/README.md).

## Planned features

**Players:** profile, badges, card / tower troop / evolution / hero collection, ranked, challenge, battle and misc stats, battle log, decks, and clan / trophy / Path of Legends / Clan Wars history (tracked over time).

**Clan management:** member roster with roles, activity, donations, war participation (decks used per day), war and friendly 1v1 win rates, a configurable "asset score", join/leave/promotion timeline, and promotion / inactivity suggestions.

**Game-wide:** meta decks per mode with usage and win rates, card stats, leaderboards (Path of Legends, clans, clan wars, events), news.

See [docs/api-findings.md](docs/api-findings.md) for what the official API does and doesn't provide.

## Development setup

1. Get an API key from [developer.clashroyale.com](https://developer.clashroyale.com) with allowed IP `45.79.218.79` (the [RoyaleAPI proxy](https://docs.royaleapi.com/proxy.html)).
2. Copy `.env.example` to `.env` and paste in your key. **Never commit `.env`.**
3. Download game art and lookup data (optional, ~150 MB into `vendor/`):
   ```bash
   node scripts/fetch-cards.mjs
   node scripts/fetch-royaleapi-assets.mjs
   ```
4. Test the connection:
   ```bash
   node scripts/probe.mjs "#YOURTAG"
   ```
5. Install dependencies and start the site at http://localhost:3000:
   ```bash
   npm install
   npm run dev
   ```

## Disclaimer

This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it. For more information see [Supercell's Fan Content Policy](https://www.supercell.com/fan-content-policy).

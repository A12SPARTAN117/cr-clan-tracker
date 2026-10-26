# CR Clan Tracker social media kit

Everything needed to set up the Reddit, X, TikTok and Instagram accounts. The images are in `out/`.
To change them, edit `src/logo.svg` or `src/render.mjs` and run `node brand/src/render.mjs` from the repo root
(it uses Microsoft Edge, so nothing extra needs installing).

## Name and handles

Same name and handle everywhere, matching the site:

| | Display name | Handle | Link field |
|---|---|---|---|
| X | CR Clan Tracker | @crclantracker | cr-clan-tracker.vercel.app |
| Instagram | CR Clan Tracker | @crclantracker | cr-clan-tracker.vercel.app |
| TikTok | CR Clan Tracker | @crclantracker | cr-clan-tracker.vercel.app |
| Reddit | CR Clan Tracker | r/CRClanTracker (community) and u/crclantracker (account) | cr-clan-tracker.vercel.app |

If a handle is taken, fall back in this order: `@crclantrack`, `@clantrackercr`, `@crclantracker.app`
(Instagram and TikTok only; X doesn't allow dots).

## Bios

**X** (160 / 160)
> Free Clash Royale stats & clan tracker. See who's active, who plays war and who's earned a promotion. Daily meta decks. Fan-made, not affiliated with Supercell.

**Instagram** (150 / 150)
> Clash Royale stats & clan management 👑
> Who's active, who plays war, who earns a promo
> Daily meta decks & tips
> Fan-made, not Supercell
> 👇 Free tracker

**TikTok** (72 / 80)
> Clash Royale clan stats, meta decks & tips 👑 Fan-made, not Supercell 👇

**Reddit community description** (379 / 500)
> The home of CR Clan Tracker, a free fan-made Clash Royale site for players and clan leaders. Share feedback, report bugs, request features, show off your clan's stats and talk meta decks. Site: cr-clan-tracker.vercel.app. Not affiliated with, endorsed, sponsored, or specifically approved by Supercell, and Supercell is not responsible for it. See Supercell's Fan Content Policy.

Supercell's Fan Content Policy asks fan content to say it isn't official, so every bio says so in short
and the Reddit description has the full wording (the same as the site footer).

## Images

| Platform | Profile picture | Banner |
|---|---|---|
| X | `x-pfp.png` (400 × 400) | `x-header.jpg` (1500 × 500) |
| Instagram | `instagram-pfp.png` (1080 × 1080) | No banner on Instagram: pin `instagram-welcome.jpg` (1080 × 1350) as the first post |
| TikTok | `tiktok-pfp.png` (1080 × 1080) | No banner on TikTok: pin `tiktok-welcome.jpg` (1080 × 1920) as a photo post |
| Reddit | `reddit-icon.png` (256 × 256), community icon | `reddit-banner.jpg` (1920 × 384) |

- Every platform crops the profile picture to a circle; the crowns sit inside it.
- The X header keeps the bottom left clear, where the profile picture covers it.
- Reddit crops the banner differently per device, so the logo sits in the middle band.
- `logo-dark.png` (with the blue glow, for dark backgrounds) and `logo-light.png` (no glow, for light ones)
  are the bare mark on a transparent background, for anything else.

## The logo

Two overlapping crowns, brushed steel behind and white marble in front, with the site's electric blue
glow (`#3aa0ff`) on obsidian (`#07080a`). It's the final version of the two-crown placeholder in the
site's nav, as the design brief described. The wordmark is `CR·CLAN/TRACKER` in JetBrains Mono ExtraBold,
the same as the nav. No Supercell or Clash Royale artwork is used.

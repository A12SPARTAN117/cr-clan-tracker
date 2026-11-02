import saved from '../../data/player-badges.json';

/**
 * Our own small copies of player badge art (192 px WebP in public/player-badges, about 8 KB each
 * against 240 KB for the official 512 px PNG), saved slowly by scripts/save-badge-art.mjs. The
 * manifest lists the levels saved for each badge, so pages never ask for a copy that isn't there.
 */
const SAVED = saved as Record<string, number[]>;

/**
 * Browsers keep badge art for a week, so a copy redrawn under the same name would keep showing
 * the old one. Bump this whenever saved copies or the placeholder are redrawn.
 */
const ART = '?v=2';

/** Shown when a badge has no art anywhere: no copy, the official image failed, no game-art stand-in. */
export const BADGE_PLACEHOLDER = `/ui/badge-placeholder.svg${ART}`;

/**
 * Official badge links that came back without an image (the API hands out links Supercell's
 * image server doesn't have yet). Remembered in this browser for a week, so a missing badge goes
 * straight to its fallback instead of failing again on every profile. Badge art only renders in
 * the browser, so reading this while rendering can't differ from the server.
 */
const DEAD_KEY = 'oa-dead-badge-links';
const DEAD_FOR = 7 * 24 * 3600_000;
let dead: Record<string, number> | null = null;

function deadLinks(): Record<string, number> {
  if (dead) return dead;
  dead = {};
  try {
    const now = Date.now();
    for (const [url, at] of Object.entries(JSON.parse(localStorage.getItem(DEAD_KEY) ?? '{}') as Record<string, number>)) if (now - at < DEAD_FOR) dead[url] = at;
  } catch {}
  return dead;
}

/** The official link, unless it already failed in this browser this week. */
export function liveOfficial(url: string | null | undefined): string | null {
  return url && !deadLinks()[url] ? url : null;
}

/** Called when an official link fails to load. */
export function markDeadOfficial(url: string) {
  const d = deadLinks();
  d[url] = Date.now();
  try {
    localStorage.setItem(DEAD_KEY, JSON.stringify(d));
  } catch {}
}

/** Our copy of this badge level, if we have one. Badges without levels are level 1. */
export function badgeCopy(id: string, level: number | null | undefined): string | null {
  const l = level ?? 1;
  return SAVED[id]?.includes(l) ? `/player-badges/${id}_L${l}.webp${ART}` : null;
}

/**
 * The saved copy of this badge's nearest other level. Levels share the badge's design (they mostly
 * change its frame), so it beats a stand-in when this level's own art can't be found.
 */
export function badgeCopyNearest(id: string, level: number | null | undefined): string | null {
  const l = level ?? 1;
  const near = SAVED[id]?.filter((x) => x !== l).sort((a, b) => Math.abs(a - l) - Math.abs(b - l) || b - a)[0];
  return near == null ? null : `/player-badges/${id}_L${near}.webp${ART}`;
}

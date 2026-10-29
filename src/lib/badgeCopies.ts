import saved from '../../data/player-badges.json';

/**
 * Our own small copies of player badge art (192 px WebP in public/player-badges, about 8 KB each
 * against 240 KB for the official 512 px PNG), saved slowly by scripts/save-badge-art.mjs. The
 * manifest lists the levels saved for each badge, so pages never ask for a copy that isn't there.
 */
const SAVED = saved as Record<string, number[]>;

/** Shown when a badge has no art anywhere: no copy, the official image failed, no game-art stand-in. */
export const BADGE_PLACEHOLDER = '/ui/badge-placeholder.svg';

/** Our copy of this badge level, if we have one. Badges without levels are level 1. */
export function badgeCopy(id: string, level: number | null | undefined): string | null {
  const l = level ?? 1;
  return SAVED[id]?.includes(l) ? `/player-badges/${id}_L${l}.webp` : null;
}

/**
 * The saved copy of this badge's nearest other level. Levels share the badge's design (they mostly
 * change its frame), so it beats a stand-in when this level's own art can't be found.
 */
export function badgeCopyNearest(id: string, level: number | null | undefined): string | null {
  const l = level ?? 1;
  const near = SAVED[id]?.filter((x) => x !== l).sort((a, b) => Math.abs(a - l) - Math.abs(b - l) || b - a)[0];
  return near == null ? null : `/player-badges/${id}_L${near}.webp`;
}

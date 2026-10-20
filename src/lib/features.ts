/**
 * Site sections that can be switched off without deleting them. A hidden section disappears from
 * the nav, footer, Help and Home, and its routes return 404.
 */
export const FEATURES = {
  /** Hidden for now: the posts in content/news.ts stay, ready to switch back on. */
  news: false,
} as const;

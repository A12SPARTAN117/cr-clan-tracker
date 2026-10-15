/**
 * Where the Donate buttons go (Ko-fi, Buy Me a Coffee, PayPal.me, GitHub Sponsors…). Set
 * NEXT_PUBLIC_DONATE_URL in .env or on the host; without it the buttons are hidden and the pages
 * just explain why the site is down. Only https links are used.
 *
 * Supercell's Fan Content Policy allows donations only if they are purely donations, not tied
 * to any features or perks, so never make a donation unlock anything on the site.
 */
const raw = process.env.NEXT_PUBLIC_DONATE_URL ?? '';

export const DONATE_URL = /^https:\/\/[^\s"'<>]+$/.test(raw) ? raw : '';

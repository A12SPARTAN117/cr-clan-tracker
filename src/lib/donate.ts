/**
 * Where the Donate buttons go. Each way to give has its own variable in .env or on the host:
 *   NEXT_PUBLIC_DONATE_PAYPAL_URL   PayPal.Me or PayPal donate link (works worldwide)
 *   NEXT_PUBLIC_DONATE_PAYFAST_URL  Payfast payment link (SA cards, Instant EFT, wallets)
 *   NEXT_PUBLIC_DONATE_YOCO_URL     Yoco payment link (cards, Apple Pay, Google Pay)
 *   NEXT_PUBLIC_DONATE_URL          anything else (Ko-fi, Buy Me a Coffee, GitHub Sponsors…)
 * Every one that's set gets a button; with none set the buttons are hidden and the pages just
 * explain why the site is down. Only https links are used.
 *
 * Supercell's Fan Content Policy allows donations only if they are purely donations, not tied
 * to any features or perks, so never make a donation unlock anything on the site.
 */
export type DonateLink = { id: 'paypal' | 'payfast' | 'yoco' | 'other'; label: string; url: string };

/**
 * https only, nothing that could break out of an attribute (scripts/build-down-page.mjs uses the
 * same rule). Trimmed first: a link pasted into a host's dashboard often brings a space or line break.
 */
const safe = (v: string | undefined) => {
  const s = v?.trim() ?? '';
  return /^https:\/\/[^\s"'<>]+$/.test(s) ? s : '';
};

// Each variable is read by its full name so Next inlines it into the client bundles.
export const DONATE_LINKS: DonateLink[] = (
  [
    { id: 'paypal', label: 'Donate with PayPal', url: safe(process.env.NEXT_PUBLIC_DONATE_PAYPAL_URL) },
    { id: 'payfast', label: 'Donate with Payfast', url: safe(process.env.NEXT_PUBLIC_DONATE_PAYFAST_URL) },
    { id: 'yoco', label: 'Donate with Yoco', url: safe(process.env.NEXT_PUBLIC_DONATE_YOCO_URL) },
    { id: 'other', label: 'Donate', url: safe(process.env.NEXT_PUBLIC_DONATE_URL) },
  ] satisfies DonateLink[]
).filter((l) => l.url);

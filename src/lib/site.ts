/**
 * The public address of the site, for link previews and the sitemap. On Vercel it's the production
 * domain (VERCEL_PROJECT_PRODUCTION_URL); SITE_URL overrides it on any other host.
 */
export const SITE_URL =
  process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://cr-clan-tracker.vercel.app');

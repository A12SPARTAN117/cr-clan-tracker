import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Content Security Policy. Only our own origin may run scripts, and images may also come from
 * the official Clash Royale asset CDN. Inline scripts stay allowed (the theme script and Next's
 * inline data) because nonces would force every page to render per request and lose caching.
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? ` 'unsafe-eval'` : ''}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://api-assets.clashroyale.com`,
  `font-src 'self'`,
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  `worker-src 'self'`,
  `manifest-src 'self'`,
  `media-src 'self'`,
  `object-src 'none'`,
  `frame-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // Browsers only honour HSTS over HTTPS, so this is harmless on localhost.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // Other sites can't embed our images and scripts (saves bandwidth on hotlinked art).
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
];

/**
 * Game art in public/: fresh for a week, then served stale for a month while the browser
 * re-checks. Art almost never changes, and each re-check is a request (a billed one on a CDN).
 */
const artCache = 'public, max-age=604800, stale-while-revalidate=2592000';

/** Paths that keep working while SITE_DOWN=1 (the down page itself, its worker, build assets, cron). */
const ALWAYS_UP = '(?!down\\.html$|down-scene\\.js$|sw\\.js$|_next/|api/cron/|favicon\\.ico$)';

const nextConfig: NextConfig = {
  cacheComponents: true,
  // In-memory page and 'use cache' storage per server (Next's default is 50 MB). A rush of
  // different players fills 50 MB in about a hundred profiles and then thrashes; servers have far
  // more memory than that. CACHE_MEMORY_MB overrides the 256 MB default.
  cacheMaxMemorySize: (Number(process.env.CACHE_MEMORY_MB) || 256) * 1024 * 1024,
  partialPrefetching: true,
  poweredByHeader: false,
  // Embedded Postgres ships WASM + data files; load it from node_modules at runtime.
  serverExternalPackages: ['@electric-sql/pglite'],
  // Migrations are read from disk on first database use.
  // Recap images read their font and our own game art from disk.
  outputFileTracingIncludes: {
    '/**': ['./drizzle/**/*'],
    '/player/*/recap': ['./assets/fonts/*.ttf', './public/characters/**/*', './public/cards/**/*'],
    '/clan/*/recap': ['./assets/fonts/*.ttf', './public/badges/**/*'],
  },
  // Custom cache lifetimes for Clash Royale API data (seconds).
  cacheLife: {
    // Player and clan snapshots: the dashboard promises a refresh at least every 10 minutes.
    cr: { stale: 60, revalidate: 300, expire: 3600 },
    // River race and battle logs move fast during war days.
    crLive: { stale: 30, revalidate: 60, expire: 900 },
    // Failed upstream calls: retry soon instead of caching the error.
    crError: { stale: 30, revalidate: 15, expire: 60 },
    // Per-member facts behind clan pages (levels, league, battle-log win rates): 100 calls per
    // clan to rebuild, and none of them moves fast. War decks come from the race (crLive).
    members: { stale: 300, revalidate: 1800, expire: 86400 },
    // Stored snapshots the cron job rebuilds about hourly (meta decks): re-read every 10 minutes.
    meta: { stale: 300, revalidate: 600, expire: 86400 },
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Image files only: /cards/[slug] is also a page, and it must keep Next's own cache header.
      { source: '/:dir(characters|scenes|cards|badges|leagues|ui|player-badges|icons)/:file(.+\\.(?:png|jpe?g|webp|avif|svg|gif))', headers: [{ key: 'Cache-Control', value: artCache }] },
      // The worker must always be re-checked so fixes reach visitors straight away.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
      { source: '/down.html', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'X-Robots-Tag', value: 'noindex' }] },
      { source: '/down-scene.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    ];
  },
  // Old links: the Pro tracker was removed (its links land on the meta decks), and leaderboard
  // locations moved into the path.
  async redirects() {
    return [
      { source: '/pros', destination: '/decks', permanent: true },
      // Leaderboard locations moved from ?loc= into the path (each is its own cached page).
      { source: '/leaderboards', has: [{ type: 'query', key: 'loc', value: '(?<loc>\\d+)' }], destination: '/leaderboards/:loc', permanent: true },
      // Player name search moved from /players?q= to /search, so /players is a static page.
      { source: '/players', has: [{ type: 'query', key: 'q', value: '(?<q>.+)' }], destination: '/search?q=:q&type=player', permanent: true },
    ];
  },
  // Maintenance switch: with SITE_DOWN=1 every page shows the site-down page (rebuild to apply).
  async rewrites() {
    if (process.env.SITE_DOWN !== '1') return [];
    return {
      beforeFiles: [
        { source: '/', destination: '/down.html' },
        { source: `/:path(${ALWAYS_UP}.+)`, destination: '/down.html' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;

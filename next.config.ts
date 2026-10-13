import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Embedded Postgres ships WASM + data files; load it from node_modules at runtime.
  serverExternalPackages: ['@electric-sql/pglite'],
  // Migrations are read from disk on first database use.
  outputFileTracingIncludes: { '/**': ['./drizzle/**/*'] },
  // Custom cache lifetimes for Clash Royale API data (seconds).
  cacheLife: {
    // Player and clan snapshots: the dashboard promises a refresh at least every 10 minutes.
    cr: { stale: 60, revalidate: 300, expire: 3600 },
    // River race and battle logs move fast during war days.
    crLive: { stale: 30, revalidate: 60, expire: 900 },
    // Failed upstream calls: retry soon instead of caching the error.
    crError: { stale: 30, revalidate: 15, expire: 60 },
  },
};

export default nextConfig;

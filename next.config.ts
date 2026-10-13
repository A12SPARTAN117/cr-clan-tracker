import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
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

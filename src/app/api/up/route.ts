import { connection } from 'next/server';

/**
 * Health check for the site-down page: 204 means the real app is running again. Rendered per
 * request on purpose, so a cached copy can't claim the site is up while the server is down.
 */
export async function GET() {
  await connection();
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}

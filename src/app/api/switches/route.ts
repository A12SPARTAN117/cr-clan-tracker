import { connection } from 'next/server';
import { limitRequest } from '@/lib/ratelimit';
import { switchesOff } from '@/lib/switches';

/**
 * The kill switches the browser needs to know about (lib/switches), for components/fx/switches.
 * Kept at the CDN for 30 seconds, so a whole crowd costs one read.
 */
export async function GET(req: Request) {
  const limited = limitRequest(req, 'route');
  if (limited) return limited;
  await connection();
  const off = [...(await switchesOff())].filter((n) => n === 'effects');
  return Response.json({ off }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=300' } });
}

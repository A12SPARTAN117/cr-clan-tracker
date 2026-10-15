import { limitRequest } from '@/lib/ratelimit';

/**
 * Same-origin copy of official card art, so WebGL can use it as a texture (the asset CDN
 * sends no CORS headers). Only the Clash Royale asset host is allowed.
 */
const HOST = 'api-assets.clashroyale.com';

/** Card art is ~100 KB; anything far bigger isn't card art. */
const MAX_BYTES = 3_000_000;

export async function GET(req: Request) {
  const limited = limitRequest(req, 'art');
  if (limited) return limited;
  const src = new URL(req.url).searchParams.get('src') ?? '';
  let u: URL;
  try {
    u = new URL(src);
  } catch {
    return new Response('bad src', { status: 400 });
  }
  if (u.protocol !== 'https:' || u.hostname !== HOST || u.port || u.username || !/\.png$/i.test(u.pathname)) {
    return new Response('not allowed', { status: 400 });
  }
  // No redirects: a redirect could point the server at a host we never allowed.
  const r = await fetch(u, { redirect: 'error', signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (!r?.ok || !r.headers.get('content-type')?.startsWith('image/')) return new Response('upstream error', { status: 502 });
  if (Number(r.headers.get('content-length') ?? 0) > MAX_BYTES) return new Response('too large', { status: 502 });
  return new Response(r.body, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800, immutable' },
  });
}

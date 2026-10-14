/**
 * Same-origin copy of official card art, so WebGL can use it as a texture (the asset CDN
 * sends no CORS headers). Only the Clash Royale asset host is allowed.
 */
const HOST = 'api-assets.clashroyale.com';

export async function GET(req: Request) {
  const src = new URL(req.url).searchParams.get('src') ?? '';
  let u: URL;
  try {
    u = new URL(src);
  } catch {
    return new Response('bad src', { status: 400 });
  }
  if (u.protocol !== 'https:' || u.hostname !== HOST || !/\.png$/i.test(u.pathname)) return new Response('not allowed', { status: 400 });
  const r = await fetch(u, { signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (!r?.ok) return new Response('upstream error', { status: 502 });
  return new Response(r.body, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800, immutable' },
  });
}

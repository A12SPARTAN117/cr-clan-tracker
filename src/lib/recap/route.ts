/** Recap images follow the API data they're drawn from: fresh for 5 minutes at the CDN. */
const RECAP_CACHE = 'public, max-age=300, s-maxage=300, stale-while-revalidate=600';

export const recapError = (status: number, msg: string) => new Response(msg, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

/**
 * Drawn PNGs, kept in this server's memory as long as the CDN keeps them, so a shared link that
 * draws a crowd costs one drawing per 5 minutes even without a CDN in front. Capped by count.
 */
const MEMO_MS = 300_000;
const MEMO_MAX = 100;
const g = globalThis as unknown as { __crRecaps?: Map<string, { at: number; png: Promise<ArrayBuffer> }> };
const memo = (g.__crRecaps ??= new Map());

/**
 * Draws the whole PNG before answering. ImageResponse renders while it streams, so a drawing
 * error would otherwise surface after a 200 and leave a broken image.
 */
export async function recapPng(draw: () => Promise<Response>, file: string, what: string): Promise<Response> {
  const key = `${what}:${file}`;
  const now = Date.now();
  let hit = memo.get(key);
  if (!hit || now - hit.at > MEMO_MS) {
    hit = { at: now, png: draw().then((r) => r.arrayBuffer()) };
    memo.delete(key);
    memo.set(key, hit);
    if (memo.size > MEMO_MAX) memo.delete(memo.keys().next().value!);
  }
  try {
    const png = await hit.png;
    return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': RECAP_CACHE, 'Content-Disposition': `inline; filename="${file}"` } });
  } catch (e) {
    if (memo.get(key) === hit) memo.delete(key);
    console.error(`[recap] ${what} image failed:`, e instanceof Error ? e.message : e);
    return recapError(500, 'Could not draw the recap');
  }
}

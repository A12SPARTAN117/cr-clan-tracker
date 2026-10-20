/** Recap images follow the API data they're drawn from: fresh for 5 minutes at the CDN. */
const RECAP_CACHE = 'public, max-age=300, s-maxage=300, stale-while-revalidate=600';

export const recapError = (status: number, msg: string) => new Response(msg, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

/**
 * Draws the whole PNG before answering. ImageResponse renders while it streams, so a drawing
 * error would otherwise surface after a 200 and leave a broken image.
 */
export async function recapPng(draw: () => Promise<Response>, file: string, what: string): Promise<Response> {
  try {
    const png = await (await draw()).arrayBuffer();
    return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': RECAP_CACHE, 'Content-Disposition': `inline; filename="${file}"` } });
  } catch (e) {
    console.error(`[recap] ${what} image failed:`, e instanceof Error ? e.message : e);
    return recapError(500, 'Could not draw the recap');
  }
}

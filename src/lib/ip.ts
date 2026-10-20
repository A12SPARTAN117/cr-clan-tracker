/**
 * The visitor's IP for rate limiting. Hosts and CDNs set a header the visitor can't forge
 * (Cloudflare's CF-Connecting-IP, X-Real-IP on Vercel, Netlify, Render and nginx), so those come
 * first. X-Forwarded-For is a list anyone can prepend to; only its last entry was added by our
 * own proxy, so that's the one used.
 */
export function clientIp(h: Headers): string {
  const direct = h.get('cf-connecting-ip') || h.get('x-real-ip');
  if (direct?.trim()) return direct.trim();
  const chain = h.get('x-forwarded-for')?.split(',').map((s) => s.trim()).filter(Boolean);
  return chain?.length ? chain[chain.length - 1] : 'unknown';
}

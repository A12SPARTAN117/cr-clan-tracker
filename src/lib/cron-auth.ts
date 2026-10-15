import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';

const digest = (s: string) => createHash('sha256').update(s).digest();

/**
 * True when the request carries `Authorization: Bearer $CRON_SECRET`. Compared in constant time
 * (on hashes, so the length doesn't leak either). No secret configured means no access.
 */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return timingSafeEqual(digest(req.headers.get('authorization') ?? ''), digest(`Bearer ${secret}`));
}

import { cacheLife } from 'next/cache';

/**
 * Gives a route's fallback shell (what Next renders before it knows the param) the lifetime of
 * the data its pages show. On Vercel, a page rendered on demand for a param keeps its shell's
 * lifetime, and a shell that reads nothing never expires: every clan and player page stayed as it
 * was first rendered until the next deploy or a Refresh. Renders nothing.
 */
export async function PageLife({ every }: { every: 'minute' | 'fiveMinutes' }) {
  'use cache';
  // Stale stays at 5 minutes in both: shorter would keep this out of the shell it is here for.
  if (every === 'minute') cacheLife('pageMinute');
  else cacheLife('pageFiveMinutes');
  return null;
}

import type { EventRanked } from '@/lib/cr/types';

export type BoardRow = { rank: number; move: number | null; tag: string; name: string; sub: string; cc: string | null; badgeId: number | null; score: number; href: string };

const t = (x: string) => x.replace('#', '');

export const EVENT_NOTE = 'Event leaderboards are global. Only events running in the game right now are listed.';

/** An event board's rows. */
export const eventRows = (items: EventRanked[]): BoardRow[] =>
  items.map((p) => ({ rank: p.rank, move: null, tag: t(p.tag), name: p.name, sub: p.clan?.name ?? 'No clan', cc: null, badgeId: p.clan?.badgeId ?? null, score: p.score, href: `/player/${t(p.tag)}` }));

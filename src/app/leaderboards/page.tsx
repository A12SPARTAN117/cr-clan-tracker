import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getClanRankings, getClanWarRankings, getLocations, getPolLeaderboard } from '@/lib/cr/api';
import { liveEventBoards } from '@/lib/events';
import { BoardView, type Board } from './BoardView';
import { PodiumScene } from './PodiumScene';

export const metadata: Metadata = { title: 'Leaderboards', description: 'Path of Legends, clan, clan war and event leaderboards, live from the official API.' };

export type { BoardRow } from './rows';

const t = (x: string) => x.replace('#', '');

async function polBoard(loc: string): Promise<Board> {
  const r = await getPolLeaderboard(loc, 100);
  return {
    ok: r.ok,
    note: 'Path of Legends is the only ranked ladder in the API. Rating = Path of Legends trophies in the top league.',
    rows: r.ok
      ? r.data.items.map((p) => ({ rank: p.rank, move: null, tag: t(p.tag), name: p.name, sub: p.clan?.name ?? 'No clan', cc: null, badgeId: p.clan?.badgeId ?? null, score: p.eloRating, href: `/player/${t(p.tag)}` }))
      : [],
  };
}

async function clanBoard(kind: 'clans' | 'war', loc: string): Promise<Board> {
  const r = kind === 'clans' ? await getClanRankings(loc, 100) : await getClanWarRankings(loc, 100);
  return {
    ok: r.ok,
    note: 'Movement compares with the previous ranking period.',
    rows: r.ok
      ? r.data.items.map((c) => ({
          rank: c.rank,
          move: c.previousRank > 0 ? c.previousRank - c.rank : null,
          tag: t(c.tag),
          name: c.name,
          sub: `${c.members}/50 members`,
          cc: c.location?.countryCode ?? null,
          badgeId: c.badgeId,
          // In the clan-war ranking, clanScore holds the war trophies.
          score: c.clanScore ?? c.clanWarTrophies ?? 0,
          href: `/clan/${t(c.tag)}`,
        }))
      : [],
  };
}

/**
 * One location's boards. Everything comes from cached API calls, so each location's page is
 * rendered once per refresh and served from the page cache: '/' for global, '/[loc]' for the rest.
 */
export async function Boards({ loc }: { loc: string }) {
  const [locs, pol, clans, war, live] = await Promise.all([getLocations(), polBoard(loc), clanBoard('clans', loc), clanBoard('war', loc), liveEventBoards()]);
  const locations = locs.ok ? locs.data.items.map((l) => ({ id: String(l.id), name: l.name, isCountry: l.isCountry })) : [];
  // Event boards load when their tab is opened (/api/events/[id]): seven of them doubled the page.

  return (
    <BoardView
      boards={{ pol, clans, war }}
      events={live.map((e) => ({ id: e.id, name: e.name }))}
      loc={loc}
      locName={loc === 'global' ? 'Global' : (locations.find((l) => l.id === loc)?.name ?? loc)}
      locations={locations}
    />
  );
}

export default function LeaderboardsPage() {
  return (
    <Suspense fallback={<PodiumScene rows={[]} label="Global" isClan={false} />}>
      <Boards loc="global" />
    </Suspense>
  );
}

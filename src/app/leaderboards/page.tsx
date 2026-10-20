import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getClanRankings, getClanWarRankings, getLocations, getPolLeaderboard } from '@/lib/cr/api';
import { liveEventBoards } from '@/lib/events';
import { BoardView, type Board } from './BoardView';
import { PodiumScene } from './PodiumScene';

export const metadata: Metadata = { title: 'Leaderboards', description: 'Path of Legends, clan, clan war and event leaderboards, live from the official API.' };

export type BoardRow = { rank: number; move: number | null; tag: string; name: string; sub: string; cc: string | null; badgeId: number | null; score: number; href: string };

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

async function Boards({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const loc = (Array.isArray(sp.loc) ? sp.loc[0] : sp.loc) || 'global';

  const [locs, pol, clans, war, live] = await Promise.all([getLocations(), polBoard(loc), clanBoard('clans', loc), clanBoard('war', loc), liveEventBoards()]);
  const locations = locs.ok ? locs.data.items.map((l) => ({ id: String(l.id), name: l.name, isCountry: l.isCountry })) : [];
  const events: Record<number, Board> = {};
  for (const e of live)
    events[e.id] = {
      ok: e.data.ok,
      note: 'Event leaderboards are global. Only events running in the game right now are listed.',
      rows: e.data.ok
        ? e.data.data.items.map((p) => ({ rank: p.rank, move: null, tag: t(p.tag), name: p.name, sub: p.clan?.name ?? 'No clan', cc: null, badgeId: p.clan?.badgeId ?? null, score: p.score, href: `/player/${t(p.tag)}` }))
        : [],
    };

  return (
    <BoardView
      boards={{ pol, clans, war, events }}
      events={live.map((e) => ({ id: e.id, name: e.name }))}
      loc={loc}
      locName={loc === 'global' ? 'Global' : (locations.find((l) => l.id === loc)?.name ?? loc)}
      locations={locations}
    />
  );
}

export default function LeaderboardsPage(props: PageProps<'/leaderboards'>) {
  return (
    <Suspense fallback={<PodiumScene rows={[]} label="Global" isClan={false} />}>
      <Boards searchParams={props.searchParams} />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ClanBadge } from '@/components/ui/ClanBadge';
import { getClanRankings, getClanWarRankings, getEventLeaderboard, getEventLeaderboards, getLocations, getPolLeaderboard } from '@/lib/cr/api';
import { fmt } from '@/lib/format';
import { EventIcon, MedalIcon, TrophyIcon, WarTrophyIcon } from '@/components/ui/icons';
import { BoardControls } from './BoardControls';
import { PodiumScene } from './PodiumScene';
import s from './leaderboards.module.css';

export const metadata: Metadata = { title: 'Leaderboards', description: 'Path of Legends, clan, clan war and event leaderboards, live from the official API.' };

type Tab = 'pol' | 'clans' | 'war' | 'events';
export type BoardRow = { rank: number; move: number | null; tag: string; name: string; sub: string; cc: string | null; badgeId: number | null; score: number; href: string };

/** The icon that goes with each board's score. */
function ScoreIcon({ tab, size = 16 }: { tab: Tab; size?: number }) {
  if (tab === 'pol') return <MedalIcon size={size} title="Ultimate Champion medals" />;
  if (tab === 'clans') return <TrophyIcon size={size} title="Clan score" />;
  if (tab === 'war') return <WarTrophyIcon size={size} title="Clan war trophies" />;
  return <EventIcon size={size} title="Event points" />;
}

const SCORE_HEAD: Record<Tab, string> = { pol: 'RATING', clans: 'CLAN SCORE', war: 'WAR TROPHIES', events: 'POINTS' };

async function loadBoard(tab: Tab, loc: string, ev: number | null): Promise<{ rows: BoardRow[]; ok: boolean; note: string }> {
  const t = (x: string) => x.replace('#', '');
  if (tab === 'pol') {
    const r = await getPolLeaderboard(loc, 100);
    return {
      ok: r.ok,
      note: 'Path of Legends is the only ranked ladder in the API. Rating = Path of Legends trophies in the top league.',
      rows: r.ok
        ? r.data.items.map((p) => ({ rank: p.rank, move: null, tag: t(p.tag), name: p.name, sub: p.clan?.name ?? 'No clan', cc: null, badgeId: p.clan?.badgeId ?? null, score: p.eloRating, href: `/player/${t(p.tag)}` }))
        : [],
    };
  }
  if (tab === 'events') {
    if (ev == null) return { rows: [], ok: true, note: 'No named event leaderboards right now.' };
    const r = await getEventLeaderboard(ev, 100);
    return {
      ok: r.ok,
      note: 'Event leaderboards are global. Points are the event score reported by the API.',
      rows: r.ok
        ? r.data.items.map((p) => ({ rank: p.rank, move: null, tag: t(p.tag), name: p.name, sub: p.clan?.name ?? 'No clan', cc: null, badgeId: p.clan?.badgeId ?? null, score: p.score, href: `/player/${t(p.tag)}` }))
        : [],
    };
  }
  const r = tab === 'clans' ? await getClanRankings(loc, 100) : await getClanWarRankings(loc, 100);
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

async function Board({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? '';
  const tab = (['pol', 'clans', 'war', 'events'].includes(one('tab')) ? one('tab') : 'pol') as Tab;
  const loc = one('loc') || 'global';

  const [locs, evs] = await Promise.all([getLocations(), getEventLeaderboards()]);
  const locations = locs.ok ? locs.data.items.map((l) => ({ id: String(l.id), name: l.name, isCountry: l.isCountry })) : [];
  // Several seasons share a name; keep the newest board per name.
  const events = evs.ok
    ? [...evs.data.items.filter((e) => e.name).reduce((m, e) => (m.has(e.name!) && m.get(e.name!)! > e.id ? m : m.set(e.name!, e.id)), new Map<string, number>()).entries()].map(([name, id]) => ({ id, name }))
    : [];
  const ev = tab === 'events' ? (Number(one('ev')) || events[0]?.id) ?? null : null;
  const locName = loc === 'global' ? 'Global' : (locations.find((l) => l.id === loc)?.name ?? loc);

  const { rows, ok, note } = await loadBoard(tab, tab === 'events' ? 'global' : loc, ev);
  const isClan = tab === 'clans' || tab === 'war';

  return (
    <>
      <PodiumScene rows={rows.slice(0, 3)} label={tab === 'events' ? (events.find((e) => e.id === ev)?.name ?? 'Events') : locName} isClan={isClan} scoreIcon={<ScoreIcon tab={tab} size={15} />} />
      <main className={s.main}>
        <BoardControls tab={tab} loc={loc} ev={ev} locations={locations} events={events} />
        {!ok ? (
          <EmptyState text="The Clash Royale API did not answer. Try again in a minute." />
        ) : rows.length ? (
          <div className={s.table}>
            <div className={s.row} style={{ background: 'var(--glass)', minHeight: 42, font: '500 10px/42px var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)' }}>
              <span>RANK</span>
              <span>MOVE</span>
              <span>{isClan ? 'CLAN' : 'PLAYER'}</span>
              <span className={s.sub}>{isClan ? 'MEMBERS' : 'CLAN'}</span>
              <span style={{ textAlign: 'right', color: 'var(--text-1)' }}>
                {SCORE_HEAD[tab]} <span style={{ color: 'var(--blue)' }}>▼</span>
              </span>
            </div>
            {rows.slice(3).map((r) => (
              <Link key={r.tag + r.rank} href={r.href} className={`${s.row} ${s.link}`}>
                <span style={{ font: '800 16px/1 var(--mono)', color: 'var(--text-3)' }}>{String(r.rank).padStart(2, '0')}</span>
                <span style={{ font: '600 11px/1 var(--mono)', color: r.move ? (r.move > 0 ? 'var(--blue)' : 'var(--ember)') : 'var(--text-3)' }}>
                  {r.move == null ? '—' : r.move > 0 ? `▲ ${r.move}` : r.move < 0 ? `▼ ${-r.move}` : '—'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {r.badgeId != null ? <ClanBadge badgeId={r.badgeId} size={22} /> : <span style={{ width: 22 }} />}
                  <span style={{ font: '600 14px/1.2 var(--sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                  {r.cc && <span style={{ font: '500 9px/1 var(--mono)', letterSpacing: '.1em', color: 'var(--text-3)' }}>{r.cc}</span>}
                </span>
                <span className={s.sub} style={{ font: '500 11px/1.2 var(--mono)', letterSpacing: '.06em', color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.sub}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 7, font: '700 15px/1 var(--mono)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  <ScoreIcon tab={tab} />
                  {fmt(r.score)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState text="This leaderboard is empty for that location." />
        )}
        <span style={{ font: '500 10px/1.5 var(--mono)', letterSpacing: '.08em', color: 'var(--text-3)' }}>{note}</span>
      </main>
    </>
  );
}

export default function LeaderboardsPage(props: PageProps<'/leaderboards'>) {
  return (
    <Suspense fallback={<PodiumScene rows={[]} label="Global" isClan={false} />}>
      <Board searchParams={props.searchParams} />
    </Suspense>
  );
}

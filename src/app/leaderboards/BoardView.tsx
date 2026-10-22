'use client';

import { HoverLink } from '@/components/ui/HoverLink';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ClanBadge } from '@/components/ui/ClanBadge';
import { EventIcon, MedalIcon, TrophyIcon, WarTrophyIcon } from '@/components/ui/icons';
import { fmt } from '@/lib/format';
import { BoardControls } from './BoardControls';
import { PodiumScene } from './PodiumScene';
import type { BoardRow } from './rows';
import s from './leaderboards.module.css';

export type Tab = 'pol' | 'clans' | 'war' | 'events';
export type Board = { rows: BoardRow[]; ok: boolean; note: string };

const TABS: Tab[] = ['pol', 'clans', 'war', 'events'];
const SCORE_HEAD: Record<Tab, string> = { pol: 'RATING', clans: 'CLAN SCORE', war: 'WAR TROPHIES', events: 'POINTS' };
const NO_EVENTS: Board = { rows: [], ok: true, note: 'Only events running in the game right now are listed.' };
const LOADING: Board = { rows: [], ok: true, note: '' };
const FAILED: Board = { rows: [], ok: false, note: '' };

/** The icon that goes with each board's score. */
function ScoreIcon({ tab, size = 16 }: { tab: Tab; size?: number }) {
  if (tab === 'pol') return <MedalIcon size={size} title="Ultimate Champion medals" />;
  if (tab === 'clans') return <TrophyIcon size={size} title="Clan score" />;
  if (tab === 'war') return <WarTrophyIcon size={size} title="Clan war trophies" />;
  return <EventIcon size={size} title="Event points" />;
}

/**
 * The three location boards arrive with the page, so switching between them only changes the URL
 * (history.replaceState). Event boards load when picked (once each), from /api/events/[id]. A new
 * location still loads from the server.
 */
export function BoardView({
  boards,
  events,
  loc,
  locName,
  locations,
}: {
  boards: Record<Exclude<Tab, 'events'>, Board>;
  events: { id: number; name: string }[];
  loc: string;
  locName: string;
  locations: { id: string; name: string; isCountry: boolean }[];
}) {
  const params = useSearchParams();
  const tab = (TABS.find((t) => t === params.get('tab')) ?? 'pol') as Tab;
  const ev = tab === 'events' ? (events.find((e) => e.id === Number(params.get('ev')))?.id ?? events[0]?.id ?? null) : null;
  const [loaded, setLoaded] = useState<Record<number, Board>>({});
  const evBoard = ev != null ? loaded[ev] : undefined;
  useEffect(() => {
    if (ev == null || evBoard) return;
    let dead = false;
    const done = (b: Board) => !dead && setLoaded((l) => ({ ...l, [ev]: b }));
    fetch(`/api/events/${ev}`)
      .then((r) => (r.ok ? (r.json() as Promise<Board>) : FAILED))
      .then(done, () => done(FAILED));
    return () => {
      dead = true;
    };
  }, [ev, evBoard]);
  const loading = tab === 'events' && ev != null && !evBoard;
  const { rows, ok, note } = tab === 'events' ? (ev != null ? (evBoard ?? LOADING) : NO_EVENTS) : boards[tab];
  const isClan = tab === 'clans' || tab === 'war';

  return (
    <>
      <PodiumScene rows={rows.slice(0, 3)} label={tab === 'events' ? (events.find((e) => e.id === ev)?.name ?? 'Events') : locName} isClan={isClan} scoreIcon={<ScoreIcon tab={tab} size={15} />} />
      <main className={s.main}>
        <BoardControls tab={tab} loc={loc} ev={ev} locations={locations} events={events} />
        {loading ? (
          <EmptyState text="Loading the leaderboard…" />
        ) : !ok ? (
          <EmptyState text="The Clash Royale API did not answer. Try again in a minute." />
        ) : rows.length ? (
          <div className={s.table}>
            <div className={`${s.row} ${s.headRow}`}>
              <span>RANK</span>
              <span>MOVE</span>
              <span>{isClan ? 'CLAN' : 'PLAYER'}</span>
              <span className={s.sub}>{isClan ? 'MEMBERS' : 'CLAN'}</span>
              <span className={s.scoreHead}>
                {SCORE_HEAD[tab]} <span>▼</span>
              </span>
            </div>
            {rows.slice(3).map((r) => (
              <HoverLink key={r.tag + r.rank} href={r.href} className={`${s.row} ${s.link}`}>
                <span className={s.rankCell}>{String(r.rank).padStart(2, '0')}</span>
                <span className={s.move} data-dir={r.move ? (r.move > 0 ? 'up' : 'down') : undefined}>
                  {r.move == null ? '—' : r.move > 0 ? `▲ ${r.move}` : r.move < 0 ? `▼ ${-r.move}` : '—'}
                </span>
                <span className={s.who}>
                  {r.badgeId != null ? <ClanBadge badgeId={r.badgeId} size={22} /> : <span className={s.noBadge} />}
                  <span className={s.whoName}>{r.name}</span>
                  {r.cc && <span className={s.cc}>{r.cc}</span>}
                </span>
                <span className={`${s.sub} ${s.subCell}`}>{r.sub}</span>
                <span className={s.score}>
                  <ScoreIcon tab={tab} />
                  {fmt(r.score)}
                </span>
              </HoverLink>
            ))}
          </div>
        ) : (
          <EmptyState text={tab === 'events' && ev == null ? 'No event leaderboards are live in the game right now.' : 'This leaderboard is empty for that location.'} />
        )}
        <span style={{ font: '500 10px/1.5 var(--mono)', letterSpacing: '.08em', color: 'var(--text-3)' }}>{note}</span>
      </main>
    </>
  );
}

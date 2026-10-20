'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/EmptyState';
import { ClanBadge } from '@/components/ui/ClanBadge';
import { EventIcon, MedalIcon, TrophyIcon, WarTrophyIcon } from '@/components/ui/icons';
import { fmt } from '@/lib/format';
import { BoardControls } from './BoardControls';
import { PodiumScene } from './PodiumScene';
import type { BoardRow } from './page';
import s from './leaderboards.module.css';

export type Tab = 'pol' | 'clans' | 'war' | 'events';
export type Board = { rows: BoardRow[]; ok: boolean; note: string };

const TABS: Tab[] = ['pol', 'clans', 'war', 'events'];
const SCORE_HEAD: Record<Tab, string> = { pol: 'RATING', clans: 'CLAN SCORE', war: 'WAR TROPHIES', events: 'POINTS' };
const NO_EVENTS: Board = { rows: [], ok: true, note: 'Only events running in the game right now are listed.' };

/** The icon that goes with each board's score. */
function ScoreIcon({ tab, size = 16 }: { tab: Tab; size?: number }) {
  if (tab === 'pol') return <MedalIcon size={size} title="Ultimate Champion medals" />;
  if (tab === 'clans') return <TrophyIcon size={size} title="Clan score" />;
  if (tab === 'war') return <WarTrophyIcon size={size} title="Clan war trophies" />;
  return <EventIcon size={size} title="Event points" />;
}

/**
 * Every board for the chosen location arrives with the page, so switching tab or event only
 * changes the URL (history.replaceState) and shows a board already on hand. A new location
 * still loads from the server.
 */
export function BoardView({
  boards,
  events,
  loc,
  locName,
  locations,
}: {
  boards: Record<Exclude<Tab, 'events'>, Board> & { events: Record<number, Board> };
  events: { id: number; name: string }[];
  loc: string;
  locName: string;
  locations: { id: string; name: string; isCountry: boolean }[];
}) {
  const params = useSearchParams();
  const tab = (TABS.find((t) => t === params.get('tab')) ?? 'pol') as Tab;
  const ev = tab === 'events' ? (events.find((e) => e.id === Number(params.get('ev')))?.id ?? events[0]?.id ?? null) : null;
  const { rows, ok, note } = tab === 'events' ? (ev != null ? boards.events[ev] : NO_EVENTS) : boards[tab];
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
          <EmptyState text={tab === 'events' && ev == null ? 'No event leaderboards are live in the game right now.' : 'This leaderboard is empty for that location.'} />
        )}
        <span style={{ font: '500 10px/1.5 var(--mono)', letterSpacing: '.08em', color: 'var(--text-3)' }}>{note}</span>
      </main>
    </>
  );
}

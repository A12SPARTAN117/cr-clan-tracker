'use client';

import { useState } from 'react';
import type { Dashboard } from '@/lib/clan/dashboard';
import type { RosterEventKind } from '@/lib/history';
import { dstr, fmt } from '@/lib/format';
import s from './dashboard.module.css';

const EV: Record<RosterEventKind, { icon: string; ring: string; type: string; verb: string }> = {
  joined: { icon: '+', ring: 'var(--blue)', type: 'Joined', verb: 'joined the clan' },
  left: { icon: '−', ring: 'var(--text-2)', type: 'Left', verb: 'left the clan' },
  kicked: { icon: '×', ring: 'var(--ember)', type: 'Kicked', verb: 'was removed' },
  promoted: { icon: '▲', ring: 'var(--blue-hi)', type: 'Promoted', verb: 'promoted' },
  demoted: { icon: '▼', ring: 'var(--text-2)', type: 'Demoted', verb: 'demoted' },
};

const FILTERS: ['all' | RosterEventKind, string][] = [
  ['all', 'All'],
  ['joined', 'Joins'],
  ['left', 'Leaves'],
  ['kicked', 'Kicks'],
  ['promoted', 'Promotions'],
  ['demoted', 'Demotions'],
];

export function RosterTab({ data }: { data: Dashboard }) {
  const [f, setF] = useState<'all' | RosterEventKind>('all');
  const events = (data.history?.events ?? []).filter((e) => f === 'all' || e.kind === f);

  return (
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,460px),1fr))', gap: 28, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FILTERS.map(([v, l]) => (
            <button key={v} type="button" className="chip" aria-pressed={f === v} onClick={() => setF(v)}>
              {l}
            </button>
          ))}
        </div>
        {data.history ? (
          <div className="data-since">Data since {dstr(new Date(data.history.trackedSince))}. Earlier roster changes were not tracked.</div>
        ) : (
          <div className="data-since">Roster tracking starts once history is on. Joins, leaves, kicks and role changes appear here from then.</div>
        )}
        {events.length ? (
          <div className={s.timeline}>
            {events.map((e, i) => {
              const ev = EV[e.kind];
              return (
                <div key={`${e.at}${e.tag}${i}`} className={s.event}>
                  <span className={s.eventDot} style={{ borderColor: ev.ring, color: ev.ring }}>
                    {ev.icon}
                  </span>
                  <span style={{ font: '500 11px/1.4 var(--mono)', color: 'var(--text-3)' }}>{dstr(new Date(e.at)).slice(0, 6)}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ font: '500 14px/1.3 var(--sans)' }}>
                      <b style={{ fontWeight: 600 }}>{e.name}</b> {ev.verb}
                      {e.detail ? ` ${e.detail}` : ''}
                    </span>
                    <span style={{ font: '500 9px/1 var(--mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: ev.ring }}>{ev.type}</span>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="body" style={{ fontSize: 14 }}>
            {data.history ? 'No roster changes of this kind yet.' : 'No tracked roster changes yet.'}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 className="heading">Former members</h3>
        <p className="body" style={{ fontSize: 14 }}>
          Players who took part in a tracked river race but are no longer in the clan.
        </p>
        <div style={{ overflowX: 'auto', border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--charcoal)' }}>
          <table className={s.plain} style={{ minWidth: 440 }}>
            <thead>
              <tr>
                <th>NAME</th>
                <th>LAST RACE</th>
                <th style={{ textAlign: 'right' }}>DECKS</th>
                <th style={{ textAlign: 'right' }}>FAME</th>
              </tr>
            </thead>
            <tbody>
              {data.former.map((m) => (
                <tr key={m.tag}>
                  <td style={{ font: '600 14px/1.2 var(--sans)' }}>
                    {m.name}
                    <span style={{ display: 'block', marginTop: 3, font: '500 9px/1 var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)' }}>#{m.tag}</span>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{m.lastRace}</td>
                  <td style={{ textAlign: 'right' }}>{m.decks}/16</td>
                  <td style={{ textAlign: 'right' }}>{fmt(m.fame)}</td>
                </tr>
              ))}
              {!data.former.length && (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--text-3)', textAlign: 'center', padding: 28 }}>
                    Nobody has left since the oldest tracked race.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

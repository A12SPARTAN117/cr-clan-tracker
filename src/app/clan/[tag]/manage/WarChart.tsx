'use client';

import { useMemo, useState } from 'react';
import { fmt } from '@/lib/format';
import type { Scored } from './shared';
import s from './dashboard.module.css';

type Metric = 'fame' | 'perDeck' | 'decks' | 'win';
type Span = 0 | 4 | 10;

const METRICS: { k: Metric; label: string; note: string }[] = [
  { k: 'fame', label: 'Fame', note: 'Total fame earned' },
  { k: 'perDeck', label: 'Fame / deck', note: 'Fame per war deck: how much each battle is worth. Members with under 4 decks are left out.' },
  { k: 'decks', label: 'Decks used', note: 'War decks used out of 16 per race, for the races each member was in the clan.' },
  { k: 'win', label: 'Win %', note: 'War battle win rate from recent battle logs (about the last 30 battles). Members with under 3 war battles are left out.' },
];
/** Rows shown before "Show all". */
const TOP = 15;
const SPANS: { k: Span; label: string }[] = [
  { k: 0, label: 'This race' },
  { k: 4, label: 'Last 4 races' },
  { k: 10, label: 'Last 10 races' },
];

type Row = { tag: string; name: string; value: number; shown: string; fame: number; decks: number; races: number };

/** One member's war totals over the chosen races (0 = the race running now). */
function totals(m: Scored, span: Span) {
  if (span === 0) return { fame: m.fame, decks: m.decks, races: 1 };
  const weeks = m.hist.slice(0, span).filter((w) => !!w);
  return { fame: weeks.reduce((a, w) => a + w.fame, 0), decks: weeks.reduce((a, w) => a + w.decks, 0), races: weeks.length };
}

/**
 * Who is carrying the clan in war: every member ranked on one measure, as horizontal bars.
 * Hover (or focus) a bar for the breakdown; click it to open the member.
 */
export function WarChart({ members, races, onOpen }: { members: Scored[]; races: number; onOpen: (tag: string) => void }) {
  const [metric, setMetric] = useState<Metric>('fame');
  const [span, setSpan] = useState<Span>(4);
  const [hover, setHover] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const spans = SPANS.filter((x) => x.k === 0 || races > 0);
  const useSpan: Span = races === 0 ? 0 : span;

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const m of members) {
      const t = totals(m, useSpan);
      let value: number | null = null;
      let shown = '';
      if (metric === 'fame') {
        value = t.fame;
        shown = fmt(t.fame);
      } else if (metric === 'perDeck') {
        if (t.decks >= 4) value = t.fame / t.decks;
        shown = value == null ? '' : fmt(Math.round(value));
      } else if (metric === 'decks') {
        if (t.races > 0) value = (t.decks / (16 * t.races)) * 100;
        shown = `${t.decks}/${16 * t.races}`;
      } else if (m.warGames >= 3 && m.warWin != null) {
        value = m.warWin;
        shown = `${Math.round(m.warWin)}%`;
      }
      if (value != null) out.push({ tag: m.tag, name: m.name, value, shown, ...t });
    }
    return out.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  }, [members, metric, useSpan]);

  const max = metric === 'decks' || metric === 'win' ? 100 : Math.max(1, ...rows.map((r) => r.value));
  const note = METRICS.find((x) => x.k === metric)!.note;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <h3 className="heading">War performance</h3>
        <span className="label-sm" style={{ letterSpacing: '.1em' }}>
          {rows.length} of {members.length} members
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', alignItems: 'center' }}>
        <div role="group" aria-label="Measure" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {METRICS.map((x) => (
            <button key={x.k} type="button" className="chip" aria-pressed={metric === x.k} onClick={() => setMetric(x.k)}>
              {x.label}
            </button>
          ))}
        </div>
        {metric !== 'win' && (
          <div role="group" aria-label="Races" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {spans.map((x) => (
              <button key={x.k} type="button" className="chip" aria-pressed={useSpan === x.k} onClick={() => setSpan(x.k)}>
                {x.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="label-sm" style={{ margin: 0, letterSpacing: '.06em', textTransform: 'none', color: 'var(--text-3)' }}>
        {note}
      </p>

      {rows.length ? (
        <ol className={s.warChart} aria-label={`War performance: ${METRICS.find((x) => x.k === metric)!.label}`}>
          {(all ? rows : rows.slice(0, TOP)).map((r, i) => (
            <li key={r.tag}>
              <button
                type="button"
                className={s.warBar}
                data-top={i < 3}
                onClick={() => onOpen(r.tag)}
                onPointerEnter={() => setHover(r.tag)}
                onPointerLeave={() => setHover((h) => (h === r.tag ? null : h))}
                onFocus={() => setHover(r.tag)}
                onBlur={() => setHover((h) => (h === r.tag ? null : h))}
              >
                <span className={s.warRank}>{i + 1}</span>
                <span className={s.warName}>{r.name}</span>
                <span className={s.warTrack}>
                  <span style={{ width: `${Math.max(1, (r.value / max) * 100)}%` }} />
                </span>
                <span className={s.warValue}>{r.shown}</span>
                {hover === r.tag && (
                  <span role="tooltip" className={s.warTip}>
                    <b>{r.name}</b>
                    {metric === 'win' ? (
                      <span>War battles: {Math.round(r.value)}% won</span>
                    ) : (
                      <span>
                        {fmt(r.fame)} fame · {r.decks} decks
                        {r.decks ? ` · ${fmt(Math.round(r.fame / r.decks))} per deck` : ''}
                        {useSpan ? ` · in ${r.races} of ${Math.min(useSpan, races)} races` : ''}
                      </span>
                    )}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="body">Nobody has enough war battles for this measure yet.</p>
      )}
      {rows.length > TOP && (
        <button type="button" className="link-mono" style={{ alignSelf: 'flex-start', background: 'none', border: 0, color: 'var(--blue)', cursor: 'pointer', fontSize: 10 }} onClick={() => setAll(!all)}>
          {all ? `Show top ${TOP}` : `Show all ${rows.length} →`}
        </button>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ActivityDot, HeatCell, ROLE_LABEL, ScoreGauge, ACTIVITY_LABEL, activityOf, heatStyle } from '@/components/ui/primitives';
import type { RosterEvent } from '@/lib/history';
import { FACTORS, FACTOR_INFO, weightSum, type Weights } from '@/lib/clan/score';
import { agoShort, dstr } from '@/lib/format';
import { WAR_DAYS } from '@/lib/war';
import { tenureText, type Scored } from './shared';
import s from './dashboard.module.css';

export function MemberDrawer({
  m,
  total,
  weights,
  events,
  onPrev,
  onNext,
  onClose,
}: {
  m: Scored;
  total: number;
  weights: Weights;
  events: RosterEvent[];
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  const sw = weightSum(weights);

  // Focus the drawer when it opens; return focus to where it came from when it closes.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => prev?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowUp' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowDown' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        onNext();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  const present = m.hist.filter(Boolean);
  const histDecks = present.reduce((a, h) => a + (h?.decks ?? 0), 0);
  const roleEvents = events.filter((e) => e.tag === m.tag && (e.kind === 'promoted' || e.kind === 'demoted' || e.kind === 'joined'));
  const act = activityOf(m.hours);

  return (
    <>
      <div className={s.backdrop} onClick={onClose} />
      <aside ref={panel} role="dialog" aria-modal="true" aria-label={`Member detail: ${m.name}`} tabIndex={-1} className={s.drawer} style={{ outline: 'none' }}>
        <div className={s.drawerHead}>
          <span className="label" style={{ letterSpacing: '.14em' }}>
            Member · {String(m.rank).padStart(2, '0')} of {total}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className={s.iconBtn} onClick={onPrev} aria-label="Previous member">
              ↑
            </button>
            <button type="button" className={s.iconBtn} onClick={onNext} aria-label="Next member">
              ↓
            </button>
            <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close">
              ESC ×
            </button>
          </div>
        </div>
        <div style={{ padding: '28px 24px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
              <h2 style={{ margin: 0, font: '800 clamp(30px,6vw,44px)/.95 var(--mono)', letterSpacing: '-.05em', wordBreak: 'break-word' }}>{m.name}</h2>
              <span style={{ font: '500 11px/1.5 var(--mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
                #{m.tag} · {ROLE_LABEL[m.role]} · {m.joined ? `Joined ${dstr(new Date(m.joined))}` : m.isNew ? 'Joined this week' : `In clan ${tenureText(m)}`}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  font: '500 11px/1 var(--mono)',
                  letterSpacing: '.08em',
                  color: act === 'inactive' ? 'var(--ember)' : act === 'risk' ? 'var(--text-2)' : 'var(--text-1)',
                }}
              >
                <ActivityDot hours={m.hours} />
                Last seen {m.hours < 1 ? 'just now' : `${agoShort(m.hours)} ago`} · {ACTIVITY_LABEL[act]}
              </span>
              <Link href={`/player/${m.tag}`} className="link-mono" style={{ fontSize: 10 }}>
                Player profile →
              </Link>
            </div>
            <ScoreGauge score={m.score} size={120} big />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="label" style={{ letterSpacing: '.14em' }}>
              Score breakdown
            </span>
            {FACTORS.map((k) => {
              const note =
                k === 'bat' && m.warWin == null ? 'No war battles in log · counted as 50' : k === 'ten' && m.tenureKnown !== 'exact' ? 'From tracked races (lower bound)' : null;
              return (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 40px', gap: 12, alignItems: 'center' }}>
                  <span style={{ font: '500 13px/1.2 var(--sans)' }}>
                    {FACTOR_INFO[k].label}
                    <span style={{ display: 'block', font: '500 9px/1.4 var(--mono)', letterSpacing: '.1em', color: 'var(--text-3)' }}>WEIGHT {Math.round((weights[k] / sw) * 100)}%</span>
                  </span>
                  <span title={note ?? undefined} style={{ height: 6, borderRadius: 3, background: 'var(--well)', overflow: 'hidden' }}>
                    <span
                      style={{
                        display: 'block',
                        height: '100%',
                        width: `${m.factors[k]}%`,
                        background: k === 'war' ? 'var(--blue)' : 'var(--text-2)',
                        boxShadow: k === 'war' ? '0 0 8px rgba(var(--glow-rgb), .7)' : 'none',
                      }}
                    />
                  </span>
                  <span style={{ textAlign: 'right', font: '700 13px/1 var(--mono)' }}>{m.factors[k]}</span>
                  {note && (
                    <span style={{ gridColumn: '2 / -1', marginTop: -8, font: '500 9px/1.3 var(--mono)', letterSpacing: '.06em', color: 'var(--text-3)' }}>{note}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="label" style={{ letterSpacing: '.14em' }}>
                War decks · this week + tracked races
              </span>
              <span style={{ font: '500 10px/1 var(--mono)', color: 'var(--text-2)' }}>{present.length ? `${histDecks}/${present.length * 16} decks` : 'No races yet'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(4,1fr)', gap: 4 }}>
              <span />
              {WAR_DAYS.map((d) => (
                <span key={d} style={{ font: '500 9px/1 var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)', textAlign: 'center' }}>
                  {d}
                </span>
              ))}
              <span style={{ font: '500 10px/22px var(--mono)', color: 'var(--blue-hi)' }}>NOW</span>
              {m.days.map((d, i) => (
                <HeatCell key={i} value={d} width="100%" height={22} fontSize={9} />
              ))}
              {m.hist.map((w, i) => (
                <WeekRow key={w?.key ?? `none${i}`} w={w} />
              ))}
            </div>
            {m.hist.some((h) => !h) && (
              <span style={{ font: '500 10px/1.5 var(--mono)', letterSpacing: '.08em', color: 'var(--text-2)' }}>Hatched weeks: not in the clan for that race.</span>
            )}
            {present.some((h) => !h?.days) && (
              <span style={{ font: '500 10px/1.5 var(--mono)', letterSpacing: '.08em', color: 'var(--text-3)' }}>
                Past races show the week total; per-day counts appear for races tracked by our snapshots.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="label" style={{ letterSpacing: '.14em' }}>
              Clan 1v1 friendlies · based on {m.fGames} games
            </span>
            {m.friendlies.length ? (
              m.friendlies.slice(0, 8).map((f) => {
                const g = f.w + f.l;
                return (
                  <div key={f.tag} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--hair)', font: '500 12px/1 var(--mono)' }}>
                    <span style={{ font: '500 14px/1.2 var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>vs {f.name}</span>
                    <span style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', background: 'var(--ember)' }}>
                      <span style={{ width: `${g ? (f.w / g) * 100 : 0}%`, background: 'var(--blue)' }} />
                    </span>
                    <span style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--blue)' }}>{f.w}W</span> <span style={{ color: 'var(--ember)' }}>{f.l}L</span>
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="body" style={{ fontSize: 14 }}>
                No clan friendlies in the last ~30 battles.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="label" style={{ letterSpacing: '.14em' }}>
              Role history
            </span>
            {roleEvents.length ? (
              roleEvents.map((e, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--hair)' }}>
                  <span style={{ font: '500 11px/1.4 var(--mono)', color: 'var(--text-3)' }}>{dstr(new Date(e.at))}</span>
                  <span style={{ font: '500 14px/1.3 var(--sans)' }}>
                    {e.kind === 'joined' ? 'Joined' : e.kind === 'promoted' ? 'Promoted' : 'Demoted'}
                    {e.detail ? ` ${e.detail}` : ''}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--hair)' }}>
                <span style={{ font: '500 11px/1.4 var(--mono)', color: 'var(--text-3)' }}>Now</span>
                <span style={{ font: '500 14px/1.3 var(--sans)' }}>
                  {ROLE_LABEL[m.role]} <span style={{ color: 'var(--text-3)' }}>· earlier role changes weren&apos;t tracked</span>
                </span>
              </div>
            )}
          </div>
          <span className="label-sm" style={{ lineHeight: 1.6 }}>
            Last seen {agoShort(m.hours)} ago · {m.warGames} war battles in the battle log
            {m.trainingGames ? ` · ${m.trainingGames} training battles (not counted)` : ''}
          </span>
        </div>
      </aside>
    </>
  );
}

function WeekRow({ w }: { w: Scored['hist'][number] }) {
  if (!w)
    return (
      <>
        <span style={{ font: '500 10px/22px var(--mono)', color: 'var(--text-3)' }}>—</span>
        {[0, 1, 2, 3].map((i) => (
          <HeatCell key={i} value={null} width="100%" height={22} />
        ))}
      </>
    );
  const label = (
    <span style={{ font: '500 10px/22px var(--mono)', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden' }} title={w.label}>
      {w.label.split(' · ')[1]}
    </span>
  );
  if (w.days)
    return (
      <>
        {label}
        {w.days.map((d, i) => (
          <HeatCell key={i} value={d} width="100%" height={22} fontSize={9} />
        ))}
      </>
    );
  // Only the week total is known: one merged cell, intensity by share of 16 decks.
  const share = Math.round((w.decks / 16) * 4);
  const h = heatStyle(share);
  return (
    <>
      {label}
      <span
        title={`${w.decks} of 16 decks · ${w.fame} fame`}
        style={{ gridColumn: 'span 4', height: 22, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 9px/1 var(--mono)', ...h.style }}
      >
        {w.decks}/16
      </span>
    </>
  );
}

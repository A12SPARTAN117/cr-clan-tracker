'use client';

import { useEffect, useState } from 'react';
import { Reveal } from '@/components/fx/Reveal';
import { RiverRace3D } from '@/components/fx/RiverRace3D';
import { HeatCell } from '@/components/ui/primitives';
import { ClanBadge } from '@/components/ui/ClanBadge';
import type { Dashboard } from '@/lib/clan/dashboard';
import { fmt, pad2 } from '@/lib/format';
import { WAR_DAYS } from '@/lib/war';
import type { Scored } from './shared';
import { WarChart } from './WarChart';
import s from './dashboard.module.css';

function useCountdown(target: string | undefined) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    const t = new Date(target).getTime();
    const tick = () => setLeft(Math.max(0, Math.floor((t - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  if (left == null) return '--:--:--';
  return [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map(pad2).join(':');
}

export function WarTab({ data, members, onOpen }: { data: Dashboard; members: Scored[]; onOpen: (tag: string) => void }) {
  const war = data.war;
  const countdown = useCountdown(war?.kind === 'training' ? war.warStarts : war?.nextReset);
  const [openWeek, setOpenWeek] = useState<string | null>(null);
  const training = war?.kind === 'training';
  const maxFame = Math.max(10000, ...(war?.clans.map((c) => c.fame) ?? [0]));
  const grid = [...members].sort((a, b) => a.decks - b.decks || a.name.localeCompare(b.name));

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="label" style={{ letterSpacing: '.14em' }}>
              River race · {war?.raceLabel ?? 'Unavailable'}
            </span>
            <Reveal as="h2" className="display-m">
              {war ? (
                <>
                  {training ? 'TRAINING' : war.kind === 'colosseum' ? 'COLOSSEUM' : 'WAR'} DAY {war.day}
                  <span style={{ color: 'var(--text-3)' }}>/{training ? 3 : 4}</span>
                </>
              ) : (
                'NO RACE DATA'
              )}
            </Reveal>
          </div>
          {war && (
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="label" style={{ letterSpacing: '.14em' }}>
                  {training ? 'War starts in' : 'Day ends in'}
                </span>
                <span style={{ font: '700 28px/1 var(--mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--blue-hi)', textShadow: '0 0 18px rgba(var(--glow-rgb), .5)' }}>{countdown}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="label" style={{ letterSpacing: '.14em' }}>
                  {training ? 'Practice decks today' : 'Our decks today'}
                </span>
                <span style={{ font: '700 28px/1 var(--mono)', fontVariantNumeric: 'tabular-nums', color: training ? 'var(--text-2)' : undefined }}>
                  {training ? war.trainingDecksToday : war.decksToday}
                  {!training && <span style={{ color: 'var(--text-3)', fontSize: 16 }}>/200</span>}
                </span>
              </div>
            </div>
          )}
        </div>
        {training && (
          <div className="data-since" role="note">
            The river race is in its training days. Training battles are practice: they don&apos;t count as playing war here, and nobody is flagged
            for skipping them. War days run Thursday to Sunday.
          </div>
        )}
        {war && (
          <div style={{ display: 'flex', gap: 4 }}>
            {WAR_DAYS.map((d, i) => {
              const now = !training && i + 1 === war.day;
              const done = !training && i + 1 < war.day;
              return (
                <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span
                    style={{
                      height: 2,
                      borderRadius: 2,
                      background: now ? 'var(--blue-hi)' : done ? 'var(--text-2)' : 'var(--hair)',
                      boxShadow: now ? '0 0 10px rgba(var(--glow-rgb), .8)' : 'none',
                    }}
                  />
                  <span style={{ font: '500 9px/1 var(--mono)', letterSpacing: '.14em', color: now ? 'var(--blue-hi)' : 'var(--text-3)' }}>
                    {d}
                    {now ? ' · NOW' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {war && <RiverRace3D clans={war.clans} training={training} height={240} />}
        <div>
          {war?.clans.map((c, i) => (
            <div key={c.tag} className={s.raceRow}>
              <span style={{ font: '700 14px/1 var(--mono)', color: i === 0 ? 'var(--gold)' : 'var(--text-3)' }}>{i + 1}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <ClanBadge badgeId={c.badgeId} size={24} />
                <span style={{ font: '600 15px/1.1 var(--sans)', color: c.us ? 'var(--text-1)' : 'var(--text-2)', minWidth: 0 }}>
                  {c.name}
                  {c.us && <span style={{ display: 'block', marginTop: 4, font: '500 9px/1 var(--mono)', letterSpacing: '.14em', color: 'var(--blue-hi)' }}>● YOUR CLAN</span>}
                </span>
              </span>
              <div className={s.boat} aria-hidden>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 7, height: 1, background: 'var(--hair)' }} />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 7,
                    height: 2,
                    width: `${(c.fame / maxFame) * 100}%`,
                    background: c.us ? 'var(--blue-hi)' : 'var(--text-3)',
                    boxShadow: c.us ? '0 0 10px rgba(var(--glow-rgb), .8)' : 'none',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: `calc(${(c.fame / maxFame) * 100}% - 6px)`,
                    width: 12,
                    height: 12,
                    transform: 'rotate(45deg)',
                    border: `1.5px solid ${c.us ? 'var(--blue-hi)' : 'var(--text-3)'}`,
                    background: 'var(--charcoal)',
                  }}
                />
              </div>
              <span style={{ textAlign: 'right', font: '600 14px/1 var(--mono)' }}>
                {fmt(c.fame)}
                <span className="label-sm" style={{ display: 'block', marginTop: 4, letterSpacing: '.12em' }}>
                  Fame
                </span>
              </span>
              <span style={{ textAlign: 'right', font: '600 14px/1 var(--mono)', color: 'var(--text-2)' }}>
                {c.decksToday}
                <span className="label-sm" style={{ display: 'block', marginTop: 4, letterSpacing: '.12em' }}>
                  Decks/200
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <h3 className="heading">Participation this week</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 9px/1 var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)' }}>
            <span>0</span>
            {[0, 1, 2, 3, 4].map((n) => (
              <HeatCell key={n} value={n} width={16} height={16} showText={false} />
            ))}
            <span>4 DECKS</span>
          </div>
        </div>
        {!data.history && !training && (war?.day ?? 0) > 1 && (
          <div className="data-since">Earlier war days show “–”: daily deck counts need snapshots, which start once history tracking is on.</div>
        )}
        <div style={{ overflowX: 'auto', border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--charcoal)' }}>
          <div className={s.grid}>
            <span className={s.gridHead} style={{ padding: '12px 14px', textAlign: 'left' }}>
              MEMBER
            </span>
            {WAR_DAYS.map((d, i) => (
              <span key={d} className={s.gridHead} style={{ color: !training && i + 1 === war?.day ? 'var(--blue-hi)' : undefined }}>
                {d}
                {!training && i + 1 === war?.day ? ' · TODAY' : ''}
              </span>
            ))}
            <span className={s.gridHead} style={{ textAlign: 'right' }}>
              TOTAL
            </span>
            <span className={s.gridHead} style={{ textAlign: 'right', padding: '12px 14px' }}>
              FLAG
            </span>
            {grid.map((m) => (
              <div key={m.tag} style={{ display: 'contents' }}>
                <button
                  type="button"
                  onClick={() => onOpen(m.tag)}
                  style={{ padding: '8px 14px', background: 'none', border: 0, borderBottom: '1px solid var(--hair)', textAlign: 'left', color: 'var(--text-1)', font: '500 13px/1.2 var(--sans)', cursor: 'pointer' }}
                >
                  {m.name}
                </button>
                {m.days.map((d, i) => (
                  <span key={i} className={s.gridCell}>
                    <HeatCell value={d} width="100%" height={26} />
                  </span>
                ))}
                <span style={{ padding: '8px 0', textAlign: 'right', borderBottom: '1px solid var(--hair)', font: '600 13px/26px var(--mono)', color: !training && m.decks === 0 ? 'var(--ember)' : 'var(--text-1)' }}>
                  {m.decks}/16
                </span>
                <span style={{ padding: '8px 14px', textAlign: 'right', borderBottom: '1px solid var(--hair)', font: '500 9px/26px var(--mono)', letterSpacing: '.12em', color: 'var(--ember)' }}>
                  {!training && m.decks === 0 ? '✕ NO DECKS' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <WarChart members={members} races={data.past.length} onOpen={onOpen} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 className="heading">Past {data.past.length || 10} races</h3>
        {data.past.length ? (
          <div style={{ border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--charcoal)', overflow: 'hidden' }}>
            {data.past.map((w) => {
              const open = openWeek === w.key;
              return (
                <div key={w.key} style={{ borderBottom: '1px solid var(--hair)' }}>
                  <button type="button" className={s.pastBtn} aria-expanded={open} onClick={() => setOpenWeek(open ? null : w.key)}>
                    <span>{w.label}</span>
                    <span style={{ fontWeight: 700, color: w.rank === 1 ? 'var(--gold)' : 'var(--text-1)' }}>{w.rank ? `#${w.rank}` : '—'}</span>
                    <span style={{ textAlign: 'right' }}>
                      {fmt(w.fame)} <span style={{ color: 'var(--text-3)', fontSize: 10 }}>FAME</span>
                    </span>
                    <span style={{ textAlign: 'right', color: (w.trophyChange ?? 0) > 0 ? 'var(--blue)' : (w.trophyChange ?? 0) < 0 ? 'var(--ember)' : 'var(--text-3)' }}>
                      {w.trophyChange == null ? '—' : `${w.trophyChange > 0 ? '▲ +' : w.trophyChange < 0 ? '▼ ' : ''}${w.trophyChange} TR`}
                    </span>
                    <span style={{ textAlign: 'right', color: 'var(--text-3)' }}>{open ? '−' : '+'}</span>
                  </button>
                  {open && (
                    <div className="cells" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', borderRadius: 0 }}>
                      {w.members.map((pm) => (
                        <div key={pm.tag} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '10px 18px', background: 'var(--obsidian)', font: '500 12px/1.2 var(--mono)' }}>
                          <span style={{ fontFamily: 'var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pm.name}</span>
                          <span style={{ color: pm.decks === 0 ? 'var(--ember)' : 'var(--text-2)', whiteSpace: 'nowrap' }}>
                            {pm.decks}/16 · {fmt(pm.fame)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="body">The API returned no race log for this clan yet.</p>
        )}
      </div>
    </div>
  );
}

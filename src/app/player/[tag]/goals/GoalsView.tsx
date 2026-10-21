'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SceneHeader } from '@/components/SceneHeader';
import { Reveal } from '@/components/fx/Reveal';
import { dstr } from '@/lib/format';
import { POL_LEAGUES } from '@/lib/leagues';
import { addGoal, removeGoal, useGoals, type Goal } from '@/lib/myGoals';
import { paceOf, progressOf, show, type Metric, type MetricKey } from '@/lib/player/goals';
import ps from '../player.module.css';
import s from './goals.module.css';

/** One-tap goals that fit where the player is now. */
function suggestions(metrics: Metric[]): { metric: MetricKey; target: number; label: string }[] {
  const m = (k: MetricKey) => metrics.find((x) => x.key === k)!;
  const out: { metric: MetricKey; target: number; label: string }[] = [];
  const t = m('trophies').current;
  if (t != null) out.push({ metric: 'trophies', target: Math.ceil((t + 1) / 500) * 500, label: `${m('trophies').label}: ${(Math.ceil((t + 1) / 500) * 500).toLocaleString('en-US')}` });
  const lg = m('polLeague').current;
  if (lg == null || lg < 7) out.push({ metric: 'polLeague', target: 7, label: 'Reach Ultimate Champion' });
  const w = m('warWins').current;
  if (w != null) {
    const next = [100, 250, 500, 1000, 2500, 5000].find((x) => x > w);
    if (next) out.push({ metric: 'warWins', target: next, label: `${next.toLocaleString('en-US')} war wins` });
  }
  const c = m('collection').current;
  if (c != null) out.push({ metric: 'collection', target: Math.ceil((c + 1) / 100) * 100, label: `Collection level ${(Math.ceil((c + 1) / 100) * 100).toLocaleString('en-US')}` });
  return out;
}

function GoalCard({ g, m, today, onRemove }: { g: Goal; m: Metric; today: string; onRemove: () => void }) {
  const pace = paceOf(m, g.target, today);
  const prog = progressOf(m, g.target);
  const cur = m.current ?? m.series.at(-1)?.[1] ?? null;
  return (
    <article className={s.goal} data-done={pace.done}>
      <div className={s.goalHead}>
        <span className={s.k}>{m.label}</span>
        <button type="button" className={s.remove} onClick={onRemove} aria-label={`Remove goal ${show(m, g.target)}`}>
          ✕
        </button>
      </div>
      <b className={s.target}>{show(m, g.target)}</b>
      <span className={s.bar} aria-label={`${Math.round(prog * 100)}% there`}>
        <span style={{ width: `${prog * 100}%` }} />
      </span>
      <span className={s.now}>
        Now {cur == null ? '—' : show(m, cur)}
        {!pace.done && cur != null && m.format !== 'league' ? ` · ${(g.target - cur).toLocaleString('en-US')} to go` : ''}
      </span>
      <span className={s.eta}>
        {pace.done
          ? 'Reached ✓'
          : pace.eta
            ? `At ${pace.perDay! >= 10 ? Math.round(pace.perDay!) : pace.perDay!.toFixed(1)} a day (last ${Math.round(pace.days)} days): around ${dstr(new Date(pace.eta))}`
            : pace.why === 'stalled'
              ? `Not moving over the last ${Math.round(pace.days)} days, so no finish date yet`
              : m.series.length === 0 && m.key === 'maxCards'
                ? 'No history for this one: progress only'
                : 'Needs a few more days of snapshots for a finish date'}
      </span>
    </article>
  );
}

export function GoalsView({ name, tag, metrics, today, trackedSince }: { name: string; tag: string; metrics: Metric[]; today: string; trackedSince: string | null }) {
  const goals = useGoals(tag);
  const [metric, setMetric] = useState<MetricKey>('trophies');
  const [target, setTarget] = useState('');
  const m = metrics.find((x) => x.key === metric)!;
  const sugg = suggestions(metrics).filter((x) => !goals.some((g) => g.metric === x.metric && g.target === x.target));

  return (
    <>
      <SceneHeader scene="/scenes/podium.jpg" height="clamp(320px, 42vh, 440px)" status={<span>Season goals · saved on this device</span>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 820 }}>
          <Link href={`/player/${tag}`} className={ps.chip} style={{ alignSelf: 'flex-start' }}>
            ← {name} <span style={{ color: 'var(--text-3)' }}>#{tag}</span>
          </Link>
          <Reveal as="h1" className={ps.name}>
            GOALS
          </Reveal>
        </div>
      </SceneHeader>
      <main className={s.main}>
        {goals.length ? (
          <div className={s.grid}>
            {goals.map((g) => (
              <GoalCard key={g.id} g={g} m={metrics.find((x) => x.key === g.metric)!} today={today} onRemove={() => removeGoal(tag, g.id)} />
            ))}
          </div>
        ) : (
          <p className={s.empty}>No goals yet. Pick one below.</p>
        )}

        {sugg.length > 0 && (
          <section className={s.block}>
            <h2 className="heading">Quick goals</h2>
            <div className={s.chips}>
              {sugg.map((x) => (
                <button key={`${x.metric}-${x.target}`} type="button" className="chip" onClick={() => addGoal(tag, x.metric, x.target)}>
                  + {x.label}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className={s.block}>
          <h2 className="heading">Set your own</h2>
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(target);
              if (Number.isFinite(n) && n > 0) {
                addGoal(tag, metric, n);
                setTarget('');
              }
            }}
          >
            <select value={metric} onChange={(e) => (setMetric(e.target.value as MetricKey), setTarget(''))} className={s.input} aria-label="What to aim for">
              {metrics.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label}
                </option>
              ))}
            </select>
            {m.format === 'league' ? (
              <select value={target} onChange={(e) => setTarget(e.target.value)} className={s.input} aria-label="League">
                <option value="">Pick a league</option>
                {POL_LEAGUES.map((l, i) => (
                  <option key={l} value={i + 1}>
                    {l}
                  </option>
                ))}
              </select>
            ) : (
              <input type="number" min={1} inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} className={s.input} placeholder={m.current != null ? `Now ${m.current.toLocaleString('en-US')}` : 'Target'} aria-label="Target" />
            )}
            <button type="submit" className="btn btn-primary" disabled={!target}>
              Add goal
            </button>
          </form>
        </section>

        <p className={s.note}>
          Progress uses {name}&apos;s live numbers from the official API. Finish dates come from the pace between daily snapshots over the last 30 days
          {trackedSince ? `, kept since ${dstr(new Date(trackedSince))}` : ', which start today'}. A goal that isn&apos;t moving gets no date rather than a guess.
        </p>
      </main>
    </>
  );
}

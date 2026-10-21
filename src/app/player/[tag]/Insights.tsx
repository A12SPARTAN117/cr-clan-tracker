'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { dstr, fmt } from '@/lib/format';
import { CLOSE_HP, heatmap, STYLES, type Insights, type Record3 } from '@/lib/player/insights';
import s from './insights.module.css';

const pct = (x: number | null) => (x == null ? '—' : `${Math.round(x * 100)}%`);
const rec = (r: Record3) => `${r.w}–${r.l}${r.d ? `–${r.d}` : ''}`;
/** True only in the browser, so the heatmap uses the viewer's own time zone. */
const useClient = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** How many stored games a section is based on, and since when. */
function Basis({ n, since, what = '1v1 games' }: { n: number; since: string | null; what?: string }) {
  return (
    <span className={s.basis}>
      From {fmt(n)} {what}
      {since ? ` since ${dstr(new Date(since))}` : ''}
    </span>
  );
}

/** Overview strip: the headline numbers, linking to the Insights tab. */
export function InsightsStrip({ x, onOpen }: { x: Insights; onOpen: () => void }) {
  const e = x.elixir;
  const items: [string, string, string][] = [
    ['Elixir leaked', e.leak == null ? '—' : e.leak.toFixed(2), 'a game'],
    ['Close games', e.close.games ? rec(e.close) : '—', e.close.games ? `${pct(e.close.rate)} won` : 'none yet'],
    ['Blowouts', e.blowout.games ? rec(e.blowout) : '—', e.blowout.games ? `${pct(e.blowout.rate)} won` : 'none yet'],
    ['Playstyle', x.playstyle.main ?? '—', x.playstyle.main ? `${pct(x.playstyle.scores[x.playstyle.main])} lean` : 'no decks yet'],
  ];
  return (
    <button type="button" className={s.strip} onClick={onOpen} aria-label="Open Insights">
      {items.map(([k, v, sub]) => (
        <span key={k} className={s.stripItem}>
          <span className={s.k}>{k}</span>
          <b>{v}</b>
          <small>{sub}</small>
        </span>
      ))}
      <span className={s.stripMore}>Insights →</span>
    </button>
  );
}

/** Shown while the player is on a losing run, with how they've done after one before. */
export function TiltWarning({ x }: { x: Insights }) {
  const t = x.tilt;
  if (t.current < t.after) return null;
  return (
    <div className={s.tilt} role="status">
      <b>{t.current} losses in a row.</b>{' '}
      {t.next.games >= 5
        ? `After ${t.after} straight losses this player goes ${rec(t.next)} (${pct(t.next.rate)}) in the next game. Maybe take a break.`
        : `Not enough losing runs on record to say how the next game tends to go. Maybe take a break.`}
    </div>
  );
}

/** Radar of the four styles, 0–100% lean each. */
function Radar({ scores }: { scores: Record<string, number> }) {
  const R = 92;
  const c = 120;
  const pts = STYLES.map((st, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / STYLES.length;
    return { st, a, x: c + Math.cos(a) * R * scores[st], y: c + Math.sin(a) * R * scores[st], lx: c + Math.cos(a) * (R + 20), ly: c + Math.sin(a) * (R + 20) };
  });
  return (
    <svg viewBox="0 0 240 240" className={s.radar} role="img" aria-label={`Playstyle: ${STYLES.map((st) => `${st} ${pct(scores[st])}`).join(', ')}`}>
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r} points={pts.map((p) => `${c + Math.cos(p.a) * R * r},${c + Math.sin(p.a) * R * r}`).join(' ')} className={s.ring} />
      ))}
      {pts.map((p) => (
        <line key={p.st} x1={c} y1={c} x2={c + Math.cos(p.a) * R} y2={c + Math.sin(p.a) * R} className={s.ring} />
      ))}
      <polygon points={pts.map((p) => `${p.x},${p.y}`).join(' ')} className={s.shape} />
      {pts.map((p) => (
        <circle key={p.st} cx={p.x} cy={p.y} r={4} className={s.dot} />
      ))}
      {pts.map((p) => (
        <text key={p.st} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" className={s.axis}>
          {p.st} {pct(scores[p.st])}
        </text>
      ))}
    </svg>
  );
}

/** Win rate by weekday and hour in the viewer's time zone; colour = win rate, strength = games. */
function Heatmap({ times }: { times: Insights['times'] }) {
  const client = useClient();
  const cells = useMemo(
    () =>
      client
        ? heatmap(
            times.map(([time, result]) => ({ time, result })),
            (iso) => {
              const d = new Date(iso);
              return { day: (d.getDay() + 6) % 7, hour: d.getHours() };
            },
          )
        : null,
    [client, times],
  );
  if (!cells) return <div className={`skeleton ${s.heatWait}`} />;
  const max = Math.max(1, ...cells.flat().map((x) => x.w + x.l));
  // Best and worst hours of the day, with at least five games behind them.
  const byHour = Array.from({ length: 24 }, (_, h) => cells.reduce((a, row) => ({ w: a.w + row[h].w, l: a.l + row[h].l }), { w: 0, l: 0 }));
  const ranked = byHour.map((x, h) => ({ h, ...x, n: x.w + x.l, r: x.w / Math.max(1, x.w + x.l) })).filter((x) => x.n >= 5);
  const best = [...ranked].sort((a, b) => b.r - a.r)[0];
  const worst = [...ranked].sort((a, b) => a.r - b.r)[0];
  const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
  return (
    <div className={s.heat}>
      <div className={s.heatGrid} role="img" aria-label="Win rate by weekday and hour">
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className={s.heatHour}>
            {h % 3 === 0 ? h : ''}
          </span>
        ))}
        {cells.map((row, d) => (
          <div key={d} style={{ display: 'contents' }}>
            <span className={s.heatDay}>{DAYS[d]}</span>
            {row.map((x, h) => {
              const n = x.w + x.l;
              const r = n ? x.w / n : 0.5;
              return (
                <span
                  key={h}
                  className={s.cell}
                  data-r={!n ? 'none' : r > 0.5 ? 'win' : r < 0.5 ? 'loss' : 'even'}
                  style={{ ['--a' as string]: n ? 0.25 + 0.75 * Math.min(1, n / max) * Math.abs(r - 0.5) * 2 : 0 }}
                  title={n ? `${DAYS[d]} ${hh(h)} · ${x.w}–${x.l} (${pct(r)})` : `${DAYS[d]} ${hh(h)} · no games`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className={s.heatKey}>
        <span>
          <i data-r="loss" /> more losses
        </span>
        <span>
          <i data-r="even" /> even
        </span>
        <span>
          <i data-r="win" /> more wins
        </span>
        <span>Stronger colour = more games and a clearer lean. Your local time.</span>
      </div>
      {best && worst && best.h !== worst.h && (
        <p className={s.heatNote}>
          Best hour: <b>{hh(best.h)}</b> ({best.w}–{best.l}, {pct(best.r)}). Worst: <b>{hh(worst.h)}</b> ({worst.w}–{worst.l}, {pct(worst.r)}).
        </p>
      )}
    </div>
  );
}

export function InsightsTab({ x }: { x: Insights }) {
  const e = x.elixir;
  const t = x.tilt;
  return (
    <div className={s.wrap}>
      <section className={s.block}>
        <div className={s.head}>
          <h3 className="heading">Elixir and close games</h3>
          <Basis n={x.games} since={x.since} />
        </div>
        <div className={s.tiles}>
          <div className={s.tile}>
            <span className={s.k}>Average elixir leaked</span>
            <b>{e.leak == null ? '—' : e.leak.toFixed(2)}</b>
            <small>{e.leakGames ? `over ${fmt(e.leakGames)} games` : 'no games with elixir data yet'}</small>
          </div>
          <div className={s.tile}>
            <span className={s.k}>Leaked in wins / losses</span>
            <b>
              {e.leakWins == null ? '—' : e.leakWins.toFixed(2)} / {e.leakLosses == null ? '—' : e.leakLosses.toFixed(2)}
            </b>
            <small>elixir wasted at full bar</small>
          </div>
          <div className={s.tile} data-good={(e.close.rate ?? 0) >= 0.5}>
            <span className={s.k}>Clutch: close games</span>
            <b>{e.close.games ? rec(e.close) : '—'}</b>
            <small>{e.close.games ? `${pct(e.close.rate)} won · ${fmt(e.close.games)} games` : 'none yet'}</small>
          </div>
          <div className={s.tile}>
            <span className={s.k}>Blowouts</span>
            <b>{e.blowout.games ? rec(e.blowout) : '—'}</b>
            <small>{e.blowout.games ? `${pct(e.blowout.rate)} won · ${fmt(e.blowout.games)} games` : 'none yet'}</small>
          </div>
        </div>
        <span className={s.basis}>
          Close: decided by one crown, or the winner kept a tower on {CLOSE_HP} hit points or fewer. Draws count as close. Blowout: two or more crowns apart. Elixir leaked is the API&apos;s
          own count.
        </span>
      </section>

      <section className={s.block}>
        <div className={s.head}>
          <h3 className="heading">Playstyle</h3>
          <Basis n={x.playstyle.games} since={x.since} what={`games with ${x.playstyle.decks} different deck${x.playstyle.decks === 1 ? '' : 's'}`} />
        </div>
        {x.playstyle.games ? (
          <div className={s.style}>
            <Radar scores={x.playstyle.scores} />
            <p className={s.styleText}>
              Mostly <b>{x.playstyle.main}</b>. Each deck is scored on how it&apos;s built: <b>beatdown</b> has a heavy tank and a high average cost, <b>cycle</b> a quick win condition and
              cheap cards, <b>bait</b> several cheap swarms the opponent must spend spells on, <b>control</b> siege, Graveyard or P.E.K.K.A with buildings and big spells. The chart is the
              average over every game.
            </p>
          </div>
        ) : (
          <p className={s.muted}>No decks stored yet. They&apos;re kept from the first time this profile is opened.</p>
        )}
      </section>

      <section className={s.block}>
        <div className={s.head}>
          <h3 className="heading">Best time to play</h3>
          <Basis n={x.times.length} since={x.times.at(-1)?.[0] ?? null} what="competitive games" />
        </div>
        <Heatmap times={x.times} />
        <p className={s.heatNote}>
          After {t.after} straight losses: <b>{t.next.games ? `${rec(t.next)} (${pct(t.next.rate)})` : 'no losing runs yet'}</b> in the next game.
          {t.current >= t.after ? ` On a ${t.current}-game losing run right now.` : ''} Friendlies and war training don&apos;t count.
        </p>
      </section>

      <section className={s.block}>
        <div className={s.head}>
          <h3 className="heading">Achievements</h3>
          <span className={s.basis}>
            {x.achievements.filter((a) => a.earned).length} of {x.achievements.length} earned · site badges, not in the game
          </span>
        </div>
        <div className={s.achGrid}>
          {x.achievements.map((a) => (
            <div key={a.id} className={s.ach} data-earned={a.earned}>
              <span className={s.achMark} aria-hidden>
                {a.earned ? '★' : '☆'}
              </span>
              <b>{a.name}</b>
              <span className={s.achRule}>{a.rule}</span>
              <span className={s.achBar}>
                <span style={{ width: `${(a.progress / a.goal) * 100}%` }} />
              </span>
              <small>{a.detail}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

'use client';

import { useMemo, useRef } from 'react';
import { useLazyScene } from '@/components/fx/lazy';
import type { Contender, ShowdownStat } from '@/components/fx/gl/showdown';
import { badgeSrc } from '@/components/ui/ClanBadge';
import { ClanFrame } from '@/components/ui/ClanFrame';
import { clanLeague } from '@/lib/clanLeague';
import { CrownIcon } from '@/components/ui/icons';
import type { Comparison, CompareRow } from '@/lib/compare';
import s from './compare.module.css';

/** The stats the showdown can draw: rows with a better direction and at least two numbers. */
function statRows(data: Comparison): CompareRow[] {
  return data.sections
    .flatMap((sec) => sec.rows)
    .filter((r) => r.better && r.values.filter((v) => typeof v === 'number').length >= 2);
}

/** A cell as the table and the showdown print it. */
export function show(v: number | string | null, r: CompareRow) {
  if (v == null) return '—';
  if (typeof v === 'string') return v;
  return `${v.toLocaleString('en-US', { maximumFractionDigits: r.digits ?? 0, minimumFractionDigits: r.digits ?? 0 })}${r.unit ?? ''}`;
}

/**
 * Each value as a share of the best in its row, so heights are honest. Lower-is-better rows are
 * inverted, counting from zero: 0 inactive members is the best possible and gets a full bar.
 */
function scale(r: CompareRow): (number | null)[] {
  const nums = r.values.map((v) => (typeof v === 'number' ? Math.max(0, v) : null));
  const ok = nums.filter((v): v is number => v != null);
  if (r.better === 'low') {
    const best = Math.min(...ok);
    return nums.map((v) => (v == null ? null : (best + 1) / (v + 1)));
  }
  const best = Math.max(...ok);
  return nums.map((v) => (v == null ? null : best > 0 ? v / best : 0));
}

/** Who leads a row: the highest value, or the lowest where less is better (ties: nobody). */
export function leaderOf(r: CompareRow): number | null {
  if (!r.better) return null;
  const nums = r.values.map((v) => (typeof v === 'number' ? v : null));
  const ok = nums.filter((v): v is number => v != null);
  if (ok.length < 2) return null;
  const best = r.better === 'high' ? Math.max(...ok) : Math.min(...ok);
  const idx = nums.flatMap((v, i) => (v === best ? [i] : []));
  return idx.length === 1 ? idx[0] : null;
}

/**
 * The top of the compare page: a 3D showdown of everyone being compared (gl/showdown), then a
 * scoreboard of how many stats each one leads. The full table below keeps every number.
 */
export function CompareArena({ data, colors }: { data: Comparison; colors: string[] }) {
  const host = useRef<HTMLDivElement>(null);
  // The stage has room for 12 stats; the scoreboard counts every stat in the table.
  const all = useMemo(() => statRows(data), [data]);
  const rows = useMemo(() => all.slice(0, 12), [all]);
  const leads = useMemo(() => rows.map(leaderOf), [rows]);
  const tally = data.entities.map((_, i) => all.filter((r) => leaderOf(r) === i).length);
  const top = Math.max(...tally);
  const champ = tally.filter((t) => t === top).length === 1 && top > 0 ? tally.indexOf(top) : null;

  const contenders: Contender[] = useMemo(() => {
    const scaled = rows.map(scale);
    return data.entities.map((e, i) => ({
      color: colors[i],
      badge: badgeSrc(e.badgeId),
      values: scaled.map((r) => r[i]),
      leads: leads.map((l) => l === i),
      champion: champ === i,
      frame: clanLeague(e.warTrophies)?.colors ?? null,
      tier: clanLeague(e.warTrophies)?.tier ?? 0,
    }));
  }, [data, rows, leads, champ, colors]);
  const stats: ShowdownStat[] = useMemo(() => rows.map((r) => ({ title: r.label, values: r.values.map((v, i) => r.labels?.[i] ?? show(v, r)) })), [rows]);

  const key = JSON.stringify([contenders, stats]);
  useLazyScene(host, () => import('@/components/fx/gl/showdown'), (m, el) => m.mountShowdown(el, { contenders, stats, names: data.entities.map((e) => e.name) }), [key]);

  if (data.entities.length < 2 || !rows.length) return null;
  const label = data.entities.map((e, i) => `${e.name} leads ${tally[i]} of ${all.length} stats`).join('; ');

  return (
    <section className={s.arena} aria-label="Showdown">
      <div className={s.stage}>
        <div ref={host} className={s.canvas} role="img" aria-label={`3D showdown. ${label}.`} />
      </div>
      {/* The same numbers as the plates on the stage, for screen readers. */}
      <ul className="sr-only">
        {stats.map((st) => (
          <li key={st.title}>
            {st.title}: {st.values.map((v, i) => `${data.entities[i].name} ${v}`).join(', ')}
          </li>
        ))}
      </ul>

      <div className={s.board}>
        {data.entities.map((e, i) => (
          <div key={e.tag} className={s.seat} data-champ={champ === i} style={{ ['--c' as string]: colors[i] }}>
            <ClanFrame badgeId={e.badgeId} warTrophies={e.warTrophies} size={30} name={e.name} />
            <span className={s.seatWho}>
              {champ === i && (
                <span className={s.champTag}>
                  <CrownIcon size={11} /> Leader
                </span>
              )}
              <span className={s.seatName}>{e.name}</span>
              <span className={s.seatSub}>{e.sub}</span>
            </span>
            <span className={s.seatScore}>
              <b>{tally[i]}</b>
              <small>of {all.length} led</small>
            </span>
            <span className={s.seatBar}>
              <span style={{ width: `${all.length ? (tally[i] / all.length) * 100 : 0}%` }} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

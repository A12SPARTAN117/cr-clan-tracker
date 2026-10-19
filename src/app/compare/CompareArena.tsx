'use client';

import { useMemo, useRef } from 'react';
import { useLazyScene } from '@/components/fx/lazy';
import type { Contender } from '@/components/fx/gl/showdown';
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

/** Each value scaled 0–1 against the best in its row (lower-is-better rows inverted). */
function scale(r: CompareRow): (number | null)[] {
  const nums = r.values.map((v) => (typeof v === 'number' ? Math.max(0, v) : null));
  const ok = nums.filter((v): v is number => v != null);
  if (r.better === 'low') {
    const best = Math.min(...ok.filter((v) => v > 0));
    return nums.map((v) => (v == null || v <= 0 ? null : best / v));
  }
  const best = Math.max(...ok);
  return nums.map((v) => (v == null ? null : best > 0 ? v / best : 0));
}

function leaderOf(r: CompareRow): number | null {
  const nums = r.values.map((v) => (typeof v === 'number' ? v : null));
  const ok = nums.filter((v): v is number => v != null);
  if (ok.length < 2) return null;
  const best = r.better === 'high' ? Math.max(...ok) : Math.min(...ok.filter((v) => r.better !== 'low' || v > 0));
  const idx = nums.flatMap((v, i) => (v === best ? [i] : []));
  return idx.length === 1 ? idx[0] : null;
}

/**
 * The top of the compare page: a 3D showdown of everyone being compared (gl/showdown), then a
 * scoreboard of how many stats each one leads. The full table below keeps every number.
 */
export function CompareArena({ data, colors }: { data: Comparison; colors: string[] }) {
  const host = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => statRows(data).slice(0, 12), [data]);
  const leads = useMemo(() => rows.map(leaderOf), [rows]);
  const tally = data.entities.map((_, i) => leads.filter((l) => l === i).length);
  const top = Math.max(...tally);
  const champ = tally.filter((t) => t === top).length === 1 && top > 0 ? tally.indexOf(top) : null;

  const contenders: Contender[] = useMemo(() => {
    const scaled = rows.map(scale);
    return data.entities.map((e, i) => ({
      color: colors[i],
      art: e.art ?? (e.badgeId != null && badgeSrc(e.badgeId) ? { src: badgeSrc(e.badgeId)!, kind: 'badge' as const } : null),
      values: scaled.map((r) => r[i]),
      leads: leads.map((l) => l === i),
      champion: champ === i,
      frame: e.badgeId != null ? (clanLeague(e.warTrophies)?.colors ?? null) : null,
      tier: clanLeague(e.warTrophies)?.tier ?? 0,
    }));
  }, [data, rows, leads, champ, colors]);

  const key = JSON.stringify(contenders) + rows.map((r) => r.label).join();
  useLazyScene(host, () => import('@/components/fx/gl/showdown'), (m, el) => m.mountShowdown(el, { contenders, titles: rows.map((r) => r.label), names: data.entities.map((e) => e.name) }), [key]);

  if (data.entities.length < 2 || !rows.length) return null;
  const label = data.entities.map((e, i) => `${e.name} leads ${tally[i]} of ${rows.length} stats`).join('; ');

  return (
    <section className={s.arena} aria-label="Showdown">
      <div className={s.stage}>
        <div ref={host} className={s.canvas} role="img" aria-label={`3D showdown. ${label}.`} />
      </div>
      <p className={s.legend}>
        <span className="label-sm">Columns, front to back</span>
        {rows.map((r, j) => (
          <span key={r.label}>
            <b>{j + 1}</b> {r.label}
          </span>
        ))}
      </p>

      <div className={s.board}>
        {data.entities.map((e, i) => (
          <div key={e.tag} className={s.seat} data-champ={champ === i} style={{ ['--c' as string]: colors[i] }}>
            {champ === i && (
              <span className={s.champTag}>
                <CrownIcon size={14} /> Leader
              </span>
            )}
            {e.badgeId != null && <ClanFrame badgeId={e.badgeId} warTrophies={e.warTrophies} size={30} name={e.name} label />}
            <span className={s.seatName}>{e.name}</span>
            <span className={s.seatSub}>{e.sub}</span>
            <span className={s.seatScore}>
              <b>{tally[i]}</b>
              <small>/ {rows.length} stats led</small>
            </span>
            <span className={s.seatBar}>
              <span style={{ width: `${rows.length ? (tally[i] / rows.length) * 100 : 0}%` }} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

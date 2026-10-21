'use client';

import { useState } from 'react';
import s from './LineChart.module.css';

/**
 * One point: its x label (a day or a race), its value (null = a gap) and an optional tooltip line.
 * `t` (ms) places points in time; without it on every point they sit evenly spaced.
 */
export type LinePoint = { x: string; v: number | null; tip?: string; t?: number };

/**
 * A small single-series line chart: the series as a solid line, an optional dashed target and an
 * optional dotted projection from the last point. Hover or tap anywhere for a crosshair and the
 * nearest point's value. Gaps (null values) break the line.
 */
export function LineChart({
  points,
  target,
  targetLabel = 'Goal',
  projection,
  format = (v) => v.toLocaleString('en-US'),
  label,
  height = 120,
  color = 'var(--blue)',
}: {
  points: LinePoint[];
  target?: number | null;
  targetLabel?: string;
  /** Where the current pace leads (drawn dotted from the last point). */
  projection?: LinePoint | null;
  format?: (v: number) => string;
  /** What the chart shows, for screen readers. */
  label: string;
  height?: number;
  color?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const all = projection ? [...points, projection] : points;
  const n = all.length;
  const vals = all.flatMap((p) => (p.v == null ? [] : [p.v]));
  if (!vals.length) return null;
  const lo0 = Math.min(...vals, target ?? Infinity);
  const hi0 = Math.max(...vals, target ?? -Infinity);
  const pad = (hi0 - lo0) * 0.12 || Math.max(1, Math.abs(hi0) * 0.05);
  const lo = lo0 - pad;
  const hi = hi0 + pad;
  // Percent coordinates, so labels and dots can sit in HTML over the SVG without stretching.
  const timed = n > 1 && all.every((p) => p.t != null) && all[n - 1].t! > all[0].t!;
  const X = (i: number) => (n === 1 ? 50 : timed ? ((all[i].t! - all[0].t!) / (all[n - 1].t! - all[0].t!)) * 100 : (i / (n - 1)) * 100);
  const Y = (v: number) => 100 - ((v - lo) / (hi - lo)) * 100;

  // The series as runs between gaps.
  const runs: string[] = [];
  let cur: string[] = [];
  points.forEach((p, i) => {
    if (p.v == null) {
      if (cur.length) runs.push(cur.join(' '));
      cur = [];
    } else cur.push(`${X(i).toFixed(2)},${Y(p.v).toFixed(2)}`);
  });
  if (cur.length) runs.push(cur.join(' '));
  const lastIdx = points.findLastIndex((p) => p.v != null);
  const last = lastIdx >= 0 ? points[lastIdx] : null;
  const proj = projection && last && projection.v != null ? `${X(lastIdx)},${Y(last.v!)} ${X(n - 1)},${Y(projection.v)}` : null;

  const h = hover != null ? all[hover] : null;
  const pick = (clientX: number, el: Element) => {
    const r = el.getBoundingClientRect();
    const at = ((clientX - r.left) / r.width) * 100;
    // The point nearest the pointer along x.
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(X(i) - at) < Math.abs(X(best) - at)) best = i;
    setHover(best);
  };

  return (
    <div className={s.wrap}>
      <div
        className={s.plot}
        style={{ height }}
        role="img"
        aria-label={label}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={s.svg} aria-hidden>
          {[0, 50, 100].map((y) => (
            <line key={y} x1="0" x2="100" y1={y} y2={y} className={s.grid} vectorEffect="non-scaling-stroke" />
          ))}
          {target != null && <line x1="0" x2="100" y1={Y(target)} y2={Y(target)} className={s.target} vectorEffect="non-scaling-stroke" />}
          {proj && <polyline points={proj} className={s.proj} style={{ stroke: color }} vectorEffect="non-scaling-stroke" />}
          {runs.map((r, i) => (
            <polyline key={i} points={r} className={s.line} style={{ stroke: color }} vectorEffect="non-scaling-stroke" />
          ))}
          {hover != null && <line x1={X(hover)} x2={X(hover)} y1="0" y2="100" className={s.cross} vectorEffect="non-scaling-stroke" />}
        </svg>
        {target != null && (
          <span className={s.targetTag} style={{ top: `${Y(target)}%` }}>
            {targetLabel} {format(target)}
          </span>
        )}
        {/* The latest value, labelled; the hovered point gets a dot of its own. */}
        {last && hover == null && <span className={s.dot} style={{ left: `${X(lastIdx)}%`, top: `${Y(last.v!)}%`, background: color }} />}
        {h && h.v != null && <span className={s.dot} data-hover style={{ left: `${X(hover!)}%`, top: `${Y(h.v)}%`, background: color }} />}
        {h && (
          <span className={s.tip} style={{ left: `${X(hover!)}%` }} data-side={X(hover!) > 60 ? 'left' : 'right'}>
            <b>{h.v == null ? '—' : format(h.v)}</b>
            <span>
              {h.x}
              {hover === n - 1 && projection ? ' · at this pace' : ''}
            </span>
            {h.tip && <span>{h.tip}</span>}
          </span>
        )}
      </div>
      <div className={s.axis}>
        <span>{all[0].x}</span>
        <span>{all[n - 1].x}</span>
      </div>
    </div>
  );
}

import type { CSSProperties, ReactNode } from 'react';
import { agoShort } from '@/lib/format';
import { Decode } from '../fx/Reveal';

/* ---------- roles ---------- */
export type ApiRole = 'leader' | 'coLeader' | 'elder' | 'member';
export const ROLE_LABEL: Record<ApiRole, string> = { leader: 'Leader', coLeader: 'Co-Leader', elder: 'Elder', member: 'Member' };
export const ROLE_ORDER: ApiRole[] = ['leader', 'coLeader', 'elder', 'member'];

export function RoleIcon({ role }: { role: ApiRole }) {
  if (role === 'leader')
    return (
      <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden>
        <polyline points="1,9 1,3 4,6 6,1 8,6 11,3 11,9 1,9" fill="none" stroke="var(--gold)" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    );
  if (role === 'coLeader')
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <polyline points="2,5 5,2 8,5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <polyline points="2,9 5,6 8,9" fill="none" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  if (role === 'elder')
    return (
      <svg width="10" height="11" viewBox="0 0 10 11" aria-hidden>
        <path d="M5 1 L9 2.5 V5.5 C9 7.8 7.2 9 5 10 C2.8 9 1 7.8 1 5.5 V2.5 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  return (
    <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden>
      <circle cx="3" cy="3" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function RoleChip({ role }: { role: ApiRole }) {
  const sty: CSSProperties =
    role === 'leader'
      ? { borderColor: 'rgba(230,179,74,.6)', color: 'var(--gold)' }
      : role === 'coLeader'
        ? { borderColor: 'var(--frame)', color: 'var(--text-1)' }
        : role === 'elder'
          ? { borderColor: 'var(--hair)', color: 'var(--text-1)' }
          : { borderColor: 'var(--hair)', color: 'var(--text-2)' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 22,
        padding: '0 8px',
        border: '1px solid',
        borderRadius: 4,
        font: '500 9px/1 var(--mono)',
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...sty,
      }}
    >
      <RoleIcon role={role} />
      {ROLE_LABEL[role]}
    </span>
  );
}

/* ---------- last seen ---------- */
export type Activity = 'active' | 'risk' | 'inactive';
export const activityOf = (hours: number): Activity => (hours < 24 ? 'active' : hours < 72 ? 'risk' : 'inactive');
export const ACTIVITY_LABEL: Record<Activity, string> = { active: 'ACTIVE', risk: 'AT RISK', inactive: 'INACTIVE' };

export function ActivityDot({ hours }: { hours: number }) {
  const a = activityOf(hours);
  const c = a === 'active' ? 'var(--blue)' : a === 'risk' ? 'var(--text-2)' : 'var(--ember)';
  return (
    <span
      aria-hidden
      style={{
        flex: 'none',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: a === 'active' ? c : 'transparent',
        border: `1.5px solid ${c}`,
        boxShadow: a === 'active' ? '0 0 6px rgba(58,160,255,.8)' : 'none',
      }}
    />
  );
}

/** Filled blue dot + ACTIVE (<24h), hollow grey + AT RISK (1–3d), hollow ember + INACTIVE (>3d). */
export function LastSeen({ hours, label = true, size = 12 }: { hours: number; label?: boolean; size?: number }) {
  const a = activityOf(hours);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        font: `500 ${size}px/1 var(--mono)`,
        whiteSpace: 'nowrap',
        color: a === 'active' ? 'var(--text-1)' : a === 'risk' ? 'var(--text-2)' : 'var(--ember)',
      }}
    >
      <ActivityDot hours={hours} />
      {agoShort(hours)}
      {label && <span style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--text-3)' }}>{ACTIVITY_LABEL[a]}</span>}
    </span>
  );
}

/* ---------- asset score gauge ---------- */
export function ScoreGauge({ score, size = 32, big = false, label }: { score: number; size?: number; big?: boolean; label?: ReactNode }) {
  const op = (0.35 + (score / 100) * 0.65).toFixed(2);
  if (big) {
    return (
      <div style={{ position: 'relative', flex: 'none', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 120 120" style={{ filter: `drop-shadow(0 0 ${Math.round(score / 8)}px rgba(58,160,255,.7))` }} aria-hidden>
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--hair)" strokeWidth="2" />
          <circle cx="60" cy="60" r="44" fill="none" stroke="var(--hair)" strokeWidth="1" />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="var(--blue-hi)"
            strokeOpacity={op}
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${score} 100`}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Decode style={{ font: '800 36px/1 var(--mono)', letterSpacing: '-.04em' }}>{score}</Decode>
          <span style={{ font: '500 8px/1 var(--mono)', letterSpacing: '.16em', color: 'var(--text-3)' }}>{label ?? 'ASSET SCORE'}</span>
        </div>
      </div>
    );
  }
  return (
    <span style={{ position: 'relative', flex: 'none', width: size, height: size }} aria-label={`Asset score ${score}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        style={{ filter: score >= 70 ? `drop-shadow(0 0 ${Math.round(score / 20)}px rgba(58,160,255,.8))` : 'none' }}
        aria-hidden
      >
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--hair)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="var(--blue)"
          strokeOpacity={op}
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${score} 100`}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `700 ${size >= 40 ? 11 : 10}px/1 var(--mono)` }}>
        {score}
      </span>
    </span>
  );
}

/* ---------- war heatmap cell ---------- */
export type HeatValue = number | null | 'pending';

export function heatStyle(n: HeatValue): { style: CSSProperties; text: string; title: string } {
  if (n === 'pending') return { style: { background: 'transparent', border: '1px dashed var(--hair)', color: 'var(--text-3)' }, text: '·', title: 'Not played yet' };
  if (n == null)
    return {
      style: { background: 'repeating-linear-gradient(135deg,var(--well) 0 3px,transparent 3px 6px)', border: '1px solid var(--hair)', color: 'transparent' },
      text: '',
      title: 'Not in clan',
    };
  const a = [0, 0.22, 0.42, 0.66, 1][Math.max(0, Math.min(4, n))];
  return {
    style: {
      background: n ? `rgba(58,160,255,${a})` : 'var(--well)',
      boxShadow: n >= 4 ? '0 0 10px rgba(58,160,255,.6),inset 0 0 0 1px rgba(140,203,255,.7)' : n ? 'none' : 'inset 0 1px 2px rgba(0,0,0,.6)',
      border: n ? 0 : '1px solid var(--hair)',
      color: n >= 3 ? '#07080A' : n ? 'var(--text-1)' : 'var(--text-3)',
    },
    text: String(n),
    title: `${n} deck${n === 1 ? '' : 's'}`,
  };
}

/** One war day: recessed "0", blue at rising alpha for 1–4, dashed when pending, hatched when not in clan. */
export function HeatCell({ value, width = 40, height = 26, fontSize = 11, showText = true }: { value: HeatValue; width?: number | string; height?: number; fontSize?: number; showText?: boolean }) {
  const h = heatStyle(value);
  return (
    <span
      title={h.title}
      style={{
        width,
        height,
        borderRadius: height < 16 ? 2 : 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: `600 ${fontSize}px/1 var(--mono)`,
        flex: 'none',
        ...h.style,
      }}
    >
      {showText ? h.text : null}
    </span>
  );
}

/* ---------- sparkline ---------- */
export function Sparkline({ values, width = 64, height = 20 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden />;
  const mx = Math.max(...values);
  const mn = Math.min(...values);
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * width).toFixed(1)},${(height - 2 - ((v - mn) / (mx - mn || 1)) * (height - 4)).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ flex: 'none', overflow: 'visible' }} aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--text-2)" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- stat tile ---------- */
export type Tone = 'up' | 'down' | 'muted' | 'neutral';
const TONE: Record<Tone, string> = { up: 'var(--blue)', down: 'var(--ember)', muted: 'var(--text-3)', neutral: 'var(--text-2)' };

export function StatTile({
  label,
  value,
  unit,
  delta,
  tone = 'neutral',
  spark,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  tone?: Tone;
  spark?: number[];
  className?: string;
}) {
  return (
    <div
      data-spot=""
      className={`spot ${className ?? ''}`}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, minHeight: 132, padding: '16px 18px' }}
    >
      <div style={{ font: '500 10px/1.3 var(--mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
        <Decode style={{ font: '800 clamp(34px,3.2vw,46px)/1 var(--mono)', letterSpacing: '-.05em' }}>{value}</Decode>
        {unit && <span style={{ font: '500 13px/1 var(--mono)', color: 'var(--text-3)' }}>{unit}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ font: '500 10px/1.3 var(--mono)', letterSpacing: '.08em', textTransform: 'uppercase', color: TONE[tone] }}>{delta}</span>
        {spark && <Sparkline values={spark} />}
      </div>
    </div>
  );
}

/* ---------- league + badges ---------- */
/** Path of Legends league marker. Numbered circle until league art that matches the live API is supplied. */
export function LeagueIcon({ league, size = 22 }: { league: number | null | undefined; size?: number }) {
  return (
    <span
      title={league ? `Path of Legends league ${league}` : 'No Path of Legends league'}
      style={{
        flex: 'none',
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1px solid var(--frame)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: `700 ${Math.round(size * 0.4)}px/1 var(--mono)`,
        color: 'var(--text-1)',
        background: 'var(--obsidian)',
      }}
    >
      {league ?? '—'}
    </span>
  );
}

export function SectionLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span className="label" style={style}>
      {children}
    </span>
  );
}

export function DataSince({ children }: { children: ReactNode }) {
  return <div className="data-since">{children}</div>;
}

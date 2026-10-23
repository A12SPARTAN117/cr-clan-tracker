import type { CSSProperties, ReactNode } from 'react';
import { agoShort } from '@/lib/format';
import { Decode } from '../fx/Reveal';
import { MedalIcon } from './icons';
import st from './primitives.module.css';

/* ---------- roles ---------- */
import type { ApiRole } from '@/lib/cr/types';
export type { ApiRole };
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
  return (
    <span className={st.chip} data-role={role}>
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
  return <span aria-hidden className={st.dot} data-a={activityOf(hours)} />;
}

/** Filled blue dot + ACTIVE (<24h), hollow grey + AT RISK (1–3d), hollow ember + INACTIVE (>3d). */
export function LastSeen({ hours, label = true, size = 12 }: { hours: number; label?: boolean; size?: number }) {
  const a = activityOf(hours);
  return (
    <span className={st.seen} data-a={a} style={size !== 12 ? { fontSize: size } : undefined}>
      <ActivityDot hours={hours} />
      {agoShort(hours)}
      {label && <span className={st.seenLabel}>{ACTIVITY_LABEL[a]}</span>}
    </span>
  );
}

/* ---------- asset score gauge ---------- */
export function ScoreGauge({ score, size = 32, big = false, label }: { score: number; size?: number; big?: boolean; label?: ReactNode }) {
  const op = (0.35 + (score / 100) * 0.65).toFixed(2);
  if (big) {
    return (
      <div style={{ position: 'relative', flex: 'none', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 120 120" style={{ filter: `drop-shadow(0 0 ${Math.round(score / 8)}px rgba(var(--glow-rgb), .7))` }} aria-hidden>
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
        style={{ filter: score >= 70 ? `drop-shadow(0 0 ${Math.round(score / 20)}px rgba(var(--glow-rgb), .8))` : 'none' }}
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
      <span className={st.gaugeNum} data-big={size >= 40 || undefined}>
        {score}
      </span>
    </span>
  );
}

/* ---------- war heatmap cell ---------- */
export type HeatValue = number | null | 'pending' | 'untracked';

export function heatStyle(n: HeatValue): { style: CSSProperties; text: string; title: string } {
  if (n === 'pending') return { style: { background: 'transparent', border: '1px dashed var(--hair)', color: 'var(--text-3)' }, text: '·', title: 'Not played yet' };
  if (n === 'untracked') return { style: { background: 'transparent', border: '1px dashed var(--hair)', color: 'var(--text-3)' }, text: '–', title: 'No daily snapshot for this day' };
  if (n == null)
    return {
      style: { background: 'repeating-linear-gradient(135deg,var(--well) 0 3px,transparent 3px 6px)', border: '1px solid var(--hair)', color: 'transparent' },
      text: '',
      title: 'Not in clan',
    };
  const a = [0, 0.22, 0.42, 0.66, 1][Math.max(0, Math.min(4, n))];
  return {
    style: {
      background: n ? `rgba(var(--glow-rgb), ${a})` : 'var(--well)',
      boxShadow: n >= 4 ? '0 0 10px rgba(var(--glow-rgb), .6),inset 0 0 0 1px rgba(var(--glow-hi-rgb), .7)' : n ? 'none' : 'inset 0 1px 2px rgba(var(--shade-rgb), .6)',
      border: n ? 0 : '1px solid var(--hair)',
      color: n >= 3 ? 'var(--void)' : n ? 'var(--text-1)' : 'var(--text-3)',
    },
    text: String(n),
    title: `${n} deck${n === 1 ? '' : 's'}`,
  };
}

/** One war day: recessed "0", blue at rising alpha for 1–4, dashed when pending, hatched when not in clan. */
export function HeatCell({ value, width = 40, height = 26, fontSize = 11, showText = true }: { value: HeatValue; width?: number | string; height?: number; fontSize?: number; showText?: boolean }) {
  const h = heatStyle(value);
  const v = value == null ? 'none' : typeof value === 'number' ? String(Math.max(0, Math.min(4, value))) : value;
  return (
    <span title={h.title} className={st.heat} data-v={v} data-small={height < 16 ? '' : undefined} style={{ width, height, fontSize: fontSize === 11 ? undefined : fontSize }}>
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

/**
 * Font size that fits `chars` monospace characters into the nearest inline-size container
 * (≈0.6em per character), capped at `max`. Big numbers shrink instead of being clipped.
 */
export const fitSize = (chars: number, max: number, min = 14) => `clamp(${min}px, calc(100cqi / ${(Math.max(3, chars) * 0.62).toFixed(2)}), ${max}px)`;

/** A big stat value that shrinks to fit its box. Optional icon in front, unit behind. */
export function FitValue({ value, unit, icon, max = 40, min = 14, decode = true, style }: { value: string; unit?: string; icon?: ReactNode; max?: number; min?: number; decode?: boolean; style?: CSSProperties }) {
  // Icon ≈ 1.2 characters, unit text is ~40% the size of the value.
  const chars = value.length + (icon ? 1.4 : 0) + (unit ? unit.length * 0.4 + 0.3 : 0);
  const fs = fitSize(chars, max, min);
  return (
    <div style={{ containerType: 'inline-size', width: '100%', minWidth: 0 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '.25em', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', font: `800 ${fs}/1 var(--mono)`, letterSpacing: '-.04em', ...style }}>
        {icon && <span className="fit-icon">{icon}</span>}
        {decode ? <Decode>{value}</Decode> : value}
        {unit && <span style={{ font: '500 .38em/1 var(--mono)', letterSpacing: 0, color: 'var(--text-3)', alignSelf: 'flex-end', paddingBottom: '.12em' }}>{unit}</span>}
      </span>
    </div>
  );
}

export function StatTile({
  label,
  value,
  unit,
  delta,
  tone = 'neutral',
  spark,
  className,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  tone?: Tone;
  spark?: number[];
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      data-spot=""
      className={`spot ${className ?? ''}`}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, minHeight: 132, padding: '16px 18px' }}
    >
      <div style={{ font: '500 10px/1.3 var(--mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</div>
      <FitValue value={value} unit={unit} icon={icon} max={46} />
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ font: '500 10px/1.3 var(--mono)', letterSpacing: '.08em', textTransform: 'uppercase', color: TONE[tone] }}>{delta}</span>
        {spark && <Sparkline values={spark} />}
      </div>
    </div>
  );
}

/* ---------- league + badges ---------- */
import { leagueName } from '@/lib/leagues';
export { leagueName, POL_LEAGUES } from '@/lib/leagues';

/** Path of Legends league badge (game art). API league n uses the classic art for league n + 3. */
export function LeagueIcon({ league, size = 22 }: { league: number | null | undefined; size?: number }) {
  // League 0 and below are the old ladder's Challenger leagues (see leagueName), so only null means none.
  if (league == null)
    return (
      <span
        title="No Path of Legends league"
        style={{ flex: 'none', width: size, height: size, borderRadius: '50%', border: '1px dashed var(--hair)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: `700 ${Math.round(size * 0.4)}px/1 var(--mono)`, color: 'var(--text-3)' }}
      >
        —
      </span>
    );
  const art = Math.min(10, Math.max(1, league + 3));
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static league art
    <img src={`/leagues/league${art}.png`} alt={leagueName(league)} title={`Path of Legends · ${leagueName(league)}`} width={size} height={size} style={{ flex: 'none', objectFit: 'contain' }} />
  );
}

/** A Path of Legends rating ("Ultimate Champion medals") with the medal icon in front. */
export function PolRating({ rating, size = 16, style }: { rating: number | null | undefined; size?: number; style?: CSSProperties }) {
  if (rating == null) return <span style={style}>—</span>;
  return (
    <span title="Ultimate Champion medals (Path of Legends rating)" className={st.rating} style={{ gap: Math.round(size * 0.4), ...style }}>
      <MedalIcon size={size} />
      {rating.toLocaleString('en-US')}
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

'use client';

import type { KeyboardEvent } from 'react';
import { CardsIcon, ClanWarIcon, ClockIcon, DonationIcon, FameIcon, MedalIcon, ReceivedIcon, SwordsIcon, TrophyIcon } from '@/components/ui/icons';
import { HeatCell, LastSeen, LeagueIcon, PolRating, RoleChip, ROLE_LABEL, ScoreGauge, ActivityDot, activityOf } from '@/components/ui/primitives';
import { FACTORS, FACTOR_INFO, weightSum, type Weights } from '@/lib/clan/score';
import { agoShort, fmt } from '@/lib/format';
import { tenureText, type Scored, type Mvp } from './shared';
import s from './dashboard.module.css';

export type SortKey =
  | 'rank' | 'name' | 'role' | 'trophies' | 'league' | 'lastSeen' | 'don' | 'recv' | 'fame' | 'decks' | 'warWin' | 'fWin' | 'score' | 'tenure' | 'trend';
export type Sort = { k: SortKey; d: 1 | -1 };

export const COLS: [SortKey, string, 'left' | 'right'][] = [
  ['rank', '#', 'left'],
  ['name', 'Member', 'left'],
  ['role', 'Role', 'left'],
  ['trophies', 'Trophies', 'right'],
  ['league', 'PoL', 'left'],
  ['lastSeen', 'Last seen', 'left'],
  ['don', 'Don.', 'right'],
  ['recv', 'Recv.', 'right'],
  ['fame', 'Fame', 'right'],
  ['decks', 'War decks', 'right'],
  ['warWin', 'War W%', 'right'],
  ['fWin', '1v1', 'right'],
  ['score', 'Asset', 'left'],
  ['tenure', 'Loyalty', 'right'],
  ['trend', 'Trend', 'right'],
];

/** Select, rank and name stay pinned on the left while the table scrolls sideways. */
const STICKY: Partial<Record<SortKey, string>> = { rank: s.stick1, name: `${s.stick2} ${s.stickEdge}` };

/** Icons shown in the column headers next to the numbers they describe. */
const COL_ICON: Partial<Record<SortKey, React.ReactNode>> = {
  trophies: <TrophyIcon size={12} />,
  league: <MedalIcon size={12} />,
  lastSeen: <ClockIcon size={12} />,
  don: <DonationIcon size={12} />,
  recv: <ReceivedIcon size={12} />,
  fame: <FameIcon size={12} />,
  decks: <CardsIcon size={12} />,
  warWin: <ClanWarIcon size={12} />,
  fWin: <SwordsIcon size={12} />,
};

/** First click sorts the most useful way: numbers high→low, names A→Z, last seen most recent first. */
export const firstDir = (k: SortKey): 1 | -1 => (k === 'name' || k === 'rank' || k === 'lastSeen' || k === 'role' ? 1 : -1);

const ROLE_IDX = { leader: 0, coLeader: 1, elder: 2, member: 3 } as const;
export const SORTERS: Record<SortKey, (m: Scored) => number | string> = {
  rank: (m) => m.rank,
  name: (m) => m.name.toLowerCase(),
  role: (m) => ROLE_IDX[m.role],
  trophies: (m) => m.trophies,
  league: (m) => (m.league ?? 0) * 10000 + (m.rating ?? 0),
  lastSeen: (m) => m.hours,
  don: (m) => m.donations,
  recv: (m) => m.received,
  fame: (m) => m.fame,
  decks: (m) => m.decks,
  warWin: (m) => m.warWin ?? -1,
  fWin: (m) => m.fWin ?? -1,
  score: (m) => m.score,
  tenure: (m) => m.tenureDays,
  trend: (m) => m.trophyTrend ?? m.rankMove,
};

export type Filters = {
  q: string;
  role: 'all' | Scored['role'];
  act: 'all' | 'active' | 'risk' | 'inactive';
  war: 'all' | 'full' | 'partial' | 'none';
  tro: number;
  isNew: boolean;
};

export function applyFilters(all: Scored[], f: Filters, sort: Sort, decksPossible: number): Scored[] {
  const q = f.q.trim().toLowerCase();
  const full = Math.max(decksPossible, 1);
  const list = all.filter(
    (m) =>
      (!q || m.name.toLowerCase().includes(q) || m.tag.toLowerCase().includes(q.replace('#', ''))) &&
      (f.role === 'all' || m.role === f.role) &&
      (f.act === 'all' || activityOf(m.hours) === f.act) &&
      (f.war === 'all' || (f.war === 'full' ? m.decks >= full : f.war === 'none' ? m.decks === 0 : m.decks > 0 && m.decks < full)) &&
      m.trophies >= f.tro &&
      (!f.isNew || m.isNew),
  );
  const g = SORTERS[sort.k];
  return list.sort((a, b) => {
    const x = g(a);
    const y = g(b);
    return (x < y ? -1 : x > y ? 1 : 0) * sort.d || a.rank - b.rank;
  });
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

const TRO_STEPS = [0, 8000, 9000, 10000];

/** Trophy change over 7 days once snapshots exist; until then, clan rank movement. */
function Trend({ m }: { m: Scored }) {
  const v = m.trophyTrend ?? m.rankMove;
  return (
    <td
      className={s.right}
      style={{ padding: '10px 14px 10px 12px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', color: v > 0 ? 'var(--blue)' : v < 0 ? 'var(--ember)' : 'var(--text-3)' }}
      title={m.trophyTrend != null ? 'Trophy change over the last 7 days' : 'Clan rank change since the weekly reset'}
    >
      {v > 0 ? `▲ ${v}` : v < 0 ? `▼ ${-v}` : '— 0'}
    </td>
  );
}

/** War MVP pill: most fame in a finished river race, with how many times. */
function MvpBadge({ x }: { x?: Mvp }) {
  if (!x) return null;
  return (
    <span className={s.mvp} title={`War MVP ${x.count} time${x.count === 1 ? '' : 's'} in the last races · latest ${x.last} with ${x.fame.toLocaleString('en-US')} fame`}>
      ★ MVP{x.count > 1 ? ` ×${x.count}` : ''}
    </span>
  );
}

export function MembersTab({
  mvp,
  all,
  rows,
  filters,
  setFilters,
  sort,
  setSort,
  sel,
  setSel,
  openTag,
  onOpen,
  weights,
  decksPossible,
  onCompare,
  onExport,
  onCopyNames,
}: {
  /** War MVP awards by member tag. */
  mvp: Map<string, Mvp>;
  all: Scored[];
  rows: Scored[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  sort: Sort;
  setSort: (s: Sort) => void;
  sel: Set<string>;
  setSel: (s: Set<string>) => void;
  openTag: string | null;
  onOpen: (tag: string) => void;
  weights: Weights;
  decksPossible: number;
  onCompare: () => void;
  onExport: () => void;
  onCopyNames: () => void;
}) {
  const sw = weightSum(weights);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters({ ...filters, [k]: v });
  const toggle = <K extends 'role' | 'act' | 'war'>(k: K, v: Filters[K]) => set(k, (filters[k] === v && v !== 'all' ? 'all' : v) as Filters[K]);
  const allSel = rows.length > 0 && rows.every((r) => sel.has(r.tag));
  const toggleSel = (tag: string) => {
    const n = new Set(sel);
    if (n.has(tag)) n.delete(tag);
    else n.add(tag);
    setSel(n);
  };
  const sortBy = (k: SortKey) => setSort({ k, d: sort.k === k ? (-sort.d as 1 | -1) : firstDir(k) });
  const key = (tag: string) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(tag);
    }
  };
  const full = Math.max(decksPossible, 1);
  const decksFg = (m: Scored) => (decksPossible > 0 && m.decks === 0 ? 'var(--ember)' : m.decks >= full && decksPossible > 0 ? 'var(--blue-hi)' : 'var(--text-1)');

  const promo = [...all]
    .filter((m) => m.role === 'member' && m.hours < 72)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  const risk = [...all]
    .filter((m) => m.hours >= 72 || (decksPossible > 0 && m.decks === 0))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 4);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className={s.filters}>
        <label className={`field ${s.find}`}>
          <span className="label" style={{ letterSpacing: '.12em' }}>
            Find
          </span>
          <input value={filters.q} onChange={(e) => set('q', e.target.value)} placeholder="Name or tag" aria-label="Find member" />
        </label>
        <div className={s.group}>
          <span className="label-sm">Role</span>
          {(['all', 'leader', 'coLeader', 'elder', 'member'] as const).map((r) => (
            <Chip key={r} on={filters.role === r} onClick={() => toggle('role', r)}>
              {r === 'all' ? 'All' : r === 'coLeader' ? 'Co' : ROLE_LABEL[r]}
            </Chip>
          ))}
        </div>
        <div className={s.group}>
          <span className="label-sm">Activity</span>
          {(
            [
              ['all', 'All'],
              ['active', 'Active'],
              ['risk', 'At risk'],
              ['inactive', 'Inactive'],
            ] as const
          ).map(([v, l]) => (
            <Chip key={v} on={filters.act === v} onClick={() => toggle('act', v)}>
              {l}
            </Chip>
          ))}
        </div>
        <div className={s.group}>
          <span className="label-sm">War</span>
          {(
            [
              ['all', 'All'],
              ['full', 'All decks'],
              ['partial', 'Partial'],
              ['none', 'None'],
            ] as const
          ).map(([v, l]) => (
            <Chip key={v} on={filters.war === v} onClick={() => toggle('war', v)}>
              {l}
            </Chip>
          ))}
        </div>
        <div className={s.group}>
          <span className="label-sm">More</span>
          <Chip on={!!filters.tro} onClick={() => set('tro', TRO_STEPS[(TRO_STEPS.indexOf(filters.tro) + 1) % TRO_STEPS.length])}>
            {filters.tro ? `≥ ${fmt(filters.tro)}` : 'Trophies: any'}
          </Chip>
          <Chip on={filters.isNew} onClick={() => set('isNew', !filters.isNew)}>
            New &lt; 7d
          </Chip>
        </div>
        <span className={s.shown} aria-live="polite">
          Showing {rows.length} of {all.length}
        </span>
      </div>

      {sel.size > 0 && (
        <div className={s.bulk} role="region" aria-label="Bulk actions">
          <span style={{ font: '700 11px/1 var(--mono)', letterSpacing: '.12em', color: 'var(--blue-hi)', marginRight: 8 }}>{sel.size} SELECTED</span>
          <button type="button" className="btn btn-sm" style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)' }} onClick={onCompare}>
            Compare
          </button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={onExport}>
            Export CSV
          </button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={onCopyNames}>
            Copy names
          </button>
          <button type="button" className="btn btn-sm" style={{ marginLeft: 'auto', background: 'none', color: 'var(--text-2)', padding: '0 8px' }} onClick={() => setSel(new Set())}>
            Clear ×
          </button>
        </div>
      )}

      <div data-spot="" className={`${s.tableWrap} ${s.desktopOnly}`}>
        <table className={s.table}>
          <thead>
            <tr>
              <th className={s.stick0} style={{ padding: '0 0 0 14px', textAlign: 'left' }}>
                <input
                  type="checkbox"
                  checked={allSel}
                  onChange={() => {
                    const n = new Set(sel);
                    rows.forEach((r) => (allSel ? n.delete(r.tag) : n.add(r.tag)));
                    setSel(n);
                  }}
                  aria-label="Select all shown members"
                  style={{ accentColor: 'var(--blue)' }}
                />
              </th>
              {COLS.map(([k, label, align]) => {
                const on = sort.k === k;
                return (
                  <th key={k} className={STICKY[k]} aria-sort={on ? (sort.d < 0 ? 'descending' : 'ascending') : 'none'} style={{ textAlign: align }}>
                    <button type="button" className={s.th} data-on={on} onClick={() => sortBy(k)} style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
                      {COL_ICON[k]}
                      {label}
                      <span className={s.arrow}>{on ? (sort.d < 0 ? '▼' : '▲') : ''}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.tag} tabIndex={0} className={s.row} data-open={openTag === m.tag} onClick={() => onOpen(m.tag)} onKeyDown={key(m.tag)}>
                <td className={s.stick0} style={{ padding: '0 0 0 14px' }} onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={sel.has(m.tag)} onChange={() => toggleSel(m.tag)} aria-label={`Select ${m.name}`} style={{ accentColor: 'var(--blue)' }} />
                </td>
                <td className={`${s.faint} ${STICKY.rank}`} style={{ fontSize: 12 }}>
                  {String(m.rank).padStart(2, '0')}
                </td>
                <td className={STICKY.name} style={{ minWidth: 170 }}>
                  <div className={s.memberName}>
                    {m.name}
                    <MvpBadge x={mvp.get(m.tag)} />
                    {m.isNew && <span className={s.newChip}>NEW</span>}
                  </div>
                  <div className={s.memberTag}>#{m.tag}</div>
                </td>
                <td>
                  <RoleChip role={m.role} />
                </td>
                <td className={s.right}>{fmt(m.trophies)}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LeagueIcon league={m.league} />
                    {m.rating ? <PolRating rating={m.rating} size={14} style={{ fontSize: 12 }} /> : <span className={s.muted}>—</span>}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <LastSeen hours={m.hours} />
                </td>
                <td className={s.right}>{fmt(m.donations)}</td>
                <td className={`${s.right} ${s.muted}`}>{fmt(m.received)}</td>
                <td className={s.right}>{fmt(m.fame)}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    <span style={{ display: 'flex', gap: 2 }}>
                      {m.days.map((d, i) => (
                        <HeatCell key={i} value={d} width={9} height={14} showText={false} />
                      ))}
                    </span>
                    <span style={{ fontSize: 12, color: decksFg(m), minWidth: 38, textAlign: 'right' }}>{m.decks}/16</span>
                  </span>
                </td>
                <td className={s.right} title={m.warGames ? `Based on ${m.warGames} war battles` : 'No war battles in the battle log'}>
                  {m.warWin == null ? <span className={s.faint}>—</span> : `${m.warWin}%`}
                </td>
                <td className={s.right} style={{ whiteSpace: 'nowrap', fontSize: 12 }} title={`Clan 1v1 friendlies, based on ${m.fGames} games`}>
                  {m.fWin == null ? '—' : `${m.fWin}%`}
                  <span className={s.faint} style={{ fontSize: 10 }}>
                    {m.fGames ? ` ${m.fGames}g` : ''}
                  </span>
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ScoreGauge score={m.score} />
                    <span className={s.segs} title="War · Donations · Activity · Win rate · Loyalty">
                      {FACTORS.map((k) => (
                        <span key={k} style={{ width: `${((m.factors[k] * weights[k]) / sw).toFixed(1)}%`, background: FACTOR_INFO[k].color }} />
                      ))}
                    </span>
                  </span>
                </td>
                <td className={`${s.right} ${s.muted}`} style={{ fontSize: 12 }} title={m.tenureKnown === 'exact' ? undefined : 'At least: counted from the oldest tracked race'}>
                  {tenureText(m)}
                </td>
                <Trend m={m} />
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className={s.empty}>No members match these filters</div>}
      </div>

      <div className={s.mobileOnly}>
        <div className={`no-scrollbar ${s.sortRow}`} style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {COLS.filter(([k]) => k !== 'rank').map(([k, label]) => (
            <button key={k} type="button" className="chip" aria-pressed={sort.k === k} onClick={() => sortBy(k)} style={{ flex: 'none' }}>
              {label} {sort.k === k ? (sort.d < 0 ? '▼' : '▲') : ''}
            </button>
          ))}
        </div>
        {rows.map((m) => (
          <div key={m.tag} role="button" tabIndex={0} className={s.card} onClick={() => onOpen(m.tag)} onKeyDown={key(m.tag)}>
            <input
              type="checkbox"
              checked={sel.has(m.tag)}
              onChange={() => toggleSel(m.tag)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${m.name}`}
              style={{ accentColor: 'var(--blue)', width: 18, height: 18 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
              <span style={{ font: '600 15px/1.1 var(--sans)' }}>
                {String(m.rank).padStart(2, '0')} · {m.name}
                <MvpBadge x={mvp.get(m.tag)} />
                {m.isNew && (
                  <span className={s.newChip} style={{ marginLeft: 6 }}>
                    NEW
                  </span>
                )}
              </span>
              <span className="label-sm" style={{ letterSpacing: '.1em', fontSize: 10 }}>
                {ROLE_LABEL[m.role]} · {fmt(m.trophies)} · {tenureText(m)}
              </span>
            </div>
            <ScoreGauge score={m.score} size={40} />
            <div className={s.cardStats}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: activityOf(m.hours) === 'inactive' ? 'var(--ember)' : 'var(--text-1)' }}>
                <ActivityDot hours={m.hours} />
                {agoShort(m.hours)}
              </span>
              <span style={{ color: decksFg(m) }}>{m.decks}/16 decks</span>
              <span className={s.muted}>{fmt(m.fame)} fame</span>
            </div>
          </div>
        ))}
        {!rows.length && <div className={s.empty}>No members match these filters</div>}
      </div>

      <div className={s.recs}>
        {[
          { title: 'Promotion candidates', rule: 'Member · top score · active', items: promo, fg: 'var(--blue-hi)', why: (m: Scored) => `${m.decks}/16 decks · ${fmt(m.donations)} donated · ${tenureText(m)} in clan` },
          {
            title: 'At risk',
            rule: decksPossible > 0 ? '3+ days away or 0 war decks' : '3+ days away',
            items: risk,
            fg: 'var(--ember)',
            why: (m: Scored) => `Last seen ${agoShort(m.hours)} ago · ${m.decks} war decks`,
          },
        ].map((r) => (
          <div key={r.title} className="panel ticks" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <h3 style={{ margin: 0, font: '600 18px/1.2 var(--sans)' }}>{r.title}</h3>
              <span className="label-sm" style={{ textAlign: 'right', letterSpacing: '.12em' }}>
                {r.rule}
              </span>
            </div>
            <div>
              {r.items.length ? (
                r.items.map((m) => (
                  <button key={m.tag} type="button" className={s.recItem} onClick={() => onOpen(m.tag)}>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      <span style={{ font: '600 14px/1.1 var(--sans)' }}>{m.name}</span>
                      <span style={{ font: '500 10px/1.2 var(--mono)', letterSpacing: '.06em', color: 'var(--text-3)' }}>{r.why(m)}</span>
                    </span>
                    <span style={{ font: '500 10px/1 var(--mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)' }}>{ROLE_LABEL[m.role]}</span>
                    <span style={{ font: '700 14px/1 var(--mono)', color: r.fg }}>{m.score}</span>
                  </button>
                ))
              ) : (
                <p className="body" style={{ fontSize: 14, paddingTop: 8 }}>
                  Nobody right now.
                </p>
              )}
            </div>
            <span style={{ font: '400 12px/1.5 var(--sans)', color: 'var(--text-3)' }}>Suggestions only. The leader decides.</span>
          </div>
        ))}
      </div>
    </div>
  );
}


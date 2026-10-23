'use client';

import type { ModeKind } from '@/lib/modes';
import { ChallengeIcon, ChessIcon, ClanWarIcon, DraftIcon, EventIcon, SwordsIcon, TeamIcon } from './ui/icons';
import s from './ModeFilter.module.css';

export type ModeOption = { key: string; label: string; kind: ModeKind; count?: number };

/** The icon for a game mode: league art for the ranked modes, drawn icons for the rest. */
export function ModeIcon({ kind, size = 26 }: { kind: ModeKind; size?: number }) {
  if (kind === 'ranked' || kind === 'uc')
    // eslint-disable-next-line @next/next/no-img-element -- static league art
    return <img src={kind === 'uc' ? '/leagues/league10.webp' : '/leagues/league9.webp'} alt="" width={size} height={size} style={{ flex: 'none', objectFit: 'contain' }} />;
  const Icon = { ladder: SwordsIcon, war: ClanWarIcon, '2v2': TeamIcon, challenge: ChallengeIcon, draft: DraftIcon, chess: ChessIcon, event: EventIcon }[kind];
  return <Icon size={size} />;
}

/** Game-mode picker: a row of icon tiles (scrolls sideways on small screens). */
export function ModeFilter({ modes, value, onChange, label = 'Game mode' }: { modes: ModeOption[]; value: string; onChange: (key: string) => void; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={`no-scrollbar ${s.row}`}>
      {modes.map((m) => {
        const on = m.key === value;
        const empty = m.count === 0;
        return (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={on}
            data-mode={m.key}
            className={s.tile}
            data-on={on}
            data-empty={empty}
            onClick={() => onChange(m.key)}
            title={empty ? `${m.label}: not enough battles sampled yet` : m.label}
          >
            <ModeIcon kind={m.kind} />
            <span className={s.label}>{m.label}</span>
            {m.count != null && <span className={s.count}>{m.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

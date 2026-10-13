'use client';

import type { ReactNode } from 'react';

export type TabDef<K extends string> = { key: K; label: string; count?: ReactNode };

/** Mono uppercase tabs with the light-tube underline. Scrolls sideways on mobile. */
export function Tabs<K extends string>({
  tabs,
  value,
  onChange,
  label,
  sticky = false,
}: {
  tabs: TabDef<K>[];
  value: K;
  onChange: (k: K) => void;
  label: string;
  sticky?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="no-scrollbar"
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: sticky ? 64 : undefined,
        zIndex: sticky ? 20 : undefined,
        display: 'flex',
        gap: 4,
        overflowX: 'auto',
        borderBottom: '1px solid var(--hair)',
        background: sticky ? 'var(--glass)' : undefined,
        backdropFilter: sticky ? 'blur(16px)' : undefined,
        WebkitBackdropFilter: sticky ? 'blur(16px)' : undefined,
      }}
    >
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            style={{
              position: 'relative',
              flex: 'none',
              height: 46,
              padding: '0 18px',
              background: 'none',
              border: 0,
              color: on ? 'var(--text-1)' : 'var(--text-3)',
              font: '500 11px/1 var(--mono)',
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: on ? 'var(--tube)' : 'none',
            }}
          >
            {t.label}
            {t.count != null && t.count !== '' && <span style={{ marginLeft: 8, color: 'var(--text-3)' }}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

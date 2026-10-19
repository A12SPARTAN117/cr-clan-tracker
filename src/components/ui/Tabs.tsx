'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export type TabDef<K extends string> = { key: K; label: string; count?: ReactNode };

/**
 * Mono uppercase tabs with the light-tube underline. Scrolls sideways when the tabs don't fit,
 * with a fade on whichever edge has more tabs past it.
 */
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
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const edges = () => {
      el.dataset.moreLeft = String(el.scrollLeft > 2);
      el.dataset.moreRight = String(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    };
    edges();
    el.addEventListener('scroll', edges, { passive: true });
    const ro = new ResizeObserver(edges);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', edges);
      ro.disconnect();
    };
  }, []);

  // Keep the chosen tab in view when it's past the edge.
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    const box = list.current;
    if (!el || !box || box.scrollWidth <= box.clientWidth) return;
    const l = el.offsetLeft - box.offsetLeft;
    if (l < box.scrollLeft || l + el.offsetWidth > box.scrollLeft + box.clientWidth) box.scrollTo({ left: l - 24, behavior: 'smooth' });
  }, [value]);

  return (
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      className="no-scrollbar oa-tabs"
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
            className="oa-tab"
            onClick={() => onChange(t.key)}
            style={{
              position: 'relative',
              flex: 'none',
              height: 46,
              background: 'none',
              border: 0,
              color: on ? 'var(--text-1)' : 'var(--text-3)',
              font: '500 11px/1 var(--mono)',
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

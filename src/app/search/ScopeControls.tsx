'use client';

import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { TagSearch } from '@/components/TagSearch';
import type { SearchScope } from '@/lib/search';

/**
 * The search runs once for players and clans; the scope chips only show or hide a section, so
 * they change the URL (history.replaceState) instead of searching again.
 */
function useScope(): SearchScope {
  const t = useSearchParams().get('type');
  return t === 'player' || t === 'clan' ? t : 'all';
}

export function ScopeChips({ counts }: { counts: Record<SearchScope, number> }) {
  const scope = useScope();
  const pick = (s: SearchScope) => {
    const u = new URL(window.location.href);
    if (s === 'all') u.searchParams.delete('type');
    else u.searchParams.set('type', s);
    window.history.replaceState(null, '', u);
  };
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {(
        [
          ['all', 'Everything'],
          ['player', 'Players'],
          ['clan', 'Clans'],
        ] as const
      ).map(([k, l]) => (
        <button key={k} type="button" className="chip" aria-pressed={scope === k} style={{ height: 30 }} onClick={() => pick(k)}>
          {k === 'all' ? l : `${l} ${counts[k]}`}
        </button>
      ))}
      <span className="label" style={{ marginLeft: 'auto' }}>
        {counts[scope]} results
      </span>
    </div>
  );
}

/** A results section that hides when the other scope is picked. */
export function ScopeSection({ kind, children }: { kind: SearchScope; children: ReactNode }) {
  const scope = useScope();
  return scope === 'all' || kind === 'all' || scope === kind ? children : null;
}

/** The search box, following the scope picked below it. */
export function ScopedSearch({ q, then }: { q: string; then?: 'manage' | 'rivals' }) {
  const scope = useScope();
  return <TagSearch key={`${q}|${scope}`} size="default" scope={scope} then={then} />;
}

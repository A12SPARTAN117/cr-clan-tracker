'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { checkTag } from '@/lib/tags';
import { Portal } from '@/components/fx/Portal';

type Loc = { id: number; name: string; isCountry: boolean };

/** Search box + filters. Everything lives in the URL so results render on the server. */
export function ClanFilters({ locations }: { locations: Loc[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [focus, setFocus] = useState(false);
  const [minM, setMinM] = useState(Number(params.get('minM') ?? 0));
  const [minW, setMinW] = useState(Number(params.get('minW') ?? 0));

  // The URL is the source of truth. Next keeps this page's state alive between visits, so
  // arriving with a new ?q= (from another page's search) must overwrite what was typed last
  // time; otherwise the debounce below would push the old query straight back.
  const urlKey = params.toString();
  const [synced, setSynced] = useState(urlKey);
  if (synced !== urlKey) {
    setSynced(urlKey);
    setQ(params.get('q') ?? '');
    setMinM(Number(params.get('minM') ?? 0));
    setMinW(Number(params.get('minW') ?? 0));
  }

  const push = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '' || v === 0 || v === 'all') next.delete(k);
      else next.set(k, String(v));
    }
    start(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  };

  // Debounced name search.
  useEffect(() => {
    const current = params.get('q') ?? '';
    if (q.trim() === current) return;
    // "#TAG" waits for Enter (it may be a player or a clan); names search as you type.
    if (q.trim().startsWith('#')) return;
    const id = setTimeout(() => {
      if (q.trim().length === 0 || q.trim().length >= 3) push({ q: q.trim() });
    }, 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [q]);

  // Results render on the server; dim them while a filter change is loading.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-results-busy', pending);
    return () => document.documentElement.removeAttribute('data-results-busy');
  }, [pending]);

  const tagLike = q.trim() && checkTag(q).kind === 'valid';
  const type = params.get('type') ?? 'all';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <label
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 64,
          maxWidth: 760,
          padding: '0 12px',
          background: 'var(--obsidian)',
          border: `1px solid ${focus ? 'rgba(58,160,255,.7)' : 'var(--hair)'}`,
          borderRadius: 8,
          boxShadow: focus ? 'var(--glow)' : 'none',
        }}
      >
        <span style={{ position: 'absolute', inset: 5, border: '1px solid var(--hair)', borderRadius: 5, pointerEvents: 'none' }} />
        <span
          aria-hidden
          style={{ flex: 'none', width: 38, height: 38, borderRadius: 5, background: 'var(--slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 16px/1 var(--mono)', color: 'var(--blue-hi)' }}
        >
          #
        </span>
        <span style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              const c = checkTag(q);
              if (c.kind === 'valid' && (q.trim().startsWith('#') || /\d/.test(q))) router.push(`/clan/${c.tag}`);
              else if (q.trim().length >= 3) push({ q: q.trim() });
            }}
            aria-label="Clan name or tag"
            autoComplete="off"
            spellCheck={false}
            style={{ width: '100%', background: 'none', border: 0, outline: 'none', boxShadow: 'none', color: 'var(--text-1)', font: '700 18px/1 var(--mono)', letterSpacing: '.06em', caretColor: 'var(--blue)' }}
          />
          {!q && !focus && (
            <span aria-hidden style={{ position: 'absolute', left: 0, width: 11, height: 22, background: 'var(--blue-hi)', animation: 'oaBlink 1.05s steps(1) infinite' }} />
          )}
        </span>
        {pending ? <Portal size={22} /> : null}
        <span style={{ font: '500 10px/1 var(--mono)', letterSpacing: '.12em', color: tagLike ? 'var(--blue-hi)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>
          {!q ? 'NAME OR #TAG' : tagLike ? 'TAG? PRESS ENTER' : q.trim().length < 3 ? '3+ LETTERS' : 'SEARCHING NAME'}
        </span>
      </label>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 28px', alignItems: 'center', padding: '16px 0', borderTop: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)' }}>
        <label className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          LOCATION
          <select
            value={params.get('loc') ?? ''}
            onChange={(e) => push({ loc: e.target.value })}
            style={{ height: 32, maxWidth: 220, padding: '0 10px', background: 'var(--obsidian)', border: '1px solid var(--hair)', borderRadius: 4, color: 'var(--text-1)', font: '500 11px/1 var(--mono)' }}
          >
            <option value="">All locations</option>
            <optgroup label="Regions">
              {locations
                .filter((l) => !l.isCountry)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Countries">
              {locations
                .filter((l) => l.isCountry)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </label>
        <label className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          MIN MEMBERS
          <input type="range" min={0} max={50} value={minM} onChange={(e) => setMinM(+e.target.value)} onPointerUp={() => push({ minM })} onKeyUp={() => push({ minM })} style={{ accentColor: 'var(--blue)', width: 120 }} />
          <span style={{ color: 'var(--text-1)', fontSize: 12, minWidth: 22 }}>{minM}</span>
        </label>
        <label className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          WAR TROPHIES ≥
          <input
            type="range"
            min={0}
            max={5000}
            step={250}
            value={minW}
            onChange={(e) => setMinW(+e.target.value)}
            onPointerUp={() => push({ minW })}
            onKeyUp={() => push({ minW })}
            style={{ accentColor: 'var(--blue)', width: 120 }}
          />
          <span style={{ color: 'var(--text-1)', fontSize: 12, minWidth: 40 }}>{minW.toLocaleString('en-US')}</span>
        </label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="label-sm">TYPE</span>
          {(
            [
              ['all', 'All'],
              ['open', 'Open'],
              ['inviteOnly', 'Invite'],
              ['closed', 'Closed'],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" className="chip" aria-pressed={type === v} onClick={() => push({ type: v })}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { createClientCache } from '@/lib/clientCache';
import { checkTag, surelyTag } from '@/lib/tags';
import { ClanBadge } from './ui/ClanBadge';
import { MembersIcon, TrophyIcon } from './ui/icons';

const HINTS = {
  all: 'Player name or #tag, clan name or #tag. Your tag is under your name in-game.',
  player: 'Player name or #tag. Your tag is under your name in-game, starting with #.',
  clan: 'Clan name or #tag. The clan tag is under the clan name in-game.',
} as const;

type Scope = keyof typeof HINTS;
type Suggest = {
  tagPlayer: { tag: string; name: string; clanName: string | null; trophies: number | null } | null;
  tagClan: { tag: string; name: string; badgeId: number; members: number } | null;
  players: { tag: string; name: string; clanName: string | null; trophies: number | null }[];
  clans: { tag: string; name: string; badgeId: number; members: number; location: string | null }[];
};
type Item = { kind: 'player' | 'clan'; tag: string; name: string; sub: string; badgeId?: number; trophies?: number | null; members?: number };

/**
 * The search box: one field for player names and tags, clan names and tags. Suggests matches
 * while typing; Enter opens the highlighted match, a tag directly, or the full results page.
 * `scope` limits it to players or clans; `then="manage"` sends clans to their dashboard.
 */
/** Suggestions seen in the last minute, shared by every search box on the page. */
const suggestCache = createClientCache<Suggest>(60_000);

export function TagSearch({
  size = 'hero',
  onScene = false,
  placeholder = '',
  defaultHint,
  autoFocus = false,
  scope = 'all',
  then,
  resultsPath = '/search',
  onPick,
}: {
  size?: 'hero' | 'default';
  /** Sits on an always-dark header scene (keeps dark colours in light theme). */
  onScene?: boolean;
  placeholder?: string;
  defaultHint?: string;
  autoFocus?: boolean;
  scope?: Scope;
  then?: 'manage';
  /** Where Enter on a name goes; pages with their own results list pass themselves. */
  resultsPath?: string;
  /** Pick mode: hand the chosen player / clan to the caller instead of navigating. */
  onPick?: (it: { kind: 'player' | 'clan'; tag: string; name: string }) => void;
}) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const [sug, setSug] = useState<{ q: string; items: Item[] } | null>(null);
  const [sel, setSel] = useState(-1);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const hero = size === 'hero';
  const trimmed = q.trim();
  const c = checkTag(q);
  const typo = trimmed.startsWith('#') && c.kind === 'invalid';

  const clanHref = (tag: string) => (then === 'manage' ? `/clan/${tag}/manage` : `/clan/${tag}`);
  const hrefOf = (it: Item) => (it.kind === 'player' ? `/player/${it.tag}` : clanHref(it.tag));

  // Debounced suggestions.
  useEffect(() => {
    const term = q.trim();
    if (term.replace(/^#/, '').length < 2 || typo) return;
    const ctl = new AbortController();
    const id = setTimeout(async () => {
      setBusy(true);
      try {
        const url = `/api/search?scope=${scope}&q=${encodeURIComponent(term)}`;
        const d = await suggestCache.get(url, () => fetch(url).then((r) => (r.ok ? (r.json() as Promise<Suggest>) : Promise.reject(r.status))));
        if (ctl.signal.aborted) return;
        const items: Item[] = [];
        if (d.tagPlayer) items.push({ kind: 'player', tag: d.tagPlayer.tag, name: d.tagPlayer.name, sub: `#${d.tagPlayer.tag} · tag match`, trophies: d.tagPlayer.trophies });
        if (d.tagClan) items.push({ kind: 'clan', tag: d.tagClan.tag, name: d.tagClan.name, sub: `#${d.tagClan.tag} · tag match`, badgeId: d.tagClan.badgeId, members: d.tagClan.members });
        for (const p of d.players.slice(0, 5)) if (!items.some((i) => i.tag === p.tag)) items.push({ kind: 'player', tag: p.tag, name: p.name, sub: `#${p.tag}${p.clanName ? ` · ${p.clanName}` : ''}`, trophies: p.trophies });
        for (const k of d.clans.slice(0, 5)) if (!items.some((i) => i.tag === k.tag)) items.push({ kind: 'clan', tag: k.tag, name: k.name, sub: `#${k.tag}${k.location ? ` · ${k.location}` : ''}`, badgeId: k.badgeId, members: k.members });
        setSug({ q: term, items });
        setSel(-1);
      } catch {
        // aborted or offline: keep the old list
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
  }, [q, scope, typo]);

  const items = sug && sug.q === trimmed ? sug.items : [];
  const open = focus && trimmed.replace(/^#/, '').length >= 2 && !typo && (items.length > 0 || busy);

  const go = (it?: Item) => {
    if (onPick) {
      const pick = it ?? (open ? items[0] : undefined) ?? (surelyTag(trimmed) && c.kind === 'valid' ? { kind: scope === 'clan' ? ('clan' as const) : ('player' as const), tag: c.tag, name: `#${c.tag}`, sub: '' } : undefined);
      if (pick) {
        onPick({ kind: pick.kind, tag: pick.tag, name: pick.name });
        setQ('');
      }
      return;
    }
    if (it) return router.push(hrefOf(it));
    if (typo || !trimmed) return;
    if (surelyTag(trimmed) && c.kind === 'valid') {
      return router.push(scope === 'player' ? `/player/${c.tag}` : scope === 'clan' ? clanHref(c.tag) : `/t/${c.tag}`);
    }
    if (trimmed.replace(/^#/, '').length < 2) return;
    const params = new URLSearchParams({ q: trimmed });
    if (scope !== 'all' && resultsPath === '/search') params.set('type', scope);
    if (then) params.set('then', then);
    router.push(`${resultsPath}?${params}`);
  };

  let hint: string = defaultHint ?? HINTS[scope];
  let hintFg = onScene ? 'var(--text-2)' : 'var(--text-3)';
  if (typo && c.kind === 'invalid') {
    hint = `"${c.bad}" can't appear in a tag. Tags only use 0 2 8 9 P Y L Q G R J C U V.`;
    hintFg = 'var(--ember)';
  } else if (surelyTag(trimmed)) {
    hint = `Looks like a tag · Enter to open #${c.kind === 'valid' ? c.tag : ''}`;
    hintFg = 'var(--blue-hi)';
  } else if (trimmed.length >= 2) {
    // Player names only find people already in our directory, so point at the tag.
    hint =
      scope === 'clan'
        ? `Enter to see every clan matching "${trimmed}" · not there? Search its #tag`
        : `Enter to see every match for "${trimmed}" · not found? Search the #tag once and the name works after`;
  }

  const fg = 'var(--text-1)';
  const panelBg = onScene ? 'var(--charcoal)' : 'var(--obsidian)';
  return (
    <div ref={box} style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: hero ? 68 : 56,
          padding: hero ? '0 10px 0 12px' : '0 8px 0 10px',
          background: onScene ? 'var(--glass)' : 'var(--obsidian)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${focus || surelyTag(trimmed) ? 'rgba(var(--glow-rgb), .7)' : typo ? 'rgba(var(--ember-rgb), .6)' : onScene ? 'rgba(var(--ink-rgb), .18)' : 'var(--hair)'}`,
          borderRadius: 8,
          boxShadow: focus ? 'var(--glow)' : onScene ? '0 20px 60px rgba(var(--shade-rgb), .35)' : 'none',
          transition: 'box-shadow .3s, border-color .3s',
        }}
      >
        <span style={{ position: 'absolute', inset: 5, border: `1px solid ${onScene ? 'rgba(var(--ink-rgb), .14)' : 'var(--hair)'}`, borderRadius: 5, pointerEvents: 'none' }} />
        <span
          aria-hidden
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: hero ? 40 : 34,
            height: hero ? 40 : 34,
            borderRadius: 5,
            background: 'var(--slate)',
            font: `800 ${hero ? 18 : 15}px/1 var(--mono)`,
            color: 'var(--blue-hi)',
            textShadow: '0 0 10px rgba(var(--glow-rgb), .8)',
          }}
        >
          {busy ? '…' : '#'}
        </span>
        <span style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <input
            value={q}
            autoFocus={autoFocus}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && items.length) {
                e.preventDefault();
                setSel((i) => (i + 1) % items.length);
              } else if (e.key === 'ArrowUp' && items.length) {
                e.preventDefault();
                setSel((i) => (i <= 0 ? items.length - 1 : i - 1));
              } else if (e.key === 'Escape') {
                setSel(-1);
                (e.target as HTMLInputElement).blur();
              } else if (e.key === 'Enter') {
                e.preventDefault();
                go(open && sel >= 0 ? items[sel] : undefined);
              }
            }}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setFocus(false), 150)}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && sel >= 0 ? `${listId}-${sel}` : undefined}
            aria-label={scope === 'player' ? 'Player name or tag' : scope === 'clan' ? 'Clan name or tag' : 'Player or clan name or tag'}
            aria-invalid={typo || undefined}
            placeholder={focus ? '' : placeholder}
            spellCheck={false}
            autoComplete="off"
            style={{
              width: '100%',
              background: 'none',
              border: 0,
              outline: 'none',
              boxShadow: 'none',
              color: fg,
              caretColor: 'var(--blue)',
              font: `700 ${hero ? 'clamp(16px,2vw,22px)' : '16px'}/1 var(--mono)`,
              letterSpacing: '.06em',
            }}
          />
          {!q && !focus && !placeholder && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                width: hero ? 12 : 10,
                height: hero ? 24 : 20,
                background: 'var(--blue-hi)',
                boxShadow: '0 0 10px rgba(var(--glow-rgb), .8)',
                animation: 'oaBlink 1.05s steps(1) infinite',
                pointerEvents: 'none',
              }}
            />
          )}
        </span>
        <button
          type="button"
          data-magnet=""
          onClick={() => go()}
          className="btn btn-primary"
          style={{ height: hero ? 48 : 40, padding: hero ? '0 22px' : '0 16px', borderRadius: 5, fontSize: hero ? 12 : 11 }}
        >
          {surelyTag(trimmed) ? 'LOOK UP ↵' : 'SEARCH'}
        </button>
      </label>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          style={{
            position: 'absolute',
            // In the hero the box sits at the bottom of a clipped scene, so open upwards.
            ...(onScene ? { bottom: 'calc(100% + 6px)' } : { top: (hero ? 68 : 56) + 6 }),
            left: 0,
            right: 0,
            zIndex: 30,
            maxHeight: 360,
            overflowY: 'auto',
            padding: 6,
            background: panelBg,
            border: `1px solid ${onScene ? 'rgba(var(--ink-rgb), .18)' : 'var(--hair)'}`,
            borderRadius: 8,
            boxShadow: '0 24px 60px rgba(var(--shade-rgb), .4)',
            color: fg,
          }}
        >
          {items.length === 0 && <div style={{ padding: '12px 10px', font: '500 11px/1 var(--mono)', letterSpacing: '.1em', color: 'var(--text-3)' }}>SEARCHING…</div>}
          {items.map((it, i) => (
            <div
              key={`${it.kind}${it.tag}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === sel}
              onMouseDown={(e) => {
                e.preventDefault();
                go(it);
              }}
              onMouseEnter={() => setSel(i)}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr auto',
                gap: 12,
                alignItems: 'center',
                padding: '9px 10px',
                borderRadius: 5,
                cursor: 'pointer',
                background: i === sel ? 'var(--slate)' : 'transparent',
              }}
            >
              {it.kind === 'clan' && it.badgeId != null ? (
                <ClanBadge badgeId={it.badgeId} size={26} />
              ) : (
                <span style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate)', font: '700 11px/1 var(--mono)', color: 'var(--blue-hi)' }}>
                  {it.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ font: '600 14px/1.15 var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
                <span style={{ font: '500 10px/1 var(--mono)', letterSpacing: '.08em', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {it.kind === 'player' ? 'PLAYER' : 'CLAN'} · {it.sub}
                </span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 12px/1 var(--mono)', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                {it.kind === 'player' && it.trophies != null && (
                  <>
                    <TrophyIcon size={14} />
                    {it.trophies.toLocaleString('en-US')}
                  </>
                )}
                {it.kind === 'clan' && it.members != null && (
                  <>
                    <MembersIcon size={14} />
                    {it.members}/50
                  </>
                )}
              </span>
            </div>
          ))}
          {items.length > 0 && (
            <div
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault();
                go();
              }}
              style={{ padding: '10px', font: '500 10px/1 var(--mono)', letterSpacing: '.12em', color: 'var(--blue-hi)', cursor: 'pointer' }}
            >
              SEE ALL RESULTS FOR &quot;{trimmed.toUpperCase()}&quot; →
            </div>
          )}
        </div>
      )}
      <span role="status" style={{ font: '500 10px/1.6 var(--mono)', letterSpacing: '.1em', color: hintFg }}>
        {hint}
      </span>
    </div>
  );
}

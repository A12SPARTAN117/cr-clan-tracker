'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { checkTag, searchHref } from '@/lib/tags';

const HINT_DEFAULT = 'Find your tag in-game: tap your name on the main screen. It sits under your name, starting with #.';

/**
 * The big tag search: # chip, blinking block cursor when empty, blue glow on focus,
 * ember border + named character when a tag contains an invalid character.
 */
export function TagSearch({
  size = 'hero',
  onScene = false,
  placeholder = '',
  defaultHint = HINT_DEFAULT,
  autoFocus = false,
}: {
  size?: 'hero' | 'default';
  /** Sits on an always-dark header scene (keeps dark colours in light theme). */
  onScene?: boolean;
  placeholder?: string;
  defaultHint?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [tag, setTag] = useState('');
  const [focus, setFocus] = useState(false);
  const c = checkTag(tag);
  const hero = size === 'hero';
  // A single word with a bad character is a mistyped tag; anything else may be a clan name.
  const typo = c.kind === 'invalid' && (tag.trim().startsWith('#') || !searchHref(tag));

  let hint = defaultHint;
  let hintFg = onScene ? '#A4A9B4' : 'var(--text-3)';
  if (typo && c.kind === 'invalid') {
    hint = `"${c.bad}" can't appear in a tag. Tags only use 0 2 8 9 P Y L Q G R J C U V.`;
    hintFg = onScene ? '#FF5464' : 'var(--ember)';
  } else if (c.kind === 'valid') {
    hint = `Valid tag · press Enter to look up #${c.tag}`;
    hintFg = onScene ? '#8CCBFF' : 'var(--blue-hi)';
  } else if (searchHref(tag)) {
    hint = `Press Enter to search clans named "${tag.trim()}"`;
  }
  const go = () => {
    if (typo) return;
    const href = searchHref(tag);
    if (href) router.push(href);
  };

  const fg = onScene ? '#F3F4F6' : 'var(--text-1)';
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: hero ? 68 : 56,
          padding: hero ? '0 10px 0 12px' : '0 8px 0 10px',
          background: onScene ? 'rgba(18,19,22,.82)' : 'var(--obsidian)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${focus || c.kind === 'valid' ? 'rgba(58,160,255,.7)' : typo ? 'rgba(255,84,100,.6)' : onScene ? 'rgba(255,255,255,.18)' : 'var(--hair)'}`,
          borderRadius: 8,
          boxShadow: focus ? 'var(--glow)' : onScene ? '0 20px 60px rgba(0,0,0,.5)' : 'none',
          transition: 'box-shadow .3s, border-color .3s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            inset: 5,
            border: `1px solid ${onScene ? 'rgba(255,255,255,.14)' : 'var(--hair)'}`,
            borderRadius: 5,
            pointerEvents: 'none',
          }}
        />
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
            background: onScene ? '#262930' : 'var(--slate)',
            font: `800 ${hero ? 18 : 15}px/1 var(--mono)`,
            color: onScene ? '#8CCBFF' : 'var(--blue-hi)',
            textShadow: '0 0 10px rgba(58,160,255,.8)',
          }}
        >
          #
        </span>
        <span style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <input
            value={tag}
            autoFocus={autoFocus}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            aria-label="Player or clan tag, or clan name"
            aria-invalid={typo || undefined}
            placeholder={focus ? '' : placeholder}
            spellCheck={false}
            autoCapitalize="characters"
            autoComplete="off"
            style={{
              width: '100%',
              background: 'none',
              border: 0,
              outline: 'none',
              boxShadow: 'none',
              color: fg,
              caretColor: '#3AA0FF',
              font: `700 ${hero ? 'clamp(16px,2vw,22px)' : '16px'}/1 var(--mono)`,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
            }}
          />
          {!tag && !focus && !placeholder && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                width: hero ? 12 : 10,
                height: hero ? 24 : 20,
                background: '#8CCBFF',
                boxShadow: '0 0 10px rgba(58,160,255,.8)',
                animation: 'oaBlink 1.05s steps(1) infinite',
                pointerEvents: 'none',
              }}
            />
          )}
        </span>
        <button
          type="button"
          data-magnet=""
          onClick={go}
          className="btn btn-primary"
          style={{ height: hero ? 48 : 40, padding: hero ? '0 22px' : '0 16px', borderRadius: 5, fontSize: hero ? 12 : 11 }}
        >
          {c.kind === 'valid' ? 'LOOK UP ↵' : 'SEARCH'}
        </button>
      </label>
      <span role="status" style={{ font: '500 10px/1.6 var(--mono)', letterSpacing: '.1em', color: hintFg }}>
        {hint}
      </span>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { cardBySlug, fixedArt, LOCAL_CARD_ART, type Rarity } from '@/lib/cards';

export const CARD_SIZES = { S: 44, M: 68, L: 104, XL: 150 } as const;
/** "fluid" fills its container's width (deck grids); the others are fixed widths in px. */
export type CardSize = keyof typeof CARD_SIZES | 'fluid';

const baseOf = (u?: string | null) => (u ?? '').replace('/cardheroes/', '/cards/').replace('/cardevolutions/', '/cards/');
const uniq = (a: (string | null | undefined)[]) => a.filter((u, i): u is string => !!u && a.indexOf(u) === i);

export type CardTileProps = {
  slug: string;
  label?: string;
  img?: string | null;
  img2?: string | null;
  fallback?: string | null;
  split?: boolean;
  rarity?: Rarity;
  size?: CardSize;
  level?: number | null;
  evo?: boolean;
  hero?: boolean;
  owned?: boolean;
  active?: boolean;
  showLabel?: boolean;
};

/**
 * A card as the game draws it: the official art already carries its rarity frame (and the
 * evo / hero frame), so the tile adds no frame of its own. Evo and hero cards get a soft glow
 * that follows the art's shape. Hover tilt + glare via data-tilt. Image fallback chain:
 * img → fallback → base /cards/ URL → local art → striped placeholder.
 */
export function CardTile(p: CardTileProps) {
  const info = cardBySlug(p.slug);
  const rarity = (p.rarity ?? info?.rarity ?? 'common') as Rarity;
  const size = p.size ?? 'M';
  const fluid = size === 'fluid';
  const w = fluid ? 0 : CARD_SIZES[size];
  const evo = !!p.evo;
  const hero = !!p.hero;
  const owned = p.owned !== false;
  const big = fluid || size === 'L' || size === 'XL';
  const name = p.label ?? info?.name ?? p.slug.replace(/-/g, ' ');
  const img = p.img === undefined ? (evo ? info?.icons.evolution : hero ? info?.icons.hero : info?.icons.normal) : p.img;

  // A local fix for broken official evo / hero art wins over the API URL.
  const fix = evo ? fixedArt(p.slug, 'evolution') : hero ? fixedArt(p.slug, 'hero') : null;
  const chain = uniq([fix, img, p.fallback, baseOf(img), info?.icons.normal, LOCAL_CARD_ART.has(p.slug) ? `/cards/${p.slug}.png` : null]);
  const chain2 = uniq([p.img2, baseOf(p.img2)]);
  const key = chain.join('|') + '#' + chain2.join('|');
  const [fail, setFail] = useState({ key, a: 0, b: 0 });
  const f = fail.key === key ? fail : { key, a: 0, b: 0 };
  const src = chain[f.a];
  const src2 = chain2[f.b];

  // drop-shadow follows the PNG's alpha, so the glow hugs the card's own frame.
  const glow = !owned
    ? 'grayscale(1)'
    : evo && hero
      ? 'drop-shadow(0 0 6px rgba(var(--evo-rgb), .55)) drop-shadow(0 0 6px rgba(var(--gold-rgb), .4))'
      : evo
        ? 'drop-shadow(0 0 7px rgba(199,155,255,.6))'
        : hero
          ? 'drop-shadow(0 0 7px rgba(245,213,138,.5))'
          : p.active
            ? 'drop-shadow(0 0 8px rgba(var(--glow-rgb), .8))'
            : 'drop-shadow(0 6px 10px rgba(var(--shade-rgb), .45))';

  const tag = [rarity === 'tower' ? 'Tower' : rarity, evo ? 'Evo' : '', hero ? 'Hero' : '', owned ? '' : 'Not owned']
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      data-tilt=""
      data-card={p.slug}
      title={p.showLabel ? undefined : name}
      style={{
        position: 'relative',
        width: fluid ? '100%' : w,
        minWidth: 0,
        flex: fluid ? '1 1 0' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        transformStyle: 'preserve-3d',
        opacity: owned ? 1 : 0.35,
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '95 / 140', filter: glow }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote API art with a manual fallback chain
          <img
            src={src}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={() => setFail({ ...f, a: f.a + 1 })}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              borderRadius: 6,
              textAlign: 'center',
              background: 'repeating-linear-gradient(135deg,var(--charcoal) 0 6px,var(--obsidian) 6px 12px)',
              font: `600 ${size === 'S' ? 6 : 8}px/1.2 var(--mono)`,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            {name}
          </div>
        )}
        {p.split && src2 && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src2}
              alt={`${name} hero`}
              loading="lazy"
              onError={() => setFail({ ...f, b: f.b + 1 })}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', clipPath: 'polygon(58% 0,100% 0,100% 100%,42% 100%)' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: '6% 10%',
                background: 'linear-gradient(112deg,transparent calc(50% - 1px),#F5D58A calc(50% - 1px),#F5D58A calc(50% + 1px),transparent calc(50% + 1px))',
                filter: 'drop-shadow(0 0 4px #E6B34A)',
                pointerEvents: 'none',
              }}
            />
          </>
        )}
        {/* Glare, kept inside the card's rounded body (CORS rules out masking with the remote art). */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: '3% 4%',
            borderRadius: '9% / 6%',
            pointerEvents: 'none',
            background: 'radial-gradient(circle at var(--gx,30%) var(--gy,20%),rgba(255,255,255,.4),rgba(255,255,255,0) 45%)',
            mixBlendMode: 'overlay',
            opacity: 'var(--ga,0)' as unknown as number,
            transition: 'opacity .3s',
          }}
        />
        {p.level != null && size !== 'S' && (
          <div
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              bottom: '5%',
              padding: big ? '12px 0 5px' : '9px 0 3px',
              borderRadius: '0 0 6px 6px',
              background: 'linear-gradient(to top,rgba(var(--void-rgb), .9),rgba(var(--void-rgb), 0))',
              font: `700 ${big ? 11 : 9}px/1 var(--mono)`,
              color: 'var(--text-1)',
              textAlign: 'center',
              letterSpacing: '.04em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            LV {p.level}
          </div>
        )}
      </div>
      {p.showLabel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div style={{ font: '500 12px/1.2 var(--sans)', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div
            style={{
              font: '500 9px/1.2 var(--mono)',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: evo ? 'var(--evo-hi)' : hero ? 'var(--gold)' : 'var(--text-3)',
            }}
          >
            {tag}
          </div>
        </div>
      )}
    </div>
  );
}

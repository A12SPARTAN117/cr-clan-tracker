'use client';

import { useState } from 'react';
import { cardArt, cardBySlug, LOCAL_CARD_ART, localArt, type Rarity } from '@/lib/cards';
import s from './CardTile.module.css';

export const CARD_SIZES = { S: 44, M: 68, L: 104, XL: 150 } as const;
/** "fluid" fills its container's width (deck grids); the others are fixed widths in px. */
export type CardSize = keyof typeof CARD_SIZES | 'fluid';

const baseOf = (u?: string | null) => (u ?? '').replace('/cardheroes/', '/cards/').replace('/cardevolutions/', '/cards/');
const uniq = (a: (string | null | undefined)[]) => a.filter((u, i): u is string => !!u && a.indexOf(u) === i);
const ours = (u?: string | null) => localArt(u)?.full;
/** Our copies come in two widths; the browser picks by the tile's width and the screen density. */
const srcSetOf = (src?: string) => (src?.startsWith('/cards/art/') ? `${src.replace(/\.avif$/, '.s.avif')} 192w, ${src} 288w` : undefined);
const SIZES: Record<CardSize, string> = { S: '44px', M: '68px', L: '104px', XL: '150px', fluid: '(max-width: 700px) 24vw, 120px' };

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
 * our AVIF copy → img → fallback → base /cards/ URL → design-kit art → striped placeholder
 * (a browser without AVIF fails our copy and moves on to the CDN's PNG).
 */
export function CardTile(p: CardTileProps) {
  const info = cardBySlug(p.slug);
  const rarity = (p.rarity ?? info?.rarity ?? 'common') as Rarity;
  const size = p.size ?? 'M';
  const fluid = size === 'fluid';
  const evo = !!p.evo;
  const hero = !!p.hero;
  const owned = p.owned !== false;
  const big = fluid || size === 'L' || size === 'XL';
  const name = p.label ?? info?.name ?? p.slug.replace(/-/g, ' ');
  const img = p.img === undefined ? cardArt(p.slug, evo, hero) : p.img;

  const chain = uniq([
    ours(img),
    img,
    ours(p.fallback),
    p.fallback,
    baseOf(img),
    ours(info?.icons.normal),
    info?.icons.normal,
    LOCAL_CARD_ART.has(p.slug) ? `/cards/${p.slug}.png` : null,
  ]);
  const chain2 = uniq([ours(p.img2), p.img2, baseOf(p.img2)]);
  const key = chain.join('|') + '#' + chain2.join('|');
  const [fail, setFail] = useState({ key, a: 0, b: 0 });
  const f = fail.key === key ? fail : { key, a: 0, b: 0 };
  const src = chain[f.a];
  const src2 = chain2[f.b];

  const glow = !owned ? 'gray' : evo && hero ? 'evohero' : evo ? 'evo' : hero ? 'hero' : p.active ? 'active' : undefined;

  const tag = [rarity === 'tower' ? 'Tower' : rarity, evo ? 'Evo' : '', hero ? 'Hero' : '', owned ? '' : 'Not owned']
    .filter(Boolean)
    .join(' · ');

  return (
    <div data-tilt="" data-card={p.slug} title={p.showLabel ? undefined : name} className={`${s.tile} ${s[size]}${big ? ` ${s.big}` : ''}${owned ? '' : ` ${s.unowned}`}`}>
      <div className={s.art} data-glow={glow}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote API art with a manual fallback chain
          <img src={src} srcSet={srcSetOf(src)} sizes={SIZES[size]} alt={name} loading="lazy" decoding="async" onError={() => setFail({ ...f, a: f.a + 1 })} className={s.img} />
        ) : (
          <div className={s.placeholder}>{name}</div>
        )}
        {p.split && src2 && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src2} srcSet={srcSetOf(src2)} sizes={SIZES[size]} alt={`${name} hero`} loading="lazy" onError={() => setFail({ ...f, b: f.b + 1 })} className={`${s.img} ${s.half}`} />
            <div className={s.seam} />
          </>
        )}
        <div aria-hidden className={s.glare} />
        {p.level != null && size !== 'S' && <div className={s.level}>LV {p.level}</div>}
      </div>
      {p.showLabel && (
        <div className={s.label}>
          <div className={s.name}>{name}</div>
          <div className={s.kind} data-k={evo ? 'evo' : hero ? 'hero' : undefined}>
            {tag}
          </div>
        </div>
      )}
    </div>
  );
}

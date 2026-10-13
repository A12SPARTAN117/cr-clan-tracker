'use client';

import { useState } from 'react';
import { cardBySlug, LOCAL_CARD_ART, type Rarity } from '@/lib/cards';

const FRAMES: Record<Rarity, string> = {
  common: 'linear-gradient(135deg,#a9aeb6,#5b6068 30%,#c4c8ce 52%,#50555c 75%,#9aa0a8)',
  rare: 'linear-gradient(135deg,#f6f6f4,#c9cac6 35%,#ffffff 50%,#b5b6b2 68%,#ededea)',
  epic: 'linear-gradient(135deg,#141418,#2a1f3a 38%,#A35BFF 47%,#1a1424 55%,#3b2a55 80%,#141418)',
  legendary: 'linear-gradient(135deg,#8CCBFF,#eef4ff 25%,#c9a8ff 45%,#a8ffe6 65%,#ffe3f2 82%,#8CCBFF)',
  champion: 'linear-gradient(135deg,#E6B34A,#1A1C20 22%,#1A1C20 78%,#E6B34A)',
  tower: 'linear-gradient(135deg,#62676F,#262930 50%,#62676F)',
};

export const CARD_SIZES = { S: 44, M: 68, L: 104, XL: 150 } as const;
export type CardSize = keyof typeof CARD_SIZES;

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
  elixir?: number | null;
  evo?: boolean;
  hero?: boolean;
  owned?: boolean;
  active?: boolean;
  showLabel?: boolean;
};

/**
 * A card with a rarity "material" frame, elixir drop, level strip, evo/hero light strip and
 * hover tilt (via data-tilt). Image fallback chain: img → fallback → base /cards/ URL →
 * local art → striped placeholder.
 */
export function CardTile(p: CardTileProps) {
  const info = cardBySlug(p.slug);
  const rarity = (p.rarity ?? info?.rarity ?? 'common') as Rarity;
  const size = p.size ?? 'M';
  const w = CARD_SIZES[size];
  const h = Math.round((w * 140) / 95);
  const evo = !!p.evo;
  const hero = !!p.hero;
  const owned = p.owned !== false;
  const big = size === 'L' || size === 'XL';
  const name = p.label ?? info?.name ?? p.slug.replace(/-/g, ' ');
  const img = p.img === undefined ? (evo ? info?.icons.evolution : hero ? info?.icons.hero : info?.icons.normal) : p.img;

  const chain = uniq([img, p.fallback, baseOf(img), info?.icons.normal, LOCAL_CARD_ART.has(p.slug) ? `/cards/${p.slug}.png` : null]);
  const chain2 = uniq([p.img2, baseOf(p.img2)]);
  const key = chain.join('|') + '#' + chain2.join('|');
  const [fail, setFail] = useState({ key, a: 0, b: 0 });
  const f = fail.key === key ? fail : { key, a: 0, b: 0 };
  const src = chain[f.a];
  const src2 = chain2[f.b];

  let strip: { bg: string; glow: string } | null = null;
  if (evo && hero) strip = { bg: 'linear-gradient(90deg,#A35BFF 50%,#E6B34A 50%)', glow: '0 0 8px rgba(163,91,255,.8),0 0 8px rgba(230,179,74,.6)' };
  else if (evo) strip = { bg: '#C79BFF', glow: '0 0 6px #A35BFF,0 0 16px rgba(163,91,255,.7)' };
  else if (hero) strip = { bg: '#F5D58A', glow: '0 0 6px #E6B34A,0 0 16px rgba(230,179,74,.6)' };

  const glow = !owned
    ? 'none'
    : evo
      ? '0 0 0 1px rgba(163,91,255,.5),0 0 18px rgba(163,91,255,.28)'
      : hero
        ? '0 0 0 1px rgba(230,179,74,.5),0 0 18px rgba(230,179,74,.25)'
        : p.active
          ? 'var(--glow)'
          : '0 6px 18px rgba(0,0,0,.45)';

  const tag = [rarity === 'tower' ? 'Tower' : rarity, evo ? 'Evo' : '', hero ? 'Hero' : '', owned ? '' : 'Not owned']
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      data-tilt=""
      title={p.showLabel ? undefined : name}
      style={{
        position: 'relative',
        width: w,
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        transformStyle: 'preserve-3d',
        opacity: owned ? 1 : 0.3,
        filter: owned ? 'none' : 'grayscale(1)',
      }}
    >
      <div style={{ position: 'relative', width: w, height: h, padding: 2, borderRadius: 7, background: FRAMES[rarity] ?? FRAMES.common, boxShadow: glow }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 5, overflow: 'hidden', background: '#07080A' }}>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote API art with a manual fallback chain
            <img
              src={src}
              alt={name}
              loading="lazy"
              decoding="async"
              onError={() => setFail({ ...f, a: f.a + 1 })}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
                textAlign: 'center',
                background: 'repeating-linear-gradient(135deg,#121316 0 6px,#1A1C20 6px 12px)',
                font: `600 ${size === 'S' ? 6 : 8}px/1.2 var(--mono)`,
                color: '#80868F',
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
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', clipPath: 'polygon(58% 0,100% 0,100% 100%,42% 100%)' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(112deg,transparent calc(50% - 1px),#F5D58A calc(50% - 1px),#F5D58A calc(50% + 1px),transparent calc(50% + 1px))',
                  filter: 'drop-shadow(0 0 4px #E6B34A)',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'radial-gradient(circle at var(--gx,30%) var(--gy,20%),rgba(255,255,255,.35),rgba(255,255,255,0) 45%)',
              mixBlendMode: 'overlay',
              opacity: 'var(--ga,0)' as unknown as number,
              transition: 'opacity .3s',
            }}
          />
          {p.level != null && size !== 'S' && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                padding: big ? '14px 0 6px' : '10px 0 4px',
                background: 'linear-gradient(to top,rgba(7,8,10,.92),rgba(7,8,10,0))',
                font: `700 ${big ? 11 : 9}px/1 var(--mono)`,
                color: '#F3F4F6',
                textAlign: 'center',
                letterSpacing: '.04em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              LV {p.level}
            </div>
          )}
        </div>
        {p.elixir != null && size !== 'S' && (
          <div
            aria-label={`${p.elixir} elixir`}
            style={{
              position: 'absolute',
              top: -6,
              left: -6,
              width: big ? 24 : 19,
              height: big ? 24 : 19,
              borderRadius: '50% 50% 50% 4px',
              transform: 'rotate(-45deg)',
              background: '#0A48C9',
              boxShadow: '0 0 0 1px rgba(140,203,255,.7),0 0 10px rgba(58,160,255,.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ transform: 'rotate(45deg)', font: `700 ${big ? 12 : 10}px/1 var(--mono)`, color: '#fff' }}>{p.elixir}</span>
          </div>
        )}
        {strip && (
          <div style={{ position: 'absolute', left: 8, right: 8, bottom: -3, height: 2, borderRadius: 2, background: strip.bg, boxShadow: strip.glow }} />
        )}
      </div>
      {p.showLabel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

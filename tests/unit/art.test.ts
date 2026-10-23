import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CARDS, cardBySlug, localArt, TOWER_TROOPS } from '@/lib/cards';
import { characterFor } from '@/lib/characters';
import { badgeSrc } from '@/components/ui/ClanBadge';

const pub = (p: string) => path.resolve('public', p.replace(/^\//, ''));

describe('our copies of the art', () => {
  it('maps official card art to the AVIF copies', () => {
    const hog = cardBySlug('hog-rider')!;
    expect(localArt(hog.icons.normal)).toEqual({ full: '/cards/art/hog-rider.avif', small: '/cards/art/hog-rider.s.avif' });
    expect(localArt('https://api-assets.clashroyale.com/cards/300/unknown.png')).toBeNull();
    expect(localArt(null)).toBeNull();
  });

  // scripts/card-art.mjs makes them; a card added to data/cards.json without running it would
  // fall back to the 165 KB CDN art on every page.
  it('has both sizes for every card, evolution, hero and tower troop', () => {
    const missing: string[] = [];
    for (const c of [...CARDS, ...TOWER_TROOPS])
      for (const u of [c.icons.normal, c.icons.evolution, c.icons.hero]) {
        const a = localArt(u);
        if (u && !a) missing.push(`${c.slug}: no mapping`);
        if (a) for (const f of [a.full, a.small]) if (!fs.existsSync(pub(f))) missing.push(f);
      }
    expect(missing).toEqual([]);
  });

  // The site shows the WebP; the recap renderer reads the PNG beside it.
  it('keeps a PNG beside every WebP the pages and recaps use', () => {
    for (const src of [characterFor('hog-rider'), characterFor('golden-knight'), badgeSrc(16000000)]) {
      expect(src).toMatch(/\.webp$/);
      expect(fs.existsSync(pub(src!))).toBe(true);
      expect(fs.existsSync(pub(src!.replace(/\.webp$/, '.png')))).toBe(true);
    }
  });
});

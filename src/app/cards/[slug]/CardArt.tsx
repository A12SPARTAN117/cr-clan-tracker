'use client';

import { useState } from 'react';
import { CardTile } from '@/components/CardTile';
import type { CardInfo } from '@/lib/cards';

type Art = 'base' | 'evo' | 'hero' | 'split';

/** Big card with Normal / Evolution / Hero / Split art tabs. */
export function CardArt({ c }: { c: CardInfo }) {
  const [art, setArt] = useState<Art>('base');
  const tabs: [Art, string][] = [['base', 'Normal']];
  if (c.hasEvolution) tabs.push(['evo', 'Evolution']);
  if (c.hasHero) tabs.push(['hero', 'Hero']);
  if (c.hasEvolution && c.hasHero) tabs.push(['split', 'Split']);
  const split = art === 'split';
  const evo = art === 'evo' || split;
  const hero = art === 'hero' || split;
  const img = evo ? c.icons.evolution : hero ? c.icons.hero : c.icons.normal;
  return (
    <>
      {tabs.length > 1 && (
        <div style={{ position: 'relative', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tabs.map(([k, l]) => (
            <button key={k} type="button" className="chip" style={{ height: 30 }} aria-pressed={art === k} onClick={() => setArt(k)}>
              {l}
            </button>
          ))}
        </div>
      )}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        <CardTile slug={c.slug} label={c.name} img={img} img2={split ? c.icons.hero : null} split={split} rarity={c.rarity} evo={evo} hero={hero} elixir={c.elixir} size="XL" />
      </div>
    </>
  );
}

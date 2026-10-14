'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CardTile } from '@/components/CardTile';
import type { CardInfo, Rarity } from '@/lib/cards';

type El = 'all' | '1' | '2' | '3' | '4' | '5' | '6+';
type Cap = 'all' | 'evo' | 'hero' | 'both';

const RAR: ['all' | Rarity, string][] = [
  ['all', 'All'],
  ['common', 'Common'],
  ['rare', 'Rare'],
  ['epic', 'Epic'],
  ['legendary', 'Legendary'],
  ['champion', 'Champion'],
  ['tower', 'Tower'],
];

export function CardsGrid({ cards }: { cards: CardInfo[] }) {
  const [q, setQ] = useState('');
  const [rar, setRar] = useState<'all' | Rarity>('all');
  const [el, setEl] = useState<El>('all');
  const [cap, setCap] = useState<Cap>('all');
  const ql = q.trim().toLowerCase();
  const list = cards.filter(
    (c) =>
      (!ql || c.name.toLowerCase().includes(ql)) &&
      (rar === 'all' || c.rarity === rar) &&
      (el === 'all' || (el === '6+' ? (c.elixir ?? 0) >= 6 : c.elixir === Number(el))) &&
      (cap === 'all' || (cap === 'evo' ? c.hasEvolution : cap === 'hero' ? c.hasHero : c.hasEvolution && c.hasHero)),
  );
  const group = <T extends string>(label: string, v: T, set: (x: T) => void, opts: [T, string][]) => (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <span className="label-sm">{label}</span>
      {opts.map(([o, l]) => (
        <button key={o} type="button" className="chip" aria-pressed={v === o} onClick={() => set(o)}>
          {l}
        </button>
      ))}
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 22px', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--hair)' }}>
        <label className="field">
          <span className="label-sm" style={{ letterSpacing: '.12em' }}>
            FIND
          </span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Card name" aria-label="Find a card" style={{ width: 150 }} />
        </label>
        {group('RARITY', rar, setRar, RAR)}
        {group('ELIXIR', el, setEl, [
          ['all', 'Any'],
          ['1', '1'],
          ['2', '2'],
          ['3', '3'],
          ['4', '4'],
          ['5', '5'],
          ['6+', '6+'],
        ])}
        {group('HAS', cap, setCap, [
          ['all', 'Any'],
          ['evo', 'Evo'],
          ['hero', 'Hero'],
          ['both', 'Both'],
        ])}
        <span style={{ marginLeft: 'auto', font: '500 10px/1 var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)' }}>{list.length} CARDS</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(88px,1fr))', gap: '24px 14px' }}>
        {list.map((c) => (
          <Link key={c.id} href={`/cards/${c.slug}`} aria-label={c.name} style={{ color: 'var(--text-1)' }}>
            <CardTile slug={c.slug} label={c.name} img={c.icons.normal} rarity={c.rarity} evo={false} hero={false} size="M" showLabel />
          </Link>
        ))}
      </div>
    </div>
  );
}

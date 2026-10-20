'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CardTile } from '@/components/CardTile';
import { EmptyState } from '@/components/EmptyState';
import { CrownIcon, CycleIcon, ElixirIcon, TrophyIcon } from '@/components/ui/icons';
import { agoShort } from '@/lib/format';
import type { BattleKind, BattleRow, BattleSideInfo, PlayerProfile } from '@/lib/player/profile';
import { BattleKindIcon, KIND_LABEL } from './BattleKindIcon';
import s from './battles.module.css';

function Side({ side, align, href }: { side: BattleSideInfo; align: 'left' | 'right'; href?: string }) {
  return (
    <div className={s.side} data-align={align}>
      <div className={s.who}>
        {href ? (
          <Link href={href} className={s.pname}>
            {side.name}
          </Link>
        ) : (
          <span className={s.pname}>{side.name}</span>
        )}
        <span className={s.pclan}>{side.clan ?? 'No clan'}</span>
      </div>
      <div className={s.cards}>
        {side.cards.map((c, i) => (
          <div key={`${c.id}-${i}`} className={s.card}>
            <CardTile slug={c.slug} label={c.name} img={c.img} rarity={c.rarity} evo={c.evo} hero={c.hero} size="fluid" />
            <span className={s.lv}>{c.level != null ? `Lvl ${c.level}` : ''}</span>
          </div>
        ))}
      </div>
      <div className={s.foot}>
        {side.tower && (
          <span className={s.tower}>
            <span style={{ width: 28 }}>
              <CardTile slug={side.tower.slug} label={side.tower.name} img={side.tower.img} rarity="tower" size="fluid" />
            </span>
            <span>
              {side.tower.name}
              <br />
              <span style={{ color: 'var(--text-3)' }}>Lvl {side.tower.level ?? '—'}</span>
            </span>
          </span>
        )}
        {side.cards.length === 8 && (
          <>
            <span className={s.fact} title="Average elixir">
              <ElixirIcon size={15} />
              {side.avgElixir.toFixed(1)}
            </span>
            <span className={s.fact} title="4-card cycle">
              <CycleIcon size={15} />
              {side.cycle}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function Battle({ b }: { b: BattleRow }) {
  const res = b.result === 'win' ? 'Victory' : b.result === 'loss' ? 'Defeat' : 'Draw';
  return (
    <article className={s.battle} data-r={b.result} aria-label={`${res} · ${KIND_LABEL[b.kind]} · vs ${b.opp.name}`}>
      <span className={s.ribbon}>{res}</span>
      <header className={s.head}>
        <span className={s.mode}>
          <BattleKindIcon kind={b.kind} size={24} />
          {b.mode === 'Event' || b.mode === 'Path of Legends' ? KIND_LABEL[b.kind] : b.mode}
        </span>
        <span className={s.score}>
          <CrownIcon size={16} />
          <b>
            {b.crowns[0]} – {b.crowns[1]}
          </b>
          <CrownIcon size={16} style={{ filter: 'hue-rotate(140deg)' }} />
        </span>
        <span className={s.meta}>
          {b.trophyChange != null && b.trophyChange !== 0 && (
            <span style={{ color: b.trophyChange > 0 ? 'var(--blue-hi)' : 'var(--ember)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <TrophyIcon size={13} />
              {b.trophyChange > 0 ? '+' : '−'}
              {Math.abs(b.trophyChange)}
            </span>
          )}
          <span>{agoShort(b.hours) === 'now' ? 'just now' : `${agoShort(b.hours)} ago`}</span>
        </span>
      </header>
      <div className={s.sides}>
        <Side side={b.me} align="left" />
        <Side side={b.them} align="right" href={b.them.tag ? `/player/${b.them.tag}` : undefined} />
      </div>
    </article>
  );
}

export function BattlesTab({ p }: { p: PlayerProfile }) {
  const kinds = [...new Set(p.battles.map((b) => b.kind))] as BattleKind[];
  const [kind, setKind] = useState<BattleKind | 'all'>('all');
  const list = p.battles.filter((b) => kind === 'all' || b.kind === kind);
  if (!p.battles.length) return <EmptyState text="No battles in the log yet." />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <button type="button" className="chip" aria-pressed={kind === 'all'} onClick={() => setKind('all')}>
          All {p.battles.length}
        </button>
        {kinds.map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <BattleKindIcon kind={k} size={14} />
            {KIND_LABEL[k]} {p.battles.filter((b) => b.kind === k).length}
          </button>
        ))}
        <span className="label-sm" style={{ marginLeft: 'auto' }}>
          Battle log holds the last ~40 battles
        </span>
      </div>
      {list.map((b) => (
        <Battle key={b.id} b={b} />
      ))}
    </div>
  );
}

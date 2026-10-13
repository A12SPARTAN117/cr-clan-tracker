import Link from 'next/link';
import { CardTile } from './CardTile';
import { Decode } from './fx/Reveal';
import type { DeckStat } from '@/lib/meta';
import { fmt } from '@/lib/format';
import s from './DeckRow.module.css';

const pct = (n: number) => n.toFixed(1);

export function DeckRow({ deck, rank, href }: { deck: DeckStat; rank: number; href?: string }) {
  const strong = deck.win >= 53;
  const inner = (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <span className={s.rank} data-first={rank === 1}>
          {String(rank).padStart(2, '0')}
        </span>
        <span className={s.name}>{deck.name}</span>
        <span className={s.sub}>
          Avg {deck.avgElixir.toFixed(1)} · Cycle {deck.cycle}
        </span>
      </div>
      <div className={s.deckCards}>
        {deck.cards.map((c) => (
          <CardTile key={`${c.id}${c.evo}${c.hero}`} slug={c.slug} rarity={c.rarity} img={c.img} evo={c.evo} hero={c.hero} elixir={c.elixir} size="M" />
        ))}
        {deck.tower && (
          <>
            <span className={s.sep} />
            <CardTile slug={deck.tower.slug} label={deck.tower.name} img={deck.tower.img} rarity="tower" size="M" />
          </>
        )}
      </div>
      <div className={s.deckNums}>
        <div className={s.num}>
          <span className="label-sm">Use</span>
          <Decode className={s.numV}>{`${pct(deck.use)}%`}</Decode>
        </div>
        <div className={s.num}>
          <span className="label-sm">Win</span>
          <Decode className={s.numV} style={{ color: strong ? 'var(--blue-hi)' : 'var(--text-1)', textShadow: strong ? '0 0 14px rgba(58,160,255,.6)' : 'none' }}>
            {`${pct(deck.win)}%`}
          </Decode>
        </div>
        <div className={s.num}>
          <span className="label-sm">Games</span>
          <span style={{ font: '500 14px/22px var(--mono)', color: 'var(--text-2)' }}>{fmt(deck.games)}</span>
        </div>
      </div>
    </>
  );
  return href ? (
    <Link href={href} data-spot="" className={s.deckRow} style={{ color: 'inherit' }}>
      {inner}
    </Link>
  ) : (
    <div data-spot="" className={s.deckRow}>
      {inner}
    </div>
  );
}

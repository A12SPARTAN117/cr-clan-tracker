import Link from 'next/link';
import type { Rarity } from '@/lib/cards';
import type { DeckStat } from '@/lib/meta';
import { CardTile } from './CardTile';
import { CycleIcon, ElixirIcon } from './ui/icons';
import { fmt } from '@/lib/format';
import s from './DeckBlock.module.css';

export type BlockCard = { id: number; slug: string; name: string; img: string | null; rarity: Rarity; evo: boolean; hero: boolean; level?: number | null };
export type BlockTower = { slug: string; name: string; img: string | null; level?: number | null } | null;

export type DeckBlockProps = {
  name: string;
  cards: BlockCard[];
  tower?: BlockTower;
  avgElixir: number;
  cycle: number;
  rank?: number;
  /** Share of sampled decks, 0–100. */
  use?: number | null;
  games?: number | null;
  win?: number | null;
  /** The deck stats page. */
  href?: string;
  /** Extra controls in the header (e.g. a copy button). */
  action?: React.ReactNode;
};

const pct = (n: number) => `${n.toFixed(1)}%`;

/** DeckBlock props for a meta deck. */
export const metaDeck = (d: DeckStat) => ({ name: d.name, cards: d.cards, tower: d.tower, avgElixir: d.avgElixir, cycle: d.cycle, use: d.use, games: d.games, win: d.win });

/**
 * A deck as RoyaleAPI shows it: usage chip + name + "Deck stats" link, the eight cards in a
 * 4 × 2 grid of plain card art, and a footer with the tower troop, average elixir, 4-card
 * cycle and win rate.
 */
export function DeckBlock(p: DeckBlockProps) {
  const strong = p.win != null && p.win >= 53;
  const weak = p.win != null && p.win < 45;
  return (
    <article data-spot="" className={s.block} aria-label={`${p.name} deck`}>
      <header className={s.head}>
        {(p.use != null || p.games != null) && (
          <span className={s.chip} title={p.use != null ? `${pct(p.use)} of sampled decks · ${fmt(p.games)} games` : `${fmt(p.games)} games`}>
            {p.use != null && <b>{pct(p.use)}</b>}
            {p.games != null && <span>{fmt(p.games)}</span>}
          </span>
        )}
        {p.rank != null && (
          <span className={s.rank} data-first={p.rank === 1}>
            {String(p.rank).padStart(2, '0')}
          </span>
        )}
        {p.href ? (
          <Link href={p.href} className={s.name}>
            {p.name}
          </Link>
        ) : (
          <span className={s.name}>{p.name}</span>
        )}
        {p.action}
        {p.href && (
          <Link href={p.href} className={s.stats}>
            Deck stats <span aria-hidden>▸</span>
          </Link>
        )}
      </header>
      <div className={s.cards}>
        {p.cards.map((c, i) => (
          <CardTile key={`${c.id}-${i}`} slug={c.slug} label={c.name} img={c.img} rarity={c.rarity} evo={c.evo} hero={c.hero} level={c.level} size="fluid" />
        ))}
      </div>
      <footer className={s.foot}>
        {p.tower && (
          <span className={s.tower} title={`Tower troop: ${p.tower.name}`}>
            <CardTile slug={p.tower.slug} label={p.tower.name} img={p.tower.img} rarity="tower" size="S" />
          </span>
        )}
        <span className={s.fact} title="Average elixir cost">
          <ElixirIcon size={16} />
          <span className={s.factK}>Avg elixir</span>
          <b>{p.avgElixir.toFixed(1)}</b>
        </span>
        <span className={s.fact} title="Elixir to cycle the four cheapest cards">
          <CycleIcon size={16} />
          <span className={s.factK}>4-card cycle</span>
          <b>{p.cycle}</b>
        </span>
        {p.win != null && (
          <span className={s.win} data-tone={strong ? 'strong' : weak ? 'weak' : undefined}>
            <span className={s.factK}>Win</span>
            <b>{pct(p.win)}</b>
          </span>
        )}
      </footer>
    </article>
  );
}

/** Responsive grid of deck blocks. */
export function DeckGrid({ children, min = 320 }: { children: React.ReactNode; min?: number }) {
  return (
    <div className={s.grid} style={{ ['--min' as string]: `${min}px` }}>
      {children}
    </div>
  );
}

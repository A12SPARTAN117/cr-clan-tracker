import type { Metadata } from 'next';
import { CARDS, TOWER_TROOPS } from '@/lib/cards';
import { CardsGrid } from './CardsGrid';
import { CardsHeader } from './CardsHeader';

export const metadata: Metadata = { title: 'Cards', description: 'Every Clash Royale card, evolution, hero and tower troop, with live meta stats.' };

export default function CardsPage() {
  const all = [...CARDS, ...TOWER_TROOPS];
  return (
    <>
      <CardsHeader
        title="CARDS"
        line={`${CARDS.length} cards · ${CARDS.filter((c) => c.hasEvolution).length} evolutions · ${CARDS.filter((c) => c.hasHero).length} heroes · ${TOWER_TROOPS.length} tower troops`}
      />
      <main className="page" style={{ paddingTop: 28, gap: 24 }}>
        <CardsGrid cards={all} />
      </main>
    </>
  );
}

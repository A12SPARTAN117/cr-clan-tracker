import { describe, expect, it } from 'vitest';
import { packCards, unpackCards } from '@/lib/cardPack';
import { cardArt, CARDS } from '@/lib/cards';

const knight = CARDS.find((c) => c.slug === 'knight')!;
const evoCard = CARDS.find((c) => c.hasEvolution && c.icons.evolution)!;

describe('packCards / unpackCards', () => {
  it('round-trips a profile-shaped value exactly', () => {
    const value = {
      tag: 'ABC',
      when: new Date('2026-10-23T00:00:00Z'),
      deck: [
        { id: knight.id, slug: knight.slug, name: knight.name, rarity: knight.rarity, elixir: knight.elixir, evo: false, hero: false, level: 14 },
        { id: evoCard.id, slug: evoCard.slug, name: evoCard.name, rarity: evoCard.rarity, elixir: evoCard.elixir, evo: true, hero: false, img: cardArt(evoCard.slug, true), level: 13 },
      ],
      // A card the table doesn't know, and one whose art differs: both pass through as they are.
      odd: [
        { id: 1, slug: 'new-card', name: 'New Card', rarity: 'epic', img: 'https://example/x.png' },
        { id: knight.id, slug: knight.slug, name: knight.name, rarity: knight.rarity, img: 'https://example/other.png' },
      ],
      nested: { battles: [{ them: { cards: [{ id: knight.id, slug: knight.slug, name: knight.name, rarity: knight.rarity, count: 3 }] } }] },
      nothing: null,
    };
    const packed = packCards(value);
    expect(unpackCards(packed)).toEqual(value);
    expect((unpackCards(packed) as typeof value).when).toBeInstanceOf(Date);
  });

  it('leaves out what the card table knows', () => {
    const card = { id: knight.id, slug: knight.slug, name: knight.name, rarity: knight.rarity, elixir: knight.elixir, level: 14 };
    expect(JSON.stringify(packCards([card])).length).toBeLessThan(JSON.stringify([card]).length / 2);
  });
});

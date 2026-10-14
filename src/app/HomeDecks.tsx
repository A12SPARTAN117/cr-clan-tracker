'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DeckBlock, DeckGrid, type DeckBlockProps } from '@/components/DeckBlock';
import { ModeFilter, type ModeOption } from '@/components/ModeFilter';
import { deckHref } from '@/lib/decks';
import { fmt } from '@/lib/format';

export type HomeMode = ModeOption & { windowHours: number; battles: number; decks: (DeckBlockProps & { key: string })[] };

/** Top decks per game mode, switched with the icon filter. */
export function HomeDecks({ modes, players }: { modes: HomeMode[]; players: number }) {
  const [key, setKey] = useState(modes[0]?.key ?? 'pol');
  const m = modes.find((x) => x.key === key) ?? modes[0];
  if (!m) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <ModeFilter modes={modes} value={m.key} onChange={setKey} />
      {m.decks.length ? (
        <DeckGrid>
          {m.decks.map(({ key: k, ...d }, i) => (
            <DeckBlock key={k} {...d} rank={i + 1} href={deckHref(k, m.key)} />
          ))}
        </DeckGrid>
      ) : (
        <p className="body" style={{ padding: '24px 0' }}>
          Not enough {m.label} battles in the sample yet. Try another mode or{' '}
          <Link href={`/decks?mode=${m.key}`}>check the decks page</Link>.
        </p>
      )}
      <p className="label-sm" style={{ lineHeight: 1.6 }}>
        {m.label} · from {fmt(m.battles)} battles of {fmt(players)} sampled top players in the last {m.windowHours}h
      </p>
    </div>
  );
}

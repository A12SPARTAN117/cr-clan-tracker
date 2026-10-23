import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LostScene } from '@/components/LostScene';
import { Portal } from '@/components/fx/Portal';
import { packCards } from '@/lib/cardPack';
import { getMeta, listOf } from '@/lib/meta';
import { getMetaTrends } from '@/lib/metaHistory';
import { DecksView, type DecksMeta } from './DecksView';

export const metadata: Metadata = {
  title: 'Meta decks',
  description: 'Top Clash Royale decks right now, with use and win rates from the battle logs of the global Path of Legends top players.',
};

async function Content() {
  const meta = await getMeta();
  if (!meta) return <LostScene variant="error" />;
  // Only Ranked's decks come with the page (without matchups, players or crown splits, which
  // each deck's own page shows); other modes load from /api/meta/[mode] when picked. Sending
  // every mode made this page about 850 KB.
  const modes: DecksMeta['modes'] = {};
  for (const [k, m] of Object.entries(meta.modes)) {
    modes[k] = { mode: m.mode, label: m.label, kind: m.kind, windowHours: m.windowHours, battles: m.battles, sides: m.sides, count: m.decks.length, list: k === 'pol' ? listOf(m) : null };
  }
  // Deck of the day: the best win rate in Ultimate Champion among decks with enough games (at
  // least 8, or the top quarter by games when the sample is small).
  const dotdMode = meta.modes.uc?.decks.length ? 'uc' : 'pol';
  const pool = meta.modes[dotdMode].decks;
  const games = pool.map((d) => d.games).sort((a, b) => b - a);
  const min = Math.min(8, games[Math.floor(games.length / 4)] ?? 2);
  const best = [...pool].filter((d) => d.games >= min).sort((a, b) => b.win - a.win || b.games - a.games)[0];
  const dotd = best ? { mode: dotdMode, deck: { ...best, matchups: [], players: [], crowns: [] } } : null;
  // Trends come from stored daily snapshots (cached for an hour); they stream in under the mode picker.
  return <DecksView meta={packCards<DecksMeta>({ players: meta.players, order: meta.order, modes, dotd })} trends={getMetaTrends()} />;
}

export default function DecksPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Portal size={64} label="Loading meta" />
          <span className="label">Reading the top players&apos; battle logs…</span>
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LostScene } from '@/components/LostScene';
import { Portal } from '@/components/fx/Portal';
import { getMeta } from '@/lib/meta';
import { getMetaTrends } from '@/lib/metaHistory';
import { DecksView } from './DecksView';

export const metadata: Metadata = {
  title: 'Meta decks',
  description: 'Top Clash Royale decks right now, with use and win rates from the battle logs of the global Path of Legends top players.',
};

async function Content() {
  const meta = await getMeta();
  if (!meta) return <LostScene variant="error" />;
  // The list never shows matchups, players or crown splits (each deck's own page does), so they
  // stay on the server: this cuts what the browser downloads by about two thirds.
  const modes = Object.fromEntries(Object.entries(meta.modes).map(([k, m]) => [k, { ...m, decks: m.decks.map((d) => ({ ...d, matchups: [], players: [], crowns: [] })) }]));
  // Trends come from stored daily snapshots (cached for an hour); they stream in under the mode picker.
  return <DecksView meta={{ ...meta, modes }} trends={getMetaTrends()} />;
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

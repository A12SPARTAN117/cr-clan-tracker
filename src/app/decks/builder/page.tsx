import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LostScene } from '@/components/LostScene';
import { Portal } from '@/components/fx/Portal';
import { packMeta } from '@/lib/builder';
import { getMeta } from '@/lib/meta';
import { BuilderView } from './BuilderView';

export const metadata: Metadata = {
  title: 'Deck builder',
  description: 'Build a Clash Royale deck, filter cards by your levels, see how it did in the meta and which decks hard-counter it, then copy it to the game.',
};

async function Content() {
  const meta = await getMeta();
  if (!meta) return <LostScene variant="error" />;
  // Counters are ranked in the browser as the deck changes, so every mode's decks go down,
  // packed without art URLs, players or crown splits.
  return <BuilderView meta={packMeta(meta)} />;
}

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Portal size={64} label="Loading deck builder" />
          <span className="label">Reading the top players&apos; battle logs…</span>
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

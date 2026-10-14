import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Portal } from '@/components/fx/Portal';
import { LostScene } from '@/components/LostScene';
import { findDeck, getMeta, similarDecks } from '@/lib/meta';
import { DeckStatsView } from './DeckStatsView';

export const metadata: Metadata = { title: 'Deck stats' };

async function Content({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ key: raw }, sp, meta] = await Promise.all([params, searchParams, getMeta()]);
  if (!meta) return <LostScene variant="error" />;
  const key = decodeURIComponent(raw);
  const want = typeof sp.mode === 'string' ? sp.mode : undefined;
  const found = findDeck(meta, key, want && meta.modes[want] ? want : 'pol');
  if (!found)
    return (
      <main className="page" style={{ maxWidth: 900 }}>
        <Link href="/decks" className="link-mono">
          ← All decks
        </Link>
        <EmptyState text="This deck is not in the current meta sample. Meta decks refresh every hour from the last 24 hours of top battles." dashed />
      </main>
    );
  return (
    <DeckStatsView
      deck={found.deck}
      rank={found.rank}
      mode={found.mode}
      modeLabel={meta.modes[found.mode].label}
      sides={meta.modes[found.mode].sides}
      windowHours={meta.modes[found.mode].windowHours}
      similar={similarDecks(meta, found.deck, found.mode)}
    />
  );
}

export default function DeckPage(props: PageProps<'/decks/[key]'>) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Portal size={64} label="Loading deck" />
        </div>
      }
    >
      <Content params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

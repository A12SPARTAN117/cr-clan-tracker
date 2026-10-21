import type { Metadata } from 'next';
import { Suspense } from 'react';
import { after, connection } from 'next/server';
import { LostScene } from '@/components/LostScene';
import { PageLoading } from '@/components/PageLoading';
import { getProHistory, getPros, recordPros } from '@/lib/pros';
import { ProsView } from './ProsView';

export const metadata: Metadata = {
  title: 'Pro tracker',
  description: 'What the top 100 Path of Legends players are playing right now, and when they switch decks.',
};

async function Content() {
  const pros = await getPros(100);
  if (!pros) return <LostScene variant="error" />;
  // Deck history reads and writes the clock-stamped record, so it runs at request time.
  await connection();
  after(() => recordPros(pros));
  const { at, stints } = await getProHistory(pros.map((p) => p.tag));
  return <ProsView pros={pros} history={stints} at={at} />;
}

export default function ProsPage() {
  return (
    <Suspense fallback={<PageLoading label="Reading the top 100 profiles" />}>
      <Content />
    </Suspense>
  );
}

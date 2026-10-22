import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LostScene } from '@/components/LostScene';
import { PageLoading } from '@/components/PageLoading';
import { getProsPage } from '@/lib/pros';
import { ProsView } from './ProsView';

export const metadata: Metadata = {
  title: 'Pro tracker',
  description: 'What the top 100 Path of Legends players are playing right now, and when they switch decks.',
};

async function Content() {
  // Stored by the cron job: a view makes no API calls and no writes.
  const data = await getProsPage();
  if (!data) return <LostScene variant="error" />;
  return <ProsView pros={data.pros} history={data.history} at={data.at} />;
}

export default function ProsPage() {
  return (
    <Suspense fallback={<PageLoading label="Reading the top 100 profiles" />}>
      <Content />
    </Suspense>
  );
}

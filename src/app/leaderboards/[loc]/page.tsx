import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { PageLife } from '@/components/PageLife';
import { Boards } from '../page';
import { PodiumScene } from '../PodiumScene';

export const metadata: Metadata = { title: 'Leaderboards', description: 'Path of Legends, clan, clan war and event leaderboards, live from the official API.' };

/**
 * A location's boards (a region or country id). Rendered on the first visit and then served from
 * the page cache. Cache Components needs one param to check at build time; this placeholder
 * redirects to the global boards.
 */
export function generateStaticParams() {
  return [{ loc: '_' }];
}

async function Location({ params }: { params: Promise<{ loc: string }> }) {
  const { loc } = await params;
  if (!/^\d{1,10}$/.test(loc)) redirect('/leaderboards');
  return <Boards loc={loc} />;
}

export default function LocationBoardsPage({ params }: PageProps<'/leaderboards/[loc]'>) {
  return (
    <>
      <PageLife every="fiveMinutes" />
      <Suspense fallback={<PodiumScene rows={[]} label="" isClan={false} />}>
        <Location params={params} />
      </Suspense>
    </>
  );
}

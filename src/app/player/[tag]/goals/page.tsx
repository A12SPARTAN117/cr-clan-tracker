import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLife } from '@/components/PageLife';
import { LostScene } from '@/components/LostScene';
import { PageLoading } from '@/components/PageLoading';
import { getPlayer } from '@/lib/cr/api';
import { SeenBeacon } from '@/components/SeenBeacon';
import { checkTag } from '@/lib/tags';
import { goalsPage } from './data';
import { GoalsView } from './GoalsView';

/**
 * Rendered on the first visit and then served from the page cache (refreshed every 10 minutes,
 * see components/PageLife). Cache Components needs one param to check that at build time; this
 * placeholder renders the not-found scene.
 */
export function generateStaticParams() {
  return [{ tag: '_' }];
}

export async function generateMetadata({ params }: PageProps<'/player/[tag]/goals'>): Promise<Metadata> {
  const c = checkTag(decodeURIComponent((await params).tag));
  if (c.kind !== 'valid') return { title: 'Season goals' };
  const r = await getPlayer(c.tag);
  return { title: r.ok ? `${r.data.name} · Season goals` : 'Season goals' };
}

async function Content({ params }: { params: Promise<{ tag: string }> }) {
  const raw = decodeURIComponent((await params).tag);
  const c = checkTag(raw);
  if (c.kind !== 'valid') return <LostScene variant="player" tag={raw.replace(/^#/, '').toUpperCase()} />;
  const page = await goalsPage(c.tag);
  if (!page.ok) return <LostScene variant={page.status === 404 ? 'player' : 'error'} tag={c.tag} />;
  return (
    <>
      <GoalsView name={page.name} tag={page.tag} metrics={page.metrics} today={page.today} trackedSince={page.trackedSince} />
      {/* Opening goals keeps daily snapshots going. */}
      <SeenBeacon kind="player" tag={c.tag} />
    </>
  );
}

export default function GoalsPage({ params }: PageProps<'/player/[tag]/goals'>) {
  return (
    <>
      <PageLife every="tenMinutes" />
      <Suspense fallback={<PageLoading label="Loading goals" />}>
        <Content params={params} />
      </Suspense>
    </>
  );
}

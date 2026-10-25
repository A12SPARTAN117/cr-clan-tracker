import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLife } from '@/components/PageLife';
import { LostScene } from '@/components/LostScene';
import { PageLoading } from '@/components/PageLoading';
import { SeenBeacon } from '@/components/SeenBeacon';
import { playerName } from '../data';
import { checkTag } from '@/lib/tags';
import { rivalsPage } from './data';
import { RivalsView } from './RivalsView';

/**
 * Rendered on the first visit and then served from the page cache (refreshed every 10 minutes,
 * see components/PageLife). Cache Components needs one param to check that at build time; this
 * placeholder renders the not-found scene.
 */
export function generateStaticParams() {
  return [{ tag: '_' }];
}

export async function generateMetadata({ params }: PageProps<'/player/[tag]/rivals'>): Promise<Metadata> {
  const c = checkTag(decodeURIComponent((await params).tag));
  if (c.kind !== 'valid') return { title: 'Player not found' };
  const name = await playerName(c.tag);
  return { title: name ? `${name} · Rivals` : 'Player not found' };
}

async function Content({ params }: { params: Promise<{ tag: string }> }) {
  const raw = decodeURIComponent((await params).tag);
  const c = checkTag(raw);
  if (c.kind !== 'valid') return <LostScene variant="player" tag={raw.replace(/^#/, '').toUpperCase()} />;
  const page = await rivalsPage(c.tag);
  if (!page.ok) return <LostScene variant={page.status === 404 ? 'player' : 'error'} tag={c.tag} />;
  return (
    <>
      <RivalsView name={page.name} tag={page.tag} character={page.character} rivals={page.rivals} logSize={page.logSize} at={page.at} />
      {/* Opening Rivals keeps the player tracked and stores their latest games, like the profile does. */}
      <SeenBeacon kind="player" tag={c.tag} />
    </>
  );
}

export default function RivalsPage({ params }: PageProps<'/player/[tag]/rivals'>) {
  return (
    <>
      <PageLife every="tenMinutes" />
      <Suspense fallback={<PageLoading label="Loading rivals" />}>
        <Content params={params} />
      </Suspense>
    </>
  );
}

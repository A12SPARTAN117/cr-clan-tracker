import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLife } from '@/components/PageLife';
import { LostScene } from '@/components/LostScene';
import { SeenBeacon } from '@/components/SeenBeacon';
import { Portal } from '@/components/fx/Portal';
import { checkTag } from '@/lib/tags';
import { playerName, playerPage } from './data';
import { PlayerView } from './PlayerView';

/**
 * Profiles are rendered on a player's first visit and then served from the cache (refreshed
 * every 10 minutes, see components/PageLife), so the page reads nothing per request. Cache Components needs
 * one param to check that at build time; this placeholder renders the not-found scene.
 */
export function generateStaticParams() {
  return [{ tag: '_' }];
}

export async function generateMetadata({ params }: PageProps<'/player/[tag]'>): Promise<Metadata> {
  const c = checkTag(decodeURIComponent((await params).tag));
  if (c.kind !== 'valid') return { title: 'Player not found' };
  const name = await playerName(c.tag);
  return { title: name ? `${name} (#${c.tag})` : 'Player not found' };
}

async function Content({ params }: { params: Promise<{ tag: string }> }) {
  const raw = decodeURIComponent((await params).tag);
  const c = checkTag(raw);
  if (c.kind !== 'valid') return <LostScene variant="player" tag={raw.replace(/^#/, '').toUpperCase()} />;
  const page = await playerPage(c.tag);
  if (!page.ok) return <LostScene variant={page.status === 404 ? 'player' : 'error'} tag={c.tag} />;
  return (
    <>
      <PlayerView data={page.data} />
      <SeenBeacon kind="player" tag={c.tag} />
    </>
  );
}

export default function PlayerPage({ params }: PageProps<'/player/[tag]'>) {
  return (
    <>
      <PageLife every="tenMinutes" />
      <Suspense
        fallback={
          <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Portal size={72} label="Loading player" />
            <span className="label">Loading card data</span>
          </div>
        }
      >
        <Content params={params} />
      </Suspense>
    </>
  );
}

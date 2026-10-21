import type { Metadata } from 'next';
import { Suspense } from 'react';
import { after, connection } from 'next/server';
import { LostScene } from '@/components/LostScene';
import { PageLoading } from '@/components/PageLoading';
import { getPlayer } from '@/lib/cr/api';
import { getPlayerHistory } from '@/lib/history';
import { trackPlayer } from '@/lib/history/snapshot';
import { metricsOf } from '@/lib/player/goals';
import { getPlayerProfile } from '@/lib/player/profile';
import { checkTag } from '@/lib/tags';
import { GoalsView } from './GoalsView';

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
  const r = await getPlayer(c.tag);
  if (!r.ok) return <LostScene variant={r.status === 404 ? 'player' : 'error'} tag={c.tag} />;
  // Request time: today's date sets the pace window, and opening goals keeps daily snapshots going.
  await connection();
  after(() => trackPlayer(r.data));
  const [p, h] = await Promise.all([getPlayerProfile(c.tag), getPlayerHistory(c.tag)]);
  if (!p) return <LostScene variant="error" tag={c.tag} />;
  const metrics = metricsOf({
    trophies: p.trophies,
    seasonalTrophies: p.seasonal?.trophies ?? null,
    polLeague: p.pol.current?.league ?? null,
    polRating: p.pol.current && p.pol.current.league >= 7 ? p.pol.current.rating : null,
    warWins: p.totals.warWins,
    wins: p.totals.wins,
    collectionLevel: p.collectionLevel,
    maxCards: p.collection.filter((x) => x.owned && x.level === 16).length,
    days: h?.days ?? [],
  });
  return <GoalsView name={p.name} tag={p.tag} metrics={metrics} today={p.generatedAt.slice(0, 10)} trackedSince={h?.trackedSince ?? null} />;
}

export default function GoalsPage({ params }: PageProps<'/player/[tag]/goals'>) {
  return (
    <Suspense fallback={<PageLoading label="Loading goals" />}>
      <Content params={params} />
    </Suspense>
  );
}

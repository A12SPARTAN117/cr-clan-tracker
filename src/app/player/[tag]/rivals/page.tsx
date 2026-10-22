import type { Metadata } from 'next';
import { Suspense } from 'react';
import { after, connection } from 'next/server';
import { onceEvery, VIEW_WRITE_MS } from '@/lib/throttle';
import { LostScene } from '@/components/LostScene';
import { PageLoading } from '@/components/PageLoading';
import { getBattleLog, getPlayer } from '@/lib/cr/api';
import { getRivals, saveBattles } from '@/lib/history/battles';
import { trackPlayer } from '@/lib/history/snapshot';
import { getPlayerProfile } from '@/lib/player/profile';
import { checkTag } from '@/lib/tags';
import { RivalsView } from './RivalsView';

export async function generateMetadata({ params }: PageProps<'/player/[tag]/rivals'>): Promise<Metadata> {
  const c = checkTag(decodeURIComponent((await params).tag));
  if (c.kind !== 'valid') return { title: 'Player not found' };
  const r = await getPlayer(c.tag);
  return { title: r.ok ? `${r.data.name} · Rivals` : 'Player not found' };
}

async function Content({ params }: { params: Promise<{ tag: string }> }) {
  const raw = decodeURIComponent((await params).tag);
  const c = checkTag(raw);
  if (c.kind !== 'valid') return <LostScene variant="player" tag={raw.replace(/^#/, '').toUpperCase()} />;
  const r = await getPlayer(c.tag);
  if (!r.ok) return <LostScene variant={r.status === 404 ? 'player' : 'error'} tag={c.tag} />;
  // Background work below reads the clock, so it must run at request time, not in a prerender.
  await connection();
  const [p, rivals, log] = await Promise.all([getPlayerProfile(c.tag), getRivals(c.tag, 50), getBattleLog(c.tag)]);
  if (!p) return <LostScene variant="error" tag={c.tag} />;
  // Opening Rivals keeps the player tracked and stores their latest games, like the profile does.
  after(() => trackPlayer(r.data));
  if (log.ok && onceEvery(`seen:${c.tag}`, VIEW_WRITE_MS)) after(() => saveBattles(c.tag, log.data));
  return <RivalsView name={p.name} tag={p.tag} character={p.favourite?.render ?? null} rivals={rivals} logSize={p.battles.length} at={Date.parse(p.generatedAt)} />;
}

export default function RivalsPage({ params }: PageProps<'/player/[tag]/rivals'>) {
  return (
    <Suspense fallback={<PageLoading label="Loading rivals" />}>
      <Content params={params} />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { after, connection } from 'next/server';
import { onceEvery, VIEW_WRITE_MS } from '@/lib/throttle';
import { LostScene } from '@/components/LostScene';
import { PageLoading } from '@/components/PageLoading';
import { getBattleLog, getPlayer } from '@/lib/cr/api';
import { eventRanksOf } from '@/lib/events';
import { getHeadToHead, saveBattles } from '@/lib/history/battles';
import { getPlayerProfile } from '@/lib/player/profile';
import { checkTag } from '@/lib/tags';
import { HeadToHeadView, type Side } from './HeadToHeadView';
import type { PlayerProfile } from '@/lib/player/profile';

type Params = Promise<{ tag: string; rival: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { tag, rival } = await params;
  const a = checkTag(decodeURIComponent(tag));
  const b = checkTag(decodeURIComponent(rival));
  if (a.kind !== 'valid' || b.kind !== 'valid') return { title: 'Rivals' };
  const [pa, pb] = await Promise.all([getPlayer(a.tag), getPlayer(b.tag)]);
  return { title: pa.ok && pb.ok ? `${pa.data.name} vs ${pb.data.name}` : 'Rivals' };
}

/** What the head-to-head page shows for one player. */
function side(p: PlayerProfile): Side {
  return {
    tag: p.tag,
    name: p.name,
    clan: p.clan?.name ?? null,
    trophies: p.seasonal?.trophies ?? p.trophies,
    best: p.seasonal?.best ?? p.bestTrophies,
    seasonal: !!p.seasonal,
    pol: { current: p.pol.current, best: p.pol.best },
    recent: p.battles.slice(0, 8).map((b) => ({ id: b.id, kind: b.kind, result: b.result, crowns: b.crowns, opp: b.opp.name, hours: b.hours })),
    character: p.favourite?.render ?? null,
  };
}

async function Content({ params }: { params: Params }) {
  const { tag, rival } = await params;
  const a = checkTag(decodeURIComponent(tag));
  const b = checkTag(decodeURIComponent(rival));
  if (a.kind !== 'valid') return <LostScene variant="player" tag={decodeURIComponent(tag).replace(/^#/, '').toUpperCase()} />;
  if (b.kind !== 'valid') return <LostScene variant="player" tag={decodeURIComponent(rival).replace(/^#/, '').toUpperCase()} />;
  // Background work and live event ranks read the clock, so this runs at request time.
  await connection();
  const [pa, pb, games, logA, logB] = await Promise.all([getPlayerProfile(a.tag), getPlayerProfile(b.tag), getHeadToHead(a.tag, b.tag), getBattleLog(a.tag), getBattleLog(b.tag)]);
  if (!pa) return <LostScene variant="player" tag={a.tag} />;
  if (!pb) return <LostScene variant="player" tag={b.tag} />;
  // Both players' latest games are stored, so the head-to-head keeps growing.
  if (logA.ok && onceEvery(`seen:${a.tag}`, VIEW_WRITE_MS)) after(() => saveBattles(a.tag, logA.data));
  if (logB.ok && onceEvery(`seen:${b.tag}`, VIEW_WRITE_MS)) after(() => saveBattles(b.tag, logB.data));
  // Live event ranks need each board's full listing; they stream in.
  const ranksA = eventRanksOf(a.tag).catch(() => []);
  const ranksB = eventRanksOf(b.tag).catch(() => []);
  return <HeadToHeadView a={side(pa)} b={side(pb)} games={games} ranksA={ranksA} ranksB={ranksB} at={Date.parse(pa.generatedAt)} />;
}

export default function HeadToHeadPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<PageLoading label="Loading head to head" />}>
      <Content params={params} />
    </Suspense>
  );
}

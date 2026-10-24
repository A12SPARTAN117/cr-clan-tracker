import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLife } from '@/components/PageLife';
import { cacheLife, cacheTag } from 'next/cache';
import { LostScene } from '@/components/LostScene';
import { PageLoading } from '@/components/PageLoading';
import { SeenBeacon } from '@/components/SeenBeacon';
import { getPlayer, tags } from '@/lib/cr/api';
import { getHeadToHead } from '@/lib/history/battles';
import type { H2HGame } from '@/lib/player/rivals';
import { getPlayerProfile } from '@/lib/player/profile';
import { checkTag } from '@/lib/tags';
import { HeadToHeadView, type Side } from './HeadToHeadView';
import type { PlayerProfile } from '@/lib/player/profile';

type Params = Promise<{ tag: string; rival: string }>;

/**
 * Rendered on the first visit and then served from the page cache (refreshed at most once a
 * minute, see ./data). Cache Components needs one param to check that at build time; this
 * placeholder renders the not-found scene.
 */
export function generateStaticParams() {
  return [{ tag: '_', rival: '_' }];
}


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

type H2HPage = { ok: true; a: Side; b: Side; games: H2HGame[]; at: number } | { ok: false; missing: string };

/** Both sides and every game between them, cached per pair for a minute. */
async function h2hPage(a: string, b: string): Promise<H2HPage> {
  'use cache';
  cacheTag(tags.player(a), tags.player(b));
  const [pa, pb, games] = await Promise.all([getPlayerProfile(a), getPlayerProfile(b), getHeadToHead(a, b)]);
  if (!pa || !pb) {
    cacheLife('crError');
    return { ok: false, missing: pa ? b : a };
  }
  cacheLife('crLive');
  return { ok: true, a: side(pa), b: side(pb), games, at: Date.parse(pa.generatedAt) };
}

async function Content({ params }: { params: Params }) {
  const { tag, rival } = await params;
  const a = checkTag(decodeURIComponent(tag));
  const b = checkTag(decodeURIComponent(rival));
  if (a.kind !== 'valid') return <LostScene variant="player" tag={decodeURIComponent(tag).replace(/^#/, '').toUpperCase()} />;
  if (b.kind !== 'valid') return <LostScene variant="player" tag={decodeURIComponent(rival).replace(/^#/, '').toUpperCase()} />;
  const page = await h2hPage(a.tag, b.tag);
  if (!page.ok) return <LostScene variant="player" tag={page.missing} />;
  return (
    <>
      <HeadToHeadView a={page.a} b={page.b} games={page.games} at={page.at} />
      {/* Both players' latest games are stored, so the head-to-head keeps growing. */}
      <SeenBeacon kind="games" tag={a.tag} />
      <SeenBeacon kind="games" tag={b.tag} />
    </>
  );
}

export default function HeadToHeadPage({ params }: { params: Params }) {
  return (
    <>
      <PageLife every="minute" />
      <Suspense fallback={<PageLoading label="Loading head to head" />}>
        <Content params={params} />
      </Suspense>
    </>
  );
}

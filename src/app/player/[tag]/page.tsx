import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LostScene } from '@/components/LostScene';
import { Portal } from '@/components/fx/Portal';
import { getBattleLog, getPlayer } from '@/lib/cr/api';
import { getPlayerProfile } from '@/lib/player/profile';
import { getPlayerHistory } from '@/lib/history';
import { trackPlayer } from '@/lib/history/snapshot';
import { getRivals, saveBattles } from '@/lib/history/battles';
import { eventRanksOf } from '@/lib/events';
import { checkTag } from '@/lib/tags';
import { recordBadgeArt } from '@/lib/badgeArt';
import { indexPlayers } from '@/lib/directory';
import { after, connection } from 'next/server';
import { PlayerView } from './PlayerView';

export async function generateMetadata({ params }: PageProps<'/player/[tag]'>): Promise<Metadata> {
  const c = checkTag(decodeURIComponent((await params).tag));
  if (c.kind !== 'valid') return { title: 'Player not found' };
  const r = await getPlayer(c.tag);
  return { title: r.ok ? `${r.data.name} (#${c.tag})` : 'Player not found' };
}

async function Content({ params }: { params: Promise<{ tag: string }> }) {
  const raw = decodeURIComponent((await params).tag);
  const c = checkTag(raw);
  if (c.kind !== 'valid') return <LostScene variant="player" tag={raw.replace(/^#/, '').toUpperCase()} />;
  const r = await getPlayer(c.tag);
  if (!r.ok) return <LostScene variant={r.status === 404 ? 'player' : 'error'} tag={c.tag} />;
  // Background work below reads the clock, so it must run at request time, not in a prerender.
  await connection();
  after(() => indexPlayers([{ tag: r.data.tag, name: r.data.name, clanTag: r.data.clan?.tag, clanName: r.data.clan?.name, trophies: r.data.trophies }]));
  // Opening a profile starts (or keeps up) its daily snapshots, so history builds from here on.
  after(() => trackPlayer(r.data));
  const [p, history, rivals, log] = await Promise.all([getPlayerProfile(c.tag), getPlayerHistory(c.tag), getRivals(c.tag), getBattleLog(c.tag)]);
  if (!p) return <LostScene variant="error" tag={c.tag} />;
  // Everyone they played against goes into the name-search directory too.
  after(() => indexPlayers(p.battles.flatMap((b) => (b.them.tag ? [{ tag: b.them.tag, name: b.them.name, clanName: b.them.clan }] : []))));
  // Each badge level's art, for the asset checklist (the API only shows the level they own).
  after(() => recordBadgeArt(p.badges));
  // Their 1v1 games are kept past the API's ~40, so head-to-head records keep growing.
  if (log.ok) after(() => saveBattles(c.tag, log.data));
  // Live event ranks need each board's full listing; they stream into the Badges tab.
  const eventRanks = eventRanksOf(c.tag).catch(() => []);
  return <PlayerView p={p} history={history} rivals={rivals} eventRanks={eventRanks} />;
}

export default function PlayerPage({ params }: PageProps<'/player/[tag]'>) {
  return (
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
  );
}

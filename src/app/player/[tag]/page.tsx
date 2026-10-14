import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LostScene } from '@/components/LostScene';
import { Portal } from '@/components/fx/Portal';
import { getPlayer } from '@/lib/cr/api';
import { getPlayerProfile } from '@/lib/player/profile';
import { getPlayerHistory } from '@/lib/history';
import { checkTag } from '@/lib/tags';
import { indexPlayers } from '@/lib/directory';
import { after } from 'next/server';
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
  after(() => indexPlayers([{ tag: r.data.tag, name: r.data.name, clanTag: r.data.clan?.tag, clanName: r.data.clan?.name, trophies: r.data.trophies }]));
  const [p, history] = await Promise.all([getPlayerProfile(c.tag), getPlayerHistory(c.tag)]);
  if (!p) return <LostScene variant="error" tag={c.tag} />;
  return <PlayerView p={p} history={history} />;
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

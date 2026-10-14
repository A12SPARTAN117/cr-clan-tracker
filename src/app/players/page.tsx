import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Reveal } from '@/components/fx/Reveal';
import { TagSearch } from '@/components/TagSearch';
import { LeagueIcon, PolRating } from '@/components/ui/primitives';
import { getPolLeaderboard } from '@/lib/cr/api';
import { PinnedPlayer } from './PinnedPlayer';

export const metadata: Metadata = { title: 'Players' };

async function TopPlayers() {
  const r = await getPolLeaderboard('global', 10);
  if (!r.ok) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))', gap: 1, background: 'var(--hair)', border: '1px solid var(--hair)', borderRadius: 8, overflow: 'hidden' }}>
      {r.data.items.map((p) => (
        <Link
          key={p.tag}
          href={`/player/${p.tag.replace('#', '')}`}
          data-spot=""
          className="spot"
          style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 12, alignItems: 'center', padding: '14px 16px', color: 'var(--text-1)' }}
        >
          <span style={{ font: '700 13px/1 var(--mono)', color: p.rank === 1 ? 'var(--gold)' : 'var(--text-3)' }}>{String(p.rank).padStart(2, '0')}</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span style={{ font: '600 15px/1.1 var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            <span className="label-sm" style={{ letterSpacing: '.1em' }}>
              {p.clan?.name ?? 'No clan'}
            </span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LeagueIcon league={7} size={22} />
            <PolRating rating={p.eloRating} size={16} style={{ font: '700 14px/1 var(--mono)' }} />
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function PlayersPage() {
  return (
    <main className="page" style={{ maxWidth: 1180 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <span className="label">Players · profile, collection, badges, battles</span>
        <Reveal as="h1" className="display-l">
          LOOK UP
          <br />
          ANY PLAYER
        </Reveal>
        <div style={{ maxWidth: 640 }}>
          <TagSearch size="default" scope="player" />
        </div>
      </header>
      <PinnedPlayer />
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="label">Path of Legends · global top 10</span>
          <Link href="/leaderboards" className="link-mono" style={{ fontSize: 10 }}>
            Full leaderboard →
          </Link>
        </div>
        <Suspense fallback={<span className="skeleton" style={{ height: 240 }} />}>
          <TopPlayers />
        </Suspense>
      </section>
    </main>
  );
}

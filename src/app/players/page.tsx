import type { Metadata } from 'next';
import { HoverLink } from '@/components/ui/HoverLink';
import { Suspense } from 'react';
import { Reveal } from '@/components/fx/Reveal';
import { TagSearch } from '@/components/TagSearch';
import { LeagueIcon, PolRating } from '@/components/ui/primitives';
import { getPolLeaderboard } from '@/lib/cr/api';
import { PinnedPlayer } from './PinnedPlayer';
import { TrophyIcon } from '@/components/ui/icons';
import { fmt } from '@/lib/format';
import { search } from '@/lib/search';
import { TagFirst } from '@/components/TagFirst';

export const metadata: Metadata = { title: 'Players' };

async function TopPlayers() {
  const r = await getPolLeaderboard('global', 10);
  if (!r.ok) return null;
  return (
    <div className="cells" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))' }}>
      {r.data.items.map((p) => (
        <HoverLink
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
        </HoverLink>
      ))}
    </div>
  );
}

/** Player-only search results for ?q= (names contain the text, or an exact tag). */
async function PlayerResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 40) ?? '';
  if (!q) return null;
  const r = await search(q, 'player', 100);
  const rows = [...(r.tagPlayer ? [r.tagPlayer] : []), ...r.players.filter((p) => p.tag !== r.tagPlayer?.tag)];
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span className="label">Players matching &quot;{q}&quot;</span>
        <span className="label">{rows.length} results</span>
      </div>
      {rows.length ? (
        <div className="cells" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))' }}>
          {rows.map((p) => (
            <HoverLink key={p.tag} href={`/player/${p.tag}`} data-spot="" className="spot" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '14px 16px', color: 'var(--text-1)' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ font: '600 15px/1.1 var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                <span className="label-sm" style={{ letterSpacing: '.1em' }}>
                  #{p.tag} · {p.clanName ?? 'No clan'}
                </span>
              </span>
              {p.trophies != null && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 13px/1 var(--mono)', color: 'var(--text-2)' }}>
                  <TrophyIcon size={14} />
                  {fmt(p.trophies)}
                </span>
              )}
            </HoverLink>
          ))}
        </div>
      ) : (
        <p className="body" style={{ fontSize: 14 }}>
          No players by that name yet.
        </p>
      )}
      <TagFirst found={rows.length > 0} />
    </section>
  );
}

export default function PlayersPage(props: PageProps<'/players'>) {
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
          <TagSearch size="default" scope="player" resultsPath="/players" />
        </div>
      </header>
      <Suspense fallback={<span className="skeleton" style={{ height: 120 }} />}>
        <PlayerResults searchParams={props.searchParams} />
      </Suspense>
      <PinnedPlayer />
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="label">Path of Legends · global top 10</span>
          <HoverLink href="/leaderboards" className="link-mono" style={{ fontSize: 10 }}>
            Full leaderboard →
          </HoverLink>
        </div>
        <Suspense fallback={<span className="skeleton" style={{ height: 240 }} />}>
          <TopPlayers />
        </Suspense>
      </section>
    </main>
  );
}

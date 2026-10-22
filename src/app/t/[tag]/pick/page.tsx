import { HoverLink } from '@/components/ui/HoverLink';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getClan, getPlayer } from '@/lib/cr/api';
import { cleanTag } from '@/lib/tags';
import { fmt } from '@/lib/format';
import { ClanBadge } from '@/components/ui/ClanBadge';
import { Reveal } from '@/components/fx/Reveal';

export const metadata: Metadata = { title: 'Player or clan?' };

const card: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  gap: 20,
  alignItems: 'center',
  padding: 22,
  color: 'var(--text-1)',
};

async function Choices({ params }: { params: Promise<{ tag: string }> }) {
  const tag = cleanTag(decodeURIComponent((await params).tag));
  const [player, clan] = await Promise.all([getPlayer(tag), getClan(tag)]);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 16 }}>
      {player.ok && (
        <HoverLink href={`/player/${tag}`} data-spot="" className="panel spot ticks" style={card}>
          <span className="label-sm">Player</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            <span style={{ font: '800 26px/1 var(--mono)', letterSpacing: '-.04em' }}>{player.data.name}</span>
            <span style={{ font: '500 11px/1.4 var(--mono)', letterSpacing: '.08em', color: 'var(--text-2)' }}>
              #{tag} · {fmt(player.data.trophies)} trophies{player.data.clan ? ` · ${player.data.clan.name}` : ''}
            </span>
          </span>
          <span className="link-mono">Open →</span>
        </HoverLink>
      )}
      {clan.ok && (
        <HoverLink href={`/clan/${tag}`} data-spot="" className="panel spot ticks" style={card}>
          <ClanBadge badgeId={clan.data.badgeId} size={48} name={clan.data.name} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            <span style={{ font: '800 26px/1 var(--mono)', letterSpacing: '-.04em' }}>{clan.data.name}</span>
            <span style={{ font: '500 11px/1.4 var(--mono)', letterSpacing: '.08em', color: 'var(--text-2)' }}>
              #{tag} · Clan · {clan.data.members}/50
            </span>
          </span>
          <span className="link-mono">Open →</span>
        </HoverLink>
      )}
    </div>
  );
}

export default function PickPage({ params }: PageProps<'/t/[tag]/pick'>) {
  return (
    <main className="page" style={{ maxWidth: 1080 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="label">Search · one tag, two matches</span>
        <Reveal as="h1" className="display-l">
          PLAYER
          <br />
          OR CLAN?
        </Reveal>
        <p className="body">Players and clans can share a tag. Pick the one you meant.</p>
      </header>
      <Suspense fallback={<div className="skeleton" style={{ height: 96 }} />}>
        <Choices params={params} />
      </Suspense>
    </main>
  );
}

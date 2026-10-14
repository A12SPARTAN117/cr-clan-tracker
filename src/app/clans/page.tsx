import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Reveal } from '@/components/fx/Reveal';
import { EmptyState } from '@/components/EmptyState';
import { ClanBadge } from '@/components/ui/ClanBadge';
import { getClanWarRankings, getLocations, searchClans } from '@/lib/cr/api';
import type { Clan } from '@/lib/cr/types';
import { fmt } from '@/lib/format';
import { MembersIcon, TrophyIcon, WarTrophyIcon } from '@/components/ui/icons';
import { ClanFilters } from './ClanFilters';

export const metadata: Metadata = { title: 'Find a clan' };

type Row = { tag: string; name: string; badgeId: number; location?: { name: string }; members: number; clanWarTrophies?: number; requiredTrophies?: number; type?: Clan['type']; rank?: number };

const TYPE_LABEL = { open: 'OPEN', inviteOnly: 'INVITE ONLY', closed: 'CLOSED' } as const;

function ClanCard({ c }: { c: Row }) {
  const tag = c.tag.replace('#', '');
  return (
    <Link
      href={`/clan/${tag}`}
      data-spot=""
      className="panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 20,
        color: 'var(--text-1)',
        background: 'radial-gradient(260px circle at var(--mx,-400px) var(--my,-400px),rgba(58,160,255,.12),transparent 70%),var(--charcoal)',
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <ClanBadge badgeId={c.badgeId} size={52} name={c.name} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <span style={{ font: '800 20px/1.05 var(--mono)', letterSpacing: '-.03em', overflowWrap: 'anywhere' }}>{c.name}</span>
          <span style={{ font: '500 10px/1 var(--mono)', letterSpacing: '.1em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
            #{tag}
            {c.location ? ` · ${c.location.name}` : ''}
          </span>
        </div>
        {c.rank != null && <span style={{ marginLeft: 'auto', font: '700 13px/1 var(--mono)', color: c.rank === 1 ? 'var(--gold)' : 'var(--text-3)' }}>#{c.rank}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, paddingTop: 14, borderTop: '1px solid var(--hair)' }}>
        {(
          [
            ['MEMBERS', `${c.members}/50`, <MembersIcon key="i" size={13} />],
            ['WAR TR.', fmt(c.clanWarTrophies), <WarTrophyIcon key="i" size={13} />],
            ['REQ.', c.requiredTrophies != null ? fmt(c.requiredTrophies) : '—', <TrophyIcon key="i" size={13} />],
          ] as const
        ).map(([k, v, icon]) => (
          <span key={k} style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
            <span className="label-sm" style={{ letterSpacing: '.12em' }}>
              {k}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '700 15px/1 var(--mono)', whiteSpace: 'nowrap' }}>
              {icon}
              {v}
            </span>
          </span>
        ))}
      </div>
      {c.type && (
        <span style={{ font: '500 9px/1 var(--mono)', letterSpacing: '.14em', color: c.type === 'open' ? 'var(--blue)' : c.type === 'closed' ? 'var(--ember)' : 'var(--text-2)' }}>
          {TYPE_LABEL[c.type]}
        </span>
      )}
    </Link>
  );
}

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? '';
  const q = one('q').trim();
  const loc = Number(one('loc')) || undefined;
  const minM = Number(one('minM')) || 0;
  const minW = Number(one('minW')) || 0;
  const type = one('type');

  let rows: Row[] = [];
  let title: string;
  let failed = false;
  if (q.length >= 3 || minM > 0) {
    const r = await searchClans({ name: q.length >= 3 ? q : undefined, locationId: loc, minMembers: minM || undefined, limit: 100 });
    failed = !r.ok;
    rows = r.ok ? r.data.items : [];
    title = q ? `Clans named "${q}"` : 'Search results';
  } else {
    const r = await getClanWarRankings(loc ?? 'global', 60);
    failed = !r.ok;
    // In the clan-war ranking, clanScore holds the war trophies.
    rows = r.ok ? r.data.items.map((c) => ({ ...c, clanWarTrophies: c.clanScore ?? c.clanWarTrophies, rank: c.rank })) : [];
    title = 'Top war clans';
  }
  const list = rows.filter((c) => (c.clanWarTrophies ?? 0) >= minW && (!type || type === 'all' || !c.type || c.type === type) && c.members >= minM);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span className="label">{title}</span>
        <span className="label">{list.length} results</span>
      </div>
      {failed ? (
        <EmptyState text="The Clash Royale API did not answer. Try again in a minute." />
      ) : list.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))', gap: 14 }}>
          {list.map((c) => (
            <ClanCard key={c.tag} c={c} />
          ))}
        </div>
      ) : (
        <EmptyState text="No clans match. Loosen a filter or search by tag." dashed />
      )}
    </section>
  );
}

async function Filters() {
  const r = await getLocations();
  const locations = r.ok ? r.data.items.map((l) => ({ id: l.id, name: l.name, isCountry: l.isCountry })) : [];
  return <ClanFilters locations={locations} />;
}

export default function ClansPage(props: PageProps<'/clans'>) {
  return (
    <main className="page" style={{ gap: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="label">Clans directory · live from the official API</span>
        <Reveal as="h1" className="display-l" style={{ fontSize: 'clamp(44px,8vw,120px)', lineHeight: 0.86 }}>
          FIND A CLAN
        </Reveal>
      </div>
      <Suspense fallback={<span className="skeleton" style={{ height: 140, maxWidth: 760 }} />}>
        <Filters />
      </Suspense>
      <Suspense fallback={<span className="skeleton" style={{ height: 320 }} />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

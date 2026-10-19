import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Portal } from '@/components/fx/Portal';
import { Reveal } from '@/components/fx/Reveal';
import { TagSearch } from '@/components/TagSearch';
import { ClanBadge } from '@/components/ui/ClanBadge';
import { KingLevel, MembersIcon, TrophyIcon, WarTrophyIcon } from '@/components/ui/icons';
import { fmt } from '@/lib/format';
import { search, type SearchClan, type SearchScope } from '@/lib/search';

export const metadata: Metadata = { title: 'Search' };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '40px 1fr auto',
  gap: 14,
  alignItems: 'center',
  padding: '14px 16px',
  color: 'var(--text-1)',
  borderBottom: '1px solid var(--hair)',
};

function Initial({ name }: { name: string }) {
  return (
    <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate)', font: '700 14px/1 var(--mono)', color: 'var(--blue-hi)' }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function ClanRow({ c, href }: { c: SearchClan; href: string }) {
  return (
    <Link href={href} data-spot="" className="spot" style={row}>
      <ClanBadge badgeId={c.badgeId} size={36} name={c.name} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
        <span style={{ font: '600 15px/1.15 var(--sans)', overflowWrap: 'anywhere' }}>{c.name}</span>
        <span className="label-sm" style={{ letterSpacing: '.1em' }}>
          #{c.tag}
          {c.location ? ` · ${c.location}` : ''}
        </span>
      </span>
      <span style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'flex-end', font: '600 12px/1 var(--mono)', color: 'var(--text-2)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <MembersIcon size={14} />
          {c.members}/50
        </span>
        {c.clanWarTrophies != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <WarTrophyIcon size={14} />
            {fmt(c.clanWarTrophies)}
          </span>
        )}
      </span>
    </Link>
  );
}

async function Results({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 40);
  const t = one(sp.type);
  const scope: SearchScope = t === 'player' || t === 'clan' ? t : 'all';
  const manage = one(sp.then) === 'manage';
  if (!q) return <EmptyState text="Type a player or clan name, or a #tag." dashed />;
  const r = await search(q, scope, 30);
  const clanHref = (tag: string) => (manage ? `/clan/${tag}/manage` : `/clan/${tag}`);
  const hits = (r.tagPlayer ? 1 : 0) + (r.tagClan ? 1 : 0) + r.players.length + r.clans.length;
  const scopeHref = (s: SearchScope) => `/search?${new URLSearchParams({ q, ...(s !== 'all' ? { type: s } : {}), ...(manage ? { then: 'manage' } : {}) })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {(
          [
            ['all', 'Everything'],
            ['player', `Players ${r.players.length + (r.tagPlayer ? 1 : 0)}`],
            ['clan', `Clans ${r.clans.length + (r.tagClan ? 1 : 0)}`],
          ] as const
        ).map(([k, l]) => (
          <Link key={k} href={scopeHref(k)} className="chip" aria-pressed={scope === k} style={{ height: 30, display: 'inline-flex', alignItems: 'center' }}>
            {scope === k || k === 'all' ? l : l.replace(/ \d+$/, '')}
          </Link>
        ))}
        <span className="label" style={{ marginLeft: 'auto' }}>
          {hits} results
        </span>
      </div>

      {(r.tagPlayer || r.tagClan) && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="label">Tag match · #{q.replace(/^#/, '').toUpperCase()}</span>
          <div className="panel" style={{ overflow: 'hidden' }}>
            {r.tagPlayer && (
              <Link href={`/player/${r.tagPlayer.tag}`} data-spot="" className="spot" style={row}>
                <Initial name={r.tagPlayer.name} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                  <span style={{ font: '600 15px/1.15 var(--sans)' }}>{r.tagPlayer.name}</span>
                  <span className="label-sm" style={{ letterSpacing: '.1em' }}>
                    Player · #{r.tagPlayer.tag}
                    {r.tagPlayer.clanName ? ` · ${r.tagPlayer.clanName}` : ''}
                  </span>
                </span>
                <span style={{ display: 'flex', gap: 14, font: '600 12px/1 var(--mono)', color: 'var(--text-2)' }}>
                  {r.tagPlayer.expLevel != null && (
                    <KingLevel level={r.tagPlayer.expLevel} size={24} />
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <TrophyIcon size={14} />
                    {fmt(r.tagPlayer.trophies)}
                  </span>
                </span>
              </Link>
            )}
            {r.tagClan && <ClanRow c={r.tagClan} href={clanHref(r.tagClan.tag)} />}
          </div>
        </section>
      )}

      {scope !== 'clan' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="label">Players named &quot;{q}&quot;</span>
          {r.players.length ? (
            <div className="panel" style={{ overflow: 'hidden' }}>
              {r.players.map((p) => (
                <Link key={p.tag} href={`/player/${p.tag}`} data-spot="" className="spot" style={row}>
                  <Initial name={p.name} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                    <span style={{ font: '600 15px/1.15 var(--sans)', overflowWrap: 'anywhere' }}>{p.name}</span>
                    <span className="label-sm" style={{ letterSpacing: '.1em' }}>
                      #{p.tag}
                      {p.clanName ? ` · ${p.clanName}` : ' · No clan'}
                    </span>
                  </span>
                  {p.trophies != null ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 12px/1 var(--mono)', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                      <TrophyIcon size={14} />
                      {fmt(p.trophies)}
                    </span>
                  ) : (
                    <span />
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="body" style={{ fontSize: 14 }}>
              No players by that name yet.
            </p>
          )}
          <span style={{ font: '500 10px/1.6 var(--mono)', letterSpacing: '.08em', color: 'var(--text-3)' }}>
            The Clash Royale API can only look players up by tag, so name search covers the global Path of Legends top 1000 and everyone in a clan
            opened on this site. Search by #tag to find anyone.
          </span>
        </section>
      )}

      {scope !== 'player' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="label">Clans named &quot;{q}&quot;</span>
          {r.clanError ? (
            <EmptyState text="The clan search did not answer. Try again in a minute." />
          ) : r.clans.length ? (
            <div className="panel" style={{ overflow: 'hidden' }}>
              {r.clans.map((c) => (
                <ClanRow key={c.tag} c={c} href={clanHref(c.tag)} />
              ))}
            </div>
          ) : (
            <p className="body" style={{ fontSize: 14 }}>
              {q.replace(/^#/, '').length < 3 ? 'Clan names need 3 or more letters.' : 'No clans by that name.'}
            </p>
          )}
          {!r.clanError && r.clans.length > 0 && (
            <Link href={`/clans?q=${encodeURIComponent(q)}`} className="link-mono" style={{ alignSelf: 'flex-start' }}>
              Filter these clans →
            </Link>
          )}
        </section>
      )}
    </div>
  );
}

async function Heading({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 40);
  const t = one(sp.type);
  const scope: SearchScope = t === 'player' || t === 'clan' ? t : 'all';
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <span className="label">Search · players and clans, by name or tag</span>
      <Reveal as="h1" className="display-l" style={{ overflowWrap: 'anywhere' }}>
        {q ? `“${q.toUpperCase()}”` : 'SEARCH'}
      </Reveal>
      <div style={{ maxWidth: 680 }}>
        <TagSearch key={`${q}|${scope}`} size="default" scope={scope} then={one(sp.then) === 'manage' ? 'manage' : undefined} />
      </div>
    </header>
  );
}

export default function SearchPage(props: PageProps<'/search'>) {
  return (
    <main className="page" style={{ maxWidth: 1080, gap: 36 }}>
      <Suspense fallback={<span className="skeleton" style={{ height: 160 }} />}>
        <Heading searchParams={props.searchParams} />
      </Suspense>
      <Suspense
        fallback={
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '24px 0' }}>
            <Portal size={40} />
            <span className="label">Searching players and clans…</span>
          </div>
        }
      >
        <Results searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

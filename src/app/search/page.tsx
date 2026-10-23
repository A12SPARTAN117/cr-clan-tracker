import type { Metadata } from 'next';
import { HoverLink } from '@/components/ui/HoverLink';
import { Suspense } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { TagFirst } from '@/components/TagFirst';
import { Portal } from '@/components/fx/Portal';
import { Reveal } from '@/components/fx/Reveal';
import { ClanBadge } from '@/components/ui/ClanBadge';
import { KingLevel, MembersIcon, TrophyIcon, WarTrophyIcon } from '@/components/ui/icons';
import { fmt } from '@/lib/format';
import { search, type SearchClan } from '@/lib/search';
import { ScopeChips, ScopedSearch, ScopeSection } from './ScopeControls';
import s from './search.module.css';

export const metadata: Metadata = { title: 'Search' };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

function Initial({ name }: { name: string }) {
  return (
    <span className={s.initial}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function ClanRow({ c, href }: { c: SearchClan; href: string }) {
  return (
    <HoverLink href={href} data-spot="" className={`spot ${s.row}`}>
      <ClanBadge badgeId={c.badgeId} size={36} name={c.name} />
      <span className={s.who}>
        <span className={s.name}>{c.name}</span>
        <span className={`label-sm ${s.sub}`}>
          #{c.tag}
          {c.location ? ` · ${c.location}` : ''}
        </span>
      </span>
      <span className={s.stats}>
        <span className={s.stat}>
          <MembersIcon size={14} />
          {c.members}/50
        </span>
        {c.clanWarTrophies != null && (
          <span className={s.stat}>
            <WarTrophyIcon size={14} />
            {fmt(c.clanWarTrophies)}
          </span>
        )}
      </span>
    </HoverLink>
  );
}

async function Results({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 40);
  const manage = one(sp.then) === 'manage';
  // Searches started from Rivals or Goals open each player's Rivals or Goals page.
  const playerHref = (tag: string) => (one(sp.then) === 'rivals' || one(sp.then) === 'goals' ? `/player/${tag}/${one(sp.then)}` : `/player/${tag}`);
  if (!q) return <EmptyState text="Type a player or clan name, or a #tag." dashed />;
  // Players and clans together; the scope chips show one or the other without searching again.
  const r = await search(q, 'all', 30);
  const clanHref = (tag: string) => (manage ? `/clan/${tag}/manage` : `/clan/${tag}`);
  const players = r.players.length + (r.tagPlayer ? 1 : 0);
  const clans = r.clans.length + (r.tagClan ? 1 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <ScopeChips counts={{ all: players + clans, player: players, clan: clans }} />

      {(r.tagPlayer || r.tagClan) && (
        <ScopeSection kind={r.tagPlayer && r.tagClan ? 'all' : r.tagPlayer ? 'player' : 'clan'}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className="label">Tag match · #{q.replace(/^#/, '').toUpperCase()}</span>
            <div className="panel" style={{ overflow: 'hidden' }}>
              {r.tagPlayer && (
                <ScopeSection kind="player">
                  <HoverLink href={playerHref(r.tagPlayer.tag)} data-spot="" className={`spot ${s.row}`}>
                    <Initial name={r.tagPlayer.name} />
                    <span className={s.who}>
                      <span className={s.name}>{r.tagPlayer.name}</span>
                      <span className={`label-sm ${s.sub}`}>
                        Player · #{r.tagPlayer.tag}
                        {r.tagPlayer.clanName ? ` · ${r.tagPlayer.clanName}` : ''}
                      </span>
                    </span>
                    <span className={s.stats}>
                      {r.tagPlayer.expLevel != null && (
                        <KingLevel level={r.tagPlayer.expLevel} size={24} />
                      )}
                      <span className={s.stat}>
                        <TrophyIcon size={14} />
                        {fmt(r.tagPlayer.trophies)}
                      </span>
                    </span>
                  </HoverLink>
                </ScopeSection>
              )}
              {r.tagClan && (
                <ScopeSection kind="clan">
                  <ClanRow c={r.tagClan} href={clanHref(r.tagClan.tag)} />
                </ScopeSection>
              )}
            </div>
          </section>
        </ScopeSection>
      )}

      <ScopeSection kind="player">
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="label">Players named &quot;{q}&quot;</span>
          {r.players.length ? (
            <div className="panel" style={{ overflow: 'hidden' }}>
              {r.players.map((p) => (
                <HoverLink key={p.tag} href={playerHref(p.tag)} data-spot="" className={`spot ${s.row}`}>
                  <Initial name={p.name} />
                  <span className={s.who}>
                    <span className={s.name}>{p.name}</span>
                    <span className={`label-sm ${s.sub}`}>
                      #{p.tag}
                      {p.clanName ? ` · ${p.clanName}` : ' · No clan'}
                    </span>
                  </span>
                  {p.trophies != null ? (
                    <span className={`${s.stats} ${s.stat}`}>
                      <TrophyIcon size={14} />
                      {fmt(p.trophies)}
                    </span>
                  ) : (
                    <span />
                  )}
                </HoverLink>
              ))}
            </div>
          ) : (
            <p className="body" style={{ fontSize: 14 }}>
              No players by that name yet.
            </p>
          )}
          <TagFirst found={r.players.length > 0} />
        </section>
      </ScopeSection>

      <ScopeSection kind="clan">
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
            <HoverLink href={`/clans?q=${encodeURIComponent(q)}`} className="link-mono" style={{ alignSelf: 'flex-start' }}>
              Filter these clans →
            </HoverLink>
          )}
        </section>
      </ScopeSection>
    </div>
  );
}

async function Heading({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 40);
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <span className="label">Search · players and clans, by name or tag</span>
      <Reveal as="h1" className="display-l" style={{ overflowWrap: 'anywhere' }}>
        {q ? `“${q.toUpperCase()}”` : 'SEARCH'}
      </Reveal>
      <div style={{ maxWidth: 680 }}>
        <ScopedSearch q={q} then={['manage', 'rivals', 'goals'].includes(one(sp.then)) ? (one(sp.then) as 'manage' | 'rivals' | 'goals') : undefined} />
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

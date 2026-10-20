import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Reveal } from '@/components/fx/Reveal';
import { EmptyState } from '@/components/EmptyState';
import { getClan, getClanWarRankings, getLocations, searchClans } from '@/lib/cr/api';
import { pool } from '@/lib/pool';
import { ClanCard, type ClanDetails, type ClanRow } from './ClanCard';
import { ClanFilters } from './ClanFilters';
import s from './clans.module.css';

export const metadata: Metadata = { title: 'Find a clan' };

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? '';
  const q = one('q').trim();
  const loc = Number(one('loc')) || undefined;
  const minM = Number(one('minM')) || 0;
  const minW = Number(one('minW')) || 0;
  const type = one('type');

  let rows: ClanRow[] = [];
  // Ranking rows lack type and required trophies; each clan's own record (cached per clan) adds them.
  let details: Promise<ClanDetails>[] | null = null;
  let title: string;
  let failed = false;
  if (q.length >= 3 || minM > 0) {
    const r = await searchClans({ name: q.length >= 3 ? q : undefined, locationId: loc, minMembers: minM || undefined, limit: 100 });
    failed = !r.ok;
    rows = r.ok ? r.data.items.map((c) => ({ ...c, location: c.location?.name })) : [];
    title = q ? `Clans named "${q}"` : 'Search results';
  } else {
    const r = await getClanWarRankings(loc ?? 'global', 60);
    failed = !r.ok;
    // In the clan-war ranking, clanScore holds the war trophies.
    rows = r.ok ? r.data.items.map((c) => ({ tag: c.tag, name: c.name, badgeId: c.badgeId, rank: c.rank, members: c.members, clanWarTrophies: c.clanScore ?? c.clanWarTrophies, location: c.location?.name })) : [];
    const own = (c: ClanRow): Promise<ClanDetails> =>
      getClan(c.tag.replace('#', '')).then((d) => (d.ok ? { members: d.data.members, type: d.data.type, requiredTrophies: d.data.requiredTrophies, location: d.data.location?.name } : null));
    if (type && type !== 'all') {
      // Filtering by type needs every clan's type first.
      const got = await pool(rows, 12, own);
      rows = rows.map((c, i) => ({ ...c, ...(got[i] ?? {}), location: got[i]?.location ?? c.location }));
    } else {
      // Otherwise the cards show at once and their details stream in.
      details = rows.map(own);
    }
    title = 'Top war clans';
  }
  const keep = rows.map((c, i) => ({ c, d: details?.[i] })).filter(({ c }) => (c.clanWarTrophies ?? 0) >= minW && (!type || type === 'all' || c.type === type) && c.members >= minM);

  return (
    <section data-results="" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span className="label">{title}</span>
        <span className="label">{keep.length} results</span>
      </div>
      {failed ? (
        <EmptyState text="The Clash Royale API did not answer. Try again in a minute." />
      ) : keep.length ? (
        <div className={s.grid}>
          {keep.map(({ c, d }) => (
            <ClanCard key={c.tag} c={c} details={d} />
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

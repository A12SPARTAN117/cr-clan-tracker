import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Reveal } from '@/components/fx/Reveal';
import { getClan, getClanWarRankings, getLocations, searchClans } from '@/lib/cr/api';
import type { ClanDetails, ClanRow } from './ClanCard';
import { ClanResults } from './ClanResults';
import { ClanFilters } from './ClanFilters';

export const metadata: Metadata = { title: 'Find a clan' };

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? '';
  const q = one('q').trim();
  const loc = Number(one('loc')) || undefined;

  // Only the name and location need the API; ClanResults applies type, members and war trophies.
  let rows: ClanRow[] = [];
  // Ranking rows lack type and required trophies; each clan's own record (cached per clan) adds them.
  let details: Promise<ClanDetails>[] | null = null;
  let title: string;
  let failed = false;
  if (q.length >= 3) {
    const r = await searchClans({ name: q, locationId: loc, limit: 100 });
    failed = !r.ok;
    rows = r.ok ? r.data.items.map((c) => ({ ...c, location: c.location?.name })) : [];
    title = `Clans named "${q}"`;
  } else {
    const r = await getClanWarRankings(loc ?? 'global', 60);
    failed = !r.ok;
    // In the clan-war ranking, clanScore holds the war trophies.
    rows = r.ok ? r.data.items.map((c) => ({ tag: c.tag, name: c.name, badgeId: c.badgeId, rank: c.rank, members: c.members, clanWarTrophies: c.clanScore ?? c.clanWarTrophies, location: c.location?.name })) : [];
    // The cards show at once and their details stream in.
    details = rows.map((c) =>
      getClan(c.tag.replace('#', '')).then((d) => (d.ok ? { members: d.data.members, type: d.data.type, requiredTrophies: d.data.requiredTrophies, location: d.data.location?.name } : null)),
    );
    title = 'Top war clans';
  }
  return <ClanResults rows={rows} details={details} title={title} failed={failed} />;
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

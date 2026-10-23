import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Reveal } from '@/components/fx/Reveal';
import { getLocations } from '@/lib/cr/api';
import { ClanResults } from './ClanResults';
import { ClanFilters } from './ClanFilters';
import { clanList } from './data';

export const metadata: Metadata = { title: 'Find a clan' };

/** The world's top war clans, part of the static page; other lists load in ClanResults. */
async function Results() {
  return <ClanResults initial={await clanList('', null)} />;
}

async function Filters() {
  const r = await getLocations();
  const locations = r.ok ? r.data.items.map((l) => ({ id: l.id, name: l.name, isCountry: l.isCountry })) : [];
  return <ClanFilters locations={locations} />;
}

export default function ClansPage() {
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
        <Results />
      </Suspense>
    </main>
  );
}

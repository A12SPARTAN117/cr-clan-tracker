import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Portal } from '@/components/fx/Portal';
import { Reveal } from '@/components/fx/Reveal';
import { getClanWarRankings, getPolLeaderboard } from '@/lib/cr/api';
import { compare, type CompareKind } from '@/lib/compare';
import { CompareView } from './CompareView';

export const metadata: Metadata = { title: 'Compare', description: 'Compare Clash Royale players or clans side by side.' };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

async function Content({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const kind: CompareKind = one(sp.type) === 'clan' ? 'clan' : 'player';
  const tags = one(sp.tags).split(',').filter(Boolean);
  const data = tags.length ? await compare(kind, tags) : { kind, entities: [], missing: [], sections: [] };
  return <CompareView data={data} suggest={tags.length < 2 ? await suggestions() : null} />;
}

/** One-click showdowns from the live leaderboards: the top two players and the top two war clans. */
async function suggestions() {
  const [pol, war] = await Promise.all([getPolLeaderboard('global', 2), getClanWarRankings('global', 2)]);
  const pick = (items: { tag: string; name: string }[]) => (items.length === 2 ? items.map((x) => ({ tag: x.tag.replace('#', ''), name: x.name })) : null);
  return { players: pol.ok ? pick(pol.data.items) : null, clans: war.ok ? pick(war.data.items) : null };
}

export default function ComparePage(props: PageProps<'/compare'>) {
  return (
    <main className="page" style={{ gap: 32 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="label">Compare · players or clans, side by side</span>
        <Reveal as="h1" className="display-l">
          COMPARE
        </Reveal>
      </header>
      <Suspense
        fallback={
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '24px 0' }}>
            <Portal size={40} />
            <span className="label">Loading profiles…</span>
          </div>
        }
      >
        <Content searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

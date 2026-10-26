import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Portal } from '@/components/fx/Portal';
import { Reveal } from '@/components/fx/Reveal';
import { getClanWarRankings, getPolLeaderboard } from '@/lib/cr/api';
import { compare, type CompareKind } from '@/lib/compare';
import { isOff } from '@/lib/switches';
import { CompareView } from './CompareView';

export const metadata: Metadata = { title: 'Compare', description: 'Compare Clash Royale players or clans side by side.' };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

async function Content({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const kind: CompareKind = one(sp.type) === 'clan' ? 'clan' : 'player';
  const tags = one(sp.tags).split(',').filter(Boolean);
  const suggest = tags.length < 2 ? await suggestions() : null;
  if (!tags.length) return <CompareView data={{ kind, entities: [], missing: [], sections: [] }} suggest={suggest} />;
  if (kind === 'player') return <CompareView data={await compare(kind, tags)} suggest={suggest} />;
  if (await isOff('compare-clans'))
    return (
      <p className="label" style={{ padding: '24px 0' }}>
        Clan comparisons are switched off for a while to keep the site fast. Player comparisons still work.
      </p>
    );
  // Clans: everything but the two member-level rows shows at once; those fill in when every
  // member's profile has loaded.
  const quick = await compare(kind, tags, { levels: false });
  return (
    <Suspense fallback={<CompareView data={quick} suggest={suggest} />}>
      <FullClans tags={tags} suggest={suggest} />
    </Suspense>
  );
}

async function FullClans({ tags, suggest }: { tags: string[]; suggest: Awaited<ReturnType<typeof suggestions>> | null }) {
  return <CompareView data={await compare('clan', tags)} suggest={suggest} />;
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

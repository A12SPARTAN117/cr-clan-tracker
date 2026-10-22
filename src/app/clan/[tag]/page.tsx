import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LostScene } from '@/components/LostScene';
import { Portal } from '@/components/fx/Portal';
import { getClan } from '@/lib/cr/api';
import { getClanProfile, getMemberLevels } from '@/lib/clan/profile';
import { getClanHistory } from '@/lib/history';
import { indexClanMembers } from '@/lib/directory';
import { after, connection } from 'next/server';
import { onceEvery, TRACK_MS } from '@/lib/throttle';
import { checkTag } from '@/lib/tags';
import { ClanProfileView } from './ClanProfileView';

export async function generateMetadata({ params }: PageProps<'/clan/[tag]'>): Promise<Metadata> {
  const c = checkTag(decodeURIComponent((await params).tag));
  if (c.kind !== 'valid') return { title: 'Clan not found' };
  const r = await getClan(c.tag);
  return r.ok ? { title: `${r.data.name} (#${c.tag})`, description: r.data.description || undefined } : { title: 'Clan not found' };
}

async function Content({ params }: { params: Promise<{ tag: string }> }) {
  const raw = decodeURIComponent((await params).tag);
  const c = checkTag(raw);
  if (c.kind !== 'valid') return <LostScene variant="clan" tag={raw.replace(/^#/, '').toUpperCase()} />;
  const r = await getClan(c.tag);
  if (!r.ok) return <LostScene variant={r.status === 404 ? 'clan' : 'error'} tag={c.tag} />;
  // Background work below reads the clock, so it must run at request time, not in a prerender.
  await connection();
  // The roster goes into name search at most hourly per clan.
  if (onceEvery(`index-clan:${c.tag}`, TRACK_MS)) after(() => indexClanMembers(r.data));
  const [data, history] = await Promise.all([getClanProfile(c.tag), getClanHistory(c.tag)]);
  if (!data) return <LostScene variant="error" tag={c.tag} />;
  // Member levels take ~50 profile calls on a cold cache: the page shows now and they stream in.
  return <ClanProfileView c={history ? { ...data, history: { trackedSince: history.trackedSince, events: history.rosterEvents } } : data} levels={getMemberLevels(c.tag)} />;
}

export default function ClanPage({ params }: PageProps<'/clan/[tag]'>) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Portal size={64} label="Loading clan" />
        </div>
      }
    >
      <Content params={params} />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LostScene } from '@/components/LostScene';
import { Portal } from '@/components/fx/Portal';
import { getClan } from '@/lib/cr/api';
import { after } from 'next/server';
import { applyHistory, getDashboard } from '@/lib/clan/dashboard';
import { getClanHistory } from '@/lib/history';
import { trackClan } from '@/lib/history/snapshot';
import { checkTag } from '@/lib/tags';
import { ClanDashboard } from './ClanDashboard';

export async function generateMetadata({ params }: PageProps<'/clan/[tag]/manage'>): Promise<Metadata> {
  const c = checkTag(decodeURIComponent((await params).tag));
  if (c.kind !== 'valid') return { title: 'Clan not found' };
  const r = await getClan(c.tag);
  return { title: r.ok ? `${r.data.name} · Manage` : 'Clan dashboard' };
}

function Loading() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      <Portal size={64} label="Loading clan" />
      <span className="label" style={{ color: 'var(--text-2)' }}>
        Reading roster, war and battle logs…
      </span>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ tag: string }> }) {
  const raw = decodeURIComponent((await params).tag);
  const c = checkTag(raw);
  if (c.kind !== 'valid') return <LostScene variant="clan" tag={raw.replace(/^#/, '').toUpperCase()} />;
  const clan = await getClan(c.tag);
  if (!clan.ok) return <LostScene variant={clan.status === 404 ? 'clan' : 'error'} tag={c.tag} />;
  const [data, history] = await Promise.all([getDashboard(c.tag), getClanHistory(c.tag)]);
  if (!data) return <LostScene variant="error" tag={c.tag} />;
  // Opening a dashboard starts (or refreshes) history tracking for the clan.
  after(() => trackClan(c.tag).catch((e) => console.error('[history] track failed:', e)));
  return <ClanDashboard data={applyHistory(data, history)} />;
}

export default function ManagePage({ params }: PageProps<'/clan/[tag]/manage'>) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

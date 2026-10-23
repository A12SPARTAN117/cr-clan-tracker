import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LostScene } from '@/components/LostScene';
import { Portal } from '@/components/fx/Portal';
import { getClan } from '@/lib/cr/api';
import { SeenBeacon } from '@/components/SeenBeacon';
import { checkTag } from '@/lib/tags';
import { ClanDashboard } from './ClanDashboard';
import { dashboardPage } from './data';

/**
 * Rendered on a clan's first visit and then served from the page cache (refreshed at most once a
 * minute, see ./data): nothing here is read per request. Cache Components needs one param to check
 * that at build time; this placeholder renders the not-found scene.
 */
export function generateStaticParams() {
  return [{ tag: '_' }];
}

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
  const page = await dashboardPage(c.tag);
  if (!page.ok) return <LostScene variant={page.status === 404 ? 'clan' : 'error'} tag={c.tag} />;
  return (
    <>
      <ClanDashboard data={page.data} />
      <SeenBeacon kind="manage" tag={c.tag} />
    </>
  );
}

export default function ManagePage({ params }: PageProps<'/clan/[tag]/manage'>) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

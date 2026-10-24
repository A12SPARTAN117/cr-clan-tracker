import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLife } from '@/components/PageLife';
import { LostScene } from '@/components/LostScene';
import { Portal } from '@/components/fx/Portal';
import { getClan } from '@/lib/cr/api';
import { SeenBeacon } from '@/components/SeenBeacon';
import { getMemberLevels } from '@/lib/clan/profile';
import { checkTag } from '@/lib/tags';
import { ClanProfileView } from './ClanProfileView';
import { clanPage } from './data';

/**
 * Rendered on a clan's first visit and then served from the page cache (refreshed at most once a
 * minute, see ./data): nothing here is read per request. Cache Components needs one param to check
 * that at build time; this placeholder renders the not-found scene.
 */
export function generateStaticParams() {
  return [{ tag: '_' }];
}

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
  const page = await clanPage(c.tag);
  if (!page.ok) return <LostScene variant={page.status === 404 ? 'clan' : 'error'} tag={c.tag} />;
  // Member levels take ~50 profile calls on a cold cache: the page shows now and they stream in.
  return (
    <>
      <ClanProfileView c={page.c} levels={getMemberLevels(c.tag)} />
      <SeenBeacon kind="clan" tag={c.tag} />
    </>
  );
}

export default function ClanPage({ params }: PageProps<'/clan/[tag]'>) {
  return (
    <>
      <PageLife every="minute" />
      <Suspense
        fallback={
          <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Portal size={64} label="Loading clan" />
          </div>
        }
      >
        <Content params={params} />
      </Suspense>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { useUrlQuery } from '@/lib/urlQuery';
import { ClanCard } from './ClanCard';
import type { ClanList } from './data';
import s from './clans.module.css';

/**
 * The clan list. The page comes with the world's top war clans; a name (?q=, 3+ characters) or a
 * location (?loc=) loads its list from /api/clans. Type, members and war trophies filter here,
 * from the URL, so changing or clearing them needs no round trip.
 */
export function ClanResults({ initial }: { initial: ClanList }) {
  const params = useUrlQuery();
  const q = (params.get('q') ?? '').trim();
  const loc = Number(params.get('loc')) || null;
  const key = q.length >= 3 || loc ? `q=${encodeURIComponent(q.length >= 3 ? q : '')}&loc=${loc ?? ''}` : '';
  const [got, setGot] = useState<{ key: string; list: ClanList } | null>(null);
  useEffect(() => {
    if (!key) return;
    let live = true;
    fetch(`/api/clans?${key}`)
      .then((r) => (r.ok ? (r.json() as Promise<ClanList>) : null))
      .catch(() => null)
      .then((list) => live && setGot({ key, list: list ?? { rows: [], title: 'Clans', failed: true } }));
    return () => {
      live = false;
    };
  }, [key]);
  const list = !key ? initial : got?.key === key ? got.list : null;

  const type = params.get('type') ?? 'all';
  const minM = Number(params.get('minM')) || 0;
  const minW = Number(params.get('minW')) || 0;
  const rows = (list?.rows ?? []).filter((c) => (c.clanWarTrophies ?? 0) >= minW && c.members >= minM && (type === 'all' || c.type === type));

  return (
    <section data-results="" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span className="label">{list?.title ?? 'Loading clans…'}</span>
        <span className="label">{list ? `${rows.length} results` : ''}</span>
      </div>
      {!list ? (
        <span className="skeleton" style={{ height: 320 }} />
      ) : list.failed ? (
        <EmptyState text="The Clash Royale API did not answer. Try again in a minute." />
      ) : rows.length ? (
        <div className={s.grid}>
          {rows.map((c) => (
            <ClanCard key={c.tag} c={c} />
          ))}
        </div>
      ) : (
        <EmptyState text="No clans match. Loosen a filter or search by tag." dashed />
      )}
    </section>
  );
}

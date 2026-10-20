'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, use, useMemo } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ClanCard, type ClanDetails, type ClanRow } from './ClanCard';
import s from './clans.module.css';

type Props = { rows: ClanRow[]; details: Promise<ClanDetails>[] | null; title: string; failed: boolean };

/**
 * The clan list. The server only fetches clans for the name and location; type, members and war
 * trophies filter here, from the URL, so changing or clearing them needs no round trip.
 */
export function ClanResults(props: Props) {
  const params = useSearchParams();
  const type = params.get('type') ?? 'all';
  const minM = Number(params.get('minM')) || 0;
  const minW = Number(params.get('minW')) || 0;
  // Ranking rows have no type until each clan's own record arrives (it streams in on page load).
  const all = useMemo(() => (props.details ? Promise.all(props.details) : null), [props.details]);
  if (type !== 'all' && all)
    return (
      <Suspense fallback={<List {...props} items={[]} waiting />}>
        <Typed {...props} all={all} type={type} minM={minM} minW={minW} />
      </Suspense>
    );
  const items = props.rows
    .map((c, i) => ({ c, d: props.details?.[i] }))
    .filter(({ c }) => (c.clanWarTrophies ?? 0) >= minW && c.members >= minM && (type === 'all' || c.type === type));
  return <List {...props} items={items} />;
}

function Typed({ all, type, minM, minW, ...props }: Props & { all: Promise<ClanDetails[]>; type: string; minM: number; minW: number }) {
  const got = use(all);
  const items = props.rows
    .map((c, i) => ({ c: { ...c, ...(got[i] ?? {}), location: got[i]?.location ?? c.location } }))
    .filter(({ c }) => c.type === type && c.members >= minM && (c.clanWarTrophies ?? 0) >= minW);
  return <List {...props} items={items} />;
}

function List({ title, failed, items, waiting = false }: Props & { items: { c: ClanRow; d?: Promise<ClanDetails> }[]; waiting?: boolean }) {
  return (
    <section data-results="" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span className="label">{title}</span>
        <span className="label">{waiting ? 'Checking clan types…' : `${items.length} results`}</span>
      </div>
      {failed ? (
        <EmptyState text="The Clash Royale API did not answer. Try again in a minute." />
      ) : waiting ? (
        <span className="skeleton" style={{ height: 320 }} />
      ) : items.length ? (
        <div className={s.grid}>
          {items.map(({ c, d }) => (
            <ClanCard key={c.tag} c={c} details={d} />
          ))}
        </div>
      ) : (
        <EmptyState text="No clans match. Loosen a filter or search by tag." dashed />
      )}
    </section>
  );
}

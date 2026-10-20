'use client';

import Link from 'next/link';
import { Suspense, use } from 'react';
import { ClanFrame } from '@/components/ui/ClanFrame';
import { MembersIcon, TrophyIcon, WarTrophyIcon } from '@/components/ui/icons';
import type { Clan } from '@/lib/cr/types';
import { fmt } from '@/lib/format';
import s from './clans.module.css';

export type ClanRow = { tag: string; name: string; badgeId: number; location?: string; members: number; clanWarTrophies?: number; requiredTrophies?: number; type?: Clan['type']; rank?: number };
/** What a clan's own record adds to a ranking row (the ranking has no type or required trophies). */
export type ClanDetails = Pick<ClanRow, 'members' | 'type' | 'requiredTrophies' | 'location'> | null;

const TYPE_LABEL = { open: 'OPEN', inviteOnly: 'INVITE ONLY', closed: 'CLOSED' } as const;

/** The stats row; `pending` while the clan's own record (required trophies, type) is on its way. */
function Body({ c, pending = false }: { c: ClanRow; pending?: boolean }) {
  return (
    <>
      <div className={s.stats}>
        {(
          [
            ['MEMBERS', `${c.members}/50`, <MembersIcon key="i" size={13} />],
            ['WAR TR.', fmt(c.clanWarTrophies), <WarTrophyIcon key="i" size={13} />],
            ['REQ.', c.requiredTrophies != null ? fmt(c.requiredTrophies) : '—', <TrophyIcon key="i" size={13} />],
          ] as const
        ).map(([k, v, icon]) => (
          <span key={k} className={s.stat}>
            <span className="label-sm">{k}</span>
            <span className={s.value}>
              {icon}
              {k === 'REQ.' && pending ? <span className={`skeleton ${s.wait}`} /> : v}
            </span>
          </span>
        ))}
      </div>
      <span className={s.type} data-type={c.type}>
        {c.type ? TYPE_LABEL[c.type] : ''}
      </span>
    </>
  );
}

function Details({ c, details }: { c: ClanRow; details: Promise<ClanDetails> }) {
  const d = use(details);
  return <Body c={{ ...c, ...(d ?? {}), location: d?.location ?? c.location }} />;
}

/**
 * A clan in the directory. Rendered on the client so the page sends each clan's data once
 * instead of a serialized element tree. `details`, when given, streams in the clan's type and
 * required trophies after the card itself has shown.
 */
export function ClanCard({ c, details }: { c: ClanRow; details?: Promise<ClanDetails> }) {
  const tag = c.tag.replace('#', '');
  return (
    <Link href={`/clan/${tag}`} data-spot="" className={`panel ${s.card}`}>
      <div className={s.head}>
        <ClanFrame badgeId={c.badgeId} warTrophies={c.clanWarTrophies} size={44} name={c.name} label />
        <div className={s.who}>
          <span className={s.name}>{c.name}</span>
          <span className={s.sub}>
            #{tag}
            {c.location ? ` · ${c.location}` : ''}
          </span>
        </div>
        {c.rank != null && (
          <span className={s.rank} data-first={c.rank === 1}>
            #{c.rank}
          </span>
        )}
      </div>
      {details ? (
        <Suspense fallback={<Body c={c} pending />}>
          <Details c={c} details={details} />
        </Suspense>
      ) : (
        <Body c={c} />
      )}
    </Link>
  );
}

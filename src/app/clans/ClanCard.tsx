'use client';

import { HoverLink } from '@/components/ui/HoverLink';
import { ClanFrame } from '@/components/ui/ClanFrame';
import { MembersIcon, TrophyIcon, WarTrophyIcon } from '@/components/ui/icons';
import type { Clan } from '@/lib/cr/types';
import { fmt } from '@/lib/format';
import s from './clans.module.css';

export type ClanRow = { tag: string; name: string; badgeId: number; location?: string; members: number; clanWarTrophies?: number; requiredTrophies?: number; type?: Clan['type']; rank?: number };

const TYPE_LABEL = { open: 'OPEN', inviteOnly: 'INVITE ONLY', closed: 'CLOSED' } as const;

/** The stats row. */
function Body({ c }: { c: ClanRow }) {
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
              {v}
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

/**
 * A clan in the directory. Rendered on the client so the page sends each clan's data once
 * instead of a serialized element tree.
 */
export function ClanCard({ c }: { c: ClanRow }) {
  const tag = c.tag.replace('#', '');
  return (
    <HoverLink href={`/clan/${tag}`} data-spot="" className={`panel ${s.card}`}>
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
      <Body c={c} />
    </HoverLink>
  );
}

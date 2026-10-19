'use client';

import { useState } from 'react';
import {
  BadgeIcon,
  CardsIcon,
  ChallengeIcon,
  ChestIcon,
  DonationIcon,
  EventIcon,
  MembersIcon,
  SwordsIcon,
  TrophyIcon,
} from '@/components/ui/icons';
import { CARDS } from '@/lib/cards';
import { fmt } from '@/lib/format';
import type { Badge, BadgeGroup, PlayerProfile } from '@/lib/player/profile';
import extraBadges from '../../../../data/badge-art.json';
import s from './badges.module.css';

const GROUP_ORDER: BadgeGroup[] = ['Milestones', 'Collection', 'Tournament & events', 'Seasonal', 'Mastery'];
/** Local copies of badge art the official CDN no longer serves (see data/badge-art.json). */
const EXTRA = extraBadges as Record<string, string>;

/** The number the game prints on a badge: its progress (wins, years, donations…) or level. */
function pillOf(b: Badge): string | null {
  if (b.progress != null && (b.target == null || b.level === b.maxLevel)) return fmt(b.progress);
  if (b.level != null) return String(b.level);
  return null;
}

/**
 * Real game art for badges the official CDN doesn't serve: a mastery badge shows its card, a year
 * badge the experience star with the year on it, and event completions the chest they reward.
 */
function standIn(b: Badge): { src: string; year?: string } | null {
  const mastery = /^Mastery(.+)$/.exec(b.id);
  if (mastery) {
    const slug = mastery[1].replace(/_v\d+$/, '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const card = CARDS.find((c) => c.slug === slug || c.slug.replace(/[^a-z]/g, '') === slug.replace(/[^a-z]/g, ''));
    return card?.icons.normal ? { src: card.icons.normal } : null;
  }
  const year = /^(\d{4})YearBadge$/.exec(b.id);
  if (year) return { src: '/ui/experience.png', year: year[1] };
  if (/Completion$/.test(b.id)) return { src: /Draft/.test(b.id) ? '/ui/chest-draft.png' : '/ui/chest-kinglegendary.png' };
  return null;
}

function BadgeArt({ b }: { b: Badge }) {
  const [broken, setBroken] = useState(false);
  const local = EXTRA[b.id];
  const src = broken ? local : (b.img ?? local);
  const alt = broken && !local ? standIn(b) : null;
  if (alt)
    return (
      <span className={s.standIn}>
        {/* eslint-disable-next-line @next/next/no-img-element -- game art stand-in */}
        <img src={alt.src} alt="" loading="lazy" />
        {alt.year && <b>{alt.year}</b>}
      </span>
    );
  if (!src || (broken && !local))
    return (
      <span className={s.placeholder} aria-hidden>
        {b.label
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase()}
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element -- official badge art with a local fallback
  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} />;
}

function BadgeItem({ b }: { b: Badge }) {
  const maxed = b.level != null && b.maxLevel != null && b.level >= b.maxLevel;
  const pct = b.progress != null && b.target ? Math.min(100, (b.progress / b.target) * 100) : maxed || b.maxLevel == null ? 100 : 0;
  const pill = pillOf(b);
  return (
    <div data-tilt="" className={s.badge} data-maxed={maxed} title={`${b.label}${b.level != null ? ` · level ${b.level}${b.maxLevel ? ` of ${b.maxLevel}` : ''}` : ''}`}>
      <div className={s.art}>
        <BadgeArt b={b} />
        {pill && <span className={s.pill}>{pill}</span>}
      </div>
      <span className={s.name}>{b.label}</span>
      {b.maxLevel != null && b.maxLevel > 1 && (
        <span className={s.levels} aria-label={`Level ${b.level ?? 0} of ${b.maxLevel}`}>
          {Array.from({ length: b.maxLevel }, (_, i) => (
            <i key={i} data-on={i < (b.level ?? 0)} />
          ))}
        </span>
      )}
      {b.target != null && !maxed && (
        <span className={s.progress}>
          <span className={s.bar}>
            <span style={{ width: `${pct}%` }} />
          </span>
          <span>
            {fmt(b.progress)} / {fmt(b.target)}
          </span>
        </span>
      )}
    </div>
  );
}

/** An icon for each classic achievement. */
function AchievementIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  const size = 30;
  if (n.includes('team')) return <MembersIcon size={size} />;
  if (n.includes('friend in need')) return <DonationIcon size={size} />;
  if (n.includes('road to glory')) return <TrophyIcon size={size} />;
  if (n.includes('gatherer')) return <CardsIcon size={size} />;
  if (n.includes('tv royale')) return <EventIcon size={size} />;
  if (n.includes('tournament rewards')) return <ChestIcon size={size} />;
  if (n.includes('tournament')) return <ChallengeIcon size={size} />;
  if (n.includes('challenge')) return <ChallengeIcon size={size} />;
  if (n.includes('practice')) return <SwordsIcon size={size} />;
  return <BadgeIcon size={size} />;
}

export function BadgesTab({ p }: { p: PlayerProfile }) {
  const [showAll, setShowAll] = useState(false);
  const groups = GROUP_ORDER.map((g) => ({ g, items: p.badges.filter((b) => b.group === g) })).filter((x) => x.items.length);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {groups.map(({ g, items }) => {
        const sorted = g === 'Mastery' ? [...items].sort((a, b) => (b.level ?? 0) - (a.level ?? 0) || (b.progress ?? 0) - (a.progress ?? 0)) : items;
        const shown = g === 'Mastery' && !showAll ? sorted.slice(0, 16) : sorted;
        return (
          <section key={g} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <h3 className="heading">
                {g} <span className={s.count}>{items.length}</span>
              </h3>
              {g === 'Mastery' && (
                <button type="button" className="link-mono" style={{ background: 'none', border: 0, color: 'var(--blue)', cursor: 'pointer', fontSize: 10 }} onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show top 16' : `Showing 16 of ${items.length} · show all →`}
                </button>
              )}
            </div>
            <div className={s.shelf}>
              {shown.map((b) => (
                <BadgeItem key={b.id} b={b} />
              ))}
            </div>
          </section>
        );
      })}
      {p.achievements.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 className="heading">
            Achievements <span className={s.count}>{p.achievements.filter((a) => a.stars >= 3).length} / {p.achievements.length}</span>
          </h3>
          <div className={s.achievements}>
            {p.achievements.map((a) => {
              const done = a.value >= a.target;
              return (
                <div key={a.name} className={s.achievement} data-done={done}>
                  <span className={s.achIcon}>
                    <AchievementIcon name={a.name} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <span style={{ font: '600 14px/1.2 var(--sans)' }}>{a.name}</span>
                    <span style={{ font: '400 12px/1.3 var(--sans)', color: 'var(--text-3)' }}>{a.info}</span>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={s.achStars} aria-label={`${a.stars} of 3 stars`}>
                      {[0, 1, 2].map((i) => (
                        <svg key={i} width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                          <path d="M12 2l3 6.6 7.2.7-5.4 4.9 1.6 7.1L12 17.6 5.6 21.3l1.6-7.1L1.8 9.3 9 8.6Z" fill={i < a.stars ? '#F2B83A' : 'none'} stroke={i < a.stars ? '#7A4A08' : 'var(--text-3)'} strokeWidth="1.4" />
                        </svg>
                      ))}
                    </span>
                    <span style={{ font: '500 11px/1 var(--mono)', color: done ? 'var(--blue-hi)' : 'var(--text-2)' }}>{done ? 'Done' : `${fmt(a.value)} / ${fmt(a.target)}`}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

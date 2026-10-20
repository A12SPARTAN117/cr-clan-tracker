'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { DeckBlock } from '@/components/DeckBlock';
import { TagSearch } from '@/components/TagSearch';
import { ClanBadge } from '@/components/ui/ClanBadge';
import { ClanFrame } from '@/components/ui/ClanFrame';
import {
  AlertIcon,
  BadgeIcon,
  CardsIcon,
  ChestIcon,
  ClanWarIcon,
  ClockIcon,
  CrownIcon,
  DonationIcon,
  ExpIcon,
  FameIcon,
  MedalIcon,
  MembersIcon,
  StreakIcon,
  SwordsIcon,
  TowerIcon,
  TrophyIcon,
  WinRateIcon,
} from '@/components/ui/icons';
import type { CompareIcon, CompareKind, CompareRow, Comparison } from '@/lib/compare';
import { CompareArena, show } from './CompareArena';
import s from './compare.module.css';

const MAX = 4;
const ICONS: Record<CompareIcon, (p: { size?: number }) => React.ReactNode> = {
  trophy: TrophyIcon,
  medal: MedalIcon,
  crown: CrownIcon,
  swords: SwordsIcon,
  cards: CardsIcon,
  star: ExpIcon,
  donation: DonationIcon,
  war: ClanWarIcon,
  members: MembersIcon,
  winrate: WinRateIcon,
  streak: StreakIcon,
  clock: ClockIcon,
  chest: ChestIcon,
  fame: FameIcon,
  badge: BadgeIcon,
  tower: TowerIcon,
  alert: AlertIcon,
};
const COLORS = ['#3aa0ff', '#e6b34a', '#c79bff', '#4ed17a'];

/** Index of the leading value for rows with a direction (ties: no leader). */
function leader(r: CompareRow): number | null {
  if (!r.better) return null;
  const nums = r.values.map((v) => (typeof v === 'number' ? v : null));
  const ok = nums.filter((v): v is number => v != null);
  if (ok.length < 2) return null;
  const best = r.better === 'high' ? Math.max(...ok) : Math.min(...ok);
  const idx = nums.flatMap((v, i) => (v === best ? [i] : []));
  return idx.length === 1 ? idx[0] : null;
}

type Pair = { tag: string; name: string }[] | null;

export function CompareView({ data, suggest }: { data: Comparison; suggest?: { players: Pair; clans: Pair } | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const tags = data.entities.map((e) => e.tag);
  const go = (kind: CompareKind, next: string[]) => {
    const p = new URLSearchParams({ type: kind });
    if (next.length) p.set('tags', next.join(','));
    start(() => router.replace(`/compare?${p}`, { scroll: false }));
  };
  const n = data.entities.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26, opacity: pending ? 0.6 : 1, transition: 'opacity .2s' }}>
      <div className={s.toolbar}>
        <div className={s.kinds} role="radiogroup" aria-label="Compare players or clans">
          {(['player', 'clan'] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={data.kind === k} className={s.kind} onClick={() => k !== data.kind && go(k, [])}>
              {k === 'player' ? <SwordsIcon size={16} /> : <MembersIcon size={16} />}
              {k === 'player' ? 'Players' : 'Clans'}
            </button>
          ))}
        </div>
        <div className={s.chips}>
          {data.entities.map((e, i) => (
            <span key={e.tag} className={s.chip} style={{ ['--c' as string]: COLORS[i] }}>
              {e.badgeId != null && <ClanBadge badgeId={e.badgeId} size={18} />}
              {e.name}
              <button type="button" aria-label={`Remove ${e.name}`} onClick={() => go(data.kind, tags.filter((t) => t !== e.tag))}>
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {n < MAX && (
        <div style={{ maxWidth: 640 }}>
          <TagSearch
            key={data.kind}
            size="default"
            scope={data.kind}
            placeholder={data.kind === 'player' ? 'Add a player: name or #tag' : 'Add a clan: name or #tag'}
            defaultHint={`Add up to ${MAX} ${data.kind === 'player' ? 'players' : 'clans'}. Pick from the suggestions or type a #tag and press Enter.`}
            onPick={(it) => {
              if (it.kind !== data.kind || tags.includes(it.tag)) return;
              go(data.kind, [...tags, it.tag]);
            }}
          />
        </div>
      )}

      {data.missing.length > 0 && <div className="data-since">Couldn&apos;t load: {data.missing.map((t) => `#${t}`).join(', ')}</div>}

      {suggest && (suggest.players || suggest.clans) && (
        <div className={s.suggest}>
          <span className="label">Try a showdown</span>
          {(
            [
              ['player', suggest.players, 'Top 2 Path of Legends players'],
              ['clan', suggest.clans, 'Top 2 war clans'],
            ] as const
          ).map(([kind, pair, title]) =>
            pair ? (
              <Link key={kind} href={`/compare?type=${kind}&tags=${pair.map((x) => x.tag).join(',')}`} className={s.suggestCard}>
                <small>{title}</small>
                <span>
                  {pair[0].name} <b>VS</b> {pair[1].name}
                </span>
              </Link>
            ) : null,
          )}
        </div>
      )}

      {n >= 2 && <CompareArena data={data} colors={COLORS} />}

      {n === 0 ? (
        <p className="body">Add two or more {data.kind === 'player' ? 'players' : 'clans'} to compare them stat by stat. The leader of each row is highlighted.</p>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table} style={{ ['--n' as string]: n }}>
            <thead>
              <tr>
                <th />
                {data.entities.map((e, i) => (
                  <th key={e.tag} style={{ ['--c' as string]: COLORS[i] }}>
                    <Link href={data.kind === 'player' ? `/player/${e.tag}` : `/clan/${e.tag}`} className={s.who}>
                      {e.badgeId != null && <ClanFrame badgeId={e.badgeId} warTrophies={e.warTrophies} size={34} label />}
                      <span>
                        <b>{e.name}</b>
                        <small>{e.sub}</small>
                      </span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            {data.sections.map((sec) => (
              <tbody key={sec.title}>
                <tr className={s.section}>
                  <th colSpan={n + 1}>{sec.title}</th>
                </tr>
                {sec.rows.map((r) => {
                  const lead = leader(r);
                  const nums = r.values.map((v) => (typeof v === 'number' ? Math.abs(v) : 0));
                  const max = Math.max(1, ...nums);
                  const Icon = ICONS[r.icon];
                  return (
                    <tr key={r.label}>
                      <th scope="row">
                        <span className={s.rowLabel}>
                          <Icon size={15} />
                          {r.label}
                        </span>
                      </th>
                      {r.values.map((v, i) => (
                        <td key={i} data-lead={lead === i} style={{ ['--c' as string]: COLORS[i] }}>
                          <span className={s.val}>{r.labels?.[i] ?? show(v, r)}</span>
                          {typeof v === 'number' && r.better && n > 1 && (
                            <span className={s.bar}>
                              <span style={{ width: `${(Math.abs(v) / max) * 100}%` }} />
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
      )}

      {data.kind === 'player' && data.entities.some((e) => e.deck) && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 className="heading">Current decks</h3>
          <div className={s.decks}>
            {data.entities.map((e) =>
              e.deck ? (
                <div key={e.tag} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="label">{e.name}</span>
                  <DeckBlock name={e.deck.name} cards={e.deck.cards} tower={e.deck.tower} avgElixir={e.deck.avgElixir} cycle={e.deck.cycle} />
                </div>
              ) : null,
            )}
          </div>
        </section>
      )}
    </div>
  );
}

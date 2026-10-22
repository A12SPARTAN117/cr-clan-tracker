'use client';

import { HoverLink } from '@/components/ui/HoverLink';
import { useState } from 'react';
import { LeagueIcon, leagueName, PolRating } from '@/components/ui/primitives';
import { polLabel } from '@/lib/leagues';
import {
  AlertIcon,
  BadgeIcon,
  CardsIcon,
  ChallengeIcon,
  ChestIcon,
  ClanWarIcon,
  ClockIcon,
  CrownIcon,
  DonationIcon,
  EventIcon,
  ExpIcon,
  FameIcon,
  MedalIcon,
  MembersIcon,
  ReceivedIcon,
  StreakIcon,
  SwordsIcon,
  TowerIcon,
  TrophyIcon,
  WinRateIcon,
} from '@/components/ui/icons';
import { DeckBlock, DeckGrid } from '@/components/DeckBlock';
import { EmptyState } from '@/components/EmptyState';
import { agoShort, dstr, fmt, monthStr } from '@/lib/format';
import type { PlayerProfile } from '@/lib/player/profile';
import type { PlayerHistory } from '@/lib/history';
import { polChanges, withChanges } from '@/lib/history/playerDaily';
import { reconstructFromBadges } from '@/lib/player/reconstruct';
import s from './player.module.css';
import type { NameHistory } from './PlayerView';

/* ---------------- Stats ---------------- */
type Row = [React.ReactNode, string, React.ReactNode];

export function StatsTab({ p }: { p: PlayerProfile }) {
  const t = p.totals;
  const own = p.collection.filter((c) => c.owned);
  const badge = (name: string) => p.badges.find((b) => b.id === name);
  const polRow = (x: PlayerProfile['pol']['current']) =>
    x ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <LeagueIcon league={x.league} size={18} />
        {polLabel(x)}
        {/* Below Ultimate Champion the API's number is progress in the league, not a rating. */}
        {x.league >= 7 && <>· <PolRating rating={x.rating} size={13} /></>}
      </span>
    ) : (
      '—'
    );
  const rank = (x: PlayerProfile['pol']['current']) => (x?.rank ? `#${fmt(x.rank)}` : '—');
  const form = p.battles.filter((b) => b.kind !== 'friendly');
  const formWins = form.filter((b) => b.result === 'win').length;
  const enemy = p.enemies[0];
  const secs: { title: string; rows: Row[] }[] = [
    {
      title: 'RANKED · PATH OF LEGENDS',
      rows: [
        [<MedalIcon key="i" size={16} />, 'Current season', polRow(p.pol.current)],
        [<TrophyIcon key="i" size={16} />, 'Global rank (current)', rank(p.pol.current)],
        [<MedalIcon key="i" size={16} />, 'Previous season', polRow(p.pol.last)],
        [<TrophyIcon key="i" size={16} />, 'Previous rank', rank(p.pol.last)],
        [<MedalIcon key="i" size={16} />, 'Best season', polRow(p.pol.best)],
        [<TrophyIcon key="i" size={16} />, 'Best rank', rank(p.pol.best)],
      ],
    },
    {
      title: 'TROPHY ROAD',
      rows: [
        [<TrophyIcon key="i" size={16} />, 'Trophy Road trophies', fmt(p.trophies)],
        [<TrophyIcon key="i" size={16} />, 'Trophy Road best', fmt(p.bestTrophies)],
        [<TrophyIcon key="i" size={16} />, p.seasonal ? `Seasonal road · ${p.seasonal.arena}` : 'Seasonal road', p.seasonal ? `${fmt(p.seasonal.trophies)} (season best ${fmt(p.seasonal.best)})` : 'Opens at 14,000'],
        [<TrophyIcon key="i" size={16} />, 'Legacy trophy road best', fmt(p.legacyHigh)],
        [<TowerIcon key="i" size={16} />, 'Trophy Road arena', p.arena ?? '—'],
      ],
    },
    {
      title: 'BATTLE',
      rows: [
        [<CrownIcon key="i" size={16} />, 'Wins', fmt(t.wins)],
        [<SwordsIcon key="i" size={16} />, 'Losses', fmt(t.losses)],
        [<WinRateIcon key="i" size={16} />, 'Win %', t.wins + t.losses ? `${((t.wins / (t.wins + t.losses)) * 100).toFixed(1)}%` : '—'],
        [<CrownIcon key="i" size={16} />, 'Three-crown wins', fmt(t.threeCrown)],
        [<SwordsIcon key="i" size={16} />, 'Battle count', fmt(t.battleCount)],
        [<StreakIcon key="i" size={16} />, 'Current streak (all modes)', p.streakRun.kind ? `${p.streakRun.count} ${p.streakRun.kind === 'win' ? 'wins' : 'losses'}` : '—'],
        [<WinRateIcon key="i" size={16} />, `Win % · last ${form.length} games`, form.length ? `${Math.round((formWins / form.length) * 100)}%` : '—'],
        [<AlertIcon key="i" size={16} />, `Worst enemy (last ${p.battles.length})`, enemy ? `${enemy.name} · lost ${enemy.losses}/${enemy.games}` : '—'],
      ],
    },
    {
      title: 'COLLECTION',
      rows: [
        [<CardsIcon key="i" size={16} />, 'Collection level', fmt(p.collectionLevel)],
        [<CardsIcon key="i" size={16} />, 'Cards found', `${own.length} / ${p.collection.length}`],
        [<CardsIcon key="i" size={16} />, 'Max-level cards', String(own.filter((c) => c.level === 16).length)],
        [<ExpIcon key="i" size={16} />, 'Average card level', own.length ? (own.reduce((a, c) => a + (c.level ?? 0), 0) / own.length).toFixed(2) : '—'],
        [<CardsIcon key="i" size={16} />, 'Evolutions unlocked', `${p.collection.filter((c) => c.evoUnlocked).length} / ${p.collection.filter((c) => c.canEvo).length}`],
        [<CardsIcon key="i" size={16} />, 'Heroes unlocked', `${p.collection.filter((c) => c.heroUnlocked).length} / ${p.collection.filter((c) => c.canHero).length}`],
        [<TowerIcon key="i" size={16} />, 'Tower troops', `${p.towers.filter((x) => x.owned).length} / ${p.towers.length}`],
        [<BadgeIcon key="i" size={16} />, 'Card mastery', `${p.mastery.length} cards · sum ${p.mastery.reduce((a, m) => a + m.level, 0)}`],
        [<BadgeIcon key="i" size={16} />, 'Badges', String(p.badges.length)],
        [<EventIcon key="i" size={16} />, 'Emotes', fmt(badge('EmoteCollection')?.progress)],
        [<FameIcon key="i" size={16} />, 'Banners', fmt(badge('BannerCollection')?.progress)],
      ],
    },
    {
      title: 'CHALLENGES & TOURNAMENTS',
      rows: [
        [<ChallengeIcon key="i" size={16} />, 'Max challenge wins', fmt(t.challengeMaxWins)],
        [<ChestIcon key="i" size={16} />, 'Challenge cards won', fmt(t.challengeCardsWon)],
        [<SwordsIcon key="i" size={16} />, 'Tournament battles', fmt(t.tournamentBattles)],
        [<ChestIcon key="i" size={16} />, 'Tournament cards won', fmt(t.tournamentCardsWon)],
      ],
    },
    {
      title: 'CLAN & WAR',
      rows: [
        [<MembersIcon key="i" size={16} />, 'Clan', p.clan?.name ?? '—'],
        [<DonationIcon key="i" size={16} />, 'Donations (total)', fmt(t.totalDonations)],
        [<DonationIcon key="i" size={16} />, 'Donated this week', fmt(t.donationsWeek)],
        [<ReceivedIcon key="i" size={16} />, 'Received this week', fmt(t.receivedWeek)],
        [<ClanWarIcon key="i" size={16} />, 'War wins (river races)', fmt(t.warWins)],
        [<ClanWarIcon key="i" size={16} />, 'Clan Wars 1 wins (retired mode)', fmt(t.warDayWins)],
        [<CardsIcon key="i" size={16} />, 'Clan cards collected', fmt(t.clanCardsCollected)],
      ],
    },
    {
      title: 'PROGRESS',
      rows: [
        [<TowerIcon key="i" size={16} />, 'King tower level', p.kingTower != null ? String(p.kingTower) : '—'],
        [<ExpIcon key="i" size={16} />, 'EXP level', String(p.expLevel)],
        [<BadgeIcon key="i" size={16} />, 'Star points', fmt(t.starPoints)],
        [<ExpIcon key="i" size={16} />, 'Total EXP', fmt(t.totalExp)],
        [<ClockIcon key="i" size={16} />, 'Years played', fmt(badge('YearsPlayed')?.level)],
      ],
    },
  ];
  return (
    <div className={s.statGrid}>
      {secs.map((sec) => (
        <div key={sec.title} className="panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <span style={{ position: 'absolute', top: -1, left: -1, width: 10, height: 10, borderTop: '1px solid var(--frame)', borderLeft: '1px solid var(--frame)' }} />
          <span style={{ font: '500 10px/1 var(--mono)', letterSpacing: '.16em', color: 'var(--blue-hi)', marginBottom: 10 }}>{sec.title}</span>
          {sec.rows.map(([icon, k, v]) => (
            <div key={k} className={s.statRow}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, font: '400 14px/1.2 var(--sans)', color: 'var(--text-2)', minWidth: 0 }}>
                <span style={{ width: 18, display: 'inline-flex', justifyContent: 'center', flex: 'none' }}>{icon}</span>
                {k}
              </span>
              <span style={{ font: '600 14px/1.2 var(--mono)', fontVariantNumeric: 'tabular-nums', textAlign: 'right', overflowWrap: 'anywhere' }}>{v}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Decks ---------------- */
export function DecksTab({ p }: { p: PlayerProfile }) {
  if (!p.decks.length) return <EmptyChest text="No decks in the battle log yet." />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span className="label" style={{ letterSpacing: '.14em', paddingBottom: 14 }}>
        Decks from the battle log · win rates are based on tracked games only
      </span>
      <DeckGrid>
        {p.decks.map((d) => (
          <DeckBlock
            key={d.key}
            name={d.name}
            cards={d.cards}
            avgElixir={d.avgElixir}
            cycle={d.cycle}
            games={d.games}
            win={(d.wins / d.games) * 100}
            action={<span className="label-sm">{agoShort(d.lastHours).toUpperCase()} AGO</span>}
          />
        ))}
      </DeckGrid>
    </div>
  );
}

/* ---------------- History ---------------- */
const EmptyChest = EmptyState;

function Table({ head, rows, empty }: { head: [string, 'left' | 'right'][]; rows: React.ReactNode[][]; empty?: string }) {
  return (
    <div style={{ border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--charcoal)', overflowX: 'auto' }}>
      <div style={{ minWidth: 520, display: 'grid', gridTemplateColumns: head.map((_, i) => (i === 0 ? '1.4fr' : '1fr')).join(' ') }}>
        {head.map(([t, al]) => (
          <span key={t} style={{ padding: '12px 16px', font: '500 10px/1 var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)', borderBottom: '1px solid var(--hair)', textAlign: al }}>
            {t}
          </span>
        ))}
        {rows.map((r, i) =>
          r.map((c, j) => (
            <span
              key={`${i}-${j}`}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--hair)',
                font: j === 0 ? '600 14px/1.2 var(--sans)' : '500 13px/1.2 var(--mono)',
                textAlign: head[j][1],
              }}
            >
              {c}
            </span>
          )),
        )}
      </div>
      {empty && <EmptyChest text={empty} />}
    </div>
  );
}

function TrophyChart({ points }: { points: { day: string; trophies: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const n = points.length;
  const vals = points.map((p) => p.trophies);
  const mn = Math.min(...vals) - 20;
  const mx = Math.max(...vals) + 20;
  const X = (i: number) => (n === 1 ? 500 : (i / (n - 1)) * 1000);
  const Y = (v: number) => 240 - ((v - mn) / Math.max(1, mx - mn)) * 240;
  const bestSoFar = vals.reduce<number[]>((acc, v) => [...acc, Math.max(acc[acc.length - 1] ?? 0, v)], []);
  const bestLine = bestSoFar.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const line = vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const h = hover != null ? points[hover] : null;
  return (
    <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span className="label" style={{ letterSpacing: '.14em' }}>
          Trophies · tracked days
        </span>
        <span style={{ font: '500 11px/1 var(--mono)', color: 'var(--text-2)' }}>{h ? `${dstr(new Date(h.day)).toUpperCase()} · ${fmt(h.trophies)} TROPHIES` : 'HOVER THE LINE'}</span>
      </div>
      <svg
        viewBox="0 0 1000 260"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Trophies over ${n} tracked days, from ${fmt(vals[0])} to ${fmt(vals[n - 1])}`}
        style={{ width: '100%', height: 260, overflow: 'visible' }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
        }}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 80, 160, 240].map((y) => (
          <line key={y} x1="0" x2="1000" y1={y} y2={y} stroke="var(--hair)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <polyline points={line} fill="none" stroke="var(--text-1)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        <polyline points={bestLine} fill="none" stroke="var(--blue)" strokeWidth="1.2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        {hover != null && (
          <>
            <line x1={X(hover)} x2={X(hover)} y1="0" y2="240" stroke="rgba(var(--glow-hi-rgb), .5)" vectorEffect="non-scaling-stroke" />
            <circle cx={X(hover)} cy={Y(vals[hover])} r="5" fill="var(--blue-hi)" style={{ filter: 'drop-shadow(0 0 6px var(--blue))' }} />
          </>
        )}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 9px/1 var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)' }}>
        <span>{dstr(new Date(points[0].day)).toUpperCase()}</span>
        <span>{dstr(new Date(points[n - 1].day)).toUpperCase()}</span>
      </div>
      <div style={{ display: 'flex', gap: 20, font: '500 10px/1 var(--mono)', letterSpacing: '.1em', color: 'var(--text-2)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 16, height: 1.5, background: 'var(--text-1)' }} />
          TROPHIES
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 16, borderTop: '1.5px dashed var(--blue)' }} />
          BEST SO FAR
        </span>
      </div>
    </div>
  );
}

const ROLE_TXT: Record<string, string> = { leader: 'Leader', coLeader: 'Co-Leader', elder: 'Elder', member: 'Member' };

/** Says where a table's rows come from: our own snapshots, or reconstructed from what the API still shows. */
function Source({ kind, children }: { kind: 'tracked' | 'reconstructed'; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', font: '500 10px/1.5 var(--mono)', letterSpacing: '.1em', color: 'var(--text-3)' }}>
      <span style={{ color: kind === 'tracked' ? 'var(--blue-hi)' : 'var(--text-2)', border: '1px solid var(--hair)', borderRadius: 4, padding: '2px 6px' }}>
        {kind === 'tracked' ? 'TRACKED' : 'RECONSTRUCTED'}
      </span>
      <span>{children}</span>
    </div>
  );
}

const signed = (n: number | null) => (n == null ? '' : n > 0 ? ` (+${fmt(n)})` : n < 0 ? ` (${fmt(n)})` : '');
const polCell = (league: number | null, rating: number | null) =>
  league == null ? (
    '—'
  ) : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <LeagueIcon league={league} size={18} />
      {league >= 7 && rating != null ? <PolRating rating={rating} size={13} /> : leagueName(league)}
    </span>
  );

/** Names and clans over time, newest first, from every time the site saw this player. */
function NamesTimeline({ names }: { names: NameHistory }) {
  if (!names?.length) return null;
  const changes = names.length - 1;
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 className="heading">
        Names and clans{' '}
        <span style={{ font: '500 11px/1 var(--mono)', color: 'var(--text-3)' }}>
          {changes ? `${changes} change${changes === 1 ? '' : 's'}` : 'no changes seen yet'}
        </span>
      </h3>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', borderLeft: '2px solid var(--hair)' }}>
        {names.map((n, i) => (
          <li key={n.from} style={{ position: 'relative', padding: '0 0 14px 18px' }}>
            <span aria-hidden style={{ position: 'absolute', left: -6, top: 4, width: 10, height: 10, borderRadius: '50%', background: i === 0 ? 'var(--blue)' : 'var(--slate)', border: '2px solid var(--void)' }} />
            <span style={{ display: 'block', font: '600 15px/1.3 var(--sans)' }}>
              {n.name}
              <span style={{ font: '500 12px/1 var(--sans)', color: 'var(--text-2)' }}>
                {' · '}
                {n.clanTag ? <HoverLink href={`/clan/${n.clanTag}`}>{n.clanName ?? `#${n.clanTag}`}</HoverLink> : 'No clan'}
              </span>
            </span>
            <span style={{ font: '500 10px/1.4 var(--mono)', letterSpacing: '.06em', color: 'var(--text-3)' }}>
              {dstr(new Date(n.from))}
              {n.to.slice(0, 10) !== n.from.slice(0, 10) ? ` – ${i === 0 ? 'now' : dstr(new Date(n.to))}` : i === 0 ? ' – now' : ''}
            </span>
          </li>
        ))}
      </ol>
      <span className="label-sm" style={{ lineHeight: 1.6 }}>
        Seen on this site from profile visits, daily snapshots and tracked clans&apos; rosters. The API has no name history, so earlier names don&apos;t show.
      </span>
    </section>
  );
}

export function HistoryTab({ p, h: hist, names }: { p: PlayerProfile; h: PlayerHistory | null; names: NameHistory }) {
  const [h, setH] = useState<'trophy' | 'clan' | 'pol' | 'war' | 'before'>(hist?.trophies.length || hist?.days.length ? 'trophy' : 'pol');
  const seasons = (
    [
      ['Current season', p.pol.current],
      ['Previous season', p.pol.last],
      ['Best season', p.pol.best],
    ] as const
  ).filter(([, x]) => x);
  // Tracking began with whichever came first: the player's own snapshots or a tracked clan's.
  const since = [hist?.trackedSince, hist?.clans.length ? hist.clans[hist.clans.length - 1].from : null].filter((x): x is string => !!x).sort()[0] ?? null;
  const perDay = new Map((hist?.war ?? []).map((w) => [w.week, w.days]));
  const days = withChanges(hist?.days ?? []).slice(0, 30);
  const polDays = polChanges(hist?.days ?? []);
  const past = reconstructFromBadges(p.badges, new Date(p.generatedAt));
  const timeline: { sort: string; when: string; what: string; detail: string }[] = [
    ...past.seasons.map((x) => ({ sort: x.month, when: monthStr(x.month), what: 'Seasonal trophy road badge', detail: x.level ? `Tier ${x.level}${x.maxLevel ? `/${x.maxLevel}` : ''}` : '—' })),
    ...past.years.map((y) => ({ sort: `${y}-13`, when: String(y), what: 'Yearly badge', detail: 'Played that year' })),
    ...past.dated.map((x) => ({ sort: `${x.year}-12`, when: String(x.year), what: x.label, detail: 'Event badge' })),
  ].sort((a, b) => b.sort.localeCompare(a.sort));
  if (past.playingSince?.date) {
    timeline.push({
      sort: '',
      when: `~${monthStr(past.playingSince.date.slice(0, 7))}`,
      what: 'Account created',
      detail: `${past.playingSince.years} years · ${fmt(past.playingSince.days)} days ago`,
    });
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <NamesTimeline names={names} />
      <div className="data-since">
        {since
          ? `Tracking since ${dstr(new Date(since))}. Daily snapshots build history from then; anything earlier is reconstructed from what the profile and the clan’s race log still show.`
          : 'Tracking starts with this visit: a daily snapshot from today on. Anything earlier is reconstructed from what the profile and the clan’s race log still show.'}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(
          [
            ['trophy', 'Trophy history'],
            ['pol', 'Path of Legends'],
            ['clan', 'Clan history'],
            ['war', 'Clan wars'],
            ['before', 'Before tracking'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" className="chip" style={{ height: 32 }} aria-pressed={h === k} onClick={() => setH(k)}>
            {l}
          </button>
        ))}
      </div>
      {h === 'pol' && (
        <>
          <Source kind="reconstructed">From the profile: the current, previous and best season results.</Source>
          <Table
            head={[
              ['SEASON', 'left'],
              ['LEAGUE', 'left'],
              ['RATING', 'right'],
              ['RANK', 'right'],
            ]}
            rows={seasons.map(([label, x]) => [
              label,
              <span key="l" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <LeagueIcon league={x!.league} size={20} />
                {polLabel(x!)}
              </span>,
              x!.league >= 7 ? <PolRating key="r" rating={x!.rating} size={14} /> : '—',
              x!.rank ? `#${fmt(x!.rank)}` : '—',
            ])}
            empty={seasons.length ? undefined : 'No Path of Legends seasons on record.'}
          />
          {polDays.length > 0 && (
            <>
              <Source kind="tracked">Daily snapshots, on the days the league, rating or rank moved.</Source>
              <Table
                head={[
                  ['DAY', 'left'],
                  ['LEAGUE', 'left'],
                  ['RATING', 'right'],
                  ['RANK', 'right'],
                ]}
                rows={polDays.map((d) => [
                  dstr(new Date(d.day)),
                  polCell(d.polLeague, null),
                  d.polLeague != null && d.polLeague >= 7 && d.polRating != null ? <PolRating key="r" rating={d.polRating} size={14} /> : fmt(d.polRating),
                  d.polRank ? `#${fmt(d.polRank)}` : '—',
                ])}
              />
            </>
          )}
        </>
      )}
      {h === 'war' && (
        <>
          <Source kind="reconstructed">From the clan’s river race log: its last 10 races, with this player’s decks and fame in each.</Source>
          <Table
            head={[
              ['WEEK', 'left'],
              ['CLAN', 'left'],
              ['DECKS', 'right'],
              ['FAME', 'right'],
            ]}
            rows={(p.war ?? []).map((w) => {
              const days = w.week ? perDay.get(w.week) : undefined;
              const split = days ? ` (${days.map((d) => (d == null ? '–' : d)).join(' ')})` : '';
              return [w.label, p.clan?.name ?? '—', `${w.decks}/16${split}`, fmt(w.fame)];
            })}
            empty={p.war?.length ? undefined : p.clan ? 'No races for this player in the clan’s last 10 races.' : 'Not in a clan, so no river races to show.'}
          />
        </>
      )}
      {h === 'clan' && (
        <Table
          head={[
            ['CLAN', 'left'],
            ['ROLE', 'left'],
            ['FROM', 'left'],
            ['TO', 'left'],
          ]}
          rows={
            hist?.clans.length
              ? hist.clans.map((c) => [c.clanName, ROLE_TXT[c.role] ?? c.role, c.baseline ? `Before ${dstr(new Date(c.from))}` : dstr(new Date(c.from)), c.to ? dstr(new Date(c.to)) : 'Now'])
              : p.clan
                ? [[p.clan.name, p.role ? ROLE_TXT[p.role] : '—', 'Before tracking', 'Now']]
                : []
          }
          empty={hist?.clans.length ? undefined : 'Earlier clans were not tracked. Clan moves appear here once a clan they are in gets tracked.'}
        />
      )}
      {h === 'trophy' && (
        <>
          {hist && hist.trophies.length >= 2 ? (
            <TrophyChart points={hist.trophies} />
          ) : (
            <EmptyChest text="Trophy history needs daily snapshots. The chart fills in from the second tracked day." />
          )}
          {days.length > 0 && (
            <>
              <Source kind="tracked">Daily profile snapshots, newest first. Changes are since the snapshot before.</Source>
              <Table
                head={[
                  ['DAY', 'left'],
                  ['TROPHIES', 'right'],
                  ['SEASONAL', 'right'],
                  ['PATH OF LEGENDS', 'left'],
                  ['WINS', 'right'],
                  ['BATTLES', 'right'],
                ]}
                rows={days.map((d) => [
                  dstr(new Date(d.day)),
                  `${fmt(d.trophies)}${signed(d.trophyChange)}`,
                  fmt(d.seasonalTrophies),
                  polCell(d.polLeague, d.polRating),
                  `${fmt(d.wins)}${signed(d.winsGained)}`,
                  `${fmt(d.battleCount)}${signed(d.battlesPlayed)}`,
                ])}
              />
            </>
          )}
        </>
      )}
      {h === 'before' && (
        <>
          <Source kind="reconstructed">From badges on the profile: account age, seasonal and yearly badges, and event badges that carry their year.</Source>
          <Table
            head={[
              ['WHEN', 'left'],
              ['WHAT', 'left'],
              ['DETAIL', 'right'],
            ]}
            rows={timeline.map((t) => [t.when, t.what, t.detail])}
            empty={timeline.length ? undefined : 'No dated badges on this profile.'}
          />
          {past.finishes.length > 0 && (
            <Table
              head={[
                ['ALL TIME', 'left'],
                ['COUNT', 'right'],
              ]}
              rows={past.finishes.map((f) => [f.label, fmt(f.count)])}
            />
          )}
        </>
      )}
    </div>
  );
}

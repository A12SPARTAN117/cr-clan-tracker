'use client';

import Link from 'next/link';
import { useCallback, useState, useTransition } from 'react';
import { SceneHeader } from '@/components/SceneHeader';
import { Decode, Reveal } from '@/components/fx/Reveal';
import { LeagueIcon, leagueName, RoleIcon, ROLE_LABEL } from '@/components/ui/primitives';
import { CardsIcon, MedalIcon, StreakIcon, TowerIcon, TrophyIcon } from '@/components/ui/icons';
import { Tabs } from '@/components/ui/Tabs';
import { agoShort, fmt } from '@/lib/format';
import { setPin, usePins } from '@/lib/pins';
import type { PlayerProfile } from '@/lib/player/profile';
import type { PlayerHistory } from '@/lib/history';
import { refreshPlayer } from './actions';
import { BadgesTab } from './Badges';
import { BattlesTab } from './Battles';
import { CollectionTab } from './Collection';
import { OverviewTab } from './Overview';
import { DecksTab, HistoryTab, StatsTab } from './TabsB';
import s from './player.module.css';

type Tab = 'overview' | 'collection' | 'badges' | 'stats' | 'battles' | 'decks' | 'history';

export function PlayerView({ p, history }: { p: PlayerProfile; history: PlayerHistory | null }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [toast, setToast] = useState('');
  const [syncing, startSync] = useTransition();
  const pins = usePins();
  const pinned = pins.player === p.tag;
  const flash = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((c) => (c === t ? '' : c)), 1800);
  }, []);

  const run = p.streakRun;
  const streak = run.kind ? `${run.kind === 'win' ? 'W' : 'L'}${run.count}` : '—';
  const facts: { k: string; v: string; sub?: string; fg?: string; league?: number | null; icon?: React.ReactNode }[] = [
    { k: 'KING TOWER', v: p.kingTower != null ? String(p.kingTower) : '—', icon: <TowerIcon size={18} /> },
    { k: 'COLLECTION LVL', v: p.collectionLevel != null ? fmt(p.collectionLevel) : '—', icon: <CardsIcon size={18} /> },
    { k: 'ARENA', v: p.arena ?? '—' },
    { k: 'TROPHIES', v: fmt(p.seasonal?.trophies ?? p.trophies), sub: `BEST ${fmt(p.seasonal?.best ?? p.bestTrophies)}`, icon: <TrophyIcon size={18} /> },
    {
      k: 'PATH OF LEGENDS',
      // Below Ultimate Champion the API reports progress, not a rating: show the league.
      v: !p.pol.current ? '—' : p.pol.current.league >= 7 ? fmt(p.pol.current.rating) : leagueName(p.pol.current.league),
      league: p.pol.current?.league ?? null,
      icon: (p.pol.current?.league ?? 0) >= 7 ? <MedalIcon size={18} title="Ultimate Champion medals" /> : undefined,
    },
    { k: 'STREAK', v: streak, fg: run.kind === 'win' ? '#FFB35C' : run.kind === 'loss' ? '#FF5464' : '#F3F4F6', icon: run.kind === 'win' ? <StreakIcon size={18} /> : undefined },
  ];

  return (
    <>
      <SceneHeader
        scene="/scenes/castle.jpg"
        height="clamp(440px, 55vh, 600px)"
        fog={1.2}
        extra={
          <>
            {p.favourite?.render && <div className={s.char} style={{ backgroundImage: `url(${p.favourite.render})` }} title={`Favourite card: ${p.favourite.name}`} />}
            <div className={s.shade} />
          </>
        }
        status={
          <>
            {p.lastSeenHours != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F3F4F6' }}>
                <span className="live-dot" />
                Seen {p.lastSeenHours < 1 ? 'just now' : `${agoShort(p.lastSeenHours)} ago`}
              </span>
            )}
            <span>Last sync {p.generatedAt.slice(11, 16)} UTC</span>
            {p.favourite && <span>Favourite · {p.favourite.name}</span>}
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 880 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className={s.chip}
              onClick={() => {
                navigator.clipboard?.writeText(`#${p.tag}`).catch(() => {});
                flash('Tag copied');
              }}
            >
              #{p.tag} <span style={{ color: '#80868F' }}>COPY</span>
            </button>
            {p.clan && (
              <Link href={`/clan/${p.clan.tag}`} className={s.chip}>
                {p.clan.name}
                {p.role && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: p.role === 'leader' ? '#E6B34A' : '#F3F4F6' }}>
                    <RoleIcon role={p.role} />
                    {ROLE_LABEL[p.role]}
                  </span>
                )}
              </Link>
            )}
          </div>
          <Reveal as="h1" className={s.name}>
            {p.name}
          </Reveal>
          <div className={s.facts}>
            {facts.map((f) => (
              <div key={f.k} className={s.fact}>
                <span className={s.factK}>{f.k}</span>
                <span className={s.factV} style={{ color: f.fg ?? '#F3F4F6' }}>
                  {f.league != null && <LeagueIcon league={f.league} size={22} />}
                  {f.icon}
                  <Decode>{f.v}</Decode>
                  {f.sub && <span style={{ font: '500 11px/1 var(--mono)', color: '#80868F' }}>{f.sub}</span>}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button
              type="button"
              data-magnet=""
              className="btn"
              style={
                pinned
                  ? { background: 'transparent', color: '#8CCBFF', boxShadow: 'inset 0 0 0 1px rgba(58,160,255,.7),0 0 18px rgba(58,160,255,.3)' }
                  : { background: '#F3F4F6', color: '#07080A' }
              }
              onClick={() => {
                setPin('player', pinned ? null : p.tag);
                if (!pinned && p.clan && !pins.clan) setPin('clan', p.clan.tag);
                flash(pinned ? 'Unpinned' : 'Pinned. Home opens to your data');
              }}
            >
              {pinned ? '✓ Pinned as me' : 'Pin as me'}
            </button>
            <button
              type="button"
              className="btn btn-scene"
              disabled={syncing}
              onClick={() =>
                startSync(async () => {
                  await refreshPlayer(p.tag);
                  flash('Player data refreshed');
                })
              }
            >
              {syncing ? 'Syncing…' : '↻ Refresh'}
            </button>
            <Link href={`/compare?type=player&tags=${p.tag}`} className="btn btn-scene">
              Compare ⇄
            </Link>
          </div>
        </div>
      </SceneHeader>

      <main className={s.main}>
        <Tabs<Tab>
          label="Player sections"
          sticky
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'overview', label: 'Overview' },
            { key: 'collection', label: 'Collection' },
            { key: 'badges', label: 'Badges' },
            { key: 'stats', label: 'Stats' },
            { key: 'battles', label: 'Battles' },
            { key: 'decks', label: 'Decks' },
            { key: 'history', label: 'History' },
          ]}
        />
        {tab === 'overview' && <OverviewTab p={p} onCopy={flash} />}
        {tab === 'collection' && <CollectionTab p={p} />}
        {tab === 'badges' && <BadgesTab p={p} />}
        {tab === 'stats' && <StatsTab p={p} />}
        {tab === 'battles' && <BattlesTab p={p} />}
        {tab === 'decks' && <DecksTab p={p} />}
        {tab === 'history' && <HistoryTab p={p} h={history} />}
      </main>

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 84,
            transform: 'translateX(-50%)',
            zIndex: 100,
            padding: '12px 18px',
            background: 'var(--obsidian)',
            border: '1px solid rgba(58,160,255,.6)',
            borderRadius: 6,
            boxShadow: '0 0 18px rgba(58,160,255,.35)',
            font: '500 11px/1 var(--mono)',
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            animation: 'oaFade .2s',
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}

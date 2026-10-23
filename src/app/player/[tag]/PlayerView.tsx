'use client';

import { HoverLink } from '@/components/ui/HoverLink';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { SceneHeader } from '@/components/SceneHeader';
import { ShareRecap } from '@/components/ShareRecap';
import { Decode, Reveal } from '@/components/fx/Reveal';
import { LeagueIcon, leagueName, RoleIcon, ROLE_LABEL } from '@/components/ui/primitives';
import { CardsIcon, MedalIcon, StreakIcon, TowerIcon, TrophyIcon } from '@/components/ui/icons';
import { Tabs } from '@/components/ui/Tabs';
import { agoShort, fmt } from '@/lib/format';
import { setPin, usePins } from '@/lib/pins';
import { setRival, useMyRivals } from '@/lib/myRivals';
import type { PlayerLite } from '@/lib/player/lite';
import type { PlayerProfile } from '@/lib/player/profile';
import { EmptyState } from '@/components/EmptyState';
import type { PlayerHistory } from '@/lib/history';
import type { Rivals } from '@/lib/player/rivals';
import { unpackCards, type Packed } from '@/lib/cardPack';
import { refreshPlayer } from './actions';
import { BadgesTab } from './Badges';
import { BattlesTab } from './Battles';
import { CollectionTab } from './Collection';
import { InsightsTab } from './Insights';
import { OverviewTab } from './Overview';
import type { Insights } from '@/lib/player/insights';
import { DecksTab, HistoryTab, StatsTab } from './TabsB';
import s from './player.module.css';

type Tab = 'overview' | 'collection' | 'badges' | 'stats' | 'insights' | 'battles' | 'decks' | 'history';

/** A player's names and clans over time (null without a database). */
export type NameHistory = { name: string; clanTag: string | null; clanName: string | null; from: string; to: string }[] | null;

/**
 * The full profile, loaded the first time a tab other than Overview or Insights opens (the page
 * only carries what those show). Failed: null with `failed`, and the tab offers a retry.
 */
function useFullProfile(tag: string, want: boolean) {
  const [got, setGot] = useState<{ tag: string; p: PlayerProfile | null; failed: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!want || (got?.tag === tag && !got.failed)) return;
    let live = true;
    fetch(`/api/player/${encodeURIComponent(tag)}`)
      .then((r) => (r.ok ? (r.json() as Promise<Packed<PlayerProfile>>) : null))
      .catch(() => null)
      .then((d) => live && setGot({ tag, p: d ? unpackCards(d) : null, failed: !d }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `got` only gates the first load; `attempt` retries
  }, [tag, want, attempt]);
  const mine = got?.tag === tag ? got : null;
  return { full: mine?.p ?? null, failed: !!mine?.failed, retry: () => setAttempt((n) => n + 1) };
}

/** Everything the profile page shows at first, sent with its cards packed (see lib/cardPack). */
export type PlayerData = { p: PlayerLite; history: PlayerHistory | null; rivals: Rivals; insights: Insights; names: NameHistory };

export function PlayerView({ data }: { data: Packed<PlayerData> }) {
  const { p, history, rivals, insights, names } = useMemo(() => unpackCards(data), [data]);
  const [tab, setTab] = useState<Tab>('overview');
  const needsFull = tab !== 'overview' && tab !== 'insights';
  const { full, failed, retry } = useFullProfile(p.tag, needsFull);
  const [toast, setToast] = useState('');
  const [syncing, startSync] = useTransition();
  const pins = usePins();
  const pinned = pins.player === p.tag;
  // Rivals are added to the pinned player ("you"); the list stays on this device, like pins.
  const mine = useMyRivals(pins.player);
  const isRival = mine.includes(p.tag);
  const flash = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((c) => (c === t ? '' : c)), 1800);
  }, []);

  const run = p.streakRun;
  const streak = run.kind ? `${run.kind === 'win' ? 'W' : 'L'}${run.count}` : '—';
  const facts: { k: string; v: string; sub?: string; fg?: string; league?: number | null; icon?: React.ReactNode }[] = [
    { k: 'KING TOWER', v: p.kingTower != null ? String(p.kingTower) : '—', icon: <TowerIcon size={18} /> },
    { k: 'COLLECTION LVL', v: p.collectionLevel != null ? fmt(p.collectionLevel) : '—', icon: <CardsIcon size={18} /> },
    { k: 'ARENA', v: p.seasonal?.arena ?? p.arena ?? '—' },
    { k: 'TROPHIES', v: fmt(p.seasonal?.trophies ?? p.trophies), sub: `${p.seasonal ? 'SEASON BEST' : 'BEST'} ${fmt(p.seasonal?.best ?? p.bestTrophies)}`, icon: <TrophyIcon size={18} /> },
    {
      k: 'PATH OF LEGENDS',
      // Below Ultimate Champion the API reports progress, not a rating: show the league.
      v: !p.pol.current ? '—' : p.pol.current.league >= 7 ? fmt(p.pol.current.rating) : leagueName(p.pol.current.league),
      league: p.pol.current?.league ?? null,
      // Global rank, when the API has one (top finishers only).
      sub: p.pol.current?.rank ? `#${fmt(p.pol.current.rank)} GLOBAL` : undefined,
      icon: (p.pol.current?.league ?? 0) >= 7 ? <MedalIcon size={18} title="Ultimate Champion medals" /> : undefined,
    },
    // From the battle log, every mode but friendlies and boat battles. The API's own streak field
    // follows rules it doesn't document (it matched no combination of modes we tried), so it isn't used.
    { k: 'STREAK · ALL MODES', v: streak, fg: run.kind === 'win' ? 'var(--streak)' : run.kind === 'loss' ? 'var(--ember)' : 'var(--text-1)', icon: run.kind === 'win' ? <StreakIcon size={18} /> : undefined },
  ];

  return (
    <>
      <SceneHeader
        // Black-and-white Knight on the battlements (Gemini); keep its blue rim light.
        scene="/scenes/player-knight.jpg"
        sceneFilter="contrast(1.05) brightness(0.8)"
        scenePosition="right top"
        // The API has no profile banner; the favourite card stands in front of the scene instead.
        character={p.favourite?.render}
        height="clamp(440px, 55vh, 600px)"
        fog={1.2}
        extra={
          <>
            <div className={s.shade} />
          </>
        }
        status={
          <>
            {p.lastSeenHours != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-1)' }}>
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
              #{p.tag} <span style={{ color: 'var(--text-3)' }}>COPY</span>
            </button>
            {p.clan && (
              <HoverLink href={`/clan/${p.clan.tag}`} className={s.chip}>
                {p.clan.name}
                {p.role && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: p.role === 'leader' ? 'var(--gold)' : 'var(--text-1)' }}>
                    <RoleIcon role={p.role} />
                    {ROLE_LABEL[p.role]}
                  </span>
                )}
              </HoverLink>
            )}
          </div>
          <Reveal as="h1" className={s.name}>
            {p.name}
          </Reveal>
          <div className={s.facts}>
            {facts.map((f) => (
              <div key={f.k} className={s.fact}>
                <span className={s.factK}>{f.k}</span>
                <span className={s.factV} style={{ color: f.fg ?? 'var(--text-1)' }}>
                  {f.league != null && <LeagueIcon league={f.league} size={22} />}
                  {f.icon}
                  <Decode>{f.v}</Decode>
                  {f.sub && <span style={{ font: '500 11px/1 var(--mono)', color: 'var(--text-3)' }}>{f.sub}</span>}
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
                  ? { background: 'transparent', color: 'var(--blue-hi)', boxShadow: 'inset 0 0 0 1px rgba(var(--glow-rgb), .7),0 0 18px rgba(var(--glow-rgb), .3)' }
                  : { background: 'var(--text-1)', color: 'var(--void)' }
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
            <HoverLink href={`/compare?type=player&tags=${p.tag}`} className="btn btn-scene">
              Compare ⇄
            </HoverLink>
            <HoverLink href={`/player/${p.tag}/rivals`} className="btn btn-scene">
              Rivals ⚔
            </HoverLink>
            {pinned && (
              <HoverLink href={`/player/${p.tag}/goals`} className="btn btn-scene">
                Goals ◎
              </HoverLink>
            )}
            {!pinned && (
              <button
                type="button"
                className="btn btn-scene"
                onClick={() => {
                  if (!pins.player) return flash('Pin yourself first: Pin as me on your own profile');
                  setRival(pins.player, p.tag, !isRival);
                  flash(isRival ? 'Removed from your rivals' : 'Added to your rivals');
                }}
              >
                {isRival ? '✓ Your rival' : '+ Add as rival'}
              </button>
            )}
            {!pinned && isRival && pins.player && (
              <HoverLink href={`/player/${pins.player}/rivals/${p.tag}`} className="btn btn-scene">
                Head to head →
              </HoverLink>
            )}
            <ShareRecap src={`/player/${p.tag}/recap`} file={`recap-${p.tag}.png`} title={`${p.name} · season recap`} />
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
            { key: 'insights', label: 'Insights' },
            { key: 'battles', label: 'Battles' },
            { key: 'decks', label: 'Decks' },
            { key: 'history', label: 'History' },
          ]}
        />
        {tab === 'overview' && <OverviewTab p={p} rivals={rivals} insights={insights} onInsights={() => setTab('insights')} onCopy={flash} />}
        {tab === 'insights' && <InsightsTab x={insights} />}
        {needsFull && !full && (failed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            <EmptyState text="This tab didn't load. The Clash Royale API may be busy." />
            <button type="button" className="btn btn-secondary btn-sm" onClick={retry}>
              Try again
            </button>
          </div>
        ) : (
          <span className="skeleton" style={{ height: 420 }} aria-label="Loading" />
        ))}
        {full && tab === 'collection' && <CollectionTab p={full} />}
        {full && tab === 'badges' && <BadgesTab p={full} />}
        {full && tab === 'stats' && <StatsTab p={full} />}
        {full && tab === 'battles' && <BattlesTab p={full} />}
        {full && tab === 'decks' && <DecksTab p={full} />}
        {full && tab === 'history' && <HistoryTab p={full} h={history} names={names} />}
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
            border: '1px solid rgba(var(--glow-rgb), .6)',
            borderRadius: 6,
            boxShadow: '0 0 18px rgba(var(--glow-rgb), .35)',
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

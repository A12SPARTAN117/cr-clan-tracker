'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { SceneHeader } from '@/components/SceneHeader';
import { Portal } from '@/components/fx/Portal';
import { Reveal } from '@/components/fx/Reveal';
import { ClanBadge } from '@/components/ui/ClanBadge';
import { StatTile } from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/Tabs';
import type { Dashboard } from '@/lib/clan/dashboard';
import { fmt } from '@/lib/format';
import { setPin, usePins } from '@/lib/pins';
import { refreshClan } from './actions';
import { applyFilters, MembersTab, type Filters, type Sort } from './MembersTab';
import { MemberDrawer } from './MemberDrawer';
import { RosterTab } from './RosterTab';
import { ScoreTab } from './ScoreTab';
import { WarTab } from './WarTab';
import { downloadCsv, saveWeights, scoreMembers, tenureText, useWeights } from './shared';
import s from './dashboard.module.css';

type Tab = 'members' | 'war' | 'roster' | 'score';
const TYPE_LABEL = { open: 'Open', inviteOnly: 'Invite only', closed: 'Closed' } as const;
const DEFAULT_FILTERS: Filters = { q: '', role: 'all', act: 'all', war: 'all', tro: 0, isNew: false };

export function ClanDashboard({ data }: { data: Dashboard }) {
  const tag = data.clan.tag;
  const params = useSearchParams();
  const weights = useWeights(tag);
  const pins = usePins();
  const [tab, setTab] = useState<Tab>('members');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<Sort>({ k: 'score', d: -1 });
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [openTag, setOpenTag] = useState<string | null>(() => params.get('member')?.toUpperCase() ?? null);
  const [compare, setCompare] = useState(false);
  const [toast, setToast] = useState('');
  const [syncing, startSync] = useTransition();

  const flash = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((cur) => (cur === t ? '' : cur)), 1800);
  }, []);

  useEffect(() => {
    if (!compare) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCompare(false);
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [compare]);

  const war = data.war;
  const decksPossible = war && war.kind !== 'training' ? war.day * 4 : 0;
  const all = useMemo(() => scoreMembers(data.members, weights), [data.members, weights]);
  const rows = useMemo(() => applyFilters(all, filters, sort, decksPossible), [all, filters, sort, decksPossible]);
  const open = openTag ? all.find((m) => m.tag === openTag) : undefined;

  // Keep the open member in the URL (?member=TAG) for deep links.
  const openMember = useCallback((t: string | null) => {
    setOpenTag(t);
    const u = new URL(window.location.href);
    if (t) u.searchParams.set('member', t);
    else u.searchParams.delete('member');
    window.history.replaceState(null, '', u);
  }, []);
  const step = (dir: 1 | -1) => {
    const list = rows.length ? rows : all;
    const i = list.findIndex((m) => m.tag === openTag);
    const n = list[(i + dir + list.length) % list.length];
    if (n) openMember(n.tag);
  };

  /* ---------- summary tiles ---------- */
  const n = all.length;
  const act24 = all.filter((m) => m.hours < 24).length;
  const act3 = all.filter((m) => m.hours < 72).length;
  const act7 = all.filter((m) => m.hours < 168).length;
  const raceShare = (i: number) => {
    const present = all.filter((m) => m.hist[i]);
    return present.length ? present.reduce((a, m) => a + (m.hist[i]?.decks ?? 0), 0) / (present.length * 16) : null;
  };
  const pastShares = data.past.map((_, i) => raceShare(i));
  const partNow = decksPossible > 0 ? all.reduce((a, m) => a + m.decks, 0) / (n * decksPossible) : pastShares[0];
  const partPrev = decksPossible > 0 ? pastShares[0] : pastShares[1];
  const partDelta = partNow != null && partPrev != null ? Math.round((partNow - partPrev) * 100) : null;
  const spark = [...pastShares].reverse().filter((v): v is number => v != null).map((v) => Math.round(v * 100));
  if (decksPossible > 0 && partNow != null) spark.push(Math.round(partNow * 100));
  const avg = n ? Math.round(all.reduce((a, m) => a + m.score, 0) / n) : 0;
  const flagged = all.filter((m) => m.hours >= 72 || (decksPossible > 0 && m.decks === 0)).length;

  const tiles = [
    { label: 'Members', value: String(data.clan.members), unit: '/50', delta: `${50 - data.clan.members} slots open`, tone: 'muted' as const },
    { label: 'Active · 24h', value: String(act24), delta: `3d ${act3} · 7d ${act7}`, tone: 'neutral' as const },
    {
      label: decksPossible > 0 ? 'War participation' : 'War participation · last race',
      value: partNow == null ? '—' : String(Math.round(partNow * 100)),
      unit: partNow == null ? '' : '%',
      delta: partDelta == null ? 'No earlier race' : `${partDelta >= 0 ? '▲' : '▼'} ${Math.abs(partDelta)} vs ${decksPossible > 0 ? 'last race' : 'race before'}`,
      tone: partDelta == null ? ('muted' as const) : partDelta >= 0 ? ('up' as const) : ('down' as const),
      spark: spark.length > 1 ? spark : undefined,
    },
    war && war.kind !== 'training'
      ? { label: 'Decks today', value: String(war.decksToday), unit: '/200', delta: `${Math.max(0, 200 - war.decksToday)} remaining`, tone: 'neutral' as const }
      : { label: 'Decks today', value: '—', delta: 'Training day', tone: 'muted' as const },
    { label: 'Avg asset score', value: String(avg), unit: '/100', delta: 'With your weights', tone: 'muted' as const },
    { label: 'Flagged inactive', value: String(flagged), delta: decksPossible > 0 ? '3+ days or 0 decks' : '3+ days away', tone: flagged ? ('down' as const) : ('muted' as const) },
  ];

  const selected = all.filter((m) => sel.has(m.tag));
  const exportRows = selected.length ? selected : rows;
  const generated = new Date(data.generatedAt);
  const lastSync = `${generated.toISOString().slice(11, 16)} UTC`;
  const pinned = pins.clan === tag;

  return (
    <>
      <SceneHeader
        scene="/scenes/war-room.jpg"
        status={
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F3F4F6' }}>
              <span className="live-dot" />
              Live · {war ? `River race ${war.label.toLowerCase()}` : 'River race unavailable'}
            </span>
            <span>Manage · leader view</span>
            <span>Last sync {lastSync}</span>
          </>
        }
        extra={
          <div style={{ ['--rune' as string]: syncing ? '.8s' : '4s' }}>
            <div className={s.rune} />
            <div className={s.runeCore} />
          </div>
        }
      >
        <div className={s.headRow}>
          <div className={s.ident}>
            <div style={{ flex: 'none' }}>
              <ClanBadge badgeId={data.clan.badgeId} size={88} name={data.clan.name} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <Reveal as="h1" className={s.clanName}>
                {data.clan.name.toUpperCase()}
              </Reveal>
              <div className={s.facts}>
                <button
                  type="button"
                  className={s.copyTag}
                  onClick={() => {
                    navigator.clipboard?.writeText(`#${tag}`).catch(() => {});
                    flash(`Tag #${tag} copied`);
                  }}
                >
                  Tag #{tag} <span style={{ color: '#80868F' }}>Copy</span>
                </button>
                <span>{TYPE_LABEL[data.clan.type]}</span>
                {data.clan.location && <span>{data.clan.location}</span>}
                <span>Req. {fmt(data.clan.requiredTrophies)}</span>
                <span>Clan score {fmt(data.clan.clanScore)}</span>
                <span>War trophies {fmt(data.clan.clanWarTrophies)}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              data-magnet=""
              className="btn btn-primary"
              style={{ background: 'linear-gradient(110deg,#F3F4F6 40%,#fff 50%,#F3F4F6 60%) 120% 0/250% 100%', color: '#07080A' }}
              disabled={syncing}
              onClick={() =>
                startSync(async () => {
                  await refreshClan(tag);
                  flash('Clan data refreshed');
                })
              }
            >
              {syncing ? 'Syncing…' : '↻ Refresh'}
            </button>
            <button type="button" className="btn btn-scene" onClick={() => (setPin('clan', pinned ? null : tag), flash(pinned ? 'Unpinned' : 'Pinned as your clan'))}>
              {pinned ? '★ Pinned' : '☆ Pin'}
            </button>
            <Link href={`/clan/${tag}`} className="btn btn-scene">
              Clan profile →
            </Link>
          </div>
        </div>
      </SceneHeader>

      <main className={s.main}>
        <div className={s.vein} />
        <div className={s.tiles}>
          {tiles.map((t) => (
            <StatTile key={t.label} {...t} />
          ))}
        </div>

        <Tabs<Tab>
          label="Dashboard sections"
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'members', label: 'Members', count: n },
            { key: 'war', label: 'War', count: war ? (war.kind === 'training' ? `T${war.day}` : `D${war.day}`) : '' },
            { key: 'roster', label: 'Roster changes', count: data.history ? data.history.events.length : data.former.length || '' },
            { key: 'score', label: 'Score settings' },
          ]}
        />

        {tab === 'members' && (
          <MembersTab
            all={all}
            rows={rows}
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            sel={sel}
            setSel={setSel}
            openTag={openTag}
            onOpen={openMember}
            weights={weights}
            decksPossible={decksPossible}
            onCompare={() => (sel.size < 2 ? flash('Select at least 2 members') : setCompare(true))}
            onExport={() => {
              downloadCsv(`${data.clan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-members.csv`, [
                ['name', 'tag', 'role', 'trophies', 'last_seen_h', 'donations', 'received', 'fame', 'war_decks', 'war_win', 'friendly_win', 'asset_score', 'in_clan'],
                ...exportRows.map((m) => [m.name, `#${m.tag}`, m.role, m.trophies, Math.round(m.hours), m.donations, m.received, m.fame, m.decks, m.warWin, m.fWin, m.score, tenureText(m)]),
              ]);
              flash(`Exported ${exportRows.length} rows`);
            }}
            onCopyNames={() => {
              navigator.clipboard?.writeText(selected.map((m) => m.name).join(', ')).catch(() => {});
              flash(`Copied ${selected.length} names`);
            }}
          />
        )}
        {tab === 'war' && <WarTab data={data} members={all} onOpen={openMember} />}
        {tab === 'roster' && <RosterTab data={data} />}
        {tab === 'score' && <ScoreTab clanName={data.clan.name} members={all} weights={weights} onChange={(w) => saveWeights(tag, w)} />}

        <p className="label-sm" style={{ lineHeight: 1.7, letterSpacing: '.1em' }}>
          Data cached, refreshed at least every 5 min · War and 1v1 win rates use each member&apos;s last ~30 battles ({data.logsRead}/{n} logs read)
        </p>
      </main>

      {open && (
        <MemberDrawer
          key={open.tag}
          m={open}
          total={n}
          weights={weights}
          events={data.history?.events ?? []}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onClose={() => openMember(null)}
        />
      )}

      {compare && (
        <>
          <div className={s.backdrop} style={{ background: 'rgba(7,8,10,.7)', backdropFilter: 'blur(4px)' }} onClick={() => setCompare(false)} />
          <div role="dialog" aria-modal="true" aria-label="Compare members" className={s.modal}>
            <div style={{ position: 'absolute', inset: 10, border: '1px solid var(--hair)', borderRadius: 6, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span className="label" style={{ letterSpacing: '.14em' }}>
                Compare · {Math.min(4, selected.length)} members
              </span>
              <button type="button" className={s.iconBtn} onClick={() => setCompare(false)} autoFocus>
                CLOSE ×
              </button>
            </div>
            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
              {selected.slice(0, 4).map((m, _i, arr) => {
                const best = m.score === Math.max(...arr.map((x) => x.score));
                return (
                  <div
                    key={m.tag}
                    style={{
                      padding: 16,
                      background: 'var(--obsidian)',
                      border: `1px solid ${best ? 'rgba(58,160,255,.7)' : 'var(--hair)'}`,
                      borderRadius: 8,
                      boxShadow: best ? '0 0 18px rgba(58,160,255,.3)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <span style={{ font: '700 18px/1.1 var(--mono)', letterSpacing: '-.03em', overflowWrap: 'anywhere' }}>{m.name}</span>
                    <span style={{ font: '500 9px/1 var(--mono)', letterSpacing: '.12em', color: best ? 'var(--blue-hi)' : 'var(--text-3)' }}>
                      {m.role.toUpperCase()} · #{m.tag}
                    </span>
                    {(
                      [
                        ['Asset score', m.score],
                        ['War decks', `${m.decks}/16`],
                        ['Fame', fmt(m.fame)],
                        ['Donations', fmt(m.donations)],
                        ['Last seen', m.hours < 24 ? `${Math.floor(m.hours)}h` : `${Math.floor(m.hours / 24)}d`],
                        ['War W%', m.warWin == null ? '—' : `${m.warWin}%`],
                        ['In clan', tenureText(m)],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--hair)', font: '500 12px/1 var(--mono)' }}>
                        <span style={{ color: 'var(--text-3)' }}>{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {toast && (
        <div role="status" className={s.toast}>
          {toast}
        </div>
      )}
      {syncing && (
        <div className={s.syncing} role="status">
          <Portal size={28} />
          SYNCING CLAN DATA
        </div>
      )}
    </>
  );
}

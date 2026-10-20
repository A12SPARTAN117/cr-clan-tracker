'use client';

import { CardTile } from '@/components/CardTile';
import { DeckBlock } from '@/components/DeckBlock';
import { EmberField } from '@/components/fx/EmberField';
import { BadgeIcon, CardsIcon, ChestIcon, CrownIcon, DonationIcon, SwordsIcon, TrophyIcon, WinRateIcon, ClanWarIcon } from '@/components/ui/icons';
import { FitValue } from '@/components/ui/primitives';
import { agoShort, fmt } from '@/lib/format';
import type { PlayerProfile } from '@/lib/player/profile';
import { BattleKindIcon, KIND_LABEL } from './BattleKindIcon';
import s from './overview.module.css';

function StreakPanel({ p }: { p: PlayerProfile }) {
  const st = { ...p.streakRun, battles: p.battles.filter((b) => p.streakRun.ids.includes(b.id)) };
  const hot = st.kind === 'win';
  const form = p.battles.slice(0, 30);
  const wins = form.filter((b) => b.result === 'win').length;
  return (
    <section className={s.streak} data-kind={st.kind ?? 'none'} aria-label="Win streak">
      {st.kind && <EmberField count={hot ? 120 : 60} gold={hot ? 0.85 : 0.05} intensity={hot ? 1.1 : 0.6} />}
      <div className={s.streakHead}>
        <div className={s.streakBig}>
          <span className={s.streakNum}>{st.kind ? `${hot ? 'W' : 'L'}${st.count}` : '—'}</span>
          <span className={s.streakLabel}>{st.kind ? `${st.count}-${hot ? 'win' : 'loss'} streak` : 'No streak right now'}</span>
        </div>
        <div className={s.streakMeta}>
          <span>
            <b>{wins}</b>W · <b>{form.length - wins}</b>L in the last {form.length}
          </span>
          <span>{form.length ? `${Math.round((wins / form.length) * 100)}% win rate` : 'No battles in the log'}</span>
        </div>
      </div>
      {st.battles.length > 0 && (
        <ol className={s.run}>
          {st.battles.map((b, i) => (
            <li key={b.id} className={s.runItem} style={{ animationDelay: `${i * 60}ms` }} title={`${KIND_LABEL[b.kind]} · vs ${b.opp.name} · ${b.crowns[0]}–${b.crowns[1]}`}>
              <BattleKindIcon kind={b.kind} size={22} />
              <span className={s.runScore}>
                {b.crowns[0]}–{b.crowns[1]}
              </span>
              <span className={s.runMode}>{KIND_LABEL[b.kind]}</span>
              <span className={s.runOpp}>vs {b.opp.name}</span>
              <span className={s.runAgo}>{agoShort(b.hours)}</span>
            </li>
          ))}
        </ol>
      )}
      <div className={s.form} aria-label="Last 30 battles, newest first">
        {form.map((b) => (
          <span key={b.id} className={s.formCell} data-r={b.result} title={`${b.result.toUpperCase()} · ${KIND_LABEL[b.kind]} · vs ${b.opp.name}`}>
            <BattleKindIcon kind={b.kind} size={22} />
            <span>{b.result === 'win' ? 'W' : b.result === 'loss' ? 'L' : 'D'}</span>
          </span>
        ))}
      </div>
      <span className="label-sm">Newest first · icon = game mode</span>
    </section>
  );
}

function Enemies({ p }: { p: PlayerProfile }) {
  if (!p.enemies.length) return null;
  const [worst, ...rest] = p.enemies;
  return (
    <section className={s.enemy} aria-label="Worst enemy">
      <span className="label">Worst enemy · last {p.battles.length} games</span>
      <div className={s.enemyMain}>
        <div style={{ width: 92 }}>
          <CardTile slug={worst.slug} label={worst.name} img={worst.img} size="fluid" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <span style={{ font: '800 clamp(22px,2.4vw,30px)/1 var(--mono)', letterSpacing: '-.04em' }}>{worst.name}</span>
          <span style={{ font: '500 13px/1.4 var(--sans)', color: 'var(--text-2)' }}>
            Lost <b style={{ color: 'var(--ember)' }}>{worst.losses}</b> of the {worst.games} games against it ({Math.round((worst.losses / worst.games) * 100)}%).
          </span>
          {rest.length > 0 && (
            <span style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
              {rest.map((e) => (
                <span key={e.slug} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '500 12px/1.2 var(--sans)', color: 'var(--text-2)' }}>
                  <CardTile slug={e.slug} label={e.name} img={e.img} size="S" />
                  {e.name} · {e.losses}/{e.games}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export function OverviewTab({ p, onCopy }: { p: PlayerProfile; onCopy: (t: string) => void }) {
  const t = p.totals;
  const owned = p.collection.filter((c) => c.owned);
  const tiles: [string, string, string, React.ReactNode][] = [
    ['Wins', fmt(t.wins), '', <CrownIcon key="i" />],
    ['Losses', fmt(t.losses), '', <SwordsIcon key="i" />],
    ['Win %', t.wins + t.losses ? ((t.wins / (t.wins + t.losses)) * 100).toFixed(1) : '—', '%', <WinRateIcon key="i" />],
    ['3-crown wins', fmt(t.threeCrown), '', <CrownIcon key="i" />],
    ['Battles', fmt(t.battleCount), '', <SwordsIcon key="i" />],
    ['Collection level', fmt(p.collectionLevel), '', <CardsIcon key="i" />],
    ['Cards found', String(owned.length), `/${p.collection.length}`, <CardsIcon key="i" />],
    // The API only keeps this season's best on the seasonal road; below 14,000 it is the Trophy Road best.
    [p.seasonal ? 'Season best' : 'Best trophies', fmt(p.seasonal?.best ?? p.bestTrophies), '', <TrophyIcon key="i" />],
    ['Star points', fmt(t.starPoints), '', <BadgeIcon key="i" />],
    ['Challenge best', fmt(t.challengeMaxWins), 'wins', <ChestIcon key="i" />],
    ['Donations', fmt(t.totalDonations), 'total', <DonationIcon key="i" />],
    ['War wins', fmt(t.warWins), '', <ClanWarIcon key="i" />],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div className={s.tiles}>
        {tiles.map(([k, v, sub, icon]) => (
          <div key={k} data-spot="" className={`spot ${s.tile}`}>
            <span className={s.tileK}>{k}</span>
            <FitValue value={v} unit={sub || undefined} icon={icon} max={34} />
          </div>
        ))}
      </div>

      <div className={s.split}>
        <StreakPanel p={p} />
        <Enemies p={p} />
      </div>

      {p.deck && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 660 }}>
          <span className="label">Current deck</span>
          <DeckBlock
            name={p.deck.name}
            cards={p.deck.cards}
            tower={p.deck.tower}
            avgElixir={p.deck.avgElixir}
            cycle={p.deck.cycle}
            action={
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(p.deck!.link).catch(() => {});
                  onCopy('Deck link copied · opens in game');
                }}
                className="link-mono"
                style={{ background: 'none', border: 0, padding: 0, color: 'var(--blue)', cursor: 'pointer', fontSize: 10 }}
              >
                Copy deck →
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}

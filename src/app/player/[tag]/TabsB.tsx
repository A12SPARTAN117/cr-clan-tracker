'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CardTile } from '@/components/CardTile';
import { agoShort, fmt } from '@/lib/format';
import type { PlayerProfile } from '@/lib/player/profile';
import s from './player.module.css';

/* ---------------- Stats ---------------- */
export function StatsTab({ p }: { p: PlayerProfile }) {
  const t = p.totals;
  const pol = (x: PlayerProfile['pol']['current']) => (x ? `League ${x.league} · ${fmt(x.rating)}` : '—');
  const rank = (x: PlayerProfile['pol']['current']) => (x?.rank ? `#${fmt(x.rank)}` : '—');
  const secs: { title: string; rows: [string, string][] }[] = [
    {
      title: 'RANKED · PATH OF LEGENDS',
      rows: [
        ['Current season', pol(p.pol.current)],
        ['Global rank (current)', rank(p.pol.current)],
        ['Previous season', pol(p.pol.last)],
        ['Previous rank', rank(p.pol.last)],
        ['Best season', pol(p.pol.best)],
        ['Best rank', rank(p.pol.best)],
      ],
    },
    {
      title: 'CHALLENGE',
      rows: [
        ['Max challenge wins', fmt(t.challengeMaxWins)],
        ['Challenge cards won', fmt(t.challengeCardsWon)],
        ['Tournament battles', fmt(t.tournamentBattles)],
        ['Tournament cards won', fmt(t.tournamentCardsWon)],
      ],
    },
    {
      title: 'BATTLE',
      rows: [
        ['Wins', fmt(t.wins)],
        ['Losses', fmt(t.losses)],
        ['Three-crown wins', fmt(t.threeCrown)],
        ['Win %', t.wins + t.losses ? `${((t.wins / (t.wins + t.losses)) * 100).toFixed(1)}%` : '—'],
        ['Battle count', fmt(t.battleCount)],
        ['Trophies (best)', `${fmt(p.trophies)} (${fmt(p.bestTrophies)})`],
      ],
    },
    {
      title: 'MISC',
      rows: [
        ['Donations (total)', fmt(t.totalDonations)],
        ['Donated this week', fmt(t.donationsWeek)],
        ['Received this week', fmt(t.receivedWeek)],
        ['War day wins', fmt(t.warDayWins)],
        ['Clan cards collected', fmt(t.clanCardsCollected)],
        ['EXP level', String(p.expLevel)],
        ['Star points', fmt(t.starPoints)],
      ],
    },
  ];
  return (
    <div className={s.statGrid}>
      {secs.map((sec) => (
        <div key={sec.title} className="panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ position: 'absolute', top: -1, left: -1, width: 10, height: 10, borderTop: '1px solid var(--frame)', borderLeft: '1px solid var(--frame)' }} />
          <span style={{ font: '500 10px/1 var(--mono)', letterSpacing: '.16em', color: 'var(--blue-hi)', marginBottom: 10 }}>{sec.title}</span>
          {sec.rows.map(([k, v]) => (
            <div key={k} className={s.statRow}>
              <span style={{ font: '400 14px/1.2 var(--sans)', color: 'var(--text-2)' }}>{k}</span>
              <span style={{ font: '600 14px/1.2 var(--mono)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Battles ---------------- */
export function BattlesTab({ p }: { p: PlayerProfile }) {
  const modes = [...new Set(p.battles.map((b) => b.mode))];
  const [mode, setMode] = useState('all');
  const [open, setOpen] = useState<string | null>(p.battles[0]?.id ?? null);
  const list = p.battles.filter((b) => mode === 'all' || b.mode === mode);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {['all', ...modes].map((m) => (
          <button key={m} type="button" className="chip" aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m === 'all' ? 'All' : m}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', font: '500 10px/1 var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)' }}>BATTLE LOG HOLDS THE LAST ~30 BATTLES</span>
      </div>
      {list.length ? (
        <div style={{ border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--charcoal)', overflow: 'hidden' }}>
          {list.map((b) => {
            const isOpen = open === b.id;
            const fg = b.result === 'win' ? 'var(--blue)' : b.result === 'loss' ? 'var(--ember)' : 'var(--text-2)';
            return (
              <div key={b.id} style={{ borderBottom: '1px solid var(--hair)' }}>
                <button type="button" className={s.battleBtn} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : b.id)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: '700 12px/1 var(--mono)', letterSpacing: '.1em', color: fg }}>
                    <span style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${fg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {b.result === 'win' ? 'W' : b.result === 'loss' ? 'L' : 'D'}
                    </span>
                    {b.result.toUpperCase()}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <span style={{ font: '600 14px/1.2 var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>vs {b.opp.name}</span>
                    <span style={{ font: '500 10px/1 var(--mono)', letterSpacing: '.08em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                      {b.opp.clan ?? 'No clan'} · {b.mode} · {agoShort(b.hours)} ago
                    </span>
                  </span>
                  <span style={{ font: '800 18px/1 var(--mono)', letterSpacing: '.04em' }}>
                    {b.crowns[0]}–{b.crowns[1]}
                  </span>
                  <span style={{ textAlign: 'right', font: '600 13px/1 var(--mono)', color: b.trophyChange ? (b.trophyChange > 0 ? 'var(--blue)' : 'var(--ember)') : 'var(--text-3)' }}>
                    {b.trophyChange ? `${b.trophyChange > 0 ? '+' : '−'}${Math.abs(b.trophyChange)}` : '—'}
                  </span>
                  <span style={{ textAlign: 'right', font: '500 14px/1 var(--mono)', color: 'var(--text-3)' }}>{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 20, padding: 18, background: 'var(--obsidian)', borderTop: '1px solid var(--hair)', animation: 'oaFade .3s' }}>
                    {[
                      { label: p.name, cards: b.mine, fg: 'var(--blue-hi)' },
                      { label: b.opp.name, cards: b.theirs, fg: 'var(--text-3)', href: b.opp.tag ? `/player/${b.opp.tag}` : null },
                    ].map((side) => (
                      <div key={side.label} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {'href' in side && side.href ? (
                          <Link href={side.href} style={{ font: '500 9px/1 var(--mono)', letterSpacing: '.14em', color: side.fg, textTransform: 'uppercase' }}>
                            {side.label} →
                          </Link>
                        ) : (
                          <span style={{ font: '500 9px/1 var(--mono)', letterSpacing: '.14em', color: side.fg, textTransform: 'uppercase' }}>{side.label}</span>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {side.cards.map((c, i) => (
                            <CardTile key={`${c.id}-${i}`} slug={c.slug} label={c.name} img={c.img} rarity={c.rarity} evo={c.evo} hero={c.hero} level={c.level} size="M" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyChest text="No battles in the log yet." />
      )}
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
      {p.decks.map((d) => {
        const win = (d.wins / d.games) * 100;
        return (
          <div key={d.key} className={s.deckRow}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ font: '600 16px/1.2 var(--sans)' }}>{d.name}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {d.cards.map((c, i) => (
                  <CardTile key={`${c.id}-${i}`} slug={c.slug} label={c.name} img={c.img} rarity={c.rarity} evo={c.evo} hero={c.hero} size="S" />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 28, justifyContent: 'flex-end' }}>
              {[
                ['GAMES', String(d.games), 'var(--text-1)'],
                ['WIN %', `${win.toFixed(1)}%`, win >= 60 ? 'var(--blue-hi)' : win < 40 ? 'var(--ember)' : 'var(--text-1)'],
              ].map(([k, v, fg]) => (
                <span key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <span className="label-sm">{k}</span>
                  <span style={{ font: '700 22px/1 var(--mono)', color: fg }}>{v}</span>
                </span>
              ))}
              <span style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <span className="label-sm">LAST USED</span>
                <span style={{ font: '500 14px/22px var(--mono)', color: 'var(--text-2)' }}>{agoShort(d.lastHours).toUpperCase()} AGO</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- History ---------------- */
export function EmptyChest({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 36, textAlign: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static chest art */}
      <img src="/scenes/chest.jpg" alt="" width={160} height={86} style={{ objectFit: 'cover', borderRadius: 6, opacity: 0.8, filter: 'grayscale(.4)' }} />
      <span style={{ font: '500 11px/1.6 var(--mono)', letterSpacing: '.1em', color: 'var(--text-3)', maxWidth: 420 }}>{text}</span>
    </div>
  );
}

function Table({ head, rows, empty }: { head: [string, 'left' | 'right'][]; rows: string[][]; empty?: string }) {
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

export function HistoryTab({ p }: { p: PlayerProfile }) {
  const [h, setH] = useState<'trophy' | 'clan' | 'pol' | 'war'>('pol');
  const seasons = (
    [
      ['Current season', p.pol.current],
      ['Previous season', p.pol.last],
      ['Best season', p.pol.best],
    ] as const
  ).filter(([, x]) => x);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="data-since">History builds up from when we start tracking a player. The API only shows the present, plus the seasons below.</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(
          [
            ['pol', 'Path of Legends'],
            ['war', 'Clan wars'],
            ['clan', 'Clan history'],
            ['trophy', 'Trophy history'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" className="chip" style={{ height: 32 }} aria-pressed={h === k} onClick={() => setH(k)}>
            {l}
          </button>
        ))}
      </div>
      {h === 'pol' && (
        <Table
          head={[
            ['SEASON', 'left'],
            ['LEAGUE', 'left'],
            ['RATING', 'right'],
            ['RANK', 'right'],
          ]}
          rows={seasons.map(([label, x]) => [label, `League ${x!.league}`, fmt(x!.rating), x!.rank ? `#${fmt(x!.rank)}` : '—'])}
          empty={seasons.length ? undefined : 'No Path of Legends seasons on record.'}
        />
      )}
      {h === 'war' && (
        <Table
          head={[
            ['WEEK', 'left'],
            ['CLAN', 'left'],
            ['DECKS', 'right'],
            ['FAME', 'right'],
          ]}
          rows={(p.war ?? []).map((w) => [w.label, p.clan?.name ?? '—', `${w.decks}/16`, fmt(w.fame)])}
          empty={p.war?.length ? undefined : p.clan ? 'No races for this player in the clan’s last 10 races.' : 'Not in a clan, so no river races to show.'}
        />
      )}
      {h === 'clan' && (
        <Table
          head={[
            ['CLAN', 'left'],
            ['ROLE', 'left'],
            ['FROM', 'left'],
            ['TO', 'left'],
          ]}
          rows={p.clan ? [[p.clan.name, p.role ?? '—', 'Before tracking', 'Now']] : []}
          empty="Earlier clans were not tracked. Clan moves appear here once tracking starts."
        />
      )}
      {h === 'trophy' && <EmptyChest text="Trophy history needs daily snapshots. The chart fills in once tracking starts for this player." />}
    </div>
  );
}

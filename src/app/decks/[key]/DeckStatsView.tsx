'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CardTile } from '@/components/CardTile';
import { DeckBlock, DeckGrid, metaDeck } from '@/components/DeckBlock';
import { EmptyState } from '@/components/EmptyState';
import { Decode } from '@/components/fx/Reveal';
import { CycleIcon, ElixirIcon, MedalIcon, SwordsIcon, WinRateIcon } from '@/components/ui/icons';
import { Tabs } from '@/components/ui/Tabs';
import { cardBySlug } from '@/lib/cards';
import { deckHref, deckLink } from '@/lib/decks';
import { fmt } from '@/lib/format';
import type { DeckStat, MetaMode } from '@/lib/meta';
import s from './deck.module.css';

type Tab = 'overview' | 'players' | 'similar' | 'matchups';
const pct = (n: number) => `${n.toFixed(1)}%`;
const share = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

export function DeckStatsView({
  deck,
  rank,
  mode,
  modeLabel,
  sides,
  windowHours,
  similar,
}: {
  deck: DeckStat;
  rank: number;
  mode: MetaMode;
  modeLabel: string;
  sides: number;
  windowHours: number;
  similar: (DeckStat & { shared: number })[];
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);
  const losses = deck.games - deck.wins - deck.draws;
  const best = deck.players.find((p) => p.rating != null);
  const link = deckLink(deck.cards.map((c) => c.id));

  return (
    <main className="page" style={{ gap: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Link href={`/decks${mode === 'pol' ? '' : `?mode=${mode}`}`} className="link-mono" style={{ alignSelf: 'flex-start' }}>
          ← All decks
        </Link>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            <span className="label">
              {modeLabel} · Rank {rank} · last {windowHours}h
            </span>
            <h1 style={{ margin: 0, font: '800 clamp(30px,4.4vw,60px)/.95 var(--mono)', letterSpacing: '-.05em', overflowWrap: 'anywhere' }}>{deck.name.toUpperCase()}</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              data-magnet=""
              className="btn btn-primary"
              onClick={() => {
                navigator.clipboard?.writeText(link).catch(() => {});
                setCopied(true);
              }}
            >
              {copied ? '✓ Link copied' : 'Copy deck link'}
            </button>
            <a href={link} className="btn btn-scene" style={{ border: '1px solid var(--hair)', color: 'var(--text-1)' }}>
              Open in game ↗
            </a>
          </div>
        </div>
      </div>

      <section className={s.hero}>
        <div className={s.cards}>
          {deck.cards.map((c) => (
            <CardTile key={`${c.id}${c.evo}${c.hero}`} slug={c.slug} label={c.name} img={c.img} rarity={c.rarity} evo={c.evo} hero={c.hero} size="fluid" showLabel />
          ))}
        </div>
        <div className={s.facts}>
          {deck.tower && (
            <div className={s.fact}>
              <span className="label-sm">Tower troop</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 34 }}>
                  <CardTile slug={deck.tower.slug} label={deck.tower.name} img={deck.tower.img} rarity="tower" size="fluid" />
                </span>
                <b className={s.factV} style={{ fontSize: 15 }}>
                  {deck.tower.name}
                </b>
              </span>
            </div>
          )}
          <div className={s.fact}>
            <span className="label-sm">Avg elixir</span>
            <span className={s.factRow}>
              <ElixirIcon size={22} />
              <Decode className={s.factV}>{deck.avgElixir.toFixed(1)}</Decode>
            </span>
          </div>
          <div className={s.fact}>
            <span className="label-sm">4-card cycle</span>
            <span className={s.factRow}>
              <CycleIcon size={22} />
              <Decode className={s.factV}>{String(deck.cycle)}</Decode>
            </span>
          </div>
          <div className={s.fact}>
            <span className="label-sm">Highest rating</span>
            {best ? (
              <span className={s.factRow}>
                <MedalIcon size={22} title="Path of Legends rating" />
                <Decode className={s.factV}>{fmt(best.rating)}</Decode>
                <Link href={`/player/${best.tag}`} style={{ font: '500 13px/1.2 var(--sans)', overflowWrap: 'anywhere' }}>
                  {best.name}
                </Link>
              </span>
            ) : (
              <span className={s.factV}>—</span>
            )}
          </div>
          <div className={s.fact}>
            <span className="label-sm">Use rate</span>
            <span className={s.factRow}>
              <WinRateIcon size={20} />
              <Decode className={s.factV}>{pct(deck.use)}</Decode>
            </span>
          </div>
          <div className={s.fact}>
            <span className="label-sm">Games</span>
            <span className={s.factRow}>
              <SwordsIcon size={20} />
              <Decode className={s.factV}>{fmt(deck.games)}</Decode>
            </span>
          </div>
        </div>
      </section>

      <Tabs<Tab>
        label="Deck stats"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'players', label: 'Players', count: deck.players.length || '' },
          { key: 'similar', label: 'Similar', count: similar.length || '' },
          { key: 'matchups', label: 'Matchups', count: deck.matchups.length || '' },
        ]}
      />

      {tab === 'overview' && (
        <div className={s.overview}>
          <div className="panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span className="label">Win %</span>
            <div className={s.wlBar} role="img" aria-label={`${deck.wins} wins, ${deck.draws} draws, ${losses} losses`}>
              <span style={{ flex: deck.wins, background: 'var(--blue)' }} />
              <span style={{ flex: deck.draws, background: 'var(--text-3)' }} />
              <span style={{ flex: losses, background: 'var(--ember)' }} />
            </div>
            <table className={s.table}>
              <tbody>
                {(
                  [
                    ['Wins', deck.wins, 'var(--blue)'],
                    ['Draws', deck.draws, 'var(--text-3)'],
                    ['Losses', losses, 'var(--ember)'],
                    ['Total', deck.games, 'var(--text-1)'],
                  ] as const
                ).map(([k, v, c]) => (
                  <tr key={k}>
                    <td>
                      <span className={s.swatch} style={{ background: c }} />
                      {k}
                    </td>
                    <td className={s.num}>{fmt(v)}</td>
                    <td className={s.num} style={{ color: 'var(--text-2)' }}>
                      {share(v, deck.games)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span className="label">Crown results</span>
            <table className={s.table}>
              <tbody>
                {[6, 5, 4, 3, 2, 1, 0].map((i) => {
                  const diff = i - 3;
                  const n = deck.crowns[i] ?? 0;
                  const max = Math.max(1, ...deck.crowns);
                  const c = diff > 0 ? 'var(--blue)' : diff < 0 ? 'var(--ember)' : 'var(--text-3)';
                  return (
                    <tr key={i}>
                      <td style={{ width: 54 }}>
                        <span className={s.swatch} style={{ background: c, opacity: 0.4 + Math.abs(diff) * 0.2 }} />
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td>
                        <span className={s.crownBar}>
                          <span style={{ width: `${(n / max) * 100}%`, background: c, opacity: 0.45 + Math.abs(diff) * 0.18 }} />
                        </span>
                      </td>
                      <td className={s.num}>{fmt(n)}</td>
                      <td className={s.num} style={{ color: 'var(--text-2)' }}>
                        {share(n, deck.games)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ gridColumn: '1 / -1', margin: 0, font: '500 10px/1.6 var(--mono)', letterSpacing: '.08em', color: 'var(--text-3)' }}>
            {fmt(deck.games)} games of {fmt(sides)} sampled decks in {modeLabel} over the last {windowHours} hours. Crown result = crowns taken minus crowns lost.
          </p>
        </div>
      )}

      {tab === 'players' &&
        (deck.players.length ? (
          <div style={{ overflowX: 'auto', border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--charcoal)' }}>
            <table className={s.table} style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th>Player</th>
                  <th className={s.num}>Rating</th>
                  <th className={s.num}>Games</th>
                  <th className={s.num}>Win %</th>
                </tr>
              </thead>
              <tbody>
                {deck.players.map((p) => (
                  <tr key={p.tag}>
                    <td>
                      <Link href={`/player/${p.tag}`} style={{ color: 'var(--text-1)', font: '600 14px/1.2 var(--sans)' }}>
                        {p.name}
                      </Link>
                    </td>
                    <td className={s.num}>
                      {p.rating != null ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <MedalIcon size={16} />
                          {fmt(p.rating)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={s.num}>{p.games}</td>
                    <td className={s.num}>{pct((p.wins / p.games) * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No players recorded for this deck yet." />
        ))}

      {tab === 'similar' &&
        (similar.length ? (
          <DeckGrid>
            {similar.map((d) => (
              <DeckBlock key={d.key} {...metaDeck(d)} href={deckHref(d.key, mode)} action={<span className="label-sm">{d.shared}/8 same</span>} />
            ))}
          </DeckGrid>
        ) : (
          <EmptyState text="No similar decks in this sample." />
        ))}

      {tab === 'matchups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {deck.matchups.length ? (
            <div style={{ border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--charcoal)' }}>
              {deck.matchups.map((mu) => {
                const w = (mu.wins / mu.games) * 100;
                const info = cardBySlug(mu.vsSlug);
                return (
                  <div key={mu.vsSlug} className={s.matchup}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CardTile slug={mu.vsSlug} label={mu.vs} rarity={info?.rarity} size="S" />
                      <span style={{ font: '600 14px/1.2 var(--sans)' }}>vs {mu.vs}</span>
                    </span>
                    <span className={s.muBar}>
                      <span style={{ width: `${w}%`, background: w >= 50 ? 'var(--blue)' : 'var(--text-3)' }} />
                      <i />
                    </span>
                    <span style={{ textAlign: 'right', font: '700 14px/1 var(--mono)', color: w >= 50 ? 'var(--blue-hi)' : 'var(--ember)' }}>
                      {w >= 50 ? '▲' : '▼'} {Math.round(w)}%
                    </span>
                    <span style={{ textAlign: 'right', font: '500 11px/1 var(--mono)', color: 'var(--text-3)' }}>{mu.games} games</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState text="Not enough games against other win conditions yet." />
          )}
          <span style={{ font: '500 10px/1.5 var(--mono)', letterSpacing: '.08em', color: 'var(--text-3)' }}>
            Grouped by the opponent&apos;s win condition. Small samples swing a lot: check the game count.
          </span>
        </div>
      )}
    </main>
  );
}

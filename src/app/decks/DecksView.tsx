'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CardTile } from '@/components/CardTile';
import { Decode, Reveal } from '@/components/fx/Reveal';
import { Fog } from '@/components/fx/Fog';
import { EmptyState } from '@/components/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { cardBySlug } from '@/lib/cards';
import { characterFor } from '@/lib/characters';
import { deckLink } from '@/lib/decks';
import { fmt } from '@/lib/format';
import type { DeckStat, MetaMode, MetaSnapshot } from '@/lib/meta';
import s from './decks.module.css';

const MODES: [MetaMode, string][] = [
  ['pol', 'Path of Legends'],
  ['ladder', 'Trophy Road'],
  ['war', 'Clan War'],
];

const pct = (n: number) => n.toFixed(1);

function setUrl(patch: Record<string, string | null>) {
  const u = new URL(window.location.href);
  for (const [k, v] of Object.entries(patch)) {
    if (v) u.searchParams.set(k, v);
    else u.searchParams.delete(k);
  }
  window.history.replaceState(null, '', u);
}

export function DecksView({ meta }: { meta: MetaSnapshot }) {
  const params = useSearchParams();
  const [mode, setMode] = useState<MetaMode>(() => (MODES.some(([m]) => m === params.get('mode')) ? (params.get('mode') as MetaMode) : 'pol'));
  const [view, setView] = useState<'decks' | 'cards'>(params.get('view') === 'cards' ? 'cards' : 'decks');
  const [sort, setSort] = useState<'use' | 'win'>('use');
  const [inc, setInc] = useState('');
  const [exc, setExc] = useState('');
  const [detail, setDetail] = useState<string | null>(params.get('deck'));
  const [copied, setCopied] = useState(false);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setLit(true), 300);
    return () => clearTimeout(id);
  }, []);

  const m = meta.modes[mode];
  const decks = useMemo(
    () =>
      m.decks
        .filter((d) => (!inc || d.cards.some((c) => c.slug === inc)) && (!exc || !d.cards.some((c) => c.slug === exc)))
        .sort((a, b) => (sort === 'use' ? b.games - a.games : b.win - a.win || b.games - a.games)),
    [m, inc, exc, sort],
  );
  const cardOpts = useMemo(() => [...new Map(m.decks.flatMap((d) => d.cards).map((c) => [c.slug, c.name])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [m]);
  const all = meta.modes.pol.decks.concat(meta.modes.ladder.decks, meta.modes.war.decks);
  const open = detail ? (m.decks.find((d) => d.key === detail) ?? all.find((d) => d.key === detail)) : undefined;
  const rankOf = (d: DeckStat) => m.decks.findIndex((x) => x.key === d.key) + 1;

  const openDeck = (k: string | null) => {
    setDetail(k);
    setCopied(false);
    setUrl({ deck: k });
    if (k) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <section className={s.header}>
        <div className={s.scene} />
        <Fog density={0.8} />
        <div className={s.slots} aria-hidden>
          {Array.from({ length: 8 }, (_, i) => {
            const c = lit ? (i < 2 ? 'rgba(163,91,255,.8)' : 'rgba(58,160,255,.7)') : 'rgba(255,255,255,.08)';
            return <span key={i} style={{ boxShadow: `inset 0 2px 6px rgba(0,0,0,.8),0 0 0 1px ${c},0 0 ${lit ? 16 : 0}px ${c}`, transitionDelay: `${i * 90}ms` }} />;
          })}
        </div>
        <div className={s.scrim} />
        <div className={s.frame} />
        <div className={s.copy}>
          <span style={{ font: '500 10px/1.4 var(--mono)', letterSpacing: '.14em', color: '#A4A9B4', textTransform: 'uppercase' }}>
            ● Live · {MODES.find(([k]) => k === mode)?.[1]} · last {meta.windowHours}h · {fmt(m.sides / 2)} battles sampled
          </span>
          <Reveal as="h1" style={{ margin: 0, font: '800 clamp(46px,8vw,124px)/.86 var(--mono)', letterSpacing: '-.06em' }}>
            META
          </Reveal>
        </div>
      </section>

      <main style={{ maxWidth: 'var(--max)', margin: '0 auto', padding: '0 var(--gutter) 80px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Tabs<MetaMode>
          label="Game mode"
          value={mode}
          onChange={(k) => {
            setMode(k);
            setUrl({ mode: k === 'pol' ? null : k });
          }}
          tabs={MODES.map(([key, label]) => ({ key, label, count: meta.modes[key].decks.length || '' }))}
        />

        {open ? (
          <DeckDetail
            deck={open}
            rank={rankOf(open)}
            modeLabel={MODES.find(([k]) => k === mode)?.[1] ?? ''}
            copied={copied}
            onCopy={() => {
              navigator.clipboard?.writeText(deckLink(open.cards.map((c) => c.id))).catch(() => {});
              setCopied(true);
            }}
            onBack={() => openDeck(null)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 22px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {(
                  [
                    ['decks', 'Decks'],
                    ['cards', 'Card stats'],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    className="chip"
                    style={{ height: 30 }}
                    aria-pressed={view === k}
                    onClick={() => {
                      setView(k);
                      setUrl({ view: k === 'cards' ? 'cards' : null });
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {view === 'decks' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 22px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className="label-sm">SORT</span>
                    <button type="button" className="chip" aria-pressed={sort === 'use'} onClick={() => setSort('use')}>
                      Most used
                    </button>
                    <button type="button" className="chip" aria-pressed={sort === 'win'} onClick={() => setSort('win')}>
                      Highest win %
                    </button>
                  </div>
                  {[
                    ['INCLUDES', inc, setInc],
                    ['EXCLUDES', exc, setExc],
                  ].map(([label, v, set]) => (
                    <label key={label as string} className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {label as string}
                      <select value={v as string} onChange={(e) => (set as (x: string) => void)(e.target.value)} className={s.select}>
                        <option value="">Any card</option>
                        {cardOpts.map(([slug, name]) => (
                          <option key={slug} value={slug}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
              <span style={{ marginLeft: 'auto', font: '500 10px/1 var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)' }}>
                {view === 'decks' ? `${decks.length} DECKS` : `${m.cards.length} CARDS`}
              </span>
            </div>

            {view === 'decks' ? (
              decks.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--hair)' }}>
                  {decks.map((d, i) => (
                    <DeckLine key={d.key} d={d} rank={i + 1} onOpen={() => openDeck(d.key)} />
                  ))}
                </div>
              ) : (
                <EmptyState text={m.decks.length ? 'No decks match these filters.' : 'Not enough battles in this mode yet.'} />
              )
            ) : (
              <CardStats m={m} />
            )}
            <span style={{ font: '500 10px/1.5 var(--mono)', letterSpacing: '.08em', color: 'var(--text-3)' }}>
              Sampled from the battle logs of the global Path of Legends top {meta.players} over the last {meta.windowHours} hours. Decks need 2+ games to appear. Click a deck for matchups.
            </span>
          </div>
        )}
      </main>
    </>
  );
}

function DeckLine({ d, rank, onOpen }: { d: DeckStat; rank: number; onOpen: () => void }) {
  const render = characterFor(d.winCon);
  const strong = d.win >= 53;
  return (
    <div
      role="button"
      tabIndex={0}
      data-spot=""
      className={s.deckLine}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {render && <div className={s.wincon} style={{ backgroundImage: `url(${render})` }} aria-hidden />}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <span style={{ font: '700 12px/1 var(--mono)', color: rank === 1 ? 'var(--gold)' : 'var(--text-3)' }}>{String(rank).padStart(2, '0')}</span>
        <span style={{ font: '600 18px/1.2 var(--sans)' }}>{d.name}</span>
        <span style={{ font: '500 10px/1.3 var(--mono)', letterSpacing: '.1em', color: 'var(--text-3)' }}>
          AVG {d.avgElixir.toFixed(1)} · CYCLE {d.cycle}
        </span>
      </div>
      <div className={s.cards}>
        {d.cards.map((c) => (
          <CardTile key={`${c.id}${c.evo}${c.hero}`} slug={c.slug} label={c.name} img={c.img} rarity={c.rarity} evo={c.evo} hero={c.hero} elixir={c.elixir} size="M" />
        ))}
        {d.tower && (
          <>
            <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--hair)', margin: '0 4px' }} />
            <CardTile slug={d.tower.slug} label={d.tower.name} img={d.tower.img} rarity="tower" size="M" />
          </>
        )}
      </div>
      <div className={s.nums}>
        {[
          ['USE', `${pct(d.use)}%`, 'var(--text-1)'],
          ['WIN', `${pct(d.win)}%`, strong ? 'var(--blue-hi)' : 'var(--text-1)'],
        ].map(([k, v, fg]) => (
          <span key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <span className="label-sm">{k}</span>
            <span style={{ font: '700 20px/1 var(--mono)', color: fg, textShadow: k === 'WIN' && strong ? '0 0 14px rgba(58,160,255,.6)' : 'none' }}>{v}</span>
          </span>
        ))}
        <span style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <span className="label-sm">GAMES</span>
          <span style={{ font: '500 13px/20px var(--mono)', color: 'var(--text-2)' }}>{fmt(d.games)}</span>
        </span>
      </div>
    </div>
  );
}

function CardStats({ m }: { m: MetaSnapshot['modes'][MetaMode] }) {
  const [sort, setSort] = useState<'use' | 'win'>('use');
  const rows = [...m.cards].filter((c) => c.games >= 5).sort((a, b) => (sort === 'use' ? b.games - a.games : b.win - a.win));
  const maxUse = Math.max(1, ...rows.map((r) => r.use));
  const head: [string, 'left' | 'right', (() => void) | null, boolean][] = [
    ['CARD', 'left', null, false],
    ['USE %', 'right', () => setSort('use'), sort === 'use'],
    ['WIN %', 'right', () => setSort('win'), sort === 'win'],
    ['EVO / HERO USE', 'right', null, false],
    ['EVO / HERO WIN', 'right', null, false],
    ['BASE WIN', 'right', null, false],
  ];
  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--charcoal)' }}>
      <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr>
            {head.map(([t, al, on, active]) => (
              <th key={t} aria-sort={active ? 'descending' : undefined} style={{ padding: '12px 14px', background: 'var(--glass)', borderBottom: '1px solid var(--hair)', textAlign: al }}>
                {on ? (
                  <button type="button" onClick={on} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: '500 10px/1.3 var(--mono)', letterSpacing: '.12em', color: active ? 'var(--text-1)' : 'var(--text-3)' }}>
                    {t} {active && <span style={{ color: 'var(--blue)' }}>▼</span>}
                  </button>
                ) : (
                  <span style={{ font: '500 10px/1.3 var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)' }}>{t}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const special = c.evoGames + c.heroGames;
            const specialWins = c.evoWins + c.heroWins;
            const baseGames = c.games - special;
            const tone = c.evoGames >= c.heroGames ? 'var(--evo-hi)' : 'var(--gold)';
            return (
              <tr key={c.id} className="oa-row" style={{ cursor: 'default' }}>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--hair)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CardTile slug={c.slug} label={c.name} img={c.img} rarity={c.rarity} size="S" />
                    <span style={{ font: '600 14px/1.2 var(--sans)' }}>{c.name}</span>
                  </span>
                </td>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--hair)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                    <span style={{ width: 90, height: 3, background: 'var(--well)' }}>
                      <span style={{ display: 'block', height: '100%', width: `${(c.use / maxUse) * 100}%`, background: 'var(--text-1)' }} />
                    </span>
                    <span style={{ font: '600 13px/1 var(--mono)', minWidth: 44, textAlign: 'right' }}>{pct(c.use)}%</span>
                  </span>
                </td>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--hair)', textAlign: 'right', font: '600 13px/1 var(--mono)', color: c.win >= 53 ? 'var(--blue-hi)' : 'var(--text-1)' }}>{pct(c.win)}%</td>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--hair)', textAlign: 'right', font: '500 12px/1 var(--mono)', color: special ? tone : 'var(--text-3)' }}>
                  {special ? `${Math.round((special / c.games) * 100)}%` : '—'}
                </td>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--hair)', textAlign: 'right', font: '500 12px/1 var(--mono)', color: special ? tone : 'var(--text-3)' }}>
                  {special >= 3 ? `${pct((specialWins / special) * 100)}%` : '—'}
                </td>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--hair)', textAlign: 'right', font: '500 12px/1 var(--mono)', color: 'var(--text-2)' }}>
                  {baseGames >= 3 ? `${pct(((c.wins - specialWins) / baseGames) * 100)}%` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DeckDetail({ deck, rank, modeLabel, copied, onCopy, onBack }: { deck: DeckStat; rank: number; modeLabel: string; copied: boolean; onCopy: () => void; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'oaFade .3s' }}>
      <button type="button" onClick={onBack} className="link-mono" style={{ alignSelf: 'flex-start', background: 'none', border: 0, padding: 0, color: 'var(--blue)', cursor: 'pointer' }}>
        ← All decks
      </button>
      <div className="panel" style={{ padding: 'clamp(20px,3vw,36px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ position: 'absolute', inset: 12, border: '1px solid var(--hair)', borderRadius: 4, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="label">
              {modeLabel} · {rank > 0 ? `Rank ${rank}` : 'Unranked in this mode'}
            </span>
            <h2 style={{ margin: 0, font: '800 clamp(32px,4.4vw,64px)/.92 var(--mono)', letterSpacing: '-.05em' }}>{deck.name.toUpperCase()}</h2>
          </div>
          <button type="button" data-magnet="" className="btn btn-primary" onClick={onCopy}>
            {copied ? '✓ Link copied' : 'Copy deck link'}
          </button>
        </div>
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          {deck.cards.map((c) => (
            <CardTile key={`${c.id}${c.evo}${c.hero}`} slug={c.slug} label={c.name} img={c.img} rarity={c.rarity} evo={c.evo} hero={c.hero} elixir={c.elixir} size="L" showLabel />
          ))}
          {deck.tower && (
            <>
              <span style={{ width: 1, height: 120, background: 'var(--hair)', margin: '0 6px' }} />
              <CardTile slug={deck.tower.slug} label={deck.tower.name} img={deck.tower.img} rarity="tower" size="L" showLabel />
            </>
          )}
        </div>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 1, background: 'var(--hair)', border: '1px solid var(--hair)', borderRadius: 6, overflow: 'hidden' }}>
          {[
            ['WIN %', pct(deck.win)],
            ['USE %', pct(deck.use)],
            ['GAMES', fmt(deck.games)],
            ['AVG ELIXIR', deck.avgElixir.toFixed(1)],
            ['4-CARD CYCLE', String(deck.cycle)],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: '14px 16px', background: 'var(--obsidian)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="label-sm">{k}</span>
              <Decode style={{ font: '800 26px/1 var(--mono)', letterSpacing: '-.04em' }}>{v}</Decode>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 className="heading">Matchups by opponent win condition</h3>
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
                  <span style={{ position: 'relative', height: 6, borderRadius: 3, background: 'var(--well)', overflow: 'hidden' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${w}%`,
                        background: w >= 50 ? 'var(--blue)' : 'var(--text-3)',
                        boxShadow: w >= 55 ? '0 0 8px rgba(58,160,255,.8)' : 'none',
                      }}
                    />
                    <span style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: 'var(--frame)' }} />
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
        <span style={{ font: '500 10px/1.5 var(--mono)', letterSpacing: '.08em', color: 'var(--text-3)' }}>Small samples swing a lot: check the game count.</span>
      </div>
    </div>
  );
}

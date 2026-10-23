'use client';

import { useRouter } from 'next/navigation';
import { setUrlQuery, useUrlQuery } from '@/lib/urlQuery';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { CardTile } from '@/components/CardTile';
import { HoverLink } from '@/components/ui/HoverLink';
import { DeckBlock, DeckGrid, metaDeck } from '@/components/DeckBlock';
import { Reveal } from '@/components/fx/Reveal';
import { EmberField } from '@/components/fx/EmberField';
import { Fog } from '@/components/fx/Fog';
import { EmptyState } from '@/components/EmptyState';
import { ModeFilter, ModeIcon } from '@/components/ModeFilter';
import { deckHref } from '@/lib/decks';
import { fmt } from '@/lib/format';
import type { DeckStat, MetaMode, ModeList, ModeMeta } from '@/lib/meta';
import type { ModeTrends } from '@/lib/trends';
import { Trends } from './Trends';
import s from './decks.module.css';

const pct = (n: number) => n.toFixed(1);

/** What the page sends: every mode's header facts, Ranked's list, and the deck of the day. */
export type DecksMeta = {
  players: number;
  order: MetaMode[];
  modes: Record<MetaMode, Omit<ModeMeta, 'decks' | 'cards'> & { count: number; list: ModeList | null }>;
  dotd: { mode: MetaMode; deck: DeckStat } | null;
};

const EMPTY: ModeList = { decks: [], cards: [] };

export function DecksView({ meta, trends }: { meta: DecksMeta; trends: Promise<Record<string, ModeTrends>> }) {
  const params = useUrlQuery();
  const router = useRouter();
  // Mode and view live in the URL (?mode=, ?view=): Ranked's decks are in the page's HTML, and a
  // link to another mode switches to it once the page is running.
  const mode: MetaMode = meta.modes[params.get('mode') ?? ''] ? (params.get('mode') as MetaMode) : 'pol';
  const view: 'decks' | 'cards' = params.get('view') === 'cards' ? 'cards' : 'decks';
  const [sort, setSort] = useState<'use' | 'win'>('use');
  const [inc, setInc] = useState('');
  const [exc, setExc] = useState('');
  const dotd = meta.dotd?.deck ?? null;
  // Modes other than Ranked load when picked (once each).
  const [loaded, setLoaded] = useState<Record<MetaMode, ModeList>>({});
  const list = meta.modes[mode].list ?? loaded[mode] ?? null;
  useEffect(() => {
    if (list) return;
    let dead = false;
    fetch(`/api/meta/${encodeURIComponent(mode)}`)
      .then((r) => (r.ok ? (r.json() as Promise<ModeList>) : null))
      .then((d) => {
        if (!dead && d) setLoaded((l) => ({ ...l, [mode]: d }));
      })
      .catch(() => {});
    return () => {
      dead = true;
    };
  }, [mode, list]);

  // Old links (/decks?deck=KEY) open the deck stats page.
  const legacy = params.get('deck');
  useEffect(() => {
    if (legacy) router.replace(deckHref(legacy, params.get('mode')));
  }, [legacy, params, router]);

  const m = useMemo(() => ({ ...meta.modes[mode], ...(list ?? EMPTY) }), [meta, mode, list]);
  // A 2-game deck at 100% isn't a real win rate, so "highest win %" only ranks decks with enough
  // games behind them (10, or 5 in thin modes).
  const minWinGames = m.decks.some((d) => d.games >= 10) ? 10 : 5;
  const decks = useMemo(
    () =>
      m.decks
        .filter((d) => (!inc || d.cards.some((c) => c.slug === inc)) && (!exc || !d.cards.some((c) => c.slug === exc)))
        .filter((d) => sort === 'use' || d.games >= minWinGames)
        .sort((a, b) => (sort === 'use' ? b.games - a.games : b.win - a.win || b.games - a.games)),
    [m, inc, exc, sort, minWinGames],
  );
  const cardOpts = useMemo(() => [...new Map(m.decks.flatMap((d) => d.cards).map((c) => [c.slug, c.name])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [m]);

  return (
    <>
      <section className={s.header}>
        <div className={s.scene} />
        <Fog density={0.8} />
        <EmberField count={200} gold={0.2} />
        {dotd && (
          <HoverLink href={deckHref(dotd.key, meta.dotd!.mode)} className={s.dotd} aria-label={`Deck of the day: ${dotd.name}`}>
            <span className={s.dotdLabel}>
              <ModeIcon kind="uc" size={18} /> Deck of the day · Ultimate Champion
            </span>
            <span className={s.dotdCards}>
              {dotd.cards.map((c, i) => (
                <span key={`${c.id}${c.evo}${c.hero}`} style={{ animationDelay: `${i * 70}ms` }}>
                  <CardTile slug={c.slug} label={c.name} img={c.img} rarity={c.rarity} evo={c.evo} hero={c.hero} size="fluid" />
                </span>
              ))}
            </span>
            <span className={s.dotdMeta}>
              <b>{dotd.name}</b>
              <span>
                <em>{dotd.win.toFixed(1)}%</em> win · {fmt(dotd.games)} games · avg {dotd.avgElixir.toFixed(1)} elixir
              </span>
            </span>
          </HoverLink>
        )}
        <div className={s.scrim} />
        <div className={s.frame} />
        <div className={s.copy}>
          <span style={{ font: '500 10px/1.4 var(--mono)', letterSpacing: '.14em', color: 'var(--text-2)', textTransform: 'uppercase' }}>
            ● Live · {m.label} · last {m.windowHours}h · {fmt(m.battles)} battles sampled
          </span>
          <Reveal as="h1" style={{ margin: 0, font: '800 clamp(46px,8vw,124px)/.86 var(--mono)', letterSpacing: '-.06em' }}>
            META
          </Reveal>
        </div>
      </section>

      <main style={{ maxWidth: 'var(--max)', margin: '0 auto', padding: '0 var(--gutter) 80px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ paddingTop: 18 }}>
          <ModeFilter
            value={mode}
            onChange={(k) => {
              setUrlQuery({ mode: k === 'pol' ? null : k });
            }}
            modes={meta.order.map((k) => ({ key: k, label: meta.modes[k].label, kind: meta.modes[k].kind, count: meta.modes[k].count }))}
          />
        </div>

        <Suspense fallback={null}>
          <Trends trends={trends} mode={mode} />
        </Suspense>

        {
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
                      setUrlQuery({ view: k === 'cards' ? 'cards' : null });
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
                    <button type="button" className="chip" aria-pressed={sort === 'win'} onClick={() => setSort('win')} title={`Decks with ${minWinGames}+ games`}>
                      Highest win %
                    </button>
                    {sort === 'win' && <span className="label-sm">{minWinGames}+ games</span>}
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
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
                <HoverLink href={`/decks/builder${mode === 'pol' ? '' : `?mode=${mode}`}`} className="btn btn-secondary btn-sm">
                  Deck builder ▸
                </HoverLink>
                <span style={{ font: '500 10px/1 var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)' }}>{view === 'decks' ? `${decks.length} DECKS` : `${m.cards.length} CARDS`}</span>
              </span>
            </div>

            {view === 'decks' ? (
              decks.length ? (
                <DeckGrid>
                  {decks.map((d, i) => (
                    <DeckBlock key={d.key} {...metaDeck(d)} rank={i + 1} href={deckHref(d.key, mode)} />
                  ))}
                </DeckGrid>
              ) : (
                <EmptyState text={!list ? 'Loading decks…' : m.decks.length ? 'No decks match these filters.' : 'Not enough battles in this mode yet.'} />
              )
            ) : (
              <CardStats m={m} />
            )}
            <span style={{ font: '500 10px/1.5 var(--mono)', letterSpacing: '.08em', color: 'var(--text-3)' }}>
              Sampled from the battle logs of {meta.players} top players (global Path of Legends top 100 and the top war clans) over the last {m.windowHours} hours. Decks need 2+ games to appear. Open Deck stats for win / loss, crowns, players and matchups.
            </span>
          </div>
        }
      </main>
    </>
  );
}

function CardStats({ m }: { m: ModeList }) {
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

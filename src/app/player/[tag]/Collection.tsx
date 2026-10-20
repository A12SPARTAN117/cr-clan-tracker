'use client';

import { useMemo, useState } from 'react';
import { CardTile } from '@/components/CardTile';
import { CardsIcon } from '@/components/ui/icons';
import type { Rarity } from '@/lib/cards';
import { fmt } from '@/lib/format';
import type { CollectionCard, Mastery, PlayerProfile } from '@/lib/player/profile';
import s from './collection.module.css';

type View = 'summary' | 'levels' | 'mastery' | 'upgrades';
const RARITY_ORDER: Rarity[] = ['champion', 'legendary', 'epic', 'rare', 'common'];
/** Level colours, like the game's level badges (16 = pink … 9 = sand). */
const LEVEL_COLOR: Record<number, string> = { 16: '#d63fd6', 15: '#2e57c9', 14: '#a3265a', 13: '#8f4fc4', 12: '#2b8a8a', 11: '#e8b531', 10: '#9fd3e6', 9: '#d9b096' };
const levelColor = (l: number | null) => (l == null ? '#3a3d44' : (LEVEL_COLOR[l] ?? '#62676f'));

/** Which art to show: the hero / evo form when unlocked. */
const artOf = (c: CollectionCard) => (c.heroUnlocked && c.heroImg ? { img: c.heroImg, hero: true, evo: false } : c.evoUnlocked && c.evoImg ? { img: c.evoImg, evo: true, hero: false } : { img: c.img, evo: false, hero: false });

function Stars({ n }: { n: number }) {
  if (!n) return <span className={s.noStars}>—</span>;
  return (
    <span className={s.stars} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2l3 6.6 7.2.7-5.4 4.9 1.6 7.1L12 17.6 5.6 21.3l1.6-7.1L1.8 9.3 9 8.6Z" fill="#F2B83A" stroke="#7A4A08" strokeWidth="1.2" />
        </svg>
      ))}
    </span>
  );
}

function UpgradeBar({ c }: { c: CollectionCard }) {
  if (!c.owned) return <span className={s.missing}>Not found</span>;
  if (!c.next) return <span className={s.max}>MAX</span>;
  if (c.next.cards == null) return <span className={s.max}>—</span>;
  const pct = Math.min(100, (c.count / c.next.cards) * 100);
  return (
    <span className={s.upg} title={`${fmt(c.count)} / ${fmt(c.next.cards)} cards`}>
      <span className={s.upgBar}>
        <span style={{ width: `${pct}%`, background: pct >= 100 ? '#4ed17a' : '#3aa0ff' }} />
      </span>
      <span className={s.upgTxt}>
        {fmt(c.count)}/{fmt(c.next.cards)}
      </span>
    </span>
  );
}

/** `form`: show the evo or hero form (greyed until that form is unlocked) instead of the best one. */
function CardCell({ c, form }: { c: CollectionCard; form?: 'evo' | 'hero' }) {
  const a = form === 'evo' ? { img: c.evoImg, evo: true, hero: false } : form === 'hero' ? { img: c.heroImg, evo: false, hero: true } : artOf(c);
  const unlocked = form === 'evo' ? c.evoUnlocked : form === 'hero' ? c.heroUnlocked : c.owned;
  return (
    <div className={s.cell}>
      <div className={s.cellArt}>
        <CardTile slug={c.slug} label={c.name} img={a.img} evo={a.evo} hero={a.hero} rarity={c.rarity} owned={unlocked} size="fluid" />
        {c.level != null && (
          <span className={s.lvl} style={{ background: levelColor(c.level) }}>
            Lvl {c.level}
          </span>
        )}
      </div>
      <span className={s.cellName}>{c.name}</span>
      <UpgradeBar c={c} />
      <Stars n={c.stars} />
    </div>
  );
}

function Summary({ p }: { p: PlayerProfile }) {
  const all = p.collection;
  const owned = all.filter((c) => c.owned);
  const heroes = all.filter((c) => c.canHero);
  const evos = all.filter((c) => c.canEvo);
  const levels = [16, 15, 14, 13, 12, 11, 10, 9];
  const atLeast = (l: number) => owned.filter((c) => (c.level ?? 0) >= l).length;
  const [open, setOpen] = useState(16);
  const inLevel = owned.filter((c) => c.level === open).sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
  const over = owned.filter((c) => (c.level ?? 0) > open).length;

  const strip = (title: string, have: number, total: number, children: React.ReactNode) => (
    <section className={s.block}>
      <h3 className={s.h3}>
        {title} <span className={s.count}>{have} / {total}</span>
      </h3>
      <div className={s.strip}>{children}</div>
    </section>
  );

  const missing = all.filter((c) => !c.owned).sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.name.localeCompare(b.name));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {missing.length > 0 &&
        strip(
          'Missing cards',
          missing.length,
          all.length,
          missing.map((c) => (
            <span key={c.id} className={`${s.mini} ${s.missingCard}`} title={`${c.name} · ${c.rarity} · not found yet`}>
              <CardTile slug={c.slug} label={c.name} img={c.img} rarity={c.rarity} owned={false} size="fluid" />
              <span className={s.missingName}>{c.name}</span>
            </span>
          )),
        )}
      {strip(
        'Tower card collection',
        p.towers.filter((t) => t.owned).length,
        p.towers.length,
        p.towers.map((t) => (
          <span key={t.slug} className={s.mini}>
            <CardTile slug={t.slug} label={t.name} img={t.img} rarity="tower" owned={t.owned} size="fluid" />
            <span>{t.level ?? '—'}</span>
          </span>
        )),
      )}
      {strip(
        'Hero card collection',
        heroes.filter((c) => c.heroUnlocked).length,
        heroes.length,
        heroes.map((c) => (
          <span key={c.id} className={s.mini}>
            <CardTile slug={c.slug} label={`Hero ${c.name}`} img={c.heroImg} hero rarity={c.rarity} owned={c.heroUnlocked} size="fluid" />
          </span>
        )),
      )}
      {strip(
        'Evo card collection',
        evos.filter((c) => c.evoUnlocked).length,
        evos.length,
        evos.map((c) => (
          <span key={c.id} className={s.mini}>
            <CardTile slug={c.slug} label={`${c.name} Evolution`} img={c.evoImg} evo rarity={c.rarity} owned={c.evoUnlocked} size="fluid" />
          </span>
        )),
      )}
      <section className={s.block}>
        <h3 className={s.h3}>
          Card collection <span className={s.count}>{owned.length} / {all.length}</span>
          {p.collectionLevel != null && (
            <span className={s.count} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CardsIcon size={13} /> Collection level {fmt(p.collectionLevel)}
            </span>
          )}
        </h3>
        <div className={s.levelBar} aria-hidden>
          {levels.map((l) => (
            <span key={l} style={{ flex: Math.max(0.0001, owned.filter((c) => c.level === l).length), background: levelColor(l) }} />
          ))}
        </div>
        <div className={s.levelChips} role="tablist" aria-label="Cards by level">
          {levels.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={open === l}
              className={s.levelChip}
              style={{ ['--c' as string]: levelColor(l) }}
              onClick={() => setOpen(l)}
            >
              <b>{l}</b>
              <span>{all.length ? Math.round((atLeast(l) / all.length) * 100) : 0}%</span>
            </button>
          ))}
        </div>
        <div className={s.levelHead}>
          <span>
            <b>Level {open}</b> {open === 16 && <span style={{ color: 'var(--text-3)' }}>Max</span>}
          </span>
          <span>
            Total at {open}+ <b>{atLeast(open)}</b> ({all.length ? Math.round((atLeast(open) / all.length) * 100) : 0}%)
          </span>
          <span>
            Exactly {open} <b>{inLevel.length}</b>
          </span>
          <span>
            Above <b>{over}</b>
          </span>
        </div>
        <div className={s.strip}>
          {inLevel.map((c) => {
            const a = artOf(c);
            return (
              <span key={c.id} className={s.mini}>
                <CardTile slug={c.slug} label={c.name} img={a.img} evo={a.evo} hero={a.hero} rarity={c.rarity} size="fluid" />
              </span>
            );
          })}
          {!inLevel.length && <span className="label-sm">No cards at exactly level {open}.</span>}
        </div>
      </section>
    </div>
  );
}

function Levels({ p }: { p: PlayerProfile }) {
  const [sort, setSort] = useState<'level' | 'elixir' | 'rarity' | 'name' | 'upgrade'>('level');
  const [rar, setRar] = useState<'all' | Rarity>('all');
  const [own, setOwn] = useState<'all' | 'owned' | 'missing'>('all');
  const [kind, setKind] = useState<'all' | 'evo' | 'hero'>('all');
  const list = useMemo(() => {
    // Evo / hero "owned" means that form is unlocked, not just the card.
    const has = (c: CollectionCard) => (kind === 'evo' ? c.evoUnlocked : kind === 'hero' ? c.heroUnlocked : c.owned);
    const l = p.collection.filter(
      (c) =>
        (kind === 'all' || (kind === 'evo' ? c.canEvo : c.canHero)) &&
        (rar === 'all' || c.rarity === rar) &&
        (own === 'all' || (own === 'owned' ? has(c) : !has(c))),
    );
    const ready = (c: CollectionCard) => (c.next?.cards ? c.count / c.next.cards : -1);
    return l.sort((a, b) =>
      sort === 'level'
        ? (b.level ?? -1) - (a.level ?? -1) || RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || (b.elixir ?? 0) - (a.elixir ?? 0)
        : sort === 'elixir'
          ? (b.elixir ?? 0) - (a.elixir ?? 0)
          : sort === 'rarity'
            ? RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
            : sort === 'upgrade'
              ? ready(b) - ready(a)
              : a.name.localeCompare(b.name),
    );
  }, [p.collection, sort, rar, own, kind]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className={s.controls}>
        <label className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          SORT
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={s.select}>
            <option value="level">Level</option>
            <option value="upgrade">Closest to upgrade</option>
            <option value="elixir">Elixir</option>
            <option value="rarity">Rarity</option>
            <option value="name">Name</option>
          </select>
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="label-sm">TYPE</span>
          {(
            [
              ['all', 'All cards'],
              ['evo', 'Evos'],
              ['hero', 'Heroes'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="label-sm">RARITY</span>
          {(['all', ...RARITY_ORDER] as const).map((r) => (
            <button key={r} type="button" className="chip" aria-pressed={rar === r} onClick={() => setRar(r)}>
              {r === 'all' ? 'All' : r[0].toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="label-sm">STATUS</span>
          {(['all', 'owned', 'missing'] as const).map((o) => (
            <button key={o} type="button" className="chip" aria-pressed={own === o} onClick={() => setOwn(o)}>
              {o[0].toUpperCase() + o.slice(1)}
            </button>
          ))}
        </div>
        <span className="label-sm" style={{ marginLeft: 'auto' }}>
          {list.length} cards
        </span>
      </div>
      <div className={s.grid}>
        {list.map((c) => (
          <CardCell key={c.id} c={c} form={kind === 'all' ? undefined : kind} />
        ))}
      </div>
      <h3 className={s.h3}>Tower troops</h3>
      <div className={s.grid}>
        {p.towers.map((t) => (
          <div key={t.slug} className={s.cell}>
            <div className={s.cellArt}>
              <CardTile slug={t.slug} label={t.name} img={t.img} rarity="tower" owned={t.owned} size="fluid" />
              {t.level != null && (
                <span className={s.lvl} style={{ background: levelColor(t.level) }}>
                  Lvl {t.level}
                </span>
              )}
            </div>
            <span className={s.cellName}>{t.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MASTERY_COLOR = (l: number) => (l >= 10 ? '#ff4d1a' : l >= 9 ? '#ff8a1f' : l >= 8 ? '#f7b54a' : l >= 6 ? '#f5d58a' : l >= 4 ? '#3aa0ff' : l >= 1 ? '#8ccbff' : '#3a3d44');

function MasteryView({ p }: { p: PlayerProfile }) {
  const total = p.collection.length;
  const by = new Map(p.mastery.map((m) => [m.slug, m]));
  const counts = Array.from({ length: 11 }, (_, i) => 10 - i).map((l) => ({ l, n: p.mastery.filter((m) => m.level === l).length }));
  const none = total - p.mastery.length;
  const sum = p.mastery.reduce((a, m) => a + m.level, 0);
  const rows: (Mastery | { slug: string; name: string; level: 0; maxLevel: 10; img: null; progress: null; target: null })[] = [
    ...p.mastery,
    ...p.collection.filter((c) => !by.has(c.slug)).map((c) => ({ slug: c.slug, name: c.name, level: 0 as const, maxLevel: 10 as const, img: null, progress: null, target: null })),
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 className={s.h3}>
        Card mastery <span className={s.count}>{p.mastery.length} / {total}</span> <span className={s.count}>Sum {sum}</span>
      </h3>
      <div className={s.levelBar}>
        {counts.map(({ l, n }) => (
          <span key={l} style={{ flex: Math.max(0.0001, l === 0 ? n + none : n), background: MASTERY_COLOR(l) }} title={`Level ${l}: ${l === 0 ? n + none : n}`} />
        ))}
      </div>
      <div className={s.masteryTable}>
        {counts.map(({ l, n }) => (
          <span key={l} style={{ borderBottomColor: MASTERY_COLOR(l) }}>
            <b>L{l}</b>
            {l === 0 ? n + none : n}
          </span>
        ))}
      </div>
      <div className={s.masteryGrid}>
        {rows.map((m) => (
          <div key={m.slug} className={s.mastery} title={`${m.name} · mastery ${m.level}/${m.maxLevel}${m.progress != null && m.target ? ` · ${m.progress}/${m.target}` : ''}`}>
            {m.img ? (
              // eslint-disable-next-line @next/next/no-img-element -- official badge art
              <img src={m.img} alt={`${m.name} mastery`} loading="lazy" />
            ) : (
              <span className={s.masteryNone}>
                <CardTile slug={m.slug} label={m.name} owned={false} size="fluid" />
              </span>
            )}
            <span className={s.masteryLvl} style={{ background: MASTERY_COLOR(m.level) }}>
              {m.level}
            </span>
            <span className={s.cellName}>{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Upgrades({ p }: { p: PlayerProfile }) {
  const [sort, setSort] = useState<'ready' | 'level' | 'toMax'>('ready');
  const list = useMemo(() => {
    const ready = (c: CollectionCard) => (c.next?.cards ? c.count / c.next.cards : c.next ? -0.5 : -1);
    return p.collection
      .filter((c) => c.owned)
      .sort((a, b) => (sort === 'ready' ? ready(b) - ready(a) : sort === 'toMax' ? a.toMax - b.toMax : (a.level ?? 0) - (b.level ?? 0)) || a.name.localeCompare(b.name));
  }, [p.collection, sort]);
  const goldToNext = p.collection.reduce((a, c) => a + (c.next?.gold && c.next.cards && c.count >= c.next.cards ? c.next.gold : 0), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className={s.controls}>
        <label className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          SORT
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={s.select}>
            <option value="ready">Ready to upgrade first</option>
            <option value="level">Lowest level first</option>
            <option value="toMax">Closest to max</option>
          </select>
        </label>
        <span className="label-sm" style={{ marginLeft: 'auto' }}>
          Gold to upgrade every ready card: {fmt(goldToNext)}
        </span>
      </div>
      <div className={s.upgGrid}>
        {list.map((c) => {
          const a = artOf(c);
          return (
            <div key={c.id} className={s.upgRow}>
              <div style={{ width: 64 }}>
                <CardTile slug={c.slug} label={c.name} img={a.img} evo={a.evo} hero={a.hero} rarity={c.rarity} size="fluid" />
              </div>
              <div className={s.upgInfo}>
                <span className={s.upgName}>{c.name}</span>
                <span>
                  Lvl <b>{c.level}</b>
                  {c.next ? ` → ${(c.level ?? 0) + 1}` : ''} <Stars n={c.stars} />
                </span>
                <UpgradeBar c={c} />
                <span>
                  {c.next?.gold ? (
                    <>
                      <b>{fmt(c.next.gold)}</b> gold for the next level
                    </>
                  ) : c.next ? (
                    '—'
                  ) : (
                    'Max level'
                  )}
                </span>
                <span>
                  <b>{fmt(c.toMax)}</b> cards til max · <b>{fmt(c.collected)}</b> collected
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <span className="label-sm" style={{ lineHeight: 1.6 }}>
        Card and gold costs follow the game&apos;s upgrade table (levels 11–16 as changed in the November 2025 update). &quot;Collected&quot; counts copies spent on upgrades plus copies in hand.
      </span>
    </div>
  );
}

export function CollectionTab({ p }: { p: PlayerProfile }) {
  const [view, setView] = useState<View>('summary');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className={s.views} role="tablist" aria-label="Collection views">
        {(
          [
            ['summary', 'Summary'],
            ['levels', 'Levels'],
            ['mastery', 'Mastery'],
            ['upgrades', 'Upgrades'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k} className={s.view} onClick={() => setView(k)}>
            {l}
          </button>
        ))}
      </div>
      {view === 'summary' && <Summary p={p} />}
      {view === 'levels' && <Levels p={p} />}
      {view === 'mastery' && <MasteryView p={p} />}
      {view === 'upgrades' && <Upgrades p={p} />}
    </div>
  );
}

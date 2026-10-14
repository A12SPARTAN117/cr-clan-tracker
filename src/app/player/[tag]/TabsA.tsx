'use client';

import { useState } from 'react';
import { CardTile } from '@/components/CardTile';
import { DeckBlock } from '@/components/DeckBlock';
import { BadgeIcon, CardsIcon, CrownIcon, DonationIcon, ExpIcon, SwordsIcon, WinRateIcon } from '@/components/ui/icons';
import { FitValue } from '@/components/ui/primitives';
import type { Rarity } from '@/lib/cards';
import { fmt } from '@/lib/format';
import type { Badge, BadgeGroup, CollectionCard, PlayerProfile } from '@/lib/player/profile';
import s from './player.module.css';

/* ---------------- Overview ---------------- */
export function OverviewTab({ p, onCopy }: { p: PlayerProfile; onCopy: (t: string) => void }) {
  const t = p.totals;
  const owned = p.collection.filter((c) => c.owned);
  const avgLevel = owned.length ? owned.reduce((a, c) => a + (c.level ?? 0), 0) / owned.length : 0;
  const tiles: [string, string, string, React.ReactNode][] = [
    ['Wins', fmt(t.wins), '', <CrownIcon key="i" />],
    ['Losses', fmt(t.losses), '', <SwordsIcon key="i" />],
    ['Win %', t.wins + t.losses ? ((t.wins / (t.wins + t.losses)) * 100).toFixed(1) : '—', '%', <WinRateIcon key="i" />],
    ['3-crown wins', fmt(t.threeCrown), '', <CrownIcon key="i" />],
    ['Battles', fmt(t.battleCount), '', <SwordsIcon key="i" />],
    ['Cards found', String(owned.length), `/${p.collection.length}`, <CardsIcon key="i" />],
    ['Avg card level', avgLevel.toFixed(1), 'lvl', <ExpIcon key="i" />],
    ['Star points', fmt(t.starPoints), '', <BadgeIcon key="i" />],
    ['Donations', fmt(t.totalDonations), 'total', <DonationIcon key="i" />],
  ];
  const form = [...p.battles].reverse().slice(-30);
  const wins = form.filter((b) => b.result === 'win').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div className={s.tiles}>
        {tiles.map(([k, v, sub, icon]) => (
          <div key={k} data-spot="" className={`spot ${s.tile}`} style={{ minWidth: 0 }}>
            <span style={{ font: '500 10px/1.3 var(--mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{k}</span>
            <FitValue value={v} unit={sub || undefined} icon={icon} max={38} />
          </div>
        ))}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
          <span className="label">Recent form · last {form.length} battles</span>
          <span style={{ font: '500 11px/1 var(--mono)', color: 'var(--text-2)' }}>
            {form.length ? `${wins}W ${form.length - wins}L · ${Math.round((wins / form.length) * 100)}% · BASED ON ${form.length} GAMES` : 'NO BATTLES IN THE LOG'}
          </span>
        </div>
        <div className={s.form}>
          {form.map((b) => {
            const w = b.result === 'win';
            const d = b.result === 'draw';
            return (
              <span
                key={b.id}
                className={s.formCell}
                title={`${w ? 'Win' : d ? 'Draw' : 'Loss'} · ${b.mode} · vs ${b.opp.name}`}
                style={{
                  background: w ? 'rgba(58,160,255,.85)' : 'var(--well)',
                  boxShadow: w ? '0 0 8px rgba(58,160,255,.45)' : 'inset 0 1px 2px rgba(0,0,0,.5)',
                  border: w ? 0 : `1px solid ${d ? 'var(--hair)' : 'rgba(255,84,100,.45)'}`,
                  color: w ? '#07080A' : d ? 'var(--text-3)' : 'var(--ember)',
                }}
              >
                {w ? 'W' : d ? 'D' : 'L'}
              </span>
            );
          })}
        </div>
        <span className="label" style={{ letterSpacing: '.1em' }}>
          ← Oldest · Newest →
        </span>
      </div>
    </div>
  );
}

/* ---------------- Collection ---------------- */
type Art = 'base' | 'evo' | 'hero' | 'split';

function tileProps(c: CollectionCard, art: Art) {
  const split = art === 'split' && c.canEvo && c.canHero;
  const evo = (art === 'evo' || split) && c.canEvo;
  const hero = (art === 'hero' || split) && c.canHero;
  return { evo, hero, split, img: evo && c.evoImg ? c.evoImg : hero && c.heroImg ? c.heroImg : c.img, img2: split ? c.heroImg : null };
}

function Bar({ k, a, b, color }: { k: string; a: number; b: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', font: '500 10px/1 var(--mono)', letterSpacing: '.14em', color: 'var(--text-3)' }}>
        <span>{k}</span>
        <span style={{ color: 'var(--text-1)' }}>
          {a}/{b}
        </span>
      </span>
      <span style={{ height: 3, borderRadius: 2, background: 'var(--well)' }}>
        <span style={{ display: 'block', height: '100%', width: `${b ? (a / b) * 100 : 0}%`, borderRadius: 2, background: color, boxShadow: color === '#8CCBFF' ? '0 0 6px rgba(58,160,255,.9)' : 'none' }} />
      </span>
    </div>
  );
}

export function CollectionTab({ p }: { p: PlayerProfile }) {
  const [rar, setRar] = useState<'all' | Rarity>('all');
  const [own, setOwn] = useState<'all' | 'owned' | 'missing'>('all');
  const [cap, setCap] = useState<'all' | 'evo' | 'hero'>('all');
  const [art, setArt] = useState<Art>('base');
  const all = p.collection;
  const list = all.filter(
    (c) => (rar === 'all' || c.rarity === rar) && (own === 'all' || (own === 'owned' ? c.owned : !c.owned)) && (cap === 'all' || (cap === 'evo' ? c.canEvo : c.canHero)),
  );
  const evos = all.filter((c) => c.canEvo);
  const heroes = all.filter((c) => c.canHero);
  const group = <T extends string>(label: string, v: T, set: (x: T) => void, opts: [T, string][]) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span className="label-sm">{label}</span>
      {opts.map(([o, l]) => (
        <button key={o} type="button" className="chip" aria-pressed={v === o} onClick={() => set(o)}>
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
        <Bar k="CARDS FOUND" a={all.filter((c) => c.owned).length} b={all.length} color="#8CCBFF" />
        <Bar k="EVOLUTIONS" a={evos.filter((c) => c.evoUnlocked).length} b={evos.length} color="#C79BFF" />
        <Bar k="HEROES" a={heroes.filter((c) => c.heroUnlocked).length} b={heroes.length} color="#E6B34A" />
        <Bar k="TOWER TROOPS" a={p.towers.filter((t) => t.owned).length} b={p.towers.length} color="var(--text-1)" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px', alignItems: 'center', padding: '14px 0', borderTop: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)' }}>
        {group('RARITY', rar, setRar, [
          ['all', 'All'],
          ['common', 'Common'],
          ['rare', 'Rare'],
          ['epic', 'Epic'],
          ['legendary', 'Legendary'],
          ['champion', 'Champion'],
        ])}
        {group('STATUS', own, setOwn, [
          ['all', 'All'],
          ['owned', 'Owned'],
          ['missing', 'Missing'],
        ])}
        {group('CAN', cap, setCap, [
          ['all', 'Any'],
          ['evo', 'Evolve'],
          ['hero', 'Hero'],
        ])}
        {group('ART', art, setArt, [
          ['base', 'Base'],
          ['evo', 'Evo'],
          ['hero', 'Hero'],
          ['split', 'Evo+Hero split'],
        ])}
        <span style={{ marginLeft: 'auto', font: '500 10px/1 var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)' }}>{list.length} CARDS</span>
      </div>
      <div className={s.cardGrid}>
        {list.map((c) => (
          <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <CardTile slug={c.slug} label={c.name} rarity={c.rarity} owned={c.owned} level={c.level} size="M" showLabel {...tileProps(c, art)} />
            <span style={{ font: '500 9px/1.3 var(--mono)', letterSpacing: '.06em', color: 'var(--text-3)' }}>
              {c.owned ? `${c.stars ? '★'.repeat(c.stars) : '☆0'} · ${fmt(c.count)} copies` : 'NOT FOUND'}
            </span>
          </div>
        ))}
      </div>
      {[
        { title: 'Evolutions', fg: 'var(--evo-hi)', items: evos.map((c) => ({ c, owned: c.evoUnlocked, art: 'evo' as Art })) },
        { title: 'Heroes', fg: 'var(--gold)', items: heroes.map((c) => ({ c, owned: c.heroUnlocked, art: 'hero' as Art })) },
      ].map((sec) => (
        <div key={sec.title} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 24, borderTop: '1px solid var(--hair)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 className="heading">{sec.title}</h3>
            <span style={{ font: '500 10px/1 var(--mono)', letterSpacing: '.14em', color: sec.fg }}>
              {sec.items.filter((i) => i.owned).length} / {sec.items.length} UNLOCKED
            </span>
          </div>
          <div className={s.smallGrid}>
            {sec.items.map(({ c, owned, art: a }) => (
              <CardTile key={c.id} slug={c.slug} label={c.name} rarity={c.rarity} owned={owned} size="S" {...tileProps(c, a)} />
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 24, borderTop: '1px solid var(--hair)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 className="heading">Tower troops</h3>
          <span style={{ font: '500 10px/1 var(--mono)', letterSpacing: '.14em', color: 'var(--text-2)' }}>
            {p.towers.filter((t) => t.owned).length} / {p.towers.length} UNLOCKED
          </span>
        </div>
        <div className={s.smallGrid}>
          {p.towers.map((t) => (
            <CardTile key={t.slug} slug={t.slug} label={t.name} img={t.img} rarity="tower" owned={t.owned} level={t.level} size="M" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Badges ---------------- */
const GROUP_ORDER: BadgeGroup[] = ['Mastery', 'Seasonal', 'Collection', 'Tournament & events', 'Milestones'];

function BadgeTrophy({ b }: { b: Badge }) {
  const maxed = b.level != null && b.maxLevel != null && b.level >= b.maxLevel;
  const pct = b.progress != null && b.target ? Math.min(100, (b.progress / b.target) * 100) : maxed ? 100 : 0;
  return (
    <div data-tilt="" className={s.badge}>
      <div className={s.glass} style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,.35),0 0 ${maxed ? 18 : 6}px rgba(58,160,255,.35)` }}>
        {b.img ? (
          // eslint-disable-next-line @next/next/no-img-element -- API badge art
          <img src={b.img} alt="" loading="lazy" style={{ width: 56, height: 56, objectFit: 'contain' }} />
        ) : (
          <span style={{ font: '800 22px/1 var(--mono)', letterSpacing: '-.04em' }}>◆</span>
        )}
      </div>
      <span style={{ font: '600 13px/1.2 var(--sans)', textAlign: 'center' }}>{b.label}</span>
      {b.level != null && (
        <span style={{ font: '500 9px/1 var(--mono)', letterSpacing: '.12em', color: maxed ? 'var(--blue-hi)' : 'var(--text-3)' }}>
          LV {b.level}
          {b.maxLevel ? ` / ${b.maxLevel}` : ''}
        </span>
      )}
      <span style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ height: 2, borderRadius: 2, background: 'var(--well)' }}>
          <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: '#8CCBFF', boxShadow: '0 0 6px rgba(58,160,255,.9)' }} />
        </span>
        <span style={{ font: '500 9px/1 var(--mono)', color: 'var(--text-3)', textAlign: 'center' }}>
          {b.progress != null ? `${fmt(b.progress)}${b.target ? ` / ${fmt(b.target)}` : ''}` : maxed ? 'MAX' : ''}
        </span>
      </span>
    </div>
  );
}

export function BadgesTab({ p }: { p: PlayerProfile }) {
  const [showAll, setShowAll] = useState(false);
  const groups = GROUP_ORDER.map((g) => ({ g, items: p.badges.filter((b) => b.group === g) })).filter((x) => x.items.length);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {groups.map(({ g, items }) => {
        const sorted = g === 'Mastery' ? [...items].sort((a, b) => (b.level ?? 0) - (a.level ?? 0) || (b.progress ?? 0) - (a.progress ?? 0)) : items;
        const shown = g === 'Mastery' && !showAll ? sorted.slice(0, 12) : sorted;
        return (
          <div key={g} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <h3 className="heading">{g}</h3>
              {g === 'Mastery' ? (
                <button type="button" className="link-mono" style={{ background: 'none', border: 0, color: 'var(--blue)', cursor: 'pointer', fontSize: 10 }} onClick={() => setShowAll(!showAll)}>
                  {showAll ? `Show top 12` : `Showing 12 of ${items.length} · show all →`}
                </button>
              ) : g === 'Collection' ? (
                <span className="label-sm">Emotes shown as a count only</span>
              ) : null}
            </div>
            <div className={s.shelf}>
              {shown.map((b) => (
                <BadgeTrophy key={b.id} b={b} />
              ))}
            </div>
          </div>
        );
      })}
      {p.achievements.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 className="heading">Classic achievements</h3>
          <div style={{ border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--charcoal)' }}>
            {p.achievements.map((a) => (
              <div key={a.name} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', gap: 16, alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--hair)' }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ font: '600 14px/1.2 var(--sans)' }}>{a.name}</span>
                  <span style={{ font: '400 12px/1.3 var(--sans)', color: 'var(--text-3)' }}>{a.info}</span>
                </span>
                <span style={{ font: '500 12px/1 var(--mono)', letterSpacing: '.2em', color: 'var(--blue-hi)', textShadow: '0 0 8px rgba(58,160,255,.6)' }} aria-label={`${a.stars} of 3 stars`}>
                  {'★'.repeat(a.stars) + '☆'.repeat(Math.max(0, 3 - a.stars))}
                </span>
                <span style={{ textAlign: 'right', font: '500 12px/1 var(--mono)', color: 'var(--text-2)' }}>{a.value >= a.target ? 'Done' : `${fmt(a.value)} / ${fmt(a.target)}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

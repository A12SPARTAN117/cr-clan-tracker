'use client';

import Link from 'next/link';
import { useMemo, useSyncExternalStore } from 'react';
import { CardTile } from '@/components/CardTile';
import { DeckBlock } from '@/components/DeckBlock';
import { SceneHeader } from '@/components/SceneHeader';
import { Reveal } from '@/components/fx/Reveal';
import { PolRating } from '@/components/ui/primitives';
import { agoShort, fmt } from '@/lib/format';
import type { Rarity } from '@/lib/cards';
import type { Pro, ProStint } from '@/lib/pros';
import s from './pros.module.css';

/* Followed pros, stored on this device. */
const KEY = 'oa-follow-pros';
let raw: string | null | undefined;
let val: string[] = [];
const NONE: string[] = [];
function read(): string[] {
  let r: string | null = null;
  try {
    r = localStorage.getItem(KEY);
  } catch {}
  if (r === raw) return val;
  raw = r;
  try {
    val = r ? (JSON.parse(r) as string[]) : [];
  } catch {
    val = [];
  }
  return val;
}
function toggle(tag: string) {
  const cur = read();
  const next = cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event(KEY));
}
function useFollowed() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(KEY, cb);
      return () => window.removeEventListener(KEY, cb);
    },
    read,
    () => NONE,
  );
}

const HOUR = 3_600_000;

/** When this pro started on their current deck, and whether that's a switch the site saw. */
function stintOf(p: Pro, history: Record<string, ProStint[]>, at: number) {
  const h = history[p.tag] ?? [];
  const cur = h[0] && p.deck && h[0].deckKey === p.deck.key ? h[0] : null;
  // A switch only counts when an earlier deck is on record; otherwise "since" is just when we started looking.
  const switched = cur && h.length > 1 ? (at - Date.parse(cur.from)) / HOUR : null;
  return { since: cur ? (at - Date.parse(cur.from)) / HOUR : null, switched, stints: h.length };
}

function ProRow({ p, history, at, followed }: { p: Pro; history: Record<string, ProStint[]>; at: number; followed: boolean }) {
  const st = stintOf(p, history, at);
  const fresh = st.switched != null && st.switched < 24;
  return (
    <li className={s.row} data-new={fresh}>
      <span className={s.rank} data-top={p.rank <= 3}>
        {p.rank}
      </span>
      <span className={s.who}>
        <Link href={`/player/${p.tag}`}>
          <b>{p.name}</b>
        </Link>
        <small>
          {p.clan ?? 'No clan'}
          {fresh ? ` · new deck ${agoShort(st.switched!)} ago` : st.since != null && st.stints > 1 ? ` · on this deck ${agoShort(st.since)}` : ''}
        </small>
      </span>
      <span className={s.rating}>
        <PolRating rating={p.rating} size={13} />
      </span>
      <span className={s.mini}>
        {p.deck ? p.deck.cards.map((c, i) => <CardTile key={i} slug={c.slug} label={c.name} img={c.img} rarity={c.rarity} evo={c.evo} hero={c.hero} size="S" />) : <span className={s.muted}>Deck not available</span>}
      </span>
      <span className={s.actions}>
        {p.deck && (
          <a href={p.deck.link} className="link-mono" target="_blank" rel="noreferrer">
            Copy
          </a>
        )}
        <button type="button" className={s.follow} aria-pressed={followed} onClick={() => toggle(p.tag)} aria-label={followed ? `Unfollow ${p.name}` : `Follow ${p.name}`}>
          {followed ? '★' : '☆'}
        </button>
      </span>
    </li>
  );
}

/** `at`: when the server read the decks (ms), for the 'switched … ago' labels. */
export function ProsView({ pros, history, at }: { pros: Pro[]; history: Record<string, ProStint[]>; at: number }) {
  const followed = useFollowed();
  const top = pros[0];
  // Which cards the top 100 are running, most common first.
  const usage = useMemo(() => {
    const m = new Map<string, { slug: string; name: string; img: string | null; rarity: Rarity; n: number; evo: number; hero: number }>();
    let decks = 0;
    for (const p of pros) {
      if (!p.deck) continue;
      decks++;
      for (const c of p.deck.cards) {
        const e = m.get(c.slug) ?? { slug: c.slug, name: c.name, img: c.img, rarity: c.rarity, n: 0, evo: 0, hero: 0 };
        e.n++;
        if (c.evo) e.evo++;
        if (c.hero) e.hero++;
        m.set(c.slug, e);
      }
    }
    return { decks, cards: [...m.values()].sort((a, b) => b.n - a.n).slice(0, 16) };
  }, [pros]);
  const mine = pros.filter((p) => followed.includes(p.tag));
  const switched = pros.filter((p) => {
    const st = stintOf(p, history, at);
    return st.switched != null && st.switched < 24;
  }).length;

  return (
    <>
      <SceneHeader scene="/scenes/podium.jpg" height="clamp(340px, 44vh, 460px)" status={<span>Global Path of Legends top 100 · current decks</span>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 820 }}>
          <Reveal as="h1" className="display-l">
            PRO TRACKER
          </Reveal>
          <p className="body" style={{ maxWidth: 600, color: 'var(--text-1)' }}>
            The deck each top player has equipped right now{switched ? `, ${switched} switched in the last 24 hours` : ''}. Follow a pro to keep them at the top of this page.
          </p>
        </div>
      </SceneHeader>
      <main className={s.main}>
        {top?.deck && (
          <section className={s.block}>
            <h2 className="heading">What #1 is using today</h2>
            <div className={s.hero}>
              <div className={s.heroWho}>
                <Link href={`/player/${top.tag}`}>
                  <b>{top.name}</b>
                </Link>
                <span>
                  <PolRating rating={top.rating} size={14} /> · {top.clan ?? 'No clan'}
                </span>
              </div>
              <div style={{ maxWidth: 560, width: '100%' }}>
                <DeckBlock
                  name={top.deck.name}
                  cards={top.deck.cards}
                  tower={top.deck.tower}
                  avgElixir={top.deck.avgElixir}
                  cycle={top.deck.cycle}
                  action={
                    <a href={top.deck.link} className="link-mono" target="_blank" rel="noreferrer" style={{ fontSize: 10 }}>
                      Copy deck →
                    </a>
                  }
                />
              </div>
            </div>
          </section>
        )}

        {mine.length > 0 && (
          <section className={s.block}>
            <h2 className="heading">Pros you follow</h2>
            <ol className={s.list}>
              {mine.map((p) => (
                <ProRow key={p.tag} p={p} history={history} at={at} followed />
              ))}
            </ol>
          </section>
        )}

        <section className={s.block}>
          <h2 className="heading">
            Most used cards <span className={s.muted}>in {usage.decks} decks</span>
          </h2>
          <div className={s.usage}>
            {usage.cards.map((c) => (
              <span key={c.slug} className={s.use} title={`${c.name}: ${c.n} of ${usage.decks} decks${c.evo ? ` · ${c.evo} as evo` : ''}${c.hero ? ` · ${c.hero} as hero` : ''}`}>
                <CardTile slug={c.slug} label={c.name} img={c.img} rarity={c.rarity} size="fluid" />
                <b>{Math.round((c.n / Math.max(1, usage.decks)) * 100)}%</b>
              </span>
            ))}
          </div>
        </section>

        <section className={s.block}>
          <h2 className="heading">Top 100</h2>
          <ol className={s.list}>
            {pros.map((p) => (
              <ProRow key={p.tag} p={p} history={history} at={at} followed={followed.includes(p.tag)} />
            ))}
          </ol>
        </section>

        <p className={s.note}>
          Decks are what each player has equipped in their profile right now, from the official API, refreshed every few minutes. &quot;New deck&quot; means this site saw them switch
          within the last 24 hours; switches are recorded from the first time the tracker ran. Followed pros are saved on this device.
        </p>
        <span className={s.muted}>Updated {fmt(pros.length)} profiles</span>
      </main>
    </>
  );
}

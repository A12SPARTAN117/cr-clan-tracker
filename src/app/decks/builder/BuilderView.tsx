'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { CardTile } from '@/components/CardTile';
import { DeckBlock, DeckGrid, metaDeck } from '@/components/DeckBlock';
import { EmptyState } from '@/components/EmptyState';
import { ModeFilter } from '@/components/ModeFilter';
import { CycleIcon, ElixirIcon } from '@/components/ui/icons';
import {
  CLOSE_SHARED,
  DECK_SIZE,
  MIN_MATCHUP_GAMES,
  PICKABLE,
  championCount,
  counterReport,
  decodeSlots,
  deckSlots,
  deckSummary,
  defaultForm,
  encodeSlots,
  poolDecks,
  slotCards,
  slotForms,
  slotFor,
  towerById,
  unpackDeck,
  type Collection,
  type PackedMeta,
  type Slot,
  type Suggestion,
} from '@/lib/builder';
import { TOWER_TROOPS, cardById, cardBySlug, type Rarity } from '@/lib/cards';
import { deckHref, deckLink } from '@/lib/decks';
import { fmt } from '@/lib/format';
import type { DeckStat } from '@/lib/meta';
import { usePins } from '@/lib/pins';
import { checkTag } from '@/lib/tags';
import s from './builder.module.css';

const pct = (wins: number, games: number) => `${((wins / games) * 100).toFixed(1)}%`;
const SLOT_LABELS = ['Evo', 'Hero', 'Evo / Hero'];
const RARITIES: [Rarity, string][] = [
  ['common', 'Common'],
  ['rare', 'Rare'],
  ['epic', 'Epic'],
  ['legendary', 'Legendary'],
  ['champion', 'Champion'],
];
const ELIXIR = ['1', '2', '3', '4', '5', '6', '7+'];
const LEVELS = [16, 15, 14, 13, 12, 11, 10, 9];
const DEFAULT_TOWER = TOWER_TROOPS.find((t) => t.slug === 'tower-princess')?.id ?? TOWER_TROOPS[0]?.id ?? null;

function setUrl(patch: Record<string, string | null>) {
  const u = new URL(window.location.href);
  for (const [k, v] of Object.entries(patch)) {
    if (v) u.searchParams.set(k, v);
    else u.searchParams.delete(k);
  }
  window.history.replaceState(null, '', u);
}

type Loaded = { tag: string; data?: Collection; error?: string };

export function BuilderView({ meta }: { meta: PackedMeta }) {
  const params = useSearchParams();
  const pins = usePins();
  const [slots, setSlots] = useState<Slot[]>(() => decodeSlots(params.get('deck')));
  const [tower, setTower] = useState<number | null>(() => towerById(Number(params.get('tower')))?.id ?? DEFAULT_TOWER);
  const [mode, setMode] = useState(() => (meta.modes[params.get('mode') ?? ''] ? params.get('mode')! : 'pol'));
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<'deck' | 'share' | null>(null);
  // The deck as it was before Clear, for one-tap undo.
  const [cleared, setCleared] = useState<Slot[] | null>(null);
  const deckRef = useRef<HTMLElement>(null);

  // Picker filters.
  const [q, setQ] = useState('');
  const [rarity, setRarity] = useState<Rarity | null>(null);
  const [elixir, setElixir] = useState<string | null>(null);
  const [special, setSpecial] = useState<'evo' | 'hero' | null>(null);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [minLevel, setMinLevel] = useState<number | null>(null);

  // A player's collection: the one typed in, else the pinned player. '' means "none".
  const [chosen, setChosen] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const tag = chosen ?? pins.player;
  useEffect(() => {
    if (!tag || loaded?.tag === tag) return;
    const ac = new AbortController();
    fetch(`/api/collection/${encodeURIComponent(tag)}`, { signal: ac.signal })
      .then(async (r) => {
        if (r.ok) return setLoaded({ tag, data: (await r.json()) as Collection });
        setLoaded({ tag, error: r.status === 404 ? `No player with tag #${tag}.` : r.status === 429 ? 'Too many requests. Try again in a minute.' : 'Clash Royale data is unavailable right now.' });
      })
      .catch((e: unknown) => {
        if (!ac.signal.aborted) setLoaded({ tag, error: e instanceof Error ? e.message : 'Could not load the collection.' });
      });
    return () => ac.abort();
  }, [tag, loaded?.tag]);
  const current = tag && loaded?.tag === tag ? loaded : null;
  const col = current?.data ?? null;
  const loading = !!tag && !current;
  const unlock = (id: number) => col?.cards[id];

  // Keep the URL shareable.
  useEffect(() => {
    const any = slots.some(Boolean);
    setUrl({ deck: any ? encodeSlots(slots) : null, tower: tower && tower !== DEFAULT_TOWER ? String(tower) : null, mode: mode === 'pol' ? null : mode });
  }, [slots, tower, mode]);

  const cards = useMemo(() => slotCards(slots), [slots]);
  const sum = deckSummary(cards);
  const full = cards.length === DECK_SIZE;
  const m = meta.modes[mode];
  const decks = useMemo(() => m.decks.map(unpackDeck), [m]);
  const report = useMemo(() => counterReport(decks, cards), [decks, cards]);
  // Counters draw on every 1v1 mode at once: one mode alone rarely has enough games per matchup.
  const { pooled, home, labels } = useMemo(() => {
    const keys = meta.order.filter((k) => meta.modes[k].kind !== '2v2');
    const lists = keys.map((k) => meta.modes[k].decks.map(unpackDeck));
    // Each deck links to the mode it was played most in.
    const home = new Map<string, { mode: string; games: number }>();
    lists.forEach((l, i) =>
      l.forEach((d) => {
        if ((home.get(d.key)?.games ?? -1) < d.games) home.set(d.key, { mode: keys[i], games: d.games });
      }),
    );
    return { pooled: poolDecks(lists), home, labels: keys.map((k) => meta.modes[k].label) };
  }, [meta]);
  const counters = useMemo(() => counterReport(pooled, cards), [pooled, cards]);
  const inDeck = useMemo(() => new Set(cards.map((c) => c.id)), [cards]);

  const place = (next: Slot[]) => {
    setSlots(next);
    setSelected(null);
    setNotice(null);
    setCopied(null);
    setCleared(null);
  };

  function clearDeck() {
    const before = slots;
    place(Array(DECK_SIZE).fill(null));
    setCleared(before);
  }

  /** Adds a card; with the Evo or Hero filter on, it goes in a slot that plays that form. */
  function pick(id: number) {
    const info = cardById(id);
    if (!info || slots.some((x) => x?.id === id)) return;
    const form = special;
    const can = (i: number) => (form === 'evo' ? slotForms(info, i).evo : form === 'hero' ? slotForms(info, i).hero : false);
    const formSlot = form ? (form === 'evo' ? [0, 2] : [1, 2]).find((i) => !slots[i] && can(i)) : undefined;
    const target = selected ?? formSlot ?? slotFor(slots, id);
    if (target < 0) return setNotice('The deck is full. Tap a card in the deck, then a card here to swap it.');
    const replacing = slots[target];
    if (info.rarity === 'champion' && championCount(slots) - (replacing && cardById(replacing.id)?.rarity === 'champion' ? 1 : 0) >= 1)
      return setNotice('A deck can hold only one Champion.');
    const next = [...slots];
    next[target] = form && can(target) ? { id, evo: form === 'evo', hero: form === 'hero' } : { id, ...defaultForm(id, target, unlock(id)) };
    place(next);
    if (form && !can(target)) setNotice(`${info.name} went in as a normal card: the ${form} slots (${form === 'evo' ? '1 and 3' : '2 and 3'}) are taken.`);
  }

  function tapSlot(i: number) {
    if (selected == null) return setSelected(i);
    if (selected === i) return setSelected(null);
    // Move or swap; each card takes the default form of its new slot.
    const next = [...slots];
    [next[i], next[selected]] = [next[selected], next[i]];
    for (const j of [i, selected]) {
      const c = next[j];
      if (c) next[j] = { id: c.id, ...defaultForm(c.id, j, unlock(c.id)) };
    }
    place(next);
  }

  function setForm(i: number, form: 'normal' | 'evo' | 'hero') {
    const next = [...slots];
    const c = next[i];
    if (!c) return;
    next[i] = { id: c.id, evo: form === 'evo', hero: form === 'hero' };
    setSlots(next);
    setCopied(null);
  }

  function load(d: DeckStat) {
    place(deckSlots(d.cards));
    setTower((d.tower && cardBySlug(d.tower.slug)?.id) || DEFAULT_TOWER);
    deckRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function copy(kind: 'deck' | 'share') {
    const text = kind === 'deck' ? deckLink(cards.map((c) => c.id)) : window.location.href;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(kind);
  }

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PICKABLE.filter((c) => {
      // Cards already in the deck leave the picker; tap them in the deck to remove them.
      if (inDeck.has(c.id)) return false;
      if (needle && !c.name.toLowerCase().includes(needle)) return false;
      if (rarity && c.rarity !== rarity) return false;
      if (elixir && (c.elixir == null || (elixir === '7+' ? c.elixir < 7 : c.elixir !== Number(elixir)))) return false;
      const own = col?.cards[c.id];
      if (special === 'evo' && !(c.hasEvolution && (!col || !ownedOnly || own?.evo))) return false;
      if (special === 'hero' && !(c.hasHero && (!col || !ownedOnly || own?.hero))) return false;
      if (col && ownedOnly && !own) return false;
      if (col && minLevel != null && !(own && own.level >= minLevel)) return false;
      return true;
    });
  }, [q, rarity, elixir, special, ownedOnly, minLevel, col, inDeck]);
  const filtered = !!q.trim() || !!rarity || !!elixir || !!special || ownedOnly || minLevel != null;
  const clearFilters = () => {
    setQ('');
    setRarity(null);
    setElixir(null);
    setSpecial(null);
    setOwnedOnly(false);
    setMinLevel(null);
  };

  const sel = selected != null ? slots[selected] : null;
  const selInfo = sel ? cardById(sel.id) : undefined;
  const selForms = selInfo && selected != null ? slotForms(selInfo, selected) : null;
  const locked = col
    ? cards.filter((c) => (c.evo && !col.cards[c.id]?.evo) || (c.hero && !col.cards[c.id]?.hero) || !col.cards[c.id]).map((c) => c.name)
    : [];
  const towerInfo = towerById(tower);

  return (
    <main className="page" style={{ gap: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Link href={`/decks${mode === 'pol' ? '' : `?mode=${mode}`}`} className="link-mono" style={{ alignSelf: 'flex-start' }}>
          ← Meta decks
        </Link>
        <span className="label">Build · check the meta · find hard counters</span>
        <h1 style={{ margin: 0, font: '800 clamp(34px,6vw,84px)/.9 var(--mono)', letterSpacing: '-.05em' }}>DECK BUILDER</h1>
      </div>

      <div className={s.layout}>
        <section ref={deckRef} className={s.deck} aria-label="Your deck">
          <div className={s.deckHead}>
            <span className={s.deckName}>{sum.name}</span>
            <span className={s.deckMeta}>
              <span className="label-sm">
                {cards.length}/{DECK_SIZE} cards
              </span>
              {cards.length > 0 && (
                <button type="button" className={s.clearDeck} onClick={clearDeck} title="Remove every card from the deck">
                  <span aria-hidden>✕</span> Clear deck
                </button>
              )}
            </span>
          </div>
          <div className={s.slots}>
            {slots.map((c, i) => {
              const info = c ? cardById(c.id) : undefined;
              const level = c ? col?.cards[c.id]?.level : undefined;
              return (
                <button
                  key={i}
                  type="button"
                  className={s.slot}
                  data-selected={selected === i}
                  data-empty={!c}
                  onClick={() => tapSlot(i)}
                  aria-label={info ? `${info.name}${c?.evo ? ' (evolution)' : c?.hero ? ' (hero)' : ''}, slot ${i + 1}` : `Empty slot ${i + 1}${i < 3 ? ` (${SLOT_LABELS[i]})` : ''}`}
                  aria-pressed={selected === i}
                >
                  {i < 3 && <span className={s.slotLabel}>{SLOT_LABELS[i]}</span>}
                  {c && info ? (
                    <CardTile slug={info.slug} label={info.name} rarity={info.rarity} evo={c.evo} hero={c.hero} level={level ?? null} owned={!col || !!col.cards[c.id]} size="fluid" />
                  ) : (
                    <span className={s.plus} aria-hidden>
                      +
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className={s.toolbar} aria-live="polite">
            {sel && selInfo && selected != null ? (
              <>
                <b className={s.toolName}>{selInfo.name}</b>
                {selForms && (selForms.evo || selForms.hero) && (
                  <span style={{ display: 'flex', gap: 4 }}>
                    <button type="button" className="chip" aria-pressed={!sel.evo && !sel.hero} onClick={() => setForm(selected, 'normal')}>
                      Normal
                    </button>
                    {selForms.evo && (
                      <button type="button" className="chip" aria-pressed={sel.evo} onClick={() => setForm(selected, 'evo')}>
                        Evo
                      </button>
                    )}
                    {selForms.hero && (
                      <button type="button" className="chip" aria-pressed={sel.hero} onClick={() => setForm(selected, 'hero')}>
                        Hero
                      </button>
                    )}
                  </span>
                )}
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    const next = [...slots];
                    next[selected] = null;
                    place(next);
                  }}
                >
                  Remove
                </button>
                <span className={s.hint}>Tap another slot to move it, or a card below to replace it.</span>
              </>
            ) : selected != null ? (
              <span className={s.hint}>The next card you pick goes in slot {selected + 1}. Tap a deck card to move it here.</span>
            ) : cleared ? (
              <span className={s.hint}>
                Deck cleared.{' '}
                <button
                  type="button"
                  className={s.undo}
                  onClick={() => {
                    setSlots(cleared);
                    setCleared(null);
                  }}
                >
                  Undo
                </button>
              </span>
            ) : (
              <span className={notice ? s.warn : s.hint}>
                {notice ?? (cards.length ? 'Tap a deck card to change its form, move or remove it.' : 'Pick cards below. Evo and hero cards go to the first three slots, as in the game.')}
              </span>
            )}
          </div>
          {notice && selected != null && <span className={s.warn}>{notice}</span>}

          <div className={s.foot}>
            <span className={s.fact} title="Average elixir cost">
              <ElixirIcon size={16} />
              <span className={s.factK}>Avg elixir</span>
              <b>{cards.length ? sum.avgElixir.toFixed(1) : '—'}</b>
            </span>
            <span className={s.fact} title="Elixir to cycle the four cheapest cards">
              <CycleIcon size={16} />
              <span className={s.factK}>4-card cycle</span>
              <b>{cards.length >= 4 ? sum.cycle : '—'}</b>
            </span>
            {sum.winCon && (
              <span className={s.fact}>
                <span>Win con</span>
                <b>{sum.winCon.name}</b>
              </span>
            )}
          </div>

          <div className={s.towers} role="radiogroup" aria-label="Tower troop">
            <span className="label-sm">Tower troop</span>
            {TOWER_TROOPS.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={tower === t.id} className={s.tower} data-on={tower === t.id} onClick={() => setTower(t.id)} title={t.name}>
                <CardTile slug={t.slug} label={t.name} rarity="tower" level={col?.towers[t.id] ?? null} owned={!col || col.towers[t.id] != null} size="fluid" />
              </button>
            ))}
            <span className={s.towerName}>{towerInfo?.name}</span>
          </div>

          {locked.length > 0 && current?.data && (
            <span className={s.warn}>
              Not in {current.data.name}&apos;s collection (or form not unlocked): {locked.join(', ')}.
            </span>
          )}

          <div className={s.actions}>
            <button type="button" className="btn btn-primary btn-sm" disabled={!full} onClick={() => copy('deck')} title={full ? 'Copies the official link that opens this deck in Clash Royale' : 'Add 8 cards first'}>
              {copied === 'deck' ? '✓ Link copied' : 'Copy deck link'}
            </button>
            {full ? (
              <a href={deckLink(cards.map((c) => c.id))} className="btn btn-secondary btn-sm">
                Open in game ↗
              </a>
            ) : (
              <span className="btn btn-secondary btn-sm" aria-disabled style={{ opacity: 0.45, cursor: 'default' }}>
                Open in game ↗
              </span>
            )}
            <button type="button" className="btn btn-secondary btn-sm" disabled={!cards.length} onClick={() => copy('share')}>
              {copied === 'share' ? '✓ Copied' : 'Share builder link'}
            </button>
          </div>
          {championCount(slots) > 1 && <span className={s.warn}>A deck can hold only one Champion.</span>}
        </section>

        <section className={s.picker} aria-label="Cards">
          <div className={s.player}>
            {current?.data ? (
              <span className={s.playerName}>
                <span className="label-sm">Collection</span>
                <b>{current.data.name}</b>
                <span className={s.tag}>#{current.data.tag}</span>
              </span>
            ) : loading ? (
              <span className={s.hint}>Loading #{tag}&apos;s collection…</span>
            ) : current?.error ? (
              <span className={s.warn}>{current.error}</span>
            ) : (
              <span className={s.hint}>Load a player to filter by their card levels.</span>
            )}
            <form
              className={s.tagForm}
              onSubmit={(e) => {
                e.preventDefault();
                const c = checkTag(tagInput);
                if (c.kind === 'valid') {
                  setChosen(c.tag);
                  setLoaded(null);
                  setTagInput('');
                }
              }}
            >
              <label className="field" style={{ width: 150 }}>
                <span aria-hidden style={{ color: 'var(--text-3)' }}>
                  #
                </span>
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Player tag" aria-label="Player tag" autoCapitalize="characters" spellCheck={false} />
              </label>
              <button type="submit" className="btn btn-secondary btn-sm" disabled={checkTag(tagInput).kind !== 'valid'}>
                Load
              </button>
              {tag && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setChosen('')}>
                  Remove player
                </button>
              )}
              {!tag && pins.player && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setChosen(null)}>
                  Use pinned
                </button>
              )}
            </form>
          </div>

          <div className={s.filters}>
            <label className="field" style={{ flex: '1 1 180px' }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cards" aria-label="Search cards" />
              {q && (
                <button type="button" className={s.fieldX} onClick={() => setQ('')} aria-label="Clear search">
                  ✕
                </button>
              )}
            </label>
            <div className={s.chips} role="group" aria-label="Rarity">
              {RARITIES.map(([r, l]) => (
                <Chip key={r} on={rarity === r} onClick={() => setRarity(rarity === r ? null : r)}>
                  {l}
                </Chip>
              ))}
            </div>
            <div className={s.chips} role="group" aria-label="Elixir">
              <ElixirIcon size={14} />
              {ELIXIR.map((e) => (
                <Chip key={e} on={elixir === e} onClick={() => setElixir(elixir === e ? null : e)}>
                  {e}
                </Chip>
              ))}
            </div>
            <div className={s.chips} role="group" aria-label="Evolution and hero">
              <Chip on={special === 'evo'} onClick={() => setSpecial(special === 'evo' ? null : 'evo')} title="Show evolutions; a pick goes in an evo slot">
                Evo
              </Chip>
              <Chip on={special === 'hero'} onClick={() => setSpecial(special === 'hero' ? null : 'hero')} title="Show heroes; a pick goes in a hero slot">
                Hero
              </Chip>
            </div>
            <div className={s.chips} role="group" aria-label="Collection filters">
              <Chip on={ownedOnly} disabled={!col} onClick={() => setOwnedOnly(!ownedOnly)} title={col ? undefined : 'Load a player first'}>
                Owned only
              </Chip>
              <label className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Level
                <select className={s.select} data-on={minLevel != null} value={minLevel ?? ''} disabled={!col} onChange={(e) => setMinLevel(e.target.value ? Number(e.target.value) : null)} title={col ? undefined : 'Load a player first'}>
                  <option value="">Any</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l === 16 ? '16 (max)' : `${l}+`}
                    </option>
                  ))}
                </select>
              </label>
              {minLevel != null && (
                <button type="button" className={s.fieldX} onClick={() => setMinLevel(null)} aria-label="Clear level filter">
                  ✕
                </button>
              )}
            </div>
            <span className={s.count}>
              {list.length} cards
              {filtered && (
                <button type="button" className={s.clearFilters} onClick={clearFilters}>
                  <span aria-hidden>✕</span> Clear filters
                </button>
              )}
            </span>
          </div>

          {list.length ? (
            <div className={s.grid}>
              {list.map((c) => {
                const own = col?.cards[c.id];
                const form = special === 'evo' ? ' evolution' : special === 'hero' ? ' hero' : '';
                return (
                  <button key={c.id} type="button" className={s.pick} onClick={() => pick(c.id)} aria-label={`Add ${c.name}${form}, ${c.elixir ?? '?'} elixir`} title={`${c.name}${form}`}>
                    <CardTile slug={c.slug} label={c.name} rarity={c.rarity} evo={special === 'evo'} hero={special === 'hero'} level={own?.level ?? null} owned={!col || !!own} size="fluid" />
                    <span className={s.elixir}>{c.elixir ?? '?'}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState text={filtered ? 'No cards match these filters.' : 'Every card is in the deck.'} />
          )}
        </section>
      </div>

      <section className={s.analysis} aria-label="Meta and counters">
        <ModeFilter
          value={mode}
          onChange={setMode}
          modes={meta.order.map((k) => ({ key: k, label: meta.modes[k].label, kind: meta.modes[k].kind, count: meta.modes[k].decks.length }))}
        />
        <span className={s.method}>
          {m.label} · last {m.windowHours}h · {fmt(m.battles)} battles from {fmt(meta.players)} top players. Every rate below is wins / games in that sample, with its game count.
        </span>

        <Meta report={report} cards={cards.length} mode={mode} onLoad={load} />
        <Counters report={counters} cards={cards.length} modes={labels} home={home} onLoad={load} />
      </section>
    </main>
  );
}

type Report = ReturnType<typeof counterReport>;

function Meta({ report, cards, mode, onLoad }: { report: Report; cards: number; mode: string; onLoad: (d: DeckStat) => void }) {
  const { exact, close, tough } = report;
  const variants = close.filter((c) => !c.exact).slice(0, 6);
  return (
    <div className={s.block}>
      <h2 className={s.h2}>Your deck in the meta</h2>
      {cards < CLOSE_SHARED ? (
        <EmptyState text={`Add at least ${CLOSE_SHARED} cards to look your deck up in the sample.`} />
      ) : (
        <>
          {exact ? (
            <p className={s.lead}>
              This exact deck (same evo and hero slots) was played <b>{fmt(exact.games)}</b> times and won <b>{pct(exact.wins, exact.games)}</b> ({fmt(exact.wins)} wins).{' '}
              <Link href={deckHref(exact.key, mode)}>Deck stats ▸</Link>
            </p>
          ) : (
            <p className={s.lead}>
              {cards === DECK_SIZE ? 'This exact deck wasn’t played 2+ times in this mode.' : `Your deck has ${cards} of ${DECK_SIZE} cards.`}
              {variants.length ? ` Decks sharing ${CLOSE_SHARED}+ of its cards:` : ` No deck sharing ${CLOSE_SHARED}+ of its cards was either.`}
            </p>
          )}
          {variants.length > 0 && (
            <DeckGrid min={300}>
              {variants.map(({ deck, shared }) => (
                <div key={deck.key} className={s.cell}>
                  <DeckBlock {...metaDeck(deck)} href={deckHref(deck.key, mode)} action={<LoadButton onClick={() => onLoad(deck)} />} />
                  <span className={s.note}>{shared === DECK_SIZE ? 'Same cards, different evo / hero slots' : `${shared}/${DECK_SIZE} cards in common`}</span>
                </div>
              ))}
            </DeckGrid>
          )}
          {tough.length > 0 && (
            <div className={s.tough}>
              <h3 className={s.h3}>Toughest matchups for decks like yours</h3>
              <ul className={s.toughList}>
                {tough.slice(0, 6).map((t) => {
                  const info = cardBySlug(t.vsSlug);
                  return (
                    <li key={t.vsSlug} className={s.toughRow}>
                      {info && <CardTile slug={info.slug} label={info.name} rarity={info.rarity} size="S" />}
                      <span className={s.toughName}>vs {t.vs}</span>
                      <span className={s.toughRate}>
                        <b>{pct(t.wins, t.games)}</b> win · {fmt(t.wins)} of {fmt(t.games)} games
                        {t.decks > 1 ? ` · ${t.decks} decks` : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Counters({ report, cards, modes, home, onLoad }: { report: Report; cards: number; modes: string[]; home: Map<string, { mode: string }>; onLoad: (d: DeckStat) => void }) {
  const { winCon, suggestions } = report;
  return (
    <div className={s.block}>
      <h2 className={s.h2}>Hard counters{winCon ? ` to ${winCon.name} decks` : ''}</h2>
      {!cards ? (
        <EmptyState text="Add cards to see which decks beat yours." />
      ) : !winCon ? (
        <EmptyState text="Counters are found against your deck's win condition (Hog Rider, Golem, X-Bow …). Add one to see the decks that beat it." />
      ) : suggestions.length ? (
        <>
          <span className={s.method}>
            Decks to play against {winCon.name}, from {modes.join(', ')} combined. Strongest evidence first: a deck&apos;s own winning record against {winCon.name} decks ({MIN_MATCHUP_GAMES}+ games), then the win conditions that beat it
            across every deck that has them, then strong decks built around cards that stop {winCon.name}. Load one to make it yours.
          </span>
          <DeckGrid min={300}>
            {suggestions.map((x) => (
              <div key={x.deck.key} className={s.cell}>
                <DeckBlock {...metaDeck(x.deck)} use={null} games={null} win={null} href={deckHref(x.deck.key, home.get(x.deck.key)?.mode ?? 'pol')} action={<LoadButton onClick={() => onLoad(x.deck)} />} />
                <Why x={x} vs={winCon.name} />
              </div>
            ))}
          </DeckGrid>
        </>
      ) : (
        <EmptyState text={`Nothing in today's sample beats ${winCon.name} decks yet, and no deck carries the usual answers to it. Check back after the next meta refresh.`} />
      )}
    </div>
  );
}

/** Why a deck is suggested: its own record, its win condition's, or the counter cards it holds. */
function Why({ x, vs }: { x: Suggestion; vs: string }) {
  const wc = x.deck.winCon ? cardBySlug(x.deck.winCon)?.name : null;
  const tag = x.basis === 'deck' ? 'Proven' : x.basis === 'winCon' ? 'Win condition' : 'Counter cards';
  return (
    <>
      <span className={s.vs}>
        <span className={s.basis} data-basis={x.basis}>
          {tag}
        </span>{' '}
        {x.vs ? (
          <>
            <b>{pct(x.vs.wins, x.vs.games)}</b> win vs {vs} · {fmt(x.vs.wins)} of {fmt(x.vs.games)} games
            {x.basis === 'winCon' && wc ? ` by ${wc} decks (${x.decks})` : ''}
          </>
        ) : (
          <>
            {x.counterCards.join(', ')} {x.counterCards.length === 1 ? 'stops' : 'stop'} {vs}
          </>
        )}
      </span>
      <span className={s.note}>
        Overall {pct(x.deck.wins, x.deck.games)} in {fmt(x.deck.games)} games
        {x.vs && x.counterCards.length ? ` · answers ${vs} with ${x.counterCards.join(', ')}` : ''}
      </span>
    </>
  );
}

/** A filter chip; when on, it shows an ✕ to say a second tap turns it off. */
function Chip({ on, children, ...rest }: { on: boolean; children: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>) {
  return (
    <button type="button" className={`chip ${s.chip}`} aria-pressed={on} {...rest}>
      {children}
      {on && (
        <span className={s.chipX} aria-hidden>
          ✕
        </span>
      )}
    </button>
  );
}

function LoadButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={`chip ${s.load}`} onClick={onClick} title="Load this deck into the builder">
      Load
    </button>
  );
}

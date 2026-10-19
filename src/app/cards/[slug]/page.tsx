import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { DeckBlock, DeckGrid, metaDeck } from '@/components/DeckBlock';
import { deckHref } from '@/lib/decks';
import { ElixirIcon } from '@/components/ui/icons';
import { CARDS, TOWER_TROOPS, cardBySlug } from '@/lib/cards';
import { getMeta } from '@/lib/meta';
import { CardsHeader } from '../CardsHeader';
import { CardArt } from './CardArt';

export function generateStaticParams() {
  return [...CARDS, ...TOWER_TROOPS].map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<'/cards/[slug]'>): Promise<Metadata> {
  const c = cardBySlug((await params).slug);
  return c ? { title: c.name, description: `${c.name}: ${c.rarity} ${c.type.toLowerCase()} with live usage and win rates.` } : { title: 'Card' };
}

const pct = (n: number) => n.toFixed(1);

async function MetaPanel({ slug, isTower }: { slug: string; isTower: boolean }) {
  const meta = await getMeta();
  if (!meta) return <p className="body">Meta stats are unavailable right now.</p>;
  const modes = meta.order.map((m) => ({ mode: m, label: meta.modes[m].label, s: meta.modes[m].cards.find((c) => c.slug === slug), sides: meta.modes[m].sides })).filter((m) => m.sides > 0);
  const pol = meta.modes.pol.cards.find((c) => c.slug === slug);
  const decks = meta.modes.pol.decks.filter((d) => d.cards.some((c) => c.slug === slug) || d.tower?.slug === slug).slice(0, 3);
  const maxUse = Math.max(1, ...modes.map((m) => m.s?.use ?? 0));
  const special = pol ? pol.evoGames + pol.heroGames : 0;
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span className="label" style={{ letterSpacing: '.14em' }}>
          Meta · last {meta.windowHours}h · usage and win % per mode
        </span>
        {isTower ? (
          <p className="body" style={{ fontSize: 14 }}>
            Tower troops are tracked per deck; see the decks below.
          </p>
        ) : (
          modes.map(({ mode, label, s }) => (
            <div key={mode} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 54px 60px', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--hair)' }}>
              <span style={{ font: '500 13px/1.2 var(--sans)' }}>{label}</span>
              <span style={{ height: 4, borderRadius: 2, background: 'var(--well)' }}>
                <span style={{ display: 'block', height: '100%', width: `${((s?.use ?? 0) / maxUse) * 100}%`, background: 'var(--text-1)' }} />
              </span>
              <span style={{ textAlign: 'right', font: '600 12px/1 var(--mono)' }}>{s ? `${pct(s.use)}%` : '—'}</span>
              <span
                style={{
                  textAlign: 'right',
                  font: '700 12px/1 var(--mono)',
                  color: !s || s.games < 10 ? 'var(--text-3)' : s.win >= 53 ? 'var(--blue-hi)' : s.win < 48 ? 'var(--ember)' : 'var(--text-1)',
                }}
                title={s ? `Based on ${s.games} games` : undefined}
              >
                {s && s.games >= 10 ? `${pct(s.win)}%` : '—'}
              </span>
            </div>
          ))
        )}
      </div>
      {pol && special >= 10 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding: 16, border: '1px solid rgba(var(--evo-rgb), .5)', borderRadius: 6, boxShadow: '0 0 18px rgba(var(--evo-rgb), .15)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ font: '500 9px/1 var(--mono)', letterSpacing: '.14em', color: pol.evoGames >= pol.heroGames ? 'var(--evo-hi)' : 'var(--gold)' }}>
              ◆ {pol.evoGames >= pol.heroGames ? 'EVOLVED' : 'HERO'}
            </span>
            <span style={{ font: '800 26px/1 var(--mono)' }}>{pct(((pol.evoWins + pol.heroWins) / special) * 100)}%</span>
            <span style={{ font: '500 10px/1 var(--mono)', color: 'var(--text-3)' }}>{Math.round((special / pol.games) * 100)}% OF PLAYS</span>
          </div>
          <div style={{ padding: 16, border: '1px solid var(--hair)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="label-sm">NORMAL</span>
            <span style={{ font: '800 26px/1 var(--mono)' }}>{pol.games - special > 0 ? `${pct(((pol.wins - pol.evoWins - pol.heroWins) / (pol.games - special)) * 100)}%` : '—'}</span>
            <span style={{ font: '500 10px/1 var(--mono)', color: 'var(--text-3)' }}>{Math.round(((pol.games - special) / pol.games) * 100)}% OF PLAYS</span>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="label" style={{ letterSpacing: '.14em' }}>
          Top Path of Legends decks with this card
        </span>
        {decks.length ? (
          <DeckGrid min={300}>
            {decks.map((d, i) => (
              <DeckBlock key={d.key} {...metaDeck(d)} rank={i + 1} href={deckHref(d.key)} />
            ))}
          </DeckGrid>
        ) : (
          <p className="body" style={{ fontSize: 14 }}>
            Not in any top deck right now.
          </p>
        )}
      </div>
    </>
  );
}

export default async function CardPage({ params }: PageProps<'/cards/[slug]'>) {
  const c = cardBySlug((await params).slug);
  if (!c) notFound();
  const isTower = c.rarity === 'tower';
  const facts: [string, string, string?][] = [
    ['ELIXIR', c.elixir != null ? String(c.elixir) : '—'],
    ['RARITY', c.rarity[0].toUpperCase() + c.rarity.slice(1)],
    ['TYPE', c.type],
    ['MAX LEVEL', '16'],
    ['EVOLUTION', c.hasEvolution ? 'YES' : '—', c.hasEvolution ? 'var(--evo-hi)' : undefined],
    ['HERO', c.hasHero ? 'YES' : '—', c.hasHero ? 'var(--gold)' : undefined],
  ];
  return (
    <>
      <CardsHeader title="CARDS" line={`Card encyclopedia · ${c.name}`} />
      <main className="page" style={{ paddingTop: 28, gap: 32 }}>
        <Link href="/cards" className="link-mono" style={{ alignSelf: 'flex-start' }}>
          ← All cards
        </Link>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 32, alignItems: 'start' }}>
          <div className="panel" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ position: 'absolute', inset: 12, border: '1px solid var(--hair)', borderRadius: 4, pointerEvents: 'none' }} />
            <CardArt c={c} />
            <div className="cells" style={{ gridTemplateColumns: 'repeat(3,1fr)', borderRadius: 6 }}>
              {facts.map(([k, v, fg]) => (
                <div key={k} style={{ padding: '12px 14px', background: 'var(--obsidian)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="label-sm">{k}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '700 15px/1.1 var(--mono)', color: fg ?? 'var(--text-1)', overflowWrap: 'anywhere' }}>
                    {k === 'ELIXIR' && c.elixir != null && <ElixirIcon size={15} />}
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="label">
                {c.rarity} · {c.type}
              </span>
              <h2 style={{ margin: 0, font: '800 clamp(36px,5vw,72px)/.9 var(--mono)', letterSpacing: '-.055em' }}>{c.name.toUpperCase()}</h2>
            </div>
            <Suspense fallback={<span className="skeleton" style={{ height: 200 }} />}>
              <MetaPanel slug={c.slug} isTower={isTower} />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}

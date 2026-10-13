import Link from 'next/link';
import { Suspense } from 'react';
import { DeckRow } from '@/components/DeckRow';
import { Draw, Reveal } from '@/components/fx/Reveal';
import { Fog } from '@/components/fx/Fog';
import { LeagueIcon } from '@/components/ui/primitives';
import { NEWS } from '@/content/news';
import { getPolLeaderboard } from '@/lib/cr/api';
import { dstr, fmt } from '@/lib/format';
import { getMeta } from '@/lib/meta';
import { HomeHero } from './HomeHero';
import { Pinned } from './Pinned';
import s from './home.module.css';

const ROMAN = ['I', 'II', 'III'];

async function Hero() {
  const meta = await getMeta();
  const sync = meta ? new Date(meta.generatedAt).toISOString().slice(11, 16) + ' UTC' : null;
  return <HomeHero metaSync={sync} />;
}

async function TopDecks() {
  const meta = await getMeta();
  const decks = meta?.modes.pol.decks.slice(0, 4) ?? [];
  if (!decks.length)
    return (
      <p className="body" style={{ padding: '24px 0' }}>
        The meta snapshot is still being built. Check back in a few minutes.
      </p>
    );
  return (
    <div>
      {decks.map((d, i) => (
        <DeckRow key={d.key} deck={d} rank={i + 1} href={`/decks?deck=${encodeURIComponent(d.key)}`} />
      ))}
      <p className="label-sm" style={{ marginTop: 14, lineHeight: 1.6 }}>
        From {fmt(meta?.battles)} battles of the global top {meta?.players} in the last {meta?.windowHours}h
      </p>
    </div>
  );
}

async function PolTop() {
  const r = await getPolLeaderboard('global', 5);
  if (!r.ok) return <p className="body">Leaderboard unavailable right now.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {r.data.items.map((p, i) => (
        <Link key={p.tag} href={`/player/${p.tag.replace('#', '')}`} className={s.polRow}>
          <span
            style={{
              font: '800 26px/1 var(--mono)',
              letterSpacing: '-.04em',
              color: i === 0 ? 'var(--gold)' : i < 3 ? 'var(--text-1)' : 'var(--text-3)',
              textShadow: i === 0 ? '0 0 16px rgba(230,179,74,.45)' : 'none',
            }}
          >
            {ROMAN[i] ?? String(i + 1).padStart(2, '0')}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
            <span style={{ font: '600 17px/1.1 var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            <span className="label-sm" style={{ letterSpacing: '.1em' }}>
              {p.clan?.name ?? 'No clan'}
            </span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* The ranked leaderboard only lists the top league (league 7 in the live API). */}
            <LeagueIcon league={7} size={26} />
            <span style={{ font: '700 18px/1 var(--mono)', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.eloRating)}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

function DecksFallback() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '20px 0' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="skeleton" style={{ height: 100 }} />
      ))}
    </div>
  );
}

export default function Home() {
  const news = NEWS.slice(0, 3);
  return (
    <>
      <Suspense fallback={<HomeHero metaSync={null} />}>
        <Hero />
      </Suspense>

      <main className={s.main}>
        <Pinned />

        <section className={s.section} style={{ gap: 24 }}>
          <div className={s.sectionHead}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span className="label">02 · Path of Legends meta · last 24h</span>
              <Reveal as="h2" className="display-l" style={{ fontSize: 'clamp(36px,5.4vw,80px)', lineHeight: 0.9, letterSpacing: '-.055em' }}>
                TOP DECKS
                <br />
                RIGHT NOW
              </Reveal>
            </div>
            <Link href="/decks" className="link-mono">
              All decks →
            </Link>
          </div>
          <Draw />
          <Suspense fallback={<DecksFallback />}>
            <TopDecks />
          </Suspense>
        </section>

        <section className={s.split}>
          <div className={s.section}>
            <span className="label">03 · Path of Legends · global top 5</span>
            <Suspense fallback={<span className="skeleton" style={{ height: 300 }} />}>
              <PolTop />
            </Suspense>
          </div>
          <div className={s.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="label">04 · Latest news</span>
              <Link href="/news" className="link-mono" style={{ fontSize: 10 }}>
                All news →
              </Link>
            </div>
            {news.map((n) => (
              <Link key={n.slug} href={`/news/${n.slug}`} className={s.newsRow}>
                <div className={s.newsThumb} style={{ backgroundImage: `url(${n.scene})` }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ display: 'flex', gap: 10, font: '500 9px/1 var(--mono)', letterSpacing: '.14em' }}>
                    <span style={{ color: n.tag === 'GUIDE' ? 'var(--blue-hi)' : 'var(--text-2)' }}>{n.tag}</span>
                    <span style={{ color: 'var(--text-3)' }}>{dstr(new Date(n.date)).toUpperCase()}</span>
                  </span>
                  <span style={{ font: '600 17px/1.25 var(--sans)', textWrap: 'pretty' }}>{n.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={s.cta}>
          <div className={s.ctaScene} />
          <Fog density={0.7} />
          <div className={s.ctaShade} />
          <div style={{ position: 'absolute', inset: 14, border: '1px solid rgba(255,255,255,.5)', borderRadius: 4, pointerEvents: 'none' }} />
          <div className={s.ctaCopy}>
            <span className="label" style={{ color: '#8CCBFF' }}>
              05 · For leaders and co-leaders
            </span>
            <Reveal as="h2" className="display-l" style={{ fontSize: 'clamp(38px,6vw,96px)' }}>
              MANAGE
              <br />
              YOUR CLAN
            </Reveal>
            <p className="body" style={{ maxWidth: 480, color: '#A4A9B4' }}>
              Activity, war decks, donations and an Asset Score for every member. Spot promotion candidates and who has gone quiet.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/my-clan" data-magnet="" className="btn btn-primary" style={{ height: 48, padding: '0 22px', background: '#F3F4F6', color: '#07080A' }}>
                Open dashboard
              </Link>
              <Link href="/clans" className="btn btn-scene" style={{ height: 48, padding: '0 18px' }}>
                Find a clan →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

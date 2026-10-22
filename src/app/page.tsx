import { HoverLink } from '@/components/ui/HoverLink';
import { Suspense } from 'react';
import { metaDeck } from '@/components/DeckBlock';
import { Draw, Reveal } from '@/components/fx/Reveal';
import { EmberField } from '@/components/fx/EmberField';
import { Fog } from '@/components/fx/Fog';
import { LeagueIcon, PolRating } from '@/components/ui/primitives';
import { NEWS } from '@/content/news';
import { FEATURES } from '@/lib/features';
import { getPolLeaderboard } from '@/lib/cr/api';
import { dstr } from '@/lib/format';
import { art } from '@/lib/art';
import { getMeta } from '@/lib/meta';
import { HomeDecks, type HomeMode } from './HomeDecks';
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
  if (!meta?.modes.pol?.decks.length)
    return (
      <p className="body" style={{ padding: '24px 0' }}>
        The meta snapshot is still being built. Check back in a few minutes.
      </p>
    );
  const modes: HomeMode[] = meta.order.map((k) => {
    const m = meta.modes[k];
    return {
      key: k,
      label: m.label,
      kind: m.kind,
      count: m.decks.length,
      windowHours: m.windowHours,
      battles: m.battles,
      decks: m.decks.slice(0, 6).map((d) => ({ key: d.key, ...metaDeck(d) })),
    };
  });
  return <HomeDecks modes={modes} players={meta.players} />;
}

async function PolTop() {
  const r = await getPolLeaderboard('global', 5);
  if (!r.ok) return <p className="body">Leaderboard unavailable right now.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {r.data.items.map((p, i) => (
        <HoverLink key={p.tag} href={`/player/${p.tag.replace('#', '')}`} className={s.polRow}>
          <span
            style={{
              font: '800 26px/1 var(--mono)',
              letterSpacing: '-.04em',
              color: i === 0 ? 'var(--gold)' : i < 3 ? 'var(--text-1)' : 'var(--text-3)',
              textShadow: i === 0 ? '0 0 16px rgba(var(--gold-rgb), .45)' : 'none',
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
            <LeagueIcon league={7} size={28} />
            <PolRating rating={p.eloRating} size={20} style={{ font: '700 18px/1 var(--mono)' }} />
          </span>
        </HoverLink>
      ))}
    </div>
  );
}

function DecksFallback() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))', gap: 16 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="skeleton" style={{ height: 260 }} />
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

        <section className={s.section} style={{ gap: 16 }}>
          <div className={s.sectionHead}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="label">02 · Meta decks · pick a game mode</span>
              <h2 className="display-m" style={{ fontSize: 'clamp(26px,3.2vw,44px)' }}>
                Top decks right now
              </h2>
            </div>
            <HoverLink href="/decks" className="link-mono">
              All decks →
            </HoverLink>
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
          {FEATURES.news && (
            <div className={s.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="label">04 · Latest news</span>
                <HoverLink href="/news" className="link-mono" style={{ fontSize: 10 }}>
                  All news →
                </HoverLink>
              </div>
              {news.map((n) => (
                <HoverLink key={n.slug} href={`/news/${n.slug}`} className={s.newsRow}>
                  <div className={s.newsThumb} style={{ backgroundImage: art(n.scene) }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ display: 'flex', gap: 10, font: '500 9px/1 var(--mono)', letterSpacing: '.14em' }}>
                      <span style={{ color: n.tag === 'GUIDE' ? 'var(--blue-hi)' : 'var(--text-2)' }}>{n.tag}</span>
                      <span style={{ color: 'var(--text-3)' }}>{dstr(new Date(n.date)).toUpperCase()}</span>
                    </span>
                    <span style={{ font: '600 17px/1.25 var(--sans)', textWrap: 'pretty' }}>{n.title}</span>
                  </div>
                </HoverLink>
              ))}
            </div>
          )}
        </section>

        <section className={s.cta}>
          <div className={s.ctaScene} />
          <Fog density={0.7} />
          <EmberField count={220} gold={0.55} />
          <div className={s.ctaShade} />
          <div style={{ position: 'absolute', inset: 14, border: '1px solid rgba(var(--ink-rgb), .5)', borderRadius: 4, pointerEvents: 'none' }} />
          <div className={s.ctaCopy}>
            <span className="label" style={{ color: 'var(--blue-hi)' }}>
              {FEATURES.news ? '05' : '04'} · For leaders and co-leaders
            </span>
            <Reveal as="h2" className="display-l" style={{ fontSize: 'clamp(38px,6vw,96px)' }}>
              MANAGE
              <br />
              YOUR CLAN
            </Reveal>
            <p className="body" style={{ maxWidth: 480, color: 'var(--text-2)' }}>
              Activity, war decks, donations and an Asset Score for every member. Spot promotion candidates and who has gone quiet.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <HoverLink href="/my-clan" data-magnet="" className="btn btn-primary" style={{ height: 48, padding: '0 22px', background: 'var(--text-1)', color: 'var(--void)' }}>
                Open dashboard
              </HoverLink>
              <HoverLink href="/clans" className="btn btn-scene" style={{ height: 48, padding: '0 18px' }}>
                Find a clan →
              </HoverLink>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

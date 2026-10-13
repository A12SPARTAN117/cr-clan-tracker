import Link from 'next/link';
import { Fog } from './fx/Fog';
import { Reveal } from './fx/Reveal';

type Variant = 'route' | 'player' | 'clan' | 'error';

const COPY: Record<Variant, { kicker: (t?: string) => string; big: string; headline: string; body: (t?: string) => string; bad: boolean }> = {
  route: {
    kicker: () => '● ROUTE LOST',
    big: '404',
    headline: 'NOTHING STANDS HERE',
    body: () => 'This page fell with the pillar. Search a tag or head back to the arena.',
    bad: false,
  },
  player: {
    kicker: (t) => `● LOOKUP FAILED${t ? ` · #${t}` : ''}`,
    big: '?',
    headline: 'PLAYER NOT FOUND',
    body: (t) =>
      `No player or clan has the tag${t ? ` #${t}` : ''}. Tags only use 0 2 8 9 P Y L Q G R J C U V, so an O is usually a 0.`,
    bad: true,
  },
  clan: {
    kicker: (t) => `● LOOKUP FAILED${t ? ` · #${t}` : ''}`,
    big: '?',
    headline: 'CLAN NOT FOUND',
    body: (t) => `No clan has the tag${t ? ` #${t}` : ''}. Tags only use 0 2 8 9 P Y L Q G R J C U V, so an O is usually a 0.`,
    bad: true,
  },
  error: {
    kicker: () => '● NO ANSWER FROM THE ARENA',
    big: '···',
    headline: 'DATA UNAVAILABLE',
    body: () => 'The Clash Royale API did not answer. It may be in maintenance. Try again in a minute.',
    bad: true,
  },
};

/** Full-height "Route Lost" scene: ruined arena, a lone Skeleton in the fog, carved 404. */
export function LostScene({ variant = 'route', tag }: { variant?: Variant; tag?: string }) {
  const c = COPY[variant];
  return (
    <section
      style={{
        position: 'relative',
        height: 'calc(100vh - 64px)',
        minHeight: 560,
        overflow: 'hidden',
        background: '#07080A',
        color: '#F3F4F6',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'url(/scenes/arena.jpg) center/cover', filter: 'grayscale(1) brightness(.5)' }} />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '6%',
          width: 'min(22vw,200px)',
          height: '38%',
          transform: 'translateX(-50%)',
          background: 'url(/characters/skeletons.png) bottom center/contain no-repeat',
          filter: 'grayscale(1) brightness(.8) drop-shadow(-2px 0 0 rgba(140,203,255,.75)) drop-shadow(0 0 26px rgba(58,160,255,.45))',
        }}
      />
      <Fog density={1.4} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(to bottom,rgba(7,8,10,.4),rgba(7,8,10,0) 30%,rgba(7,8,10,.3) 70%,#07080A),radial-gradient(ellipse at center,rgba(7,8,10,0) 40%,rgba(7,8,10,.8) 100%)',
        }}
      />
      <div style={{ position: 'absolute', inset: 14, border: '1px solid rgba(255,255,255,.55)', borderRadius: 4, pointerEvents: 'none' }} />
      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          padding: '0 24px 18vh',
          textAlign: 'center',
        }}
      >
        <span style={{ font: '500 10px/1.4 var(--mono)', letterSpacing: '.16em', color: c.bad ? '#FF5464' : '#A4A9B4' }}>{c.kicker(tag)}</span>
        <Reveal
          as="h1"
          style={{
            margin: 0,
            font: '800 clamp(110px,24vw,340px)/.8 var(--mono)',
            letterSpacing: '-.08em',
            color: 'transparent',
            background: 'linear-gradient(180deg,#C9CCD2,#5A5E66)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 30px rgba(58,160,255,.25))',
          }}
        >
          {c.big}
        </Reveal>
        <h2 style={{ margin: 0, font: '700 clamp(22px,3vw,36px)/1.1 var(--mono)', letterSpacing: '-.03em' }}>{c.headline}</h2>
        <p style={{ margin: 0, maxWidth: 440, font: '400 16px/1.55 var(--sans)', color: '#A4A9B4', textWrap: 'pretty' }}>{c.body(tag)}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/" data-magnet="" className="btn" style={{ height: 46, background: '#F3F4F6', color: '#07080A' }}>
            Back to the arena
          </Link>
          <Link href="/clans" className="btn btn-scene" style={{ height: 46 }}>
            Search clans →
          </Link>
        </div>
      </div>
    </section>
  );
}

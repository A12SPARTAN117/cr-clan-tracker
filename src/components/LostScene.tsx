import { HoverLink } from '@/components/ui/HoverLink';
import type { ReactNode } from 'react';
import { Fog } from './fx/Fog';
import { Reveal } from './fx/Reveal';

type Variant = 'route' | 'player' | 'clan' | 'error' | 'crash';

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
  crash: {
    kicker: () => '● SERVER OVERLOADED',
    big: '500',
    headline: 'THE ARENA IS DOWN',
    body: () => 'Something went wrong on our side while loading this page. Nothing is lost: give it a minute and try again.',
    bad: true,
  },
};

/**
 * Full-height "Route Lost" scene: ruined arena, a lone Skeleton in the fog, carved 404.
 * `retry` swaps the primary button for "Try again"; `children` go under the buttons.
 */
export function LostScene({ variant = 'route', tag, retry, children }: { variant?: Variant; tag?: string; retry?: () => void; children?: ReactNode }) {
  const c = COPY[variant];
  return (
    <section
      style={{
        position: 'relative',
        display: 'flex',
        minHeight: 'max(560px, calc(100vh - 64px))',
        overflow: 'hidden',
        background: 'var(--void)',
        color: 'var(--text-1)',
      }}
    >
      <div data-art="" style={{ position: 'absolute', inset: 0, background: 'var(--art-arena) center/cover', filter: 'grayscale(1) brightness(.5)' }} />
      <div
        aria-hidden
        data-figure=""
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '6%',
          width: 'min(22vw,200px)',
          height: '38%',
          transform: 'translateX(-50%)',
          background: 'url(/characters/skeletons.webp) bottom center/contain no-repeat',
          filter: 'grayscale(1) brightness(.8) drop-shadow(-2px 0 0 rgba(var(--glow-hi-rgb), .75)) drop-shadow(0 0 26px rgba(var(--glow-rgb), .45))',
        }}
      />
      <Fog density={1.4} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(to bottom,rgba(var(--void-rgb), .4),rgba(var(--void-rgb), 0) 30%,rgba(var(--void-rgb), .3) 70%,var(--void)),radial-gradient(ellipse at center,rgba(var(--void-rgb), 0) 40%,rgba(var(--void-rgb), .8) 100%)',
        }}
      />
      <div style={{ position: 'absolute', inset: 14, border: '1px solid rgba(var(--ink-rgb), .55)', borderRadius: 4, pointerEvents: 'none' }} />
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          padding: children ? '64px 24px 72px' : '0 24px 18vh',
          textAlign: 'center',
        }}
      >
        <span style={{ font: '500 10px/1.4 var(--mono)', letterSpacing: '.16em', color: c.bad ? 'var(--ember)' : 'var(--text-2)' }}>{c.kicker(tag)}</span>
        <Reveal
          as="h1"
          style={{
            margin: 0,
            font: children ? '800 clamp(96px,16vw,220px)/.8 var(--mono)' : '800 clamp(110px,24vw,340px)/.8 var(--mono)',
            letterSpacing: '-.08em',
            color: 'transparent',
            background: 'linear-gradient(180deg,var(--metal-hi),var(--metal-lo))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 30px rgba(var(--glow-rgb), .25))',
          }}
        >
          {c.big}
        </Reveal>
        <h2 style={{ margin: 0, font: '700 clamp(22px,3vw,36px)/1.1 var(--mono)', letterSpacing: '-.03em' }}>{c.headline}</h2>
        <p style={{ margin: 0, maxWidth: 440, font: '400 16px/1.55 var(--sans)', color: 'var(--text-2)', textWrap: 'pretty' }}>{c.body(tag)}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {retry ? (
            <button type="button" onClick={retry} data-magnet="" className="btn" style={{ height: 46, background: 'var(--text-1)', color: 'var(--void)', border: 0, cursor: 'pointer' }}>
              Try again
            </button>
          ) : (
            <HoverLink href="/" data-magnet="" className="btn" style={{ height: 46, background: 'var(--text-1)', color: 'var(--void)' }}>
              Back to the arena
            </HoverLink>
          )}
          {retry ? (
            <HoverLink href="/" className="btn btn-scene" style={{ height: 46 }}>
              Back to the arena
            </HoverLink>
          ) : (
            <HoverLink href="/clans" className="btn btn-scene" style={{ height: 46 }}>
              Search clans →
            </HoverLink>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

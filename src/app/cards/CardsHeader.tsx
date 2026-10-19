import type { ReactNode } from 'react';
import { Fog } from '@/components/fx/Fog';
import { Reveal } from '@/components/fx/Reveal';

/** Obelisk ring around a slowly turning portal. */
export function CardsHeader({ line, title }: { line: ReactNode; title: string }) {
  return (
    <section style={{ position: 'relative', height: 'clamp(380px,46vh,500px)', overflow: 'hidden', background: 'var(--void)', color: 'var(--text-1)' }}>
      <div data-art="" style={{ position: 'absolute', inset: 0, background: 'var(--art-obelisk) center 30%/cover', filter: 'grayscale(1) brightness(.5)' }} />
      <div
        aria-hidden
        className="oa-portal-ring"
        style={{
          position: 'absolute',
          left: '62%',
          top: '58%',
          width: 'min(40vw,460px)',
          aspectRatio: '1',
          borderRadius: '50%',
          border: '2px solid var(--blue-hi)',
          boxShadow: '0 0 30px rgba(var(--glow-rgb), .7),inset 0 0 40px rgba(var(--glow-rgb), .5)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '62%',
          top: '58%',
          width: 'min(20vw,220px)',
          height: 'min(5vw,60px)',
          borderRadius: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'radial-gradient(closest-side,rgba(var(--glow-hi-rgb), .6),transparent)',
          pointerEvents: 'none',
        }}
      />
      <Fog density={1} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom,rgba(var(--void-rgb), .4),rgba(var(--void-rgb), 0) 35%,rgba(var(--void-rgb), .5) 72%,var(--void))' }} />
      <div style={{ position: 'absolute', inset: 14, border: '1px solid rgba(var(--ink-rgb), .55)', borderRadius: 4, pointerEvents: 'none' }} />
      <div
        style={{
          position: 'relative',
          height: '100%',
          maxWidth: 'var(--max)',
          margin: '0 auto',
          padding: '40px clamp(28px,4vw,64px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 14,
          pointerEvents: 'none',
        }}
      >
        <span style={{ font: '500 10px/1.4 var(--mono)', letterSpacing: '.14em', color: 'var(--text-2)', textTransform: 'uppercase' }}>{line}</span>
        <Reveal as="h1" style={{ margin: 0, font: '800 clamp(46px,8vw,124px)/.86 var(--mono)', letterSpacing: '-.06em' }}>
          {title}
        </Reveal>
      </div>
    </section>
  );
}

'use client';

import { DonateCard } from '@/components/DonateCard';

/**
 * Last-resort error page, shown when the root layout itself fails. It replaces the whole
 * document, so nothing from globals.css or the site fonts is available: inline styles only.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          padding: '56px 20px',
          boxSizing: 'border-box',
          textAlign: 'center',
          color: '#F3F4F6',
          background: 'radial-gradient(ellipse at 50% 30%,rgba(58,160,255,.16),rgba(7,8,10,0) 60%),#07080A',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        }}
      >
        <title>The arena is down · CR Clan Tracker</title>
        <span style={{ fontSize: 10, letterSpacing: '.16em', color: '#FF5464' }}>● SERVER OVERLOADED{error.digest ? ` · ${error.digest}` : ''}</span>
        <h1
          style={{
            margin: 0,
            font: '800 clamp(90px,18vw,200px)/.8 ui-monospace, monospace',
            letterSpacing: '-.08em',
            color: 'transparent',
            background: 'linear-gradient(180deg,#C9CCD2,#5A5E66)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          500
        </h1>
        <h2 style={{ margin: 0, fontSize: 'clamp(22px,3vw,34px)', letterSpacing: '-.03em' }}>THE ARENA IS DOWN</h2>
        <p style={{ margin: 0, maxWidth: 440, font: '400 16px/1.55 system-ui, sans-serif', color: '#A4A9B4' }}>
          Something went wrong on our side. Nothing is lost: give it a minute and try again.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={retry}
            style={{ height: 46, padding: '0 20px', border: 0, borderRadius: 4, background: '#F3F4F6', color: '#07080A', font: '700 12px/1 ui-monospace, monospace', letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Try again
          </button>
          {/* A plain link on purpose: a full reload is the best chance of recovering here. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{ height: 46, display: 'inline-flex', alignItems: 'center', padding: '0 20px', borderRadius: 4, border: '1px solid rgba(255,255,255,.35)', color: '#F3F4F6', font: '700 12px/1 ui-monospace, monospace', letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'none' }}
          >
            Home
          </a>
        </div>
        <DonateCard />
        <p style={{ margin: '12px 0 0', maxWidth: 560, font: '400 11px/1.6 system-ui, sans-serif', color: '#6B7079' }}>
          This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it.
          For more information see{' '}
          <a href="https://www.supercell.com/fan-content-policy" target="_blank" rel="noreferrer" style={{ color: '#8CCBFF' }}>
            Supercell&apos;s Fan Content Policy
          </a>
          .
        </p>
      </body>
    </html>
  );
}

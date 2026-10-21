import { DONATE_LINKS } from '@/lib/donate';

/**
 * "Why is the site down" card with a Donate button per way to give (PayPal, Payfast, Yoco…), for the error pages. Inline styles only,
 * so it also works in global-error, which renders without the site's stylesheet.
 */
export function DonateCard() {
  return (
    <aside
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 520,
        padding: '22px 22px 24px',
        borderRadius: 6,
        border: '1px solid rgba(140,203,255,.28)',
        background: 'linear-gradient(180deg,rgba(18,22,30,.88),rgba(7,8,10,.92))',
        boxShadow: '0 0 0 1px rgba(7,8,10,.6), 0 18px 60px rgba(0,0,0,.5), 0 0 40px rgba(58,160,255,.12)',
        textAlign: 'left',
        color: '#F3F4F6',
        pointerEvents: 'auto',
      }}
    >
      <span style={{ display: 'block', font: '500 10px/1.4 var(--mono, ui-monospace, monospace)', letterSpacing: '.16em', color: '#8CCBFF' }}>
        ● KEEP THE ARENA OPEN
      </span>
      <h3 style={{ margin: '10px 0 8px', font: '700 20px/1.2 var(--mono, ui-monospace, monospace)', letterSpacing: '-.02em' }}>
        We don&apos;t have proper servers yet
      </h3>
      <p style={{ margin: '0 0 10px', font: '400 14px/1.6 var(--sans, system-ui, sans-serif)', color: '#C9CCD2' }}>
        CR Clan Tracker is free and fan-made. Right now it runs on free hosting because we can&apos;t afford real servers yet, so when
        lots of people visit at once or the free limits run out, the site goes down.
      </p>
      <p style={{ margin: 0, font: '400 14px/1.6 var(--sans, system-ui, sans-serif)', color: '#C9CCD2' }}>
        {DONATE_LINKS.length
          ? 'Donations pay for hosting so this stops happening. They are purely donations and do not unlock anything.'
          : 'Your data is safe. Please try again in a few minutes.'}
      </p>
      {DONATE_LINKS.length > 0 && (
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {DONATE_LINKS.map((l, i) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                height: 46,
                padding: '0 20px',
                borderRadius: 4,
                // The first link is the main button; the others are outlined so the card stays calm.
                ...(i === 0
                  ? { background: 'linear-gradient(180deg,#5BB4FF,#2A6FD6)', boxShadow: '0 0 24px rgba(58,160,255,.45), inset 0 1px 0 rgba(255,255,255,.35)', color: '#07080A' }
                  : { border: '1px solid rgba(140,203,255,.45)', color: '#8CCBFF' }),
                font: '700 12px/1 var(--mono, ui-monospace, monospace)',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="currentColor">
                <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z" />
              </svg>
              {DONATE_LINKS.length === 1 ? 'Donate to keep the site running' : l.label}
            </a>
          ))}
        </div>
      )}
    </aside>
  );
}

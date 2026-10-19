import { Portal } from './fx/Portal';

/**
 * Route loading screen (used by the loading.tsx files). Next prefetches it with the link, so a
 * click shows this at once instead of waiting on the server: a header band in the page's own
 * shape, the portal loader, and a few shimmering rows where the content will land.
 */
export function PageLoading({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div aria-busy="true" style={{ minHeight: '80vh' }}>
      <section
        style={{
          position: 'relative',
          minHeight: 'clamp(320px, 44vh, 480px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 18,
          background: 'radial-gradient(ellipse at 50% 40%, rgba(var(--glow-rgb), .08), transparent 60%), var(--void)',
        }}
      >
        <div style={{ position: 'absolute', inset: 14, border: '1px solid rgba(var(--ink-rgb), .25)', borderRadius: 4, pointerEvents: 'none' }} />
        <Portal size={72} label={label} />
        <span className="label">{label}</span>
      </section>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto', padding: '28px var(--gutter)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: rows }, (_, i) => (
          <span key={i} className="skeleton" style={{ display: 'block', height: i === 0 ? 96 : 56, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}

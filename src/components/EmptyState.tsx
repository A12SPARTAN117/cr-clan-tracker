/** Empty state: an open chest with a plain message. */
export function EmptyState({ text, dashed = false }: { text: string; dashed?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        padding: 48,
        textAlign: 'center',
        border: dashed ? '1px dashed var(--hair)' : undefined,
        borderRadius: 8,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static chest scene */}
      <img src="/scenes/chest.jpg" alt="" width={160} height={86} style={{ objectFit: 'cover', borderRadius: 6, opacity: 0.85, filter: 'grayscale(.4)' }} />
      <span style={{ font: '500 11px/1.6 var(--mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', maxWidth: 440 }}>{text}</span>
    </div>
  );
}

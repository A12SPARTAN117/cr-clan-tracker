import badges from '../../../data/clan-badges.json';

const MAP = badges as Record<string, string>;

export const badgeSrc = (badgeId: number | null | undefined) => (badgeId != null && MAP[String(badgeId)] ? `/badges/${MAP[String(badgeId)]}` : null);

/** Clan badge art for an API badgeId. Full colour: it is data. */
export function ClanBadge({ badgeId, size = 40, name }: { badgeId: number | null | undefined; size?: number; name?: string }) {
  const src = badgeSrc(badgeId);
  if (!src)
    return (
      <span
        aria-hidden
        style={{ display: 'inline-block', flex: 'none', width: size, height: size * 1.12, border: '1px dashed var(--hair)', borderRadius: '40% 40% 50% 50%' }}
      />
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small static art, sized by the caller
    <img src={src} alt={name ? `${name} badge` : ''} width={size} height={Math.round(size * 1.12)} style={{ flex: 'none', objectFit: 'contain', display: 'block' }} />
  );
}

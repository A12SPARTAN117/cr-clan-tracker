import { useId } from 'react';
import { clanLeague } from '@/lib/clanLeague';
import { ClanBadge } from './ClanBadge';

/**
 * A clan badge in its River Race league frame: a metal ring in the league's colours (bronze,
 * silver, gold, legendary) with one to three gems for the tier, and the league name under it
 * when `label` is set. Drawn, since the game's own frame art isn't available to us.
 */
export function ClanFrame({
  badgeId,
  warTrophies,
  size = 56,
  name,
  label = false,
}: {
  badgeId: number | null | undefined;
  warTrophies: number | null | undefined;
  size?: number;
  name?: string;
  label?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const lg = clanLeague(warTrophies);
  if (!lg) return <ClanBadge badgeId={badgeId} size={size} name={name} />;
  const [hi, mid, lo] = lg.colors;
  const box = Math.round(size * 1.5);
  return (
    <span
      title={`${lg.name} league`}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: Math.max(3, Math.round(size * 0.06)), flex: 'none' }}
    >
      <span style={{ position: 'relative', width: box, height: box, display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 100 100" width={box} height={box} aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            <linearGradient id={`m${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={hi} />
              <stop offset=".5" stopColor={mid} />
              <stop offset="1" stopColor={lo} />
            </linearGradient>
            <radialGradient id={`g${id}`}>
              <stop offset=".55" stopColor={mid} stopOpacity=".35" />
              <stop offset="1" stopColor={mid} stopOpacity="0" />
            </radialGradient>
          </defs>
          {lg.kind === 'legendary' && <circle cx="50" cy="50" r="50" fill={`url(#g${id})`} />}
          {/* Ring with notches, like the game's league frames. */}
          <circle cx="50" cy="50" r="42" fill="none" stroke={`url(#m${id})`} strokeWidth="7" />
          <circle cx="50" cy="50" r="46" fill="none" stroke={lo} strokeOpacity=".7" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="38" fill="none" stroke={hi} strokeOpacity=".5" strokeWidth="1" />
          {[0, 90, 180, 270].map((a) => (
            <rect key={a} x="47" y="3" width="6" height="10" rx="1.5" fill={`url(#m${id})`} stroke={lo} strokeWidth=".8" transform={`rotate(${a + 45} 50 50)`} />
          ))}
          {/* Tier gems along the bottom of the ring. */}
          {Array.from({ length: lg.tier }, (_, i) => {
            const x = 50 + (i - (lg.tier - 1) / 2) * 13;
            return <path key={i} d={`M${x} 84l5.5 6-5.5 6-5.5-6Z`} fill={hi} stroke={lo} strokeWidth="1.2" />;
          })}
        </svg>
        <ClanBadge badgeId={badgeId} size={size} name={name} />
      </span>
      {label && (
        <span style={{ font: `700 ${Math.max(9, Math.round(size * 0.17))}px/1 var(--mono)`, letterSpacing: '.1em', textTransform: 'uppercase', color: mid, whiteSpace: 'nowrap' }}>
          {lg.name}
        </span>
      )}
    </span>
  );
}

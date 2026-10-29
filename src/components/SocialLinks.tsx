import { SOCIAL, type SocialId } from '@/lib/social';
import s from './SocialLinks.module.css';

/** Each network's logo, one colour (currentColor), drawn on a 24 px grid. */
export function SocialGlyph({ id, size = 16 }: { id: SocialId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={s.glyph}>
      {id === 'x' && <path fill="currentColor" d="M18.9 1.2h3.7l-8 9.2 9.4 12.4h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2L6.5 3.3H4.3l13.3 17.3Z" />}
      {id === 'instagram' && (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5.2" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" />
        </g>
      )}
      {id === 'reddit' && (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <ellipse cx="12" cy="14.6" rx="8.4" ry="6" />
          <circle cx="4.4" cy="10.6" r="1.9" />
          <circle cx="19.6" cy="10.6" r="1.9" />
          <path d="M12 8.6 13.4 3l4.2 1" />
          <circle cx="18.9" cy="4.3" r="1.4" />
          <circle cx="9" cy="13.6" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="13.6" r="1.1" fill="currentColor" stroke="none" />
          <path d="M9 17.2c1.7 1.2 4.3 1.2 6 0" />
        </g>
      )}
    </svg>
  );
}

/**
 * Links to the site's Reddit, X and Instagram. `row`: logo chips (footer, menu sheet); `cards`:
 * one card per network with its handle and what we post there (Support page).
 */
export function SocialLinks({ variant = 'row', className }: { variant?: 'row' | 'cards'; className?: string }) {
  return (
    <ul className={`${variant === 'cards' ? s.cards : s.row} ${className ?? ''}`} aria-label="CR Clan Tracker on social media">
      {SOCIAL.map((l) => (
        <li key={l.id}>
          <a href={l.url} target="_blank" rel="noopener noreferrer" className={s.link} data-net={l.id}>
            <SocialGlyph id={l.id} size={variant === 'cards' ? 26 : 16} />
            {variant === 'cards' ? (
              <span className={s.text}>
                <b>{l.label}</b>
                <span className={s.handle}>{l.handle}</span>
                <span className={s.blurb}>{l.blurb}</span>
              </span>
            ) : (
              <span>{l.label}</span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

import { useId, type CSSProperties, type ReactNode } from 'react';

/**
 * Small game-styled stat icons, drawn as inline SVG so they stay crisp at any size and work
 * in both themes. Each takes a pixel `size` (height; width follows the viewBox) and an
 * optional `title` (otherwise decorative / aria-hidden).
 */

type P = { size?: number; title?: string; style?: CSSProperties };

function Svg({ size = 16, title, style, vb = '0 0 24 24', children }: P & { vb?: string; children: ReactNode }) {
  const [, , w, h] = vb.split(' ').map(Number);
  return (
    <svg
      width={Math.round((size * w) / h)}
      height={size}
      viewBox={vb}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ flex: 'none', display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

/** Pink elixir drop. */
export function ElixirIcon(p: P) {
  const id = useId();
  return (
    <Svg {...p} vb="0 0 20 24">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F38BF6" />
          <stop offset=".55" stopColor="#C53ACF" />
          <stop offset="1" stopColor="#7B1597" />
        </linearGradient>
      </defs>
      <path d="M10 1.5C10 1.5 2.5 10.2 2.5 15.2A7.5 7.5 0 0 0 17.5 15.2C17.5 10.2 10 1.5 10 1.5Z" fill={`url(#${id})`} stroke="#4E0C61" strokeWidth="1.2" />
      <ellipse cx="7" cy="14" rx="1.6" ry="3" fill="#fff" opacity=".55" transform="rotate(-18 7 14)" />
    </Svg>
  );
}

/** Pink circular arrows: the 4-card cycle. */
export function CycleIcon(p: P) {
  return (
    <Svg {...p}>
      <g fill="none" stroke="#D45ADB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.5 9.5A8 8 0 0 0 5.2 7.4" />
        <path d="M4.5 14.5A8 8 0 0 0 18.8 16.6" />
        <path d="M5 3.5V7.6H9.1" />
        <path d="M19 20.5V16.4H14.9" />
      </g>
    </Svg>
  );
}

/** Gold trophy cup (trophies, clan score, required trophies). */
export function TrophyIcon(p: P) {
  const id = useId();
  return (
    <Svg {...p}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9A3" />
          <stop offset=".5" stopColor="#F2B83A" />
          <stop offset="1" stopColor="#B87512" />
        </linearGradient>
      </defs>
      <path d="M5 4H2.5V7A4 4 0 0 0 6.5 11M19 4H21.5V7A4 4 0 0 1 17.5 11" fill="none" stroke="#C88A1E" strokeWidth="1.8" />
      <path d="M5 2.5H19V8A7 7 0 0 1 5 8Z" fill={`url(#${id})`} stroke="#7A4A08" strokeWidth="1" />
      <path d="M10.3 14.5H13.7L14.4 18H9.6Z" fill="#E0A12F" stroke="#7A4A08" strokeWidth=".8" />
      <rect x="6.5" y="18" width="11" height="3.5" rx="1" fill="#C88A1E" stroke="#7A4A08" strokeWidth=".8" />
      <path d="M8.5 4.5V7.5" stroke="#fff" strokeOpacity=".6" strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

/** Clan war trophy: a cup with crossed swords behind it. */
export function WarTrophyIcon(p: P) {
  return (
    <Svg {...p}>
      <g stroke="#A4A9B4" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 3L20 20" />
        <path d="M21 3L4 20" />
      </g>
      <g transform="translate(4.4 4) scale(.64)">
        <path d="M5 2.5H19V8A7 7 0 0 1 5 8Z" fill="#F2B83A" stroke="#7A4A08" strokeWidth="1.4" />
        <path d="M10.3 14.5H13.7L14.4 18H9.6Z" fill="#E0A12F" stroke="#7A4A08" strokeWidth="1.2" />
        <rect x="6.5" y="18" width="11" height="3.5" rx="1" fill="#C88A1E" stroke="#7A4A08" strokeWidth="1.2" />
      </g>
    </Svg>
  );
}

/** Ultimate Champion medal: the Path of Legends rating ("medals"). */
export function MedalIcon(p: P) {
  const id = useId();
  return (
    <Svg {...p} vb="0 0 22 24">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E7D2FF" />
          <stop offset=".45" stopColor="#A35BFF" />
          <stop offset="1" stopColor="#5A1FB0" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9A3" />
          <stop offset="1" stopColor="#C88A1E" />
        </linearGradient>
      </defs>
      <path d="M5 1H9.5L12 7.5L9 9Z" fill="#7B3FE0" />
      <path d="M17 1H12.5L10 7.5L13 9Z" fill="#5A1FB0" />
      <circle cx="11" cy="15" r="7.8" fill={`url(#${id}r)`} stroke="#7A4A08" strokeWidth="1" />
      <circle cx="11" cy="15" r="5.6" fill={`url(#${id})`} stroke="#3A0F7A" strokeWidth=".8" />
      <path d="M11 11.2L12.2 13.7L14.9 14L12.9 15.8L13.4 18.5L11 17.2L8.6 18.5L9.1 15.8L7.1 14L9.8 13.7Z" fill="#fff" opacity=".92" />
    </Svg>
  );
}

/** Blue crown (crowns / three-crown wins). */
export function CrownIcon(p: P) {
  return (
    <Svg {...p} vb="0 0 24 20">
      <path d="M2 6L7 10L12 2L17 10L22 6L20 17H4Z" fill="#3AA0FF" stroke="#0A48C9" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="4" y="15.5" width="16" height="3" rx="1" fill="#E6B34A" stroke="#7A4A08" strokeWidth=".8" />
      <circle cx="12" cy="2.6" r="1.3" fill="#F5D58A" />
    </Svg>
  );
}

/** Two cards with an arrow: cards donated. */
export function DonationIcon(p: P) {
  return (
    <Svg {...p}>
      <rect x="3" y="4" width="10" height="14" rx="2" fill="#262930" stroke="#8CCBFF" strokeWidth="1.4" transform="rotate(-10 8 11)" />
      <rect x="9" y="5" width="10" height="14" rx="2" fill="#1A1C20" stroke="#8CCBFF" strokeWidth="1.4" transform="rotate(8 14 12)" />
      <path d="M12 21.5H20M17.5 19L20 21.5L17.5 24" fill="none" stroke="#3AA0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -2)" />
    </Svg>
  );
}

/** Two people: clan members. */
export function MembersIcon(p: P) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8" r="3.6" fill="#A4A9B4" />
      <path d="M2.5 20C2.5 15.5 5.5 13.5 9 13.5S15.5 15.5 15.5 20Z" fill="#A4A9B4" />
      <circle cx="16.5" cy="7" r="3" fill="#62676F" />
      <path d="M16.3 12.4C19.4 12.6 21.5 14.6 21.5 18.5H17.3C17.1 15.9 16.6 14 16.3 12.4Z" fill="#62676F" />
    </Svg>
  );
}

/** King level: blue experience star. */
export function ExpIcon(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 1.5L15 8.2L22.2 8.9L16.8 13.8L18.3 21L12 17.3L5.7 21L7.2 13.8L1.8 8.9L9 8.2Z" fill="#3AA0FF" stroke="#0A48C9" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M12 5.5L13.3 9.6" stroke="#fff" strokeOpacity=".6" strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

/** Crossed swords: battles / wins. */
export function SwordsIcon(p: P) {
  return (
    <Svg {...p}>
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4L15.5 15.5" stroke="#D7DBE2" strokeWidth="2.4" />
        <path d="M20 4L8.5 15.5" stroke="#D7DBE2" strokeWidth="2.4" />
        <path d="M13.5 18.5L18.5 13.5M5.5 13.5L10.5 18.5" stroke="#C88A1E" strokeWidth="2.2" />
        <path d="M17 17L20.5 20.5M7 17L3.5 20.5" stroke="#7A4A08" strokeWidth="2.4" />
      </g>
    </Svg>
  );
}

/** River race fame: a pennant flag. */
export function FameIcon(p: P) {
  return (
    <Svg {...p}>
      <path d="M5 2.5V22" stroke="#A4A9B4" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 3.5H19L16 8L19 12.5H6Z" fill="#E6B34A" stroke="#7A4A08" strokeWidth="1" strokeLinejoin="round" />
    </Svg>
  );
}

/** A single card: decks used / cards. */
export function CardsIcon(p: P) {
  return (
    <Svg {...p}>
      <rect x="5" y="2.5" width="14" height="19" rx="2.5" fill="#1A1C20" stroke="#A35BFF" strokeWidth="1.6" />
      <path d="M12 7.5L14.5 12L12 16.5L9.5 12Z" fill="#C79BFF" />
    </Svg>
  );
}

/** Cards received. */
export function ReceivedIcon(p: P) {
  return (
    <Svg {...p}>
      <rect x="6" y="2.5" width="12" height="16" rx="2" fill="#1A1C20" stroke="#A4A9B4" strokeWidth="1.4" />
      <path d="M12 12V22M8.5 18.5L12 22L15.5 18.5" fill="none" stroke="#3AA0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Clock: last seen / time. */
export function ClockIcon(p: P) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="#A4A9B4" strokeWidth="1.8" />
      <path d="M12 7V12L15.5 14" fill="none" stroke="#8CCBFF" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Percentage gauge: win rate / usage. */
export function WinRateIcon(p: P) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="#262930" strokeWidth="3" />
      <path d="M12 3A9 9 0 1 1 3.4 14.7" fill="none" stroke="#3AA0FF" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

/** Chest: challenge / tournament cards won. */
export function ChestIcon(p: P) {
  return (
    <Svg {...p}>
      <path d="M3 10C3 5.5 6.5 4 12 4S21 5.5 21 10Z" fill="#B8742A" stroke="#5C3510" strokeWidth="1" />
      <rect x="3" y="10" width="18" height="10" rx="1.5" fill="#9A5B1E" stroke="#5C3510" strokeWidth="1" />
      <rect x="10" y="8.5" width="4" height="5" rx="1" fill="#F2B83A" stroke="#7A4A08" strokeWidth=".8" />
    </Svg>
  );
}

/** Badge / achievement star. */
export function BadgeIcon(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 2L20 6V12C20 17 16.5 20.5 12 22C7.5 20.5 4 17 4 12V6Z" fill="#262930" stroke="#E6B34A" strokeWidth="1.6" />
      <path d="M12 7.5L13.4 10.4L16.5 10.8L14.2 12.9L14.8 16L12 14.5L9.2 16L9.8 12.9L7.5 10.8L10.6 10.4Z" fill="#F5D58A" />
    </Svg>
  );
}

/** Up/down arrows: rank movement or streak. */
export function StreakIcon(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 3C14 7 18 8.5 18 13.5A6 6 0 0 1 6 13.5C6 11 7.5 9.5 8.5 8.5C8.5 11 10 12 10.8 12C10.8 9 11 6 12 3Z" fill="#FF7A3D" stroke="#9A2E0B" strokeWidth="1" strokeLinejoin="round" />
      <path d="M12 13C13.2 14.2 14 15 14 16.5A2 2 0 0 1 10 16.5C10 15 11 14 12 13Z" fill="#FFD27A" />
    </Svg>
  );
}

/** Tower troop: a small king tower. */
export function TowerIcon(p: P) {
  return (
    <Svg {...p}>
      <path d="M5 4H7.5V6H10V4H14V6H16.5V4H19V10H5Z" fill="#62676F" stroke="#262930" strokeWidth=".8" />
      <path d="M6 10H18L17 21H7Z" fill="#80868F" stroke="#262930" strokeWidth=".8" />
      <path d="M10.5 21V16.5A1.5 1.5 0 0 1 13.5 16.5V21Z" fill="#262930" />
    </Svg>
  );
}

/** "137,471" next to its icon, kept on one line. */
export function IconStat({ icon, children, gap = 6, style }: { icon: ReactNode; children: ReactNode; gap?: number; style?: CSSProperties }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap, whiteSpace: 'nowrap', ...style }}>
      {icon}
      <span>{children}</span>
    </span>
  );
}

/** Clan war: a shield with crossed swords. */
export function ClanWarIcon(p: P) {
  return (
    <Svg {...p}>
      <g strokeLinecap="round">
        <path d="M3.5 3.5L18 18" stroke="#D7DBE2" strokeWidth="2" />
        <path d="M20.5 3.5L6 18" stroke="#D7DBE2" strokeWidth="2" />
      </g>
      <path d="M12 6.5L17.5 8.7V12.6C17.5 16 15.3 18.4 12 19.6C8.7 18.4 6.5 16 6.5 12.6V8.7Z" fill="#0A48C9" stroke="#8CCBFF" strokeWidth="1.3" />
      <path d="M12 9.5V16.5M9.2 12.2H14.8" stroke="#F5D58A" strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

/** 2v2: two helmets side by side. */
export function TeamIcon(p: P) {
  return (
    <Svg {...p}>
      <path d="M2.5 14C2.5 9.5 5 7 8.5 7S14.5 9.5 14.5 14V17H2.5Z" fill="#3AA0FF" stroke="#0A48C9" strokeWidth="1.1" />
      <path d="M9.5 14C9.5 9.5 12 7 15.5 7S21.5 9.5 21.5 14V17H9.5Z" fill="#FF5464" stroke="#8E1222" strokeWidth="1.1" />
      <path d="M4.5 12.5H12.5M11.5 12.5H19.5" stroke="#07080A" strokeWidth="1.6" />
      <rect x="2" y="17" width="20" height="2.6" rx="1" fill="#E6B34A" />
    </Svg>
  );
}

/** Challenges: a laurel wreath around a trophy. */
export function ChallengeIcon(p: P) {
  return (
    <Svg {...p}>
      <g fill="none" stroke="#E6B34A" strokeWidth="1.6" strokeLinecap="round">
        <path d="M5 6C3 9 3 14 6.5 17.5" />
        <path d="M19 6C21 9 21 14 17.5 17.5" />
        <path d="M4.2 9.5L6 10.2M4 13L6 13.2M5 16L6.8 15.5M19.8 9.5L18 10.2M20 13L18 13.2M19 16L17.2 15.5" />
      </g>
      <path d="M8.5 5H15.5V8.5A3.5 3.5 0 0 1 8.5 8.5Z" fill="#F2B83A" stroke="#7A4A08" strokeWidth=".9" />
      <path d="M11 12H13L13.5 14.5H10.5Z" fill="#E0A12F" />
      <rect x="9" y="14.5" width="6" height="2.3" rx=".8" fill="#C88A1E" />
    </Svg>
  );
}

/** Draft: three cards fanned out. */
export function DraftIcon(p: P) {
  return (
    <Svg {...p}>
      <rect x="4" y="5" width="9" height="13" rx="1.6" fill="#262930" stroke="#A4A9B4" strokeWidth="1.2" transform="rotate(-16 8.5 11.5)" />
      <rect x="11" y="5" width="9" height="13" rx="1.6" fill="#262930" stroke="#A4A9B4" strokeWidth="1.2" transform="rotate(16 15.5 11.5)" />
      <rect x="7.5" y="4" width="9" height="14" rx="1.6" fill="#1A1C20" stroke="#C79BFF" strokeWidth="1.4" />
      <path d="M12 8L13.8 11L12 14L10.2 11Z" fill="#C79BFF" />
    </Svg>
  );
}

/** Chess events: a knight piece. */
export function ChessIcon(p: P) {
  return (
    <Svg {...p}>
      <path d="M7 20H17L16 17H8Z" fill="#E6B34A" stroke="#7A4A08" strokeWidth="1" />
      <path d="M8.5 17C8.5 13.5 10 12.5 9.5 11L7 12.2L5.8 10.4L10 4.5C13.5 4 17 6.5 16.8 11.5L16 17Z" fill="#A35BFF" stroke="#3A0F7A" strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="11" cy="8" r=".9" fill="#fff" />
    </Svg>
  );
}

/** Generic live event: a starburst. */
export function EventIcon(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 2L14.2 7.2L19.8 6L16.6 10.7L21 14.3L15.4 14.8L15.6 20.5L12 16.2L8.4 20.5L8.6 14.8L3 14.3L7.4 10.7L4.2 6L9.8 7.2Z" fill="#FF5464" stroke="#8E1222" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="12" cy="11.8" r="3" fill="#F5D58A" />
    </Svg>
  );
}

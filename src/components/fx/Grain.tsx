/**
 * Full-screen film grain at 1.5% opacity: one tiled noise image the browser draws once. (It was an
 * animated canvas redrawn ~12 times a second over the whole page, which cost a phone more than
 * the grain was worth.)
 */
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Grain() {
  return <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, opacity: 0.015, backgroundImage: NOISE, backgroundSize: '160px 160px' }} />;
}

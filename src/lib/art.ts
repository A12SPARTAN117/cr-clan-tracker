/**
 * CSS background-image for a scene still. Scenes in public/scenes have a daylight twin in
 * public/scenes/light, picked by the --art-* tokens in globals.css when Marble Day is on.
 */
export function art(src: string): string {
  const m = /^\/scenes\/([\w-]+)\.jpg$/.exec(src);
  return m ? `var(--art-${m[1]}, url(${src}))` : `url(${src})`;
}

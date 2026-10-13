'use client';

/** True when the user asked for reduced motion (or a page forced it off). */
export function reducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.motion === 'off'
  );
}

export type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem('oa-theme', t);
  } catch {}
  window.dispatchEvent(new CustomEvent('oa-theme', { detail: t }));
}

export function toggleTheme(): Theme {
  const next = getTheme() === 'light' ? 'dark' : 'light';
  setTheme(next);
  return next;
}

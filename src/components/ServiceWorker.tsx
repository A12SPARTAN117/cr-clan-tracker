'use client';

import { useEffect } from 'react';

/**
 * Registers public/sw.js (production only). The worker does one thing: when the server can't be
 * reached, it shows the cached /down.html page instead of the browser's own error screen.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (document.readyState === 'complete') register();
    else addEventListener('load', register, { once: true });
  }, []);
  return null;
}

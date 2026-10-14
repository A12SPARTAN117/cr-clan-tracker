'use client';

import { EmberField } from './EmberField';

/** A faint layer of drifting embers behind every page (one small three.js canvas). */
export function AmbientEmbers() {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      <EmberField count={90} gold={0.3} intensity={0.45} />
    </div>
  );
}

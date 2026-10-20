import type { Metadata } from 'next';
import { SceneHeader } from '@/components/SceneHeader';
import { Reveal } from '@/components/fx/Reveal';
import { MyRivals } from './MyRivals';

export const metadata: Metadata = { title: 'Rivals', description: 'Head-to-head records against the opponents a player keeps meeting.' };

export default function RivalsPage() {
  return (
    <>
      <SceneHeader scene="/scenes/shields.jpg" status={<span>Rivals · head to head</span>} height="clamp(380px, 50vh, 540px)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
          <Reveal as="h1" className="display-l">
            WHO KEEPS
            <br />
            BEATING YOU?
          </Reveal>
          <p className="body" style={{ maxWidth: 560, color: 'var(--text-1)' }}>
            Every opponent a player meets more than once, with the head-to-head record and each game between them. Pin yourself on your player
            page and this opens your rivals straight away.
          </p>
        </div>
      </SceneHeader>
      <main className="page" style={{ maxWidth: 1080, minHeight: '40vh', paddingTop: 28 }}>
        <MyRivals />
      </main>
    </>
  );
}

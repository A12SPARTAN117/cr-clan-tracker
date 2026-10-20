import type { Metadata } from 'next';
import { SceneHeader } from '@/components/SceneHeader';
import { Reveal } from '@/components/fx/Reveal';
import { MyClan } from './MyClan';

export const metadata: Metadata = { title: 'My clan' };

export default function MyClanPage() {
  return (
    <>
      {/* The clan's stronghold: a cracked tower lit from inside, kept in its own blue. */}
      <SceneHeader scene="/scenes/tower.jpg" sceneFilter="brightness(0.78) saturate(0.95)" scenePosition="center 30%" status={<span>My clan · leader view</span>} height="clamp(380px, 50vh, 540px)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 620 }}>
          <Reveal as="h1" className="display-l">
            WHICH CLAN
            <br />
            DO YOU RUN?
          </Reveal>
          <p className="body" style={{ maxWidth: 560, color: 'var(--text-1)' }}>
            The dashboard shows who is active, who plays war and an Asset Score for every member. It works for any clan: no login, and
            nothing is stored except on this device.
          </p>
        </div>
      </SceneHeader>
      <main className="page" style={{ maxWidth: 1080, minHeight: '40vh', paddingTop: 28 }}>
        <MyClan />
      </main>
    </>
  );
}

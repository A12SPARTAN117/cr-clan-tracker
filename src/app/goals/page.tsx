import type { Metadata } from 'next';
import { SceneHeader } from '@/components/SceneHeader';
import { Reveal } from '@/components/fx/Reveal';
import { MyGoals } from './MyGoals';

export const metadata: Metadata = { title: 'Season goals', description: 'Set Clash Royale goals and see your progress and an estimated finish date.' };

export default function GoalsEntryPage() {
  return (
    <>
      <SceneHeader scene="/scenes/podium.jpg" status={<span>Season goals · saved on this device</span>} height="clamp(380px, 50vh, 540px)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
          <Reveal as="h1" className="display-l">
            WHAT ARE YOU
            <br />
            AIMING FOR?
          </Reveal>
          <p className="body" style={{ maxWidth: 560, color: 'var(--text-1)' }}>
            Set goals like Ultimate Champion or 1,000 war wins, and see how far along you are and when you&apos;ll get there at your current pace. Pin yourself on your player page and
            this opens your goals straight away.
          </p>
        </div>
      </SceneHeader>
      <main className="page" style={{ maxWidth: 1080, minHeight: '40vh', paddingTop: 28 }}>
        <MyGoals />
      </main>
    </>
  );
}

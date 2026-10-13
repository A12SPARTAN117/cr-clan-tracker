import type { Metadata } from 'next';
import { Reveal } from '@/components/fx/Reveal';
import { MyClan } from './MyClan';

export const metadata: Metadata = { title: 'My clan' };

export default function MyClanPage() {
  return (
    <main className="page" style={{ maxWidth: 1080, minHeight: '70vh' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="label">My clan · leader view</span>
        <Reveal as="h1" className="display-l">
          WHICH CLAN
          <br />
          DO YOU RUN?
        </Reveal>
        <p className="body" style={{ maxWidth: 560 }}>
          The dashboard shows who is active, who plays war and an Asset Score for every member. It works for any clan: no login, and
          nothing is stored except on this device.
        </p>
      </header>
      <MyClan />
    </main>
  );
}

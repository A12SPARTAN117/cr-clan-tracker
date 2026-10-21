import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/fx/Reveal';
import { SceneHeader } from '@/components/SceneHeader';
import { DONATE_LINKS } from '@/lib/donate';
import h from '../help/help.module.css';
import s from './support.module.css';

export const metadata: Metadata = {
  title: 'Support us',
  description: 'What CR Clan Tracker is for, who makes it, and how donations keep it free and online.',
};

const COSTS = [
  { k: 'Servers', v: 'Right now the site runs on free hosting, which goes down when lots of people visit at once. Real servers keep it up.' },
  { k: 'Database', v: 'Clan history, roster changes and war participation are built from snapshots we store every day. Storage grows with every clan tracked.' },
  { k: 'Data', v: 'Every page asks the Clash Royale API for live numbers, and the meta reads thousands of battles a day. Bandwidth and processing add up.' },
  { k: 'Time', v: 'New features, fixes after game updates, and keeping the numbers right are all done in our spare time.' },
];

const HEART = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor">
    <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z" />
  </svg>
);

/** One button per way to give; the first is the main one, the rest are outlined. */
function DonateButtons() {
  if (!DONATE_LINKS.length)
    return (
      <span className={s.donate} aria-disabled="true" data-off="">
        {HEART} Donations open soon
      </span>
    );
  return (
    <div className={s.donateRow}>
      {DONATE_LINKS.map((l, i) => (
        <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className={s.donate} data-alt={i > 0 ? '' : undefined}>
          {HEART} {l.id === 'other' && DONATE_LINKS.length === 1 ? 'Donate to CR Clan Tracker' : l.label}
        </a>
      ))}
    </div>
  );
}

export default function SupportPage() {
  return (
    <>
      {/* The throne room keeps its storm-blue light, so it skips the usual greyscale. */}
      <SceneHeader scene="/scenes/throne.jpg" sceneFilter="brightness(0.78) saturate(0.95)" scenePosition="center 35%" status={<span>Support us · free · fan-made</span>} height="clamp(340px, 46vh, 500px)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'flex-start' }}>
          <Reveal as="h1" className="display-l">
            KEEP THE
            <br />
            ARENA OPEN
          </Reveal>
          <DonateButtons />
        </div>
      </SceneHeader>

      <main className={s.main}>
        <section className={h.section}>
          <h2 className={h.h2}>What this is for</h2>
          <p className={s.lead}>
            CR Clan Tracker is a free home for Clash Royale players and clan leaders. Look anyone up, see what the top players are winning with,
            and run your clan with real numbers: who&apos;s active, who plays war, who&apos;s ready for a promotion and who has gone quiet.
          </p>
          <p className={h.intro}>
            No accounts, no ads, nothing locked behind a paywall. Everything on the site is free for everyone, and it will stay that way.
          </p>
        </section>

        <section className={h.section}>
          <h2 className={h.h2}>About us</h2>
          <p className={h.intro}>
            We&apos;re a small, independent team of Clash Royale players and clan leaders. We built the tools we always wanted while running our
            own clans: an honest score for every member, war participation you can trust, and history that remembers who joined and who left.
          </p>
          <p className={h.intro}>
            We work on it in our spare time. We&apos;re not affiliated with Supercell; this is a fan project made under Supercell&apos;s Fan Content
            Policy.
          </p>
        </section>

        <section className={h.section}>
          <h2 className={h.h2}>Why we need support</h2>
          <p className={h.intro}>Running the site costs money every month, and right now it comes out of our own pockets. Donations go straight to:</p>
          <div className={s.costs}>
            {COSTS.map((c) => (
              <div key={c.k} className={s.cost}>
                <b>{c.k}</b>
                <p>{c.v}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={s.give}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            <span className="label" style={{ color: 'var(--blue-hi)' }}>
              ● Every bit helps
            </span>
            <b className={s.giveTitle}>Chip in to keep CR Clan Tracker free and online</b>
            <p className={h.intro} style={{ fontSize: 14 }}>
              Donations are purely donations: they don&apos;t unlock features, perks or anything else on the site, as the Fan Content Policy requires.
            </p>
          </div>
          <DonateButtons />
        </section>

        <section className={h.section}>
          <h2 className={h.h2}>Other ways to help</h2>
          <ul className={h.list}>
            <li>Share the site with your clan. More clans tracked means more history and better meta stats for everyone.</li>
            <li>Pin your player and clan on their pages so Home opens straight to them.</li>
            <li>
              New here? The <Link href="/help">Help page</Link> walks through every feature.
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}

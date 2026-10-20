import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/fx/Reveal';
import { SceneHeader } from '@/components/SceneHeader';
import { FAQ, FEATURES, GUIDES, QUICK_START, TIPS } from '@/content/help';
import s from './help.module.css';

export const metadata: Metadata = {
  title: 'Help',
  description: 'How to use CR Clan Tracker: finding players and clans, the clan dashboard, meta decks, Compare and more.',
};

export default function HelpPage() {
  return (
    <>
      {/* The rune gate keeps its blue glow, so it skips the usual greyscale. */}
      <SceneHeader scene="/scenes/portal.jpg" sceneFilter="brightness(0.78) saturate(0.95)" scenePosition="center 22%" status={<span>Help · guides · every feature</span>} height="clamp(320px, 42vh, 460px)">
        <Reveal as="h1" className="display-l">
          HOW IT
          <br />
          WORKS
        </Reveal>
      </SceneHeader>

      <div className={s.wrap}>
        <nav className={s.toc} aria-label="On this page">
          <span className="label-sm">On this page</span>
          <a href="#start">Quick start</a>
          <a href="#features">Features</a>
          {GUIDES.map((g) => (
            <a key={g.id} href={`#${g.id}`}>
              {g.title}
            </a>
          ))}
          <a href="#tips">Shortcuts</a>
          <a href="#faq">Data &amp; FAQ</a>
        </nav>

        <main className={s.main}>
          <section id="start" className={s.section}>
            <h2 className={s.h2}>Quick start</h2>
            <ol className={s.steps3}>
              {QUICK_START.map((q, i) => (
                <li key={q.title} className={s.stepCard}>
                  <span className={s.stepNum}>{i + 1}</span>
                  <b>{q.title}</b>
                  <p>{q.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="features" className={s.section}>
            <h2 className={s.h2}>Everything you can do</h2>
            <div className={s.features}>
              {FEATURES.map((f) => (
                <Link key={f.title} href={f.href} className={s.feature} data-spot="">
                  <b>{f.title}</b>
                  <p>{f.text}</p>
                  <span className="link-mono">{f.cta} →</span>
                </Link>
              ))}
            </div>
          </section>

          {GUIDES.map((g) => (
            <section key={g.id} id={g.id} className={s.section}>
              <h2 className={s.h2}>{g.title}</h2>
              <p className={s.intro}>{g.intro}</p>
              <ol className={s.list}>
                {g.steps.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
              {g.tips?.map((t) => (
                <p key={t} className="data-since" style={{ textTransform: 'none', letterSpacing: '.02em', fontSize: 12 }}>
                  {t}
                </p>
              ))}
            </section>
          ))}

          <section id="tips" className={s.section}>
            <h2 className={s.h2}>Shortcuts</h2>
            <dl className={s.keys}>
              {TIPS.map((t) => (
                <div key={t.k}>
                  <dt>
                    <kbd>{t.k}</kbd>
                  </dt>
                  <dd>{t.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="faq" className={s.section}>
            <h2 className={s.h2}>Data &amp; FAQ</h2>
            {FAQ.map((f) => (
              <details key={f.q} className={s.faq}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </section>

          <section className={s.cta}>
            <b>Still stuck, or want to help keep the site free?</b>
            <Link href="/support" className="btn btn-primary">
              Support us
            </Link>
          </section>
        </main>
      </div>
    </>
  );
}

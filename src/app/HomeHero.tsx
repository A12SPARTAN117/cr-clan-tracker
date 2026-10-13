'use client';

import { useEffect, useRef, useState } from 'react';
import { Fog } from '@/components/fx/Fog';
import { ParticleCrown } from '@/components/fx/ParticleCrown';
import { Reveal } from '@/components/fx/Reveal';
import { reducedMotion } from '@/components/fx/motion';
import { TagSearch } from '@/components/TagSearch';
import { warDay } from '@/lib/war';
import s from './home.module.css';

function useWarLabel() {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setLabel(warDay(new Date()).label);
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return label;
}

/**
 * Home hero, variant 1a "Crown". Layers: void → ruined arena (22s push-in, parallax) → fog →
 * champion render (greyscale + blue rim, colour on hover) → particle crown → scrim → frame → copy.
 */
export function HomeHero({ metaSync }: { metaSync: string | null }) {
  const root = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLDivElement>(null);
  const crown = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const war = useWarLabel();

  useEffect(() => {
    let mx = 0;
    let my = 0;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const k = reducedMotion() ? 0 : 1;
      const y = scrollY;
      if (scene.current) scene.current.style.transform = `translate3d(${mx * -12 * k}px,${(my * -8 + y * 0.25) * k}px,0)`;
      if (champ.current) champ.current.style.transform = `translateX(-50%) translate3d(${mx * -26 * k}px,${(my * -10 + y * 0.12) * k}px,0)`;
      if (crown.current) crown.current.style.transform = `translateX(-50%) translate3d(${mx * 18 * k}px,${(my * 10 - y * 0.18) * k}px,0)`;
      if (copy.current) {
        copy.current.style.opacity = String(Math.max(0, 1 - y / (innerHeight * 0.6)));
        copy.current.style.transform = `translateY(${-y * 0.15 * k}px)`;
      }
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
      queue();
    };
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('scroll', queue, { passive: true });
    apply();
    return () => {
      removeEventListener('pointermove', onMove);
      removeEventListener('scroll', queue);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={root} className={s.hero} aria-label="Search players and clans">
      <div ref={scene} className={s.sceneWrap}>
        <div className={s.scene} />
      </div>
      <Fog density={1.3} />
      <div ref={champ} className={s.champ} style={{ transform: 'translateX(-50%)' }}>
        <div className={s.champImg} />
      </div>
      <div ref={crown} className={s.crown} style={{ transform: 'translateX(-50%)' }}>
        <ParticleCrown scrollRoot={root} />
      </div>
      <div className={s.scrim} />
      <div className={s.frame} />
      <div ref={copy} className={s.copy}>
        <div className={s.status}>
          <b>● Live{war ? ` · ${war}` : ''}</b>
          <span>Fan-made · free</span>
          {metaSync && <span>Meta sync {metaSync}</span>}
        </div>
        <Reveal as="h1" className={s.title}>
          KNOW YOUR
          <br />
          CLAN.
        </Reveal>
        <div className={s.searchWrap}>
          <TagSearch onScene />
        </div>
      </div>
    </section>
  );
}

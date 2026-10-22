'use client';

import { HoverLink } from '@/components/ui/HoverLink';
import { useRef } from 'react';
import { Fog } from '@/components/fx/Fog';
import { ParticleCrown } from '@/components/fx/ParticleCrown';
import { Reveal } from '@/components/fx/Reveal';
import { ClanBadge } from '@/components/ui/ClanBadge';
import { fmt } from '@/lib/format';
import type { BoardRow } from './page';
import s from './leaderboards.module.css';

const ORDER = [1, 0, 2];
const HEIGHT = ['clamp(150px,22vh,220px)', 'clamp(110px,16vh,160px)', 'clamp(90px,13vh,130px)'];

/** Obsidian podium with I / II / III and a hanging particle crown. */
export function PodiumScene({ rows, label, isClan, scoreIcon }: { rows: BoardRow[]; label: string; isClan: boolean; scoreIcon?: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  return (
    <section ref={root} className={s.podium}>
      <div className={s.scene} />
      <Fog density={0.9} />
      <div className={s.crown}>
        <ParticleCrown count={1400} scrollRoot={root} />
      </div>
      <div className={s.scrim} />
      <div className={s.frame} />
      <div className={s.steps}>
        {ORDER.map((i) => {
          const r = rows[i];
          return (
            <HoverLink key={i} href={r?.href ?? '#'} className={s.step} aria-label={r ? `${['First', 'Second', 'Third'][i]}: ${r.name}` : undefined}>
              <div style={{ height: 'clamp(54px,7vw,92px)', display: 'flex', alignItems: 'flex-end', filter: 'drop-shadow(0 0 16px rgba(var(--glow-rgb), .4))' }}>
                {r?.badgeId != null && <ClanBadge badgeId={r.badgeId} size={64} name={isClan ? r.name : undefined} />}
              </div>
              <span style={{ font: '600 clamp(13px,1.3vw,17px)/1.1 var(--sans)', textAlign: 'center', minHeight: '1.1em', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r?.name ?? ''}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '700 clamp(12px,1.2vw,15px)/1 var(--mono)', minHeight: '1em', whiteSpace: 'nowrap' }}>
                {r && scoreIcon}
                {r ? fmt(r.score) : ''}
              </span>
              <div
                className={s.block}
                style={{ height: HEIGHT[i], boxShadow: `inset 0 1px 0 rgba(255,255,255,.18),0 -10px 40px ${i === 0 ? 'rgba(var(--gold-rgb), .15)' : 'rgba(var(--glow-rgb), .15)'}` }}
              >
                <span
                  style={{
                    font: '800 clamp(40px,6vw,88px)/1 var(--mono)',
                    letterSpacing: '-.04em',
                    color: i === 0 ? 'var(--gold)' : 'var(--silver)',
                    textShadow: i === 0 ? '0 0 30px rgba(var(--gold-rgb), .6)' : '0 0 24px rgba(var(--glow-hi-rgb), .6)',
                  }}
                >
                  {['I', 'II', 'III'][i]}
                </span>
              </div>
            </HoverLink>
          );
        })}
      </div>
      <div className={s.title}>
        <span style={{ font: '500 10px/1.4 var(--mono)', letterSpacing: '.14em', color: 'var(--text-2)', textTransform: 'uppercase' }}>● Live · {label}</span>
        <Reveal as="h1" style={{ margin: 0, font: '800 clamp(40px,6.4vw,100px)/.86 var(--mono)', letterSpacing: '-.06em' }}>
          LEADER
          <br />
          BOARDS
        </Reveal>
      </div>
    </section>
  );
}

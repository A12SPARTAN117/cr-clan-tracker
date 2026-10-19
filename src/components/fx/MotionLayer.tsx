'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { reducedMotion } from './motion';
import { Portal } from './Portal';

/**
 * Global motion layer, mounted once in the root layout. Drives the pointer effects from the
 * design prototypes: data-spot (cursor light), data-tilt (3D tilt + glare) and data-magnet
 * (magnetic pull), and runs the fog-wipe page transition. Reveal, Draw and Decode are
 * components (see Reveal.tsx) so they stay hydration-safe.
 */
export function MotionLayer() {
  const veil = useRef<HTMLDivElement>(null);
  const portal = useRef<HTMLDivElement>(null);
  const slowTimer = useRef<number | undefined>(undefined);
  const pathname = usePathname();

  // Cursor light, card tilt, magnetic buttons.
  useEffect(() => {
    let lastTilt: HTMLElement | null = null;
    const untilt = (el: HTMLElement) => {
      el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
      el.style.transform = '';
      el.style.setProperty('--ga', '0');
    };
    const onMove = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t || !t.closest) return;
      const spot = t.closest<HTMLElement>('[data-spot]');
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty('--mx', `${e.clientX - r.left}px`);
        spot.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      if (reducedMotion() || e.pointerType === 'touch') return;
      const tilt = t.closest<HTMLElement>('[data-tilt]');
      if (lastTilt && lastTilt !== tilt) {
        untilt(lastTilt);
        lastTilt = null;
      }
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.transition = 'transform .08s linear';
        tilt.style.transform = `perspective(600px) rotateX(${(-py * 16).toFixed(2)}deg) rotateY(${(px * 16).toFixed(2)}deg) translateZ(4px)`;
        tilt.style.setProperty('--ga', '1');
        tilt.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
        tilt.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
        lastTilt = tilt;
      }
      const mag = t.closest<HTMLElement>('[data-magnet]');
      if (mag) {
        const r = mag.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        mag.style.transition = 'transform .2s cubic-bezier(.16,1,.3,1)';
        mag.style.transform = `translate(${dx * 0.18}px,${dy * 0.28}px)`;
        if (!mag.dataset.oaMag) {
          mag.dataset.oaMag = '1';
          mag.addEventListener('pointerleave', () => {
            mag.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
            mag.style.transform = '';
          });
        }
      }
    };
    const onLeaveDoc = () => {
      if (lastTilt) untilt(lastTilt);
      lastTilt = null;
    };
    addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeaveDoc);
    return () => {
      removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeaveDoc);
    };
  }, []);

  // Fog wipe: fade in on internal link click, fade out once the new route renders.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href') ?? '';
      if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/.test(href)) return;
      const url = new URL(a.href, location.href);
      // Only route changes get the wipe; the veil is lifted when the pathname changes.
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      const v = veil.current;
      if (!v) return;
      v.style.transitionDuration = reducedMotion() ? '.15s' : '.35s';
      v.style.opacity = '1';
      window.clearTimeout(slowTimer.current);
      slowTimer.current = window.setTimeout(() => {
        if (portal.current) portal.current.style.opacity = '1';
      }, 800);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    window.clearTimeout(slowTimer.current);
    const v = veil.current;
    if (!v) return;
    const id = requestAnimationFrame(() => {
      v.style.transitionDuration = reducedMotion() ? '.15s' : '.5s';
      v.style.opacity = '0';
      if (portal.current) portal.current.style.opacity = '0';
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      ref={veil}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        pointerEvents: 'none',
        opacity: 0,
        transition: 'opacity .5s cubic-bezier(.65,0,.35,1)',
        background: 'radial-gradient(ellipse at 50% 60%,rgba(var(--glow-rgb), .10),rgba(var(--void-rgb), 0) 60%),var(--void)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div ref={portal} style={{ opacity: 0, transition: 'opacity .3s' }}>
        <Portal size={72} />
      </div>
    </div>
  );
}

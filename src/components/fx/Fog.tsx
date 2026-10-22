'use client';

import { useEffect, useRef } from 'react';
import { fxLevel } from './budget';
import { getTheme, reducedMotion } from './motion';
import { addEffect, kick } from './ticker';

/** One soft puff (a radial gradient), drawn once per colour and theme and then scaled. */
function puffSprite(inner: string, outer: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return c;
}

/**
 * Drifting fog puffs and rising dust motes, drawn on a canvas that fills its parent. Soft by
 * nature, so it draws at pixel ratio 1 and 30 fps on the shared loop (../ticker); fewer puffs at
 * the 'low' effects level, one still frame at 'off' and under reduced motion.
 */
export function Fog({ density = 1 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const x = c?.getContext('2d');
    if (!c || !x) return;
    const level = fxLevel();
    const d = density * (level === 'full' ? 1 : 0.6);
    let W = 0;
    let H = 0;
    let drawn = false;
    const size = () => {
      const r = c.getBoundingClientRect();
      W = r.width;
      H = r.height;
      c.width = Math.round(W);
      c.height = Math.round(H);
      drawn = false;
      kick();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    const puffs = Array.from({ length: Math.round(14 * d) }, () => ({
      x: Math.random(),
      y: 0.45 + Math.random() * 0.6,
      r: 0.18 + Math.random() * 0.3,
      v: (Math.random() * 0.5 + 0.2) * (Math.random() < 0.5 ? -1 : 1) * 0.00012,
      b: Math.random() < 0.35,
    }));
    const motes = Array.from({ length: Math.round(60 * d) }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: Math.random() * 1.4 + 0.3,
      v: Math.random() * 0.00025 + 0.00005,
      p: Math.random() * 6.28,
    }));
    const sprites = new Map<string, { blue: HTMLCanvasElement; white: HTMLCanvasElement }>();
    const spritesFor = (light: boolean) => {
      const k = light ? 'light' : 'dark';
      let s = sprites.get(k);
      if (!s)
        sprites.set(
          k,
          (s = light
            ? { blue: puffSprite('rgba(20,122,240,0.06)', 'rgba(255,255,255,0)'), white: puffSprite('rgba(255,255,255,0.32)', 'rgba(255,255,255,0)') }
            : { blue: puffSprite('rgba(58,160,255,0.07)', 'rgba(0,0,0,0)'), white: puffSprite('rgba(200,210,225,0.05)', 'rgba(0,0,0,0)') }),
        );
      return s;
    };
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(c);
    let last = performance.now();
    const still = () => reducedMotion() || level === 'off';
    const stop = addEffect(
      (t) => {
        // Movement per millisecond, so 30 fps drifts as fast as 60 did.
        const step = Math.min(100, t - last) / 16;
        last = t;
        const frozen = still();
        // Obsidian adds light; Marble Day lays white mist over pale art, so it paints normally.
        const light = getTheme() === 'light';
        const sp = spritesFor(light);
        x.clearRect(0, 0, W, H);
        x.globalCompositeOperation = light ? 'source-over' : 'lighter';
        for (const p of puffs) {
          if (!frozen) {
            p.x += p.v * 16 * step;
            if (p.x > 1.4) p.x = -0.4;
            if (p.x < -0.4) p.x = 1.4;
          }
          const R = p.r * Math.max(W, H);
          x.drawImage(p.b ? sp.blue : sp.white, p.x * W - R, p.y * H - R, R * 2, R * 2);
        }
        for (const m of motes) {
          if (!frozen) {
            m.y -= m.v * 16 * step;
            m.p += 0.02 * step;
            if (m.y < -0.02) {
              m.y = 1.02;
              m.x = Math.random();
            }
          }
          const a = 0.25 + 0.35 * Math.sin(m.p + t * 0.001);
          x.fillStyle = light ? `rgba(20,110,225,${(a * 0.7).toFixed(3)})` : `rgba(160,205,255,${a.toFixed(3)})`;
          x.beginPath();
          x.arc(m.x * W + Math.sin(m.p) * 6, m.y * H, m.s, 0, 6.283);
          x.fill();
        }
        x.globalCompositeOperation = 'source-over';
        drawn = true;
      },
      { active: () => visible && !(drawn && still()), fps: 30 },
    );
    const onTheme = () => {
      drawn = false;
      kick();
    };
    addEventListener('oa-theme', onTheme);
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      removeEventListener('oa-theme', onTheme);
    };
  }, [density]);
  return <canvas ref={ref} aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }} />;
}

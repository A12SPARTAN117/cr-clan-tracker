'use client';

import { useEffect, useRef } from 'react';
import { reducedMotion } from './motion';

/** Drifting fog puffs and rising dust motes, drawn on a canvas that fills its parent. */
export function Fog({ density = 1 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const x = c?.getContext('2d');
    if (!c || !x) return;
    let W = 0;
    let H = 0;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const size = () => {
      const r = c.getBoundingClientRect();
      W = r.width;
      H = r.height;
      c.width = W * dpr;
      c.height = H * dpr;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    const puffs = Array.from({ length: Math.round(14 * density) }, () => ({
      x: Math.random(),
      y: 0.45 + Math.random() * 0.6,
      r: 0.18 + Math.random() * 0.3,
      v: (Math.random() * 0.5 + 0.2) * (Math.random() < 0.5 ? -1 : 1) * 0.00012,
      b: Math.random() < 0.35,
    }));
    const motes = Array.from({ length: Math.round(60 * density) }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: Math.random() * 1.4 + 0.3,
      v: Math.random() * 0.00025 + 0.00005,
      p: Math.random() * 6.28,
    }));
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);
    let raf = 0;
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      const still = reducedMotion();
      x.clearRect(0, 0, W, H);
      x.globalCompositeOperation = 'lighter';
      for (const p of puffs) {
        if (!still) {
          p.x += p.v * 16;
          if (p.x > 1.4) p.x = -0.4;
          if (p.x < -0.4) p.x = 1.4;
        }
        const R = p.r * Math.max(W, H);
        const g = x.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, R);
        g.addColorStop(0, p.b ? 'rgba(58,160,255,0.07)' : 'rgba(200,210,225,0.05)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.fillRect(p.x * W - R, p.y * H - R, R * 2, R * 2);
      }
      for (const m of motes) {
        if (!still) {
          m.y -= m.v * 16;
          m.p += 0.02;
          if (m.y < -0.02) {
            m.y = 1.02;
            m.x = Math.random();
          }
        }
        const a = 0.25 + 0.35 * Math.sin(m.p + t * 0.001);
        x.fillStyle = `rgba(160,205,255,${a.toFixed(3)})`;
        x.beginPath();
        x.arc(m.x * W + Math.sin(m.p) * 6, m.y * H, m.s, 0, 6.283);
        x.fill();
      }
      x.globalCompositeOperation = 'source-over';
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [density]);
  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
    />
  );
}

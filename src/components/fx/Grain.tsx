'use client';

import { useEffect, useRef } from 'react';
import { reducedMotion } from './motion';

/** Full-screen animated film grain at 1.5% opacity, ~12fps. */
export function Grain() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const x = c?.getContext('2d');
    if (!c || !x) return;
    const img = x.createImageData(160, 160);
    const draw = () => {
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      x.putImageData(img, 0, 0);
    };
    draw();
    let last = 0;
    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (reducedMotion() || document.hidden || t - last < 80) return;
      last = t;
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={ref}
      width={160}
      height={160}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0.015,
        mixBlendMode: 'screen',
        imageRendering: 'pixelated',
      }}
    />
  );
}

'use client';

import { createElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { reducedMotion } from './motion';

/** Fires once when the element is 15% in view. */
function useInViewOnce<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}

type Tag = 'h1' | 'h2' | 'h3' | 'div' | 'p' | 'span';

/** Title mask reveal: rises 28px and unmasks over 900ms when it enters the viewport. */
export function Reveal({
  as = 'div',
  className,
  style,
  children,
}: {
  as?: Tag;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [ref, seen] = useInViewOnce<HTMLElement>();
  return createElement(as, { ref, className: `${className ?? ''} ${seen ? 'oa-reveal-in' : 'oa-reveal-pre'}`, style }, children);
}

/** Hairline that draws in from the left (1100ms). */
export function Draw({ style }: { style?: CSSProperties }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>();
  return <div ref={ref} aria-hidden className={seen ? 'oa-draw-in' : 'oa-draw-pre'} style={{ height: 1, background: 'var(--hair)', ...style }} />;
}

const DIGITS = '0123456789';

/** Number decode: digits scramble and settle left to right over 420ms when first seen. */
export function Decode({ children, className, style }: { children: string | number; className?: string; style?: CSSProperties }) {
  const final = String(children);
  const [ref, seen] = useInViewOnce<HTMLSpanElement>();
  const [shown, setShown] = useState(final);
  const done = useRef(false);

  useEffect(() => {
    if (!seen || done.current) {
      setShown(final);
      return;
    }
    done.current = true;
    if (reducedMotion()) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = (t - t0) / 420;
      if (k >= 1) {
        setShown(final);
        return;
      }
      setShown(final.replace(/\d/g, (d, i: number) => (i / final.length < k ? d : DIGITS[(Math.random() * 10) | 0])));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      setShown(final);
    };
  }, [seen, final]);

  return (
    <span ref={ref} className={className} style={style}>
      <span className="sr-only">{final}</span>
      <span aria-hidden>{shown}</span>
    </span>
  );
}

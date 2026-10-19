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

/**
 * Reveal state that never waits on JavaScript for what's already on screen. The server HTML plays
 * the reveal with CSS alone ('auto'), so an above-the-fold title shows on first paint even while
 * the page is still loading. Once hydrated, anything that starts off screen is hidden ('pre')
 * and plays when scrolled to ('in').
 */
function useReveal<T extends Element>() {
  const ref = useRef<T>(null);
  const [phase, setPhase] = useState<'auto' | 'pre' | 'in'>('auto');
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) return; // on screen: the CSS reveal already ran
    // Hidden only after this check, so nothing on screen ever flashes away.
    setPhase('pre');
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPhase('in');
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, phase] as const;
}

type Tag = 'h1' | 'h2' | 'h3' | 'div' | 'p' | 'span';

/**
 * Title mask reveal: rises 28px and unmasks over 900ms when it enters the viewport.
 * The observed element stays unclipped; only the inner span is masked. (Chrome's
 * IntersectionObserver honours the target's own clip-path / transform, so a fully clipped
 * target never reports as visible and would stay hidden forever.)
 */
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
  const [ref, phase] = useReveal<HTMLElement>();
  return createElement(as, { ref, className, style }, <span className={`oa-reveal-${phase}`}>{children}</span>);
}

/** Hairline that draws in from the left (1100ms). */
export function Draw({ style }: { style?: CSSProperties }) {
  const [ref, phase] = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden style={{ height: 1, ...style, background: 'none' }}>
      <div className={`oa-draw-${phase}`} style={{ height: '100%', background: style?.background ?? 'var(--hair)' }} />
    </div>
  );
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

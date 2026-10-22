'use client';

import { fxLevel, stepDown } from './budget';

/**
 * One animation loop for every effect on the page. Each effect used to run its own
 * requestAnimationFrame loop that kept asking for frames even while it was off screen or paused,
 * and every frame asked for makes the browser commit and repaint the page: on a long page on a
 * phone that alone kept the CPU busy. Here:
 * - frames are only requested while some effect is active (on screen, tab visible);
 * - decorative effects pause after IDLE_MS without input (pointer, touch, scroll, keys) and
 *   resume on the next input, so someone reading a page costs nothing;
 * - each effect runs at its own frame rate (30 fps at the 'low' level);
 * - a watchdog steps the level down when frames keep coming in slow.
 */

export type Effect = {
  frame: (now: number) => void;
  /** False while there is nothing to draw (off screen, a still frame already drawn…). */
  active: () => boolean;
  fps: number;
  /** Pauses while the visitor is idle (true for everything decorative). */
  idlePause: boolean;
  last: number;
};

const IDLE_MS = 10_000;
const subs = new Set<Effect>();
let raf = 0;
let awakeUntil = 0;
let listening = false;

// Watchdog: frames slower than SLOW_MS for a whole window step the level down.
const SLOW_MS = 50;
const WINDOW_MS = 4000;
let winStart = 0;
let winFrames = 0;
let prev = 0;

function watch(now: number) {
  const gap = now - prev;
  prev = now;
  // A long gap is the tab coming back, or the loop restarting: not a slow frame.
  if (gap > 500 || !winStart) {
    winStart = now;
    winFrames = 0;
    return;
  }
  winFrames++;
  if (now - winStart < WINDOW_MS) return;
  if ((now - winStart) / winFrames > SLOW_MS && fxLevel() !== 'off') stepDown();
  winStart = now;
  winFrames = 0;
}

function loop(now: number) {
  raf = 0;
  if (document.hidden) return; // visibilitychange restarts it
  const awake = performance.now() < awakeUntil;
  const level = fxLevel();
  let any = false;
  let drew = false;
  for (const s of subs) {
    // A new effect always gets its first frame, so it never shows up blank.
    if (!s.active() || (s.idlePause && s.last && (!awake || level === 'off'))) continue;
    any = true;
    const fps = level === 'full' ? s.fps : Math.min(s.fps, 30);
    if (now - s.last < 1000 / fps - 2) continue;
    s.last = now;
    s.frame(now);
    drew = true;
  }
  if (drew) watch(now);
  if (any) raf = requestAnimationFrame(loop);
  else prev = 0;
}

/** Asks for frames again (an effect became active, input arrived, the tab came back). */
export function kick() {
  if (!raf && typeof document !== 'undefined' && !document.hidden) raf = requestAnimationFrame(loop);
}

function wake() {
  awakeUntil = performance.now() + IDLE_MS;
  kick();
}

function listen() {
  if (listening) return;
  listening = true;
  const opts = { passive: true, capture: true } as const;
  for (const ev of ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'scroll', 'keydown']) addEventListener(ev, wake, opts);
  document.addEventListener('visibilitychange', () => !document.hidden && wake());
  wake();
}

/** Runs `frame` on the shared loop. Returns the unsubscribe function. */
export function addEffect(frame: (now: number) => void, opts: { active?: () => boolean; fps?: number; idlePause?: boolean } = {}): () => void {
  listen();
  const s: Effect = { frame, active: opts.active ?? (() => true), fps: opts.fps ?? 60, idlePause: opts.idlePause ?? true, last: 0 };
  subs.add(s);
  kick();
  return () => {
    subs.delete(s);
  };
}

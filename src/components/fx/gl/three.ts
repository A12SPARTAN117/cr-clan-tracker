'use client';

import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { fxPixelRatio } from '../budget';
import { reducedMotion } from '../motion';
import { addEffect, kick } from '../ticker';

export type ThreeCtx = { renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera; el: HTMLElement; dpr: number };
export type ThreeScene = {
  /** Called every visible frame; `t` in seconds since mount, `still` under reduced motion. */
  frame: (t: number, dt: number, still: boolean) => void;
  resize?: (w: number, h: number) => void;
  dispose: () => void;
};

/**
 * Mounts a transparent WebGL canvas that fills `el`, and draws `setup`'s frames on the shared
 * loop (../ticker) only while the element is on screen, the tab is visible and the visitor isn't
 * idle, at `fps` frames a second. Returns a cleanup function (or null when WebGL is unavailable:
 * the page simply renders without the effect).
 */
export function mountThree(
  el: HTMLElement,
  setup: (ctx: ThreeCtx) => ThreeScene,
  opts: { fov?: number; z?: number; antialias?: boolean; fps?: number } = {},
): (() => void) | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: opts.antialias ?? false, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  const dpr = fxPixelRatio();
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  el.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(opts.fov ?? 50, 1, 0.1, 100);
  camera.position.set(0, 0, opts.z ?? 5);
  const s = setup({ renderer, scene, camera, el, dpr });

  const size = () => {
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    s.resize?.(w, h);
  };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(el);

  let visible = true;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) kick();
  });
  io.observe(el);

  const t0 = performance.now();
  let last = t0;
  let drawn = false;
  // Under reduced motion one frame is drawn and then nothing more.
  const stop = addEffect(
    (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      s.frame((now - t0) / 1000, dt, reducedMotion());
      renderer.render(scene, camera);
      drawn = true;
    },
    { active: () => visible && !(drawn && reducedMotion()), fps: opts.fps ?? 60 },
  );

  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
    s.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

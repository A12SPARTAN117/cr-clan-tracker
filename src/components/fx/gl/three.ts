'use client';

import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { reducedMotion } from '../motion';

export type ThreeCtx = { renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera; el: HTMLElement; dpr: number };
export type ThreeScene = {
  /** Called every visible frame; `t` in seconds since mount, `still` under reduced motion. */
  frame: (t: number, dt: number, still: boolean) => void;
  resize?: (w: number, h: number) => void;
  dispose: () => void;
};

/**
 * Mounts a transparent WebGL canvas that fills `el`, and runs `setup`'s frame loop only while
 * the element is on screen and the tab is visible. Returns a cleanup function (or null when
 * WebGL is unavailable: the page simply renders without the effect).
 */
export function mountThree(el: HTMLElement, setup: (ctx: ThreeCtx) => ThreeScene, opts: { fov?: number; z?: number; antialias?: boolean } = {}): (() => void) | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: opts.antialias ?? false, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  const dpr = Math.min(devicePixelRatio || 1, 2);
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
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(el);

  const t0 = performance.now();
  let last = t0;
  let raf = 0;
  let drawn = false;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    const still = reducedMotion();
    // Under reduced motion draw one frame and stop updating.
    if (still && drawn) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    s.frame((now - t0) / 1000, dt, still);
    renderer.render(scene, camera);
    drawn = true;
  };
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    s.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

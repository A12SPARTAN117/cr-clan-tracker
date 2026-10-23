'use client';

import { fxLevel } from '../budget';
import { getTheme } from '../motion';
import { modelView, mountPoints, perspective, setBlend } from './points';

const TAU = Math.PI * 2;

/** 2.8k dots on a crown: a band, the wall below it, five spikes, orbs on the tips and a top disc. */
function crownPoints(n: number): number[][] {
  const P: number[][] = [];
  for (let i = 0; i < n; i++) {
    const u = Math.random();
    if (u < 0.22) {
      const a = Math.random() * TAU;
      P.push([Math.cos(a) * 1.02, 0.55 + (Math.random() - 0.5) * 0.08, Math.sin(a) * 1.02]);
    } else if (u < 0.5) {
      const a = Math.random() * TAU;
      P.push([Math.cos(a), 0.55 - Math.random() * 0.5, Math.sin(a)]);
    } else if (u < 0.86) {
      const k = Math.floor(Math.random() * 5);
      const h = Math.random();
      const a = (k / 5) * TAU + (Math.random() - 0.5) * (1 - h) * 0.55;
      P.push([Math.cos(a), 0.05 - h * 0.95, Math.sin(a)]);
    } else if (u < 0.96) {
      const a0 = (Math.floor(Math.random() * 5) / 5) * TAU;
      const th = Math.random() * TAU;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 0.09;
      P.push([Math.cos(a0) + r * Math.sin(ph) * Math.cos(th), -0.98 + r * Math.cos(ph), Math.sin(a0) + r * Math.sin(ph) * Math.sin(th)]);
    } else {
      const a = Math.random() * TAU;
      const rr = Math.sqrt(Math.random()) * 0.9;
      P.push([Math.cos(a) * rr, 0.6, Math.sin(a) * rr]);
    }
  }
  return P;
}

const CAM_DIST = 3.2;

const vertex = /* glsl */ `
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  attribute vec3 position;
  attribute vec3 aScatter;
  attribute float aHi;
  uniform float uBurst;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vD;
  varying float vHi;
  void main() {
    vec3 p = mix(position, aScatter, uBurst);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float depth = -mv.z - ${CAM_DIST.toFixed(1)};
    float d = (1.0 - depth) * 0.5;
    float f = ${CAM_DIST.toFixed(1)} / (${CAM_DIST.toFixed(1)} + depth);
    vAlpha = clamp(0.25 + d * 0.75, 0.08, 1.0) * (1.0 - uBurst * 0.5);
    vD = d;
    vHi = aHi;
    gl_PointSize = (aHi > 0.5 ? 1.6 : 1.05) * f * uPixelRatio;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform float uLight;
  varying float vAlpha;
  varying float vD;
  varying float vHi;
  void main() {
    vec3 c = vHi > 0.5 ? vec3(140.0, 203.0, 255.0) / 255.0 : vec3(200.0 + vD * 40.0, 215.0 + vD * 30.0, 255.0) / 255.0;
    // Marble Day: black and blue, so it stands out on the pale daylight art the way the glowing
    // crown does at night. The body is near-black ink (a touch lighter toward the back for
    // depth); the highlight dots are the site's electric blue.
    vec3 ink = vHi > 0.5 ? vec3(0.02, 0.36, 0.95) : vec3(0.04 + vD * 0.07, 0.045 + vD * 0.07, 0.06 + vD * 0.07);
    c = mix(c, ink, uLight);
    float a = vHi > 0.5 ? vAlpha : vAlpha * 0.8;
    a = min(1.0, a * (1.0 + uLight * 0.25));
    gl_FragColor = vec4(c * a, a);
  }
`;

/** Mounts the particle crown into `el` (see ../ParticleCrown). Returns a cleanup function. */
export function mountCrown(el: HTMLElement, { count, scrollRoot }: { count?: number; scrollRoot?: React.RefObject<HTMLElement | null> }) {
  // 2.8k dots on desktop, 1.5k on phones and slower devices.
  const n = count ?? (innerWidth < 760 || fxLevel() !== 'full' ? 1500 : 2800);
  const base = crownPoints(n);
  const pos = new Float32Array(n * 3);
  const scat = new Float32Array(n * 3);
  const hi = new Float32Array(n);
  base.forEach(([x, y, z], i) => {
    // Prototype y grows downward (screen space); WebGL y grows upward.
    pos.set([x, -y, z], i * 3);
    const th = Math.random() * TAU;
    const ph = Math.acos(2 * Math.random() - 1);
    const r = 1.5 + Math.random() * 2.5;
    scat.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
    hi[i] = i % 9 === 0 ? 1 : 0;
  });

  let mx = 0;
  let my = 0;
  let tmx = 0;
  let tmy = 0;
  let rot = 0;
  let burst = 0;
  // The pointer is read once per frame, not on every move event (each read forces layout).
  let cx: number | null = null;
  let cy = 0;
  const onMove = (e: PointerEvent) => {
    cx = e.clientX;
    cy = e.clientY;
  };
  addEventListener('pointermove', onMove, { passive: true });

  // The hero's centrepiece: full frame rate, still frame only under reduced motion.
  const stop = mountPoints(
    el,
    { vertex, fragment },
    { position: { data: pos, size: 3 }, aScatter: { data: scat, size: 3 }, aHi: { data: hi, size: 1 } },
    ({ gl, dpr, u }) => {
      gl.uniform1f(u('uPixelRatio'), dpr);
      return {
        frame: (_t, _dt, still, size) => {
          if (cx !== null) {
            const b = el.getBoundingClientRect();
            tmx = ((cx - b.left) / b.width - 0.5) * 2;
            tmy = ((cy - b.top) / b.height - 0.5) * 2;
            cx = null;
          }
          const root = scrollRoot?.current ?? el;
          const r = root.getBoundingClientRect();
          const sp = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height * 0.9)));
          burst += ((still ? 0 : sp) - burst) * 0.08;
          if (!still) {
            mx += (tmx - mx) * 0.05;
            my += (tmy - my) * 0.05;
            rot += 0.0035;
          }
          // Match the prototype: 1 unit at the crown's centre = 0.32 × the shorter side.
          const visibleH = size.h / (0.32 * Math.min(size.w, size.h));
          const fov = (2 * Math.atan(visibleH / (2 * CAM_DIST)) * 180) / Math.PI;
          gl.uniformMatrix4fv(u('projectionMatrix'), false, perspective(fov, size.w / size.h, 0.1, 50));
          gl.uniformMatrix4fv(u('modelViewMatrix'), false, modelView(CAM_DIST, -0.32 + my * 0.25, -(rot + mx * 0.5)));
          gl.uniform1f(u('uBurst'), burst);
          const light = getTheme() === 'light';
          setBlend(gl, !light);
          gl.uniform1f(u('uLight'), light ? 1 : 0);
        },
      };
    },
    { fps: 60 },
  );

  return () => {
    stop?.();
    removeEventListener('pointermove', onMove);
  };
}

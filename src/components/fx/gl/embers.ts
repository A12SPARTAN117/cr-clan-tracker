'use client';

import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three';
import { mountThree } from './three';

const vertex = /* glsl */ `
  attribute vec4 aSeed;   // x, z, phase, speed
  attribute float aGold;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uPointer;
  varying float vAlpha;
  varying float vGold;
  void main() {
    float life = fract(aSeed.z + uTime * aSeed.w);
    // Rise from below the frame, sway sideways, drift away from the pointer.
    float y = -2.6 + life * 5.2;
    float x = aSeed.x + sin(uTime * 0.6 + aSeed.z * 12.0) * 0.25 + sin(life * 6.2831) * 0.12;
    vec3 p = vec3(x, y, aSeed.y);
    vec2 d = p.xy - uPointer * vec2(4.0, 2.4);
    p.xy += normalize(d + 0.0001) * 0.35 * exp(-dot(d, d) * 0.6);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    // Fade in at the bottom, out at the top, flicker a little.
    vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.65, 1.0, life)) * (0.65 + 0.35 * sin(uTime * 7.0 + aSeed.z * 40.0));
    vGold = aGold;
    gl_PointSize = (2.0 + aSeed.w * 50.0) * uPixelRatio * (4.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform float uIntensity;
  varying float vAlpha;
  varying float vGold;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, r) * vAlpha * uIntensity;
    vec3 blue = vec3(0.55, 0.8, 1.0);
    vec3 gold = vec3(1.0, 0.76, 0.42);
    gl_FragColor = vec4(mix(blue, gold, vGold) * a, a);
  }
`;

/** Mounts the ember scene into `el` (see ../EmberField). Returns a cleanup function. */
export function mountEmbers(el: HTMLElement, { count, gold, intensity }: { count: number; gold: number; intensity: number }) {
  const n = innerWidth < 760 ? Math.round(count * 0.5) : count;
  let pointer = { x: 9, y: 9 };
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    pointer = { x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: -((e.clientY - r.top) / r.height - 0.5) * 2 };
  };
  addEventListener('pointermove', onMove, { passive: true });
  const stop = mountThree(
    el,
    ({ scene, dpr }) => {
      const seed = new Float32Array(n * 4);
      const tint = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        seed.set([(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 3, Math.random(), 0.02 + Math.random() * 0.06], i * 4);
        tint[i] = Math.random() < gold ? 1 : 0;
      }
      const geo = new BufferGeometry();
      geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
      geo.setAttribute('aSeed', new BufferAttribute(seed, 4));
      geo.setAttribute('aGold', new BufferAttribute(tint, 1));
      const mat = new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: dpr }, uPointer: { value: [9, 9] }, uIntensity: { value: intensity } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        premultipliedAlpha: true,
      });
      const pts = new Points(geo, mat);
      pts.frustumCulled = false;
      scene.add(pts);
      let px = 9;
      let py = 9;
      return {
        frame: (t, _dt, still) => {
          mat.uniforms.uTime.value = still ? 12 : t;
          px += (pointer.x - px) * 0.08;
          py += (pointer.y - py) * 0.08;
          mat.uniforms.uPointer.value = [px, py];
        },
        dispose: () => {
          geo.dispose();
          mat.dispose();
        },
      };
    },
    { fov: 50, z: 4 },
  );
  return () => {
    removeEventListener('pointermove', onMove);
    stop?.();
  };
}

'use client';

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';
import { getTheme, reducedMotion } from '../motion';

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
    // Marble Day: the crown is drawn in ink, slate dots with glowing blue highlights.
    vec3 ink = vHi > 0.5 ? vec3(0.04, 0.4, 0.94) : vec3(0.16 - vD * 0.08, 0.24 - vD * 0.06, 0.38);
    c = mix(c, ink, uLight);
    float a = vHi > 0.5 ? vAlpha : vAlpha * 0.8;
    gl_FragColor = vec4(c * a, a);
  }
`;

/** Mounts the particle crown into `el` (see ../ParticleCrown). Returns a cleanup function. */
export function mountCrown(el: HTMLElement, { count, scrollRoot }: { count?: number; scrollRoot?: React.RefObject<HTMLElement | null> }) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null; // No WebGL: the scene still works without the crown.
  }
  const dpr = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  el.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(52, 1, 0.1, 50);
  camera.position.set(0, 0, CAM_DIST);

  // 2.8k dots on desktop, 1.5k on phones.
  const n = count ?? (innerWidth < 760 ? 1500 : 2800);
  const base = crownPoints(n);
  const pos = new Float32Array(n * 3);
  const scat = new Float32Array(n * 3);
  const hi = new Float32Array(n);
  base.forEach(([x, y, z], i) => {
    // Prototype y grows downward (screen space); three.js y grows upward.
    pos.set([x, -y, z], i * 3);
    const th = Math.random() * TAU;
    const ph = Math.acos(2 * Math.random() - 1);
    const r = 1.5 + Math.random() * 2.5;
    scat.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
    hi[i] = i % 9 === 0 ? 1 : 0;
  });
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('aScatter', new BufferAttribute(scat, 3));
  geo.setAttribute('aHi', new BufferAttribute(hi, 1));
  const mat = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: { uBurst: { value: 0 }, uPixelRatio: { value: dpr }, uLight: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    premultipliedAlpha: true,
  });
  const points = new Points(geo, mat);
  scene.add(points);

  const size = () => {
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Match the prototype: 1 unit at the crown's centre = 0.32 × the shorter side.
    const visibleH = h / (0.32 * Math.min(w, h));
    camera.fov = (2 * Math.atan(visibleH / (2 * CAM_DIST)) * 180) / Math.PI;
    camera.updateProjectionMatrix();
  };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(el);

  let mx = 0;
  let my = 0;
  let tmx = 0;
  let tmy = 0;
  let rot = 0;
  let burst = 0;
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    tmx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  addEventListener('pointermove', onMove, { passive: true });

  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(el);

  let raf = 0;
  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const still = reducedMotion();
    const root = scrollRoot?.current ?? el;
    const r = root.getBoundingClientRect();
    const sp = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height * 0.9)));
    burst += ((still ? 0 : sp) - burst) * 0.08;
    if (!still) {
      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;
      rot += 0.0035;
    }
    points.rotation.order = 'XYZ';
    points.rotation.y = -(rot + mx * 0.5);
    points.rotation.x = -0.32 + my * 0.25;
    mat.uniforms.uBurst.value = burst;
    const light = getTheme() === 'light';
    if (light !== mat.uniforms.uLight.value > 0.5) {
      mat.uniforms.uLight.value = light ? 1 : 0;
      mat.blending = light ? NormalBlending : AdditiveBlending;
      mat.needsUpdate = true;
    }
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('pointermove', onMove);
    ro.disconnect();
    io.disconnect();
    geo.dispose();
    mat.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

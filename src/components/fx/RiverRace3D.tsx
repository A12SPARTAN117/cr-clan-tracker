'use client';

import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  ShaderMaterial,
  type Material,
} from 'three';
import { mountThree } from './three';

export type RaceBoat = { tag: string; name: string; fame: number; us: boolean };

const water = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: /* glsl */ `
    uniform float uTime;
    uniform float uLanes;
    varying vec2 vUv;
    float hash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      // Thin current dashes drifting towards the finish (+x), each row at its own speed.
      float rows = uLanes * 7.0;
      float row = floor(uv.y * rows);
      float r = hash(row);
      float dash = smoothstep(0.82, 0.9, fract(uv.x * (3.0 + r * 3.0) + r * 7.0 - uTime * (0.08 + r * 0.1)));
      float thin = 1.0 - smoothstep(0.0, 0.12, abs(fract(uv.y * rows) - 0.5));
      float streak = dash * thin * (0.25 + r * 0.35);
      // Dotted rope dividers between lanes.
      float lane = abs(fract(uv.y * uLanes) - 0.5);
      float divider = smoothstep(0.485, 0.5, lane) * step(0.45, fract(uv.x * 40.0)) * 0.45;
      vec3 deep = vec3(0.02, 0.07, 0.15);
      vec3 shallow = vec3(0.04, 0.2, 0.36);
      vec3 col = mix(deep, shallow, 0.55 + 0.45 * cos(lane * 6.2831));
      col += vec3(0.55, 0.8, 1.0) * streak + vec3(0.9, 0.8, 0.55) * divider;
      // Fade the edges into the page.
      float edge = smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x) * smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);
      gl_FragColor = vec4(col, 0.95 * edge);
    }
  `,
};

/** A little boat: hull, mast and a pennant in the clan's colour. */
function makeBoat(us: boolean, mats: Material[]) {
  const g = new Group();
  const hullMat = new MeshLambertMaterial({ color: us ? 0x2a6fd6 : 0x4a4e57 });
  const deckMat = new MeshLambertMaterial({ color: us ? 0x8ccbff : 0x80868f });
  const sailMat = new MeshBasicMaterial({ color: us ? 0x8ccbff : 0xa4a9b4 });
  mats.push(hullMat, deckMat, sailMat);
  const hull = new Mesh(new BoxGeometry(0.9, 0.2, 0.42), hullMat);
  const bow = new Mesh(new ConeGeometry(0.21, 0.36, 4), hullMat);
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.x = Math.PI / 4;
  bow.position.set(0.62, 0, 0);
  bow.scale.set(1, 1, 0.7);
  const deck = new Mesh(new BoxGeometry(0.5, 0.12, 0.3), deckMat);
  deck.position.set(-0.1, 0.16, 0);
  const mast = new Mesh(new BoxGeometry(0.04, 0.8, 0.04), deckMat);
  mast.position.set(0.05, 0.55, 0);
  const sailGeo = new BufferGeometry();
  sailGeo.setAttribute('position', new Float32BufferAttribute([0.07, 0.92, 0, 0.07, 0.5, 0, 0.5, 0.75, 0], 3));
  sailGeo.computeVertexNormals();
  const sail = new Mesh(sailGeo, sailMat);
  sailMat.side = 2; // DoubleSide
  g.add(hull, bow, deck, mast, sail);
  return g;
}

/**
 * The current river race as a scene: one lane per clan on flowing water, each clan's boat as
 * far along as its fame (finish line at `finish` fame). Your clan's boat is blue. During
 * training days every boat waits at the start.
 */
export function RiverRace3D({ clans, finish = 10000, training = false, height = 220 }: { clans: RaceBoat[]; finish?: number; training?: boolean; height?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const key = clans.map((c) => `${c.tag}:${c.fame}:${c.us ? 1 : 0}`).join('|') + `|${finish}|${training}`;

  useEffect(() => {
    const el = host.current;
    if (!el || !clans.length) return;
    const lanes = clans.length;
    const W = 10;
    const D = lanes * 1.25;
    const stop = mountThree(
      el,
      ({ scene, camera }) => {
        const mats: Material[] = [];
        const geos: BufferGeometry[] = [];
        scene.add(new AmbientLight(0xffffff, 1.6));
        const sun = new DirectionalLight(0xdfefff, 1.4);
        sun.position.set(-3, 6, 4);
        scene.add(sun);

        const waterMat = new ShaderMaterial({
          vertexShader: water.vertex,
          fragmentShader: water.fragment,
          uniforms: { uTime: { value: 0 }, uLanes: { value: lanes } },
          transparent: true,
          depthWrite: false,
        });
        const waterGeo = new PlaneGeometry(W + 2, D + 0.6);
        const plane = new Mesh(waterGeo, waterMat);
        plane.rotation.x = -Math.PI / 2;
        scene.add(plane);
        mats.push(waterMat);
        geos.push(waterGeo);

        // Finish line: a gold bar across the river with posts.
        const goldMat = new MeshBasicMaterial({ color: 0xe6b34a });
        mats.push(goldMat);
        const lineGeo = new BoxGeometry(0.06, 0.02, D);
        const postGeo = new BoxGeometry(0.08, 0.9, 0.08);
        geos.push(lineGeo, postGeo);
        const fx = W / 2 - 0.4;
        const line = new Mesh(lineGeo, goldMat);
        line.position.set(fx, 0.02, 0);
        const p1 = new Mesh(postGeo, goldMat);
        p1.position.set(fx, 0.45, -D / 2 - 0.1);
        const p2 = new Mesh(postGeo, goldMat);
        p2.position.set(fx, 0.45, D / 2 + 0.1);
        scene.add(line, p1, p2);

        const startX = -W / 2 + 0.6;
        const boats = clans.map((c, i) => {
          const b = makeBoat(c.us, mats);
          const z = -D / 2 + (i + 0.5) * (D / lanes);
          const progress = training ? 0 : Math.min(1, c.fame / Math.max(1, finish));
          const tx = startX + progress * (fx - startX - 0.5);
          b.position.set(startX, 0.08, z);
          b.scale.setScalar(c.us ? 1.15 : 1);
          scene.add(b);
          return { b, tx, phase: i * 1.7 };
        });

        camera.position.set(0, 6.6, 3.6);
        camera.lookAt(0, 0, 0.2);
        return {
          frame: (t, _dt, still) => {
            waterMat.uniforms.uTime.value = still ? 0 : t;
            const k = still ? 1 : Math.min(1, t / 2.2);
            const ease = 1 - Math.pow(1 - k, 3);
            boats.forEach(({ b, tx, phase }) => {
              b.position.x = startX + (tx - startX) * ease;
              b.position.y = 0.08 + (still ? 0 : Math.sin(t * 2 + phase) * 0.04);
              b.rotation.x = still ? 0 : Math.sin(t * 1.6 + phase) * 0.06;
              b.rotation.z = still ? 0 : Math.sin(t * 1.3 + phase) * 0.03;
            });
          },
          resize: (w, h) => {
            // Fit the river's width on narrow screens.
            const aspect = w / h;
            const f = Math.max(1, 2.4 / aspect);
            camera.position.set(0, 6.6 * f, 3.6 * f);
            camera.lookAt(0, 0, 0.2);
          },
          dispose: () => {
            mats.forEach((m) => m.dispose());
            geos.forEach((g) => g.dispose());
            scene.traverse((o) => {
              if (o instanceof Mesh) o.geometry.dispose();
            });
          },
        };
      },
      { fov: 40, antialias: true },
    );
    return () => stop?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures every input
  }, [key]);

  return (
    <div
      ref={host}
      role="img"
      aria-label={`River race: ${clans.map((c) => `${c.name} ${c.fame} fame`).join(', ')}${training ? ' (training days, the race has not started)' : ''}`}
      data-fx="river"
      style={{ position: 'relative', width: '100%', height, borderRadius: 8, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 60%, rgba(10,72,201,.18), transparent 70%)' }}
    />
  );
}

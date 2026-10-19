'use client';

import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PlaneGeometry,
  Points,
  RepeatWrapping,
  RingGeometry,
  SRGBColorSpace,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  TorusGeometry,
  Vector3,
  type Material,
  type Texture,
} from 'three';
import { getTheme } from '../motion';
import { mountThree } from './three';

/** One side of the showdown: its colour, its art, and each stat scaled 0–1 against the others. */
export type Contender = {
  color: string;
  art: { src: string; kind: 'render' | 'card' | 'badge' } | null;
  /** Per stat, 0–1 (1 = best of the group); null = no value. */
  values: (number | null)[];
  /** Per stat, whether this contender leads it outright. */
  leads: boolean[];
  /** Leads the most stats overall: gets the crown. */
  champion: boolean;
};

/** Same-origin URL for official art (WebGL needs CORS; see /api/art); local art as is. */
const artUrl = (src: string) => (src.startsWith('/') ? src : `/api/art?src=${encodeURIComponent(src)}`);
const easeOut = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Soft round glow, white (tinted by the material). */
const glowTexture = () =>
  canvasTexture(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.25, 'rgba(255,255,255,.55)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
  });

/** "VS" in the site's heavy mono, with a blue glow. */
const vsTexture = () =>
  canvasTexture(256, 160, (g) => {
    g.font = '800 128px "JetBrains Mono", ui-monospace, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = 'rgba(58,160,255,.9)';
    g.shadowBlur = 24;
    g.fillStyle = '#f3f4f6';
    g.fillText('VS', 128, 84);
  });

/** A gold crown for the overall leader. */
const crownTexture = () =>
  canvasTexture(128, 96, (g) => {
    g.beginPath();
    g.moveTo(14, 82);
    g.lineTo(8, 22);
    g.lineTo(38, 50);
    g.lineTo(64, 10);
    g.lineTo(90, 50);
    g.lineTo(120, 22);
    g.lineTo(114, 82);
    g.closePath();
    const f = g.createLinearGradient(0, 10, 0, 82);
    f.addColorStop(0, '#fff1b8');
    f.addColorStop(0.5, '#f5c84a');
    f.addColorStop(1, '#b07a0c');
    g.fillStyle = f;
    g.shadowColor = 'rgba(245,200,74,.9)';
    g.shadowBlur = 14;
    g.fill();
    g.shadowBlur = 0;
    g.lineWidth = 4;
    g.strokeStyle = '#6b4500';
    g.stroke();
  });

/** A stat's number on the floor, matching the legend under the stage. */
const numberTexture = (k: number) =>
  canvasTexture(96, 96, (g) => {
    g.beginPath();
    g.arc(48, 48, 40, 0, Math.PI * 2);
    g.fillStyle = 'rgba(11,13,18,.85)';
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(140,203,255,.75)';
    g.stroke();
    g.font = '800 46px "JetBrains Mono", ui-monospace, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#f3f4f6';
    g.fillText(String(k), 48, 52);
  });

/** Light stripes that scroll along the river. */
const waterTexture = () => {
  const t = canvasTexture(64, 256, (g) => {
    g.fillStyle = 'rgba(58,160,255,.35)';
    g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = `rgba(140,203,255,${0.15 + (i % 3) * 0.12})`;
      g.fillRect(8 + ((i * 23) % 44), i * 28, 6 + (i % 2) * 6, 18);
    }
  });
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(1, 3);
  return t;
};

const emberVertex = /* glsl */ `
  attribute vec4 aSeed;   // x, z, phase, speed
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float life = fract(aSeed.z + uTime * aSeed.w);
    vec3 p = vec3(aSeed.x + sin(uTime * 0.7 + aSeed.z * 9.0) * 0.18, life * 5.0, aSeed.y);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vAlpha = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.6, 1.0, life));
    vColor = aColor;
    gl_PointSize = (3.0 + aSeed.w * 60.0) * uPixelRatio * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const emberFragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vAlpha;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

/**
 * The compare showdown (see ../../app/compare/CompareArena): an arena floor where each contender
 * gets a lane of glowing columns, one per stat, scaled against the others. Their art floats above
 * the lane in a spinning ring, embers rise in their colour, and the overall leader wears a crown.
 * Two contenders face off across a river under a VS sigil. Returns a cleanup function.
 */
export function mountShowdown(el: HTMLElement, { contenders }: { contenders: Contender[] }) {
  let pointer = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    pointer = { x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2)), y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2)) };
  };
  addEventListener('pointermove', onMove, { passive: true });

  const stop = mountThree(
    el,
    ({ scene, camera, dpr }) => {
      const n = contenders.length;
      const m = Math.max(1, ...contenders.map((c) => c.values.length));
      const owned: { dispose(): void }[] = [];
      const own = <T extends { dispose(): void }>(x: T) => (owned.push(x), x);
      const glow = own(glowTexture());
      const world = new Group();
      scene.add(world);

      // ---- arena floor: dark stone disc, faint rings ----
      const floorMat = own(new MeshBasicMaterial({ color: 0x0b0d12, transparent: true, opacity: 0.9 }));
      const floor = new Mesh(own(new CircleGeometry(8.5, 72)), floorMat);
      floor.rotation.x = -Math.PI / 2;
      world.add(floor);
      const ringMat = own(new MeshBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0.14, depthWrite: false }));
      for (const r of [2.2, 4.4, 6.6, 8.4]) {
        const ring = new Mesh(own(new RingGeometry(r, r + 0.02, 120)), ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.005;
        world.add(ring);
      }

      // ---- the stats: one group per stat on an arc facing the camera, contenders side by side ----
      const R = 7.5;
      const arc = Math.min(2.3, 0.3 * m);
      const cz = R * 0.55; // the arc's centre sits toward the camera, so the ends curve in
      const thetaOf = (j: number) => (m > 1 ? j / (m - 1) - 0.5 : 0) * arc;
      const groupW = m > 1 ? ((R * arc) / (m - 1)) * 0.78 : 1.6;
      const colW = Math.min(0.46, (groupW / n) * 0.82);
      const box = own(new BoxGeometry(1, 1, 1));
      box.translate(0, 0.5, 0);

      type Col = { mesh: Mesh; cap: Mesh; halo: Sprite | null; target: number; delay: number };
      const cols: Col[] = [];
      const lightMats: { mat: MeshBasicMaterial | SpriteMaterial; dark: number; light: number }[] = [];
      const bodies = contenders.map((c) => {
        const color = new Color(c.color);
        const body = own(new MeshBasicMaterial({ color, transparent: true, opacity: 0.82 }));
        lightMats.push({ mat: body, dark: 0.82, light: 0.95 });
        return { color, body, cap: own(new MeshBasicMaterial({ color: color.clone().lerp(new Color(0xffffff), 0.55) })) };
      });

      for (let j = 0; j < m; j++) {
        const th = thetaOf(j);
        const gx = Math.sin(th) * R;
        const gz = cz - Math.cos(th) * R;
        const tx = Math.cos(th);
        const tz = Math.sin(th);
        // A faint plinth under each group, and its number in front (matches the legend).
        const plinth = new Mesh(own(new PlaneGeometry(groupW * 1.05, colW * 2.4)), ringMat);
        plinth.rotation.set(-Math.PI / 2, 0, -th);
        plinth.position.set(gx, 0.008, gz);
        world.add(plinth);
        // Drawn on top so the bars never hide it.
        const num = new Sprite(own(new SpriteMaterial({ map: own(numberTexture(j + 1)), transparent: true, depthWrite: false, depthTest: false })));
        num.renderOrder = 10;
        num.scale.set(0.5, 0.5, 1);
        num.position.set(gx - Math.sin(th) * 1.15, 0.25, gz + Math.cos(th) * 1.15);
        world.add(num);
        contenders.forEach((c, i) => {
          const off = (i - (n - 1) / 2) * colW * 1.18;
          const x = gx + tx * off;
          const z = gz + tz * off;
          const mesh = new Mesh(box, bodies[i].body);
          mesh.position.set(x, 0, z);
          mesh.rotation.y = -th;
          mesh.scale.set(colW, 0.001, colW);
          const cap = new Mesh(box, bodies[i].cap);
          cap.rotation.y = -th;
          cap.scale.set(colW * 1.08, 0.08, colW * 1.08);
          cap.position.set(x, 0, z);
          world.add(mesh, cap);
          let halo: Sprite | null = null;
          if (c.leads[j]) {
            const hm = own(new SpriteMaterial({ map: glow, color: bodies[i].color, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.9 }));
            lightMats.push({ mat: hm, dark: 0.9, light: 0.55 });
            halo = new Sprite(hm);
            halo.scale.setScalar(colW * 3.4);
            halo.position.set(x, 0, z);
            world.add(halo);
          }
          const v = c.values[j];
          cols.push({ mesh, cap, halo, target: v == null ? 0.03 : 0.12 + v * 3.2, delay: 0.25 + j * 0.07 + i * 0.1 });
        });
      }

      // ---- floating art behind the arc, each in a spinning ring ----
      const loader = new TextureLoader();
      const textures: Texture[] = [];
      const artY = 4.7;
      const artZ = cz - R - 1.6;
      const artGap = n <= 2 ? 4.4 : n === 3 ? 3.3 : 2.7;
      const artX = (i: number) => (i - (n - 1) / 2) * artGap;
      const floaters: { g: Group; ring: Mesh; base: number }[] = [];
      contenders.forEach((c, i) => {
        const g = new Group();
        g.position.set(artX(i), artY, artZ);
        const color = new Color(c.color);
        const ring = new Mesh(own(new TorusGeometry(1.1, 0.028, 8, 96)), own(new MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })));
        const aura = new Sprite(own(new SpriteMaterial({ map: glow, color, transparent: true, opacity: 0.4, depthWrite: false, blending: AdditiveBlending })));
        aura.scale.setScalar(3.6);
        g.add(aura, ring);
        if (c.art) {
          const [w, h] = c.art.kind === 'card' ? [1.2, 1.78] : c.art.kind === 'badge' ? [1.5, 1.68] : [2.2, 2.2];
          const mat = own(new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
          loader.load(
            artUrl(c.art.src),
            (tex) => {
              tex.colorSpace = SRGBColorSpace;
              textures.push(tex);
              mat.map = tex;
              mat.needsUpdate = true;
            },
            undefined,
            () => {},
          );
          const plane = new Mesh(own(new PlaneGeometry(w, h)), mat);
          plane.position.z = 0.05;
          plane.userData.fade = mat;
          g.add(plane);
        }
        if (c.champion) {
          const crown = new Sprite(own(new SpriteMaterial({ map: own(crownTexture()), transparent: true, depthWrite: false })));
          crown.scale.set(1, 0.75, 1);
          crown.position.y = 1.62;
          crown.userData.crown = true;
          g.add(crown);
        }
        world.add(g);
        floaters.push({ g, ring, base: i * 1.7 });
      });

      // ---- one-on-one: a VS sigil between the two, over a river that runs through the arena ----
      let water: Texture | null = null;
      let vs: Group | null = null;
      if (n === 2) {
        water = own(waterTexture());
        const river = new Mesh(own(new PlaneGeometry(0.9, 18)), own(new MeshBasicMaterial({ map: water, transparent: true, opacity: 0.55, depthWrite: false })));
        river.rotation.x = -Math.PI / 2;
        river.position.set(0, 0.012, -2);
        world.add(river);
        vs = new Group();
        vs.position.set(0, artY - 0.2, artZ + 0.4);
        const vsPlane = new Mesh(own(new PlaneGeometry(1.4, 0.88)), own(new MeshBasicMaterial({ map: own(vsTexture()), transparent: true, depthWrite: false })));
        const vsRing = new Mesh(own(new TorusGeometry(0.9, 0.03, 8, 96)), own(new MeshBasicMaterial({ color: 0x8ccbff, transparent: true, opacity: 0.9 })));
        const vsAura = new Sprite(own(new SpriteMaterial({ map: glow, color: 0x3aa0ff, transparent: true, opacity: 0.45, depthWrite: false, blending: AdditiveBlending })));
        vsAura.scale.setScalar(3);
        vs.add(vsAura, vsRing, vsPlane);
        world.add(vs);
      }

      // ---- embers rising from the arc in each contender's colour ----
      const per = innerWidth < 760 ? 40 : 90;
      const count = per * n;
      const seed = new Float32Array(count * 4);
      const tint = new Float32Array(count * 3);
      contenders.forEach((c, i) => {
        const col = new Color(c.color);
        for (let k = 0; k < per; k++) {
          const q = i * per + k;
          const th = (Math.random() - 0.5) * arc * 1.1;
          const r = R + (Math.random() - 0.5) * 1.6;
          seed.set([Math.sin(th) * r, cz - Math.cos(th) * r, Math.random(), 0.04 + Math.random() * 0.08], q * 4);
          tint.set([col.r, col.g, col.b], q * 3);
        }
      });
      const pGeo = own(new BufferGeometry());
      pGeo.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
      pGeo.setAttribute('aSeed', new BufferAttribute(seed, 4));
      pGeo.setAttribute('aColor', new BufferAttribute(tint, 3));
      const pMat = own(
        new ShaderMaterial({
          vertexShader: emberVertex,
          fragmentShader: emberFragment,
          uniforms: { uTime: { value: 0 }, uPixelRatio: { value: dpr } },
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          premultipliedAlpha: true,
        }),
      );
      const embers = new Points(pGeo, pMat);
      embers.frustumCulled = false;
      world.add(embers);

      // ---- camera: a slow orbit, nudged by the pointer; pulled back on narrow screens ----
      let dist = 11;
      const look = new Vector3(0, 2, -2.2);
      // Widest thing on stage: the arc of stats, or the row of floating art.
      const span = Math.max(2 * R * Math.sin(arc / 2) + 1.8, (n - 1) * artGap + 3);
      let px = 0;
      let py = 0;
      let light = false;

      return {
        resize: (w, h) => {
          // Back off until the whole span fits the horizontal field of view (fov 40° is vertical).
          const half = Math.atan(Math.tan((20 * Math.PI) / 180) * (w / h));
          dist = Math.max(10, (span / 2 / Math.tan(half)) * (w / h < 1 ? 0.98 : 1.08) + (w / h < 1 ? 0.5 : 2));
        },
        frame: (t, dt, still) => {
          const isLight = getTheme() === 'light';
          if (isLight !== light) {
            light = isLight;
            floorMat.color.set(light ? 0xc9ced6 : 0x0b0d12);
            ringMat.color.set(light ? 0x0a63d6 : 0x3aa0ff);
            ringMat.opacity = light ? 0.22 : 0.14;
            for (const l of lightMats) {
              l.mat.opacity = light ? l.light : l.dark;
              if (l.mat instanceof SpriteMaterial) l.mat.blending = light ? NormalBlending : AdditiveBlending;
              l.mat.needsUpdate = true;
            }
            pMat.blending = light ? NormalBlending : AdditiveBlending;
            pMat.needsUpdate = true;
          }

          const time = still ? 30 : t;
          for (const c of cols) {
            const h = c.target * (still ? 1 : easeOut((t - c.delay) / 1.3));
            c.mesh.scale.y = Math.max(0.001, h);
            c.cap.position.y = h;
            if (c.halo) {
              c.halo.position.y = h + 0.15;
              (c.halo.material as SpriteMaterial).opacity = (light ? 0.55 : 0.75) + Math.sin(time * 3 + c.delay * 7) * 0.2;
            }
          }
          floaters.forEach((f) => {
            f.g.position.y = artY + Math.sin(time * 1.1 + f.base) * 0.12;
            f.ring.rotation.z = time * 0.6 + f.base;
            f.ring.rotation.x = Math.sin(time * 0.5 + f.base) * 0.35;
            for (const child of f.g.children) {
              const fade = child.userData.fade as Material | undefined;
              if (fade && (fade as MeshBasicMaterial).map) fade.opacity = Math.min(1, fade.opacity + (still ? 1 : dt * 1.8));
              if (child.userData.crown) child.position.y = 1.55 + Math.sin(time * 2) * 0.06;
            }
            f.g.lookAt(camera.position.x, f.g.position.y, camera.position.z);
          });
          if (vs) {
            vs.rotation.y = Math.sin(time * 0.8) * 0.25;
            (vs.children[1] as Mesh).rotation.z = time * 0.9;
            vs.lookAt(camera.position.x, vs.position.y, camera.position.z);
          }
          if (water) water.offset.y = still ? 0 : -t * 0.35;
          pMat.uniforms.uTime.value = time;

          px += (pointer.x - px) * 0.05;
          py += (pointer.y - py) * 0.05;
          const a = (still ? 0 : Math.sin(t * 0.12) * 0.16) + px * 0.12;
          camera.position.set(Math.sin(a) * dist, 5.4 + dist * 0.18 - py * 0.6, Math.cos(a) * dist);
          camera.lookAt(look);
        },
        dispose: () => {
          for (const o of owned) o.dispose();
          for (const t of textures) t.dispose();
        },
      };
    },
    { fov: 40, z: 11, antialias: true },
  );
  return () => {
    removeEventListener('pointermove', onMove);
    stop?.();
  };
}

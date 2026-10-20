'use client';

import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NormalBlending,
  PCFSoftShadowMap,
  PMREMGenerator,
  PlaneGeometry,
  Points,
  SRGBColorSpace,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  TorusGeometry,
  Vector3,
  type Texture,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { getTheme } from '../motion';
import { mountThree } from './three';

/** One side of the showdown: its colour, its clan badge, and each stat scaled 0–1 against the others. */
export type Contender = {
  color: string;
  /** The clan badge (a player's clan, or the clan itself); null for a player without a clan. */
  badge: string | null;
  /** Per stat, value ÷ the best value in that stat (lower-is-better stats inverted); null = no value. */
  values: (number | null)[];
  /** Per stat, whether this contender leads it outright. */
  leads: boolean[];
  /** Leads the most stats overall: gets the crown. */
  champion: boolean;
  /** The clan's league frame colours (light to dark) and tier (1–3), drawn as a metal ring with gems. */
  frame?: [string, string, string] | null;
  tier?: number;
};
/** A stat as the tiles show it: its title and each contender's formatted value. */
export type ShowdownStat = { title: string; values: string[] };

const easeOut = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
/** Rises with a slight overshoot and settles, like something heavy landing. */
const easeBack = (k: number) => {
  const x = Math.min(1, Math.max(0, k));
  const c = 1.2;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

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

/** The floor fades out at its edge so it melts into the stage's CSS background. */
const fadeTexture = () =>
  canvasTexture(256, 256, (g) => {
    const r = g.createRadialGradient(128, 128, 40, 128, 128, 128);
    r.addColorStop(0, '#fff');
    r.addColorStop(1, '#000');
    g.fillStyle = r;
    g.fillRect(0, 0, 256, 256);
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

/** Stand-in for a player without a clan: an empty shield. */
const noClanTexture = () =>
  canvasTexture(224, 252, (g) => {
    g.beginPath();
    g.moveTo(112, 10);
    g.lineTo(206, 44);
    g.quadraticCurveTo(206, 190, 112, 242);
    g.quadraticCurveTo(18, 190, 18, 44);
    g.closePath();
    g.fillStyle = 'rgba(30,34,44,.92)';
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = 'rgba(140,150,170,.7)';
    g.stroke();
    g.font = '700 30px "JetBrains Mono", ui-monospace, monospace';
    g.textAlign = 'center';
    g.fillStyle = 'rgba(200,206,220,.85)';
    g.fillText('NO', 112, 118);
    g.fillText('CLAN', 112, 154);
  });

const moteVertex = /* glsl */ `
  attribute vec4 aSeed;   // x, z, phase, speed
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float life = fract(aSeed.z + uTime * aSeed.w);
    vec3 p = vec3(aSeed.x + sin(uTime * 0.6 + aSeed.z * 9.0) * 0.12, life * 3.6, aSeed.y);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.55, 1.0, life)) * 0.7;
    vColor = aColor;
    gl_PointSize = (2.0 + aSeed.w * 30.0) * uPixelRatio * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const moteFragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vAlpha;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

/**
 * The compare showdown (see ../../app/compare/CompareArena): a lit stone stage with one tile per
 * stat, laid out in a grid and read like a page (left to right, back to front). On each tile every
 * contender gets a glossy column whose height is its value against the best in that stat, so the
 * columns are honest: equal values stand equally tall. The leader's column wears a gold cap. Each
 * tile carries an HTML plate with the stat and the real numbers. Behind the grid, each contender's
 * clan badge floats in its league frame (metal ring, tier gems); the overall leader gets a crown.
 * Returns a cleanup function.
 */
export function mountShowdown(el: HTMLElement, { contenders, stats: all, names = [] }: { contenders: Contender[]; stats: ShowdownStat[]; names?: string[] }) {
  // Phones (a stage taller than wide) show the first six stats, two to a row, so the plates stay
  // readable; the table under the stage has every stat.
  const narrow = el.clientWidth / Math.max(1, el.clientHeight) < 1.25;
  const stats = narrow ? all.slice(0, 6) : all;
  // Name plates ride above each contender's badge.
  const plates = names.map((n, i) => {
    const d = document.createElement('span');
    d.className = 'sd-name';
    d.style.setProperty('--c', contenders[i]?.color ?? '#3aa0ff');
    d.textContent = n;
    el.appendChild(d);
    return d;
  });
  // Stat plates are HTML (crisp at any size), pinned to the front edge of each tile every frame.
  const tags = stats.map((st, j) => {
    const d = document.createElement('div');
    d.className = 'sd-stat';
    const t = document.createElement('span');
    t.className = 'sd-stat-t';
    t.textContent = st.title;
    const v = document.createElement('span');
    v.className = 'sd-stat-v';
    st.values.forEach((val, i) => {
      const x = document.createElement('i');
      x.style.setProperty('--c', contenders[i]?.color ?? '#3aa0ff');
      if (contenders[i]?.leads[j]) x.dataset.lead = 'true';
      x.textContent = val;
      v.appendChild(x);
    });
    d.append(t, v);
    el.appendChild(d);
    return d;
  });
  let pointer = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    pointer = { x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2)), y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2)) };
  };
  addEventListener('pointermove', onMove, { passive: true });

  const stop = mountThree(
    el,
    ({ renderer, scene, camera, dpr }) => {
      const n = contenders.length;
      const m = Math.max(1, stats.length);
      const owned: { dispose(): void }[] = [];
      const own = <T extends { dispose(): void }>(x: T) => (owned.push(x), x);
      const glow = own(glowTexture());

      // ---- renderer: filmic tone, soft shadows, a studio environment for the reflections ----
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFSoftShadowMap;
      const pmrem = new PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const env = own(pmrem.fromScene(room, 0.04).texture);
      room.dispose();
      pmrem.dispose();
      scene.environment = env;

      const hemi = new HemisphereLight(0xbfdcff, 0x0b0d12, 0.7);
      const key = new DirectionalLight(0xffffff, 2.2);
      key.castShadow = true;
      key.shadow.mapSize.set(innerWidth < 760 ? 1024 : 2048, innerWidth < 760 ? 1024 : 2048);
      key.shadow.bias = -0.0004;
      key.shadow.normalBias = 0.02;
      key.shadow.radius = 4;
      const rim = new DirectionalLight(0x3aa0ff, 1.1);
      scene.add(hemi, key, key.target, rim);

      const world = new Group();
      scene.add(world);

      // ---- the grid: phones get three tiles a row, wider screens six ----
      const cols = Math.min(m, narrow ? 2 : 6);
      const rows = Math.ceil(m / cols);
      const T = 1.7; // tile size
      const GAP_X = narrow ? 1 : 0.42; // phones: wider gaps, the plates are wider than the tiles
      const P = T + GAP_X; // tile pitch across
      const GAP_Z = 1.65; // front to back, room for the stat plates between rows
      const PZ = T + GAP_Z;
      const W = cols * P - GAP_X;
      const D = rows * PZ - GAP_Z;
      const H = narrow ? 1.2 : 1.35; // the tallest column
      const tileAt = (j: number) => {
        const c = j % cols;
        const r = Math.floor(j / cols);
        // A short last row is centred.
        const inRow = r === rows - 1 ? m - r * cols : cols;
        return { x: (c - (inRow - 1) / 2) * P, z: (r - (rows - 1) / 2) * PZ };
      };

      // Floor: dark stone, fading out at its edge.
      const fade = own(fadeTexture());
      const floorMat = own(new MeshStandardMaterial({ color: 0x0d1017, roughness: 0.55, metalness: 0.1, transparent: true, alphaMap: fade, depthWrite: false }));
      const floorR = Math.max(W, D) * 0.85 + 2;
      const floor = new Mesh(own(new CircleGeometry(floorR, 64)), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      world.add(floor);

      const tileGeo = own(new RoundedBoxGeometry(T, 0.14, T, 3, 0.05));
      tileGeo.translate(0, -0.07, 0);
      const tileMat = own(new MeshStandardMaterial({ color: 0x242b3a, roughness: 0.38, metalness: 0.3, transparent: true, opacity: 0 }));
      const edgeMat = own(new MeshBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0, depthWrite: false }));
      const edgeGeo = own(new PlaneGeometry(T * 0.86, 0.03));

      const pw = Math.min(0.42, ((T * 0.8) / n) * 0.78); // column width
      const pitch = n > 1 ? Math.min(pw * 1.3, (T * 0.8 - pw) / (n - 1)) : 0;
      const bodies = contenders.map((c) => {
        const color = new Color(c.color);
        return own(
          new MeshPhysicalMaterial({
            color,
            roughness: 0.28,
            metalness: 0.1,
            clearcoat: 1,
            clearcoatRoughness: 0.15,
            emissive: color,
            emissiveIntensity: 0.12,
          }),
        );
      });
      const goldCap = own(new MeshStandardMaterial({ color: 0xf5c84a, roughness: 0.22, metalness: 0.9, emissive: 0xb07a0c, emissiveIntensity: 0.35 }));
      const capGeo = own(new RoundedBoxGeometry(pw * 1.12, 0.07, pw * 1.12, 2, 0.02));

      type Col = { mesh: Mesh; cap: Mesh | null; halo: Sprite | null; height: number; delay: number };
      const cols3: Col[] = [];
      const tiles: { mesh: Mesh; delay: number }[] = [];
      const tagAt: Vector3[] = [];
      const tagDelay: number[] = [];
      for (let j = 0; j < m; j++) {
        const { x: gx, z: gz } = tileAt(j);
        const delay = 0.15 + j * 0.06;
        const tile = new Mesh(tileGeo, tileMat);
        tile.position.set(gx, 0, gz);
        tile.receiveShadow = true;
        world.add(tile);
        tiles.push({ mesh: tile, delay });
        const edge = new Mesh(edgeGeo, edgeMat);
        edge.rotation.x = -Math.PI / 2;
        edge.position.set(gx, 0.004, gz + T / 2 - 0.12);
        world.add(edge);
        tagAt.push(new Vector3(gx, 0, gz + T / 2));
        tagDelay.push(delay + 0.6 + n * 0.08);

        contenders.forEach((c, i) => {
          const v = c.values[j];
          // Honest heights, with a sliver for zero so the column still reads as "there, but none".
          const height = v == null ? 0 : Math.max(0.04, v * H);
          if (!height) return;
          const geo = own(new RoundedBoxGeometry(pw, height, pw, 3, Math.min(0.045, height / 2.2)));
          geo.translate(0, height / 2, 0);
          const mesh = new Mesh(geo, bodies[i]);
          const x = gx + (i - (n - 1) / 2) * pitch;
          const z = gz + 0.22;
          mesh.position.set(x, 0, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.scale.y = 0.001;
          world.add(mesh);
          let cap: Mesh | null = null;
          let halo: Sprite | null = null;
          if (c.leads[j]) {
            cap = new Mesh(capGeo, goldCap);
            cap.position.set(x, 0, z);
            cap.castShadow = true;
            world.add(cap);
            const hm = own(new SpriteMaterial({ map: glow, color: 0xf5c84a, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 }));
            halo = new Sprite(hm);
            halo.scale.setScalar(pw * 2.2);
            halo.position.set(x, 0, z);
            world.add(halo);
          }
          cols3.push({ mesh, cap, halo, height, delay: delay + 0.2 + i * 0.08 });
        });
      }

      // Light and shadow camera cover the grid.
      const reach = Math.max(W, D) / 2 + 1.5;
      key.position.set(-reach * 0.6, reach * 1.6 + 4, reach * 1.1);
      key.target.position.set(0, 0, 0);
      Object.assign(key.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 0.5, far: reach * 6 + 10 });
      key.shadow.camera.updateProjectionMatrix();
      rim.position.set(reach, 3, -reach * 1.4);

      // ---- clan badges behind the grid, each in its league frame ----
      const loader = new TextureLoader();
      const textures: Texture[] = [];
      const artY = H + (narrow ? 0.85 : 0.75);
      const artZ = -D / 2 - 0.6;
      const artGap = Math.min(n <= 2 ? 3.6 : 2.7, (W + 1.5) / Math.max(1, n - 1 + (n === 2 ? 0.6 : 0)));
      const artX = (i: number) => (i - (n - 1) / 2) * artGap;
      const medal = narrow ? 0.62 : 0.72; // ring radius
      const floaters: { g: Group; ring: Group; art: MeshBasicMaterial; base: number }[] = [];
      contenders.forEach((c, i) => {
        const g = new Group();
        g.position.set(artX(i), artY, artZ);
        const color = new Color(c.color);
        const frame = c.frame ? c.frame.map((x) => new Color(x)) : null;
        const metal = (col: Color, rough = 0.25) => own(new MeshStandardMaterial({ color: col, metalness: 0.9, roughness: rough, emissive: col, emissiveIntensity: 0.08 }));
        const ring = new Group();
        ring.add(new Mesh(own(new TorusGeometry(medal, frame ? 0.075 : 0.045, 16, 96)), metal(frame ? frame[1] : color)));
        if (frame) {
          ring.add(new Mesh(own(new TorusGeometry(medal * 0.9, 0.018, 8, 96)), metal(frame[0], 0.3)));
          ring.add(new Mesh(own(new TorusGeometry(medal * 1.1, 0.018, 8, 96)), metal(frame[2], 0.3)));
        }
        const backing = new Mesh(own(new CircleGeometry(medal * 0.94, 64)), own(new MeshStandardMaterial({ color: 0x0b0d12, roughness: 0.6, metalness: 0.2, transparent: true, opacity: 0.85 })));
        backing.position.z = -0.02;
        const aura = new Sprite(own(new SpriteMaterial({ map: glow, color: frame ? frame[1] : color, transparent: true, opacity: 0.35, depthWrite: false, blending: AdditiveBlending })));
        aura.scale.setScalar(medal * 4.2);
        aura.position.z = -0.05;
        g.add(aura, backing, ring);
        if (frame) {
          const gem = own(new RoundedBoxGeometry(0.13, 0.13, 0.06, 1, 0.015));
          const gemMat = own(new MeshPhysicalMaterial({ color: frame[0], metalness: 0.2, roughness: 0.1, clearcoat: 1, emissive: frame[0], emissiveIntensity: 0.25 }));
          for (let k = 0; k < (c.tier ?? 0); k++) {
            const gm = new Mesh(gem, gemMat);
            gm.rotation.z = Math.PI / 4;
            gm.position.set((k - ((c.tier ?? 1) - 1) / 2) * 0.24, -medal - 0.16, 0.05);
            g.add(gm);
          }
        }
        const art = own(new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
        const plane = new Mesh(own(new PlaneGeometry(medal * 1.3, medal * 1.3 * 1.12)), art);
        plane.position.z = 0.04;
        g.add(plane);
        if (c.badge) {
          loader.load(
            c.badge,
            (tex) => {
              tex.colorSpace = SRGBColorSpace;
              tex.anisotropy = 4;
              textures.push(tex);
              art.map = tex;
              art.needsUpdate = true;
            },
            undefined,
            () => {},
          );
        } else {
          art.map = own(noClanTexture());
        }
        if (c.champion) {
          const crown = new Sprite(own(new SpriteMaterial({ map: own(crownTexture()), transparent: true, depthWrite: false, toneMapped: false })));
          crown.scale.set(0.82, 0.62, 1);
          crown.position.y = medal + 0.5;
          crown.userData.crown = true;
          g.add(crown);
        }
        world.add(g);
        floaters.push({ g, ring, art, base: i * 1.7 });
      });

      // ---- one-on-one: a VS sigil between the two badges ----
      let vs: Group | null = null;
      if (n === 2) {
        vs = new Group();
        vs.position.set(0, artY, artZ + 0.3);
        const vsPlane = new Mesh(own(new PlaneGeometry(0.95, 0.6)), own(new MeshBasicMaterial({ map: own(vsTexture()), transparent: true, depthWrite: false, toneMapped: false })));
        const vsRing = new Mesh(own(new TorusGeometry(0.58, 0.02, 8, 96)), own(new MeshBasicMaterial({ color: 0x8ccbff, transparent: true, opacity: 0.85, toneMapped: false })));
        const vsAura = new Sprite(own(new SpriteMaterial({ map: glow, color: 0x3aa0ff, transparent: true, opacity: 0.35, depthWrite: false, blending: AdditiveBlending })));
        vsAura.scale.setScalar(2.1);
        // Drawn last and over everything, so nothing translucent dims it.
        vsPlane.renderOrder = 5;
        (vsPlane.material as MeshBasicMaterial).depthTest = false;
        vs.add(vsAura, vsRing, vsPlane);
        world.add(vs);
      }

      // ---- a few motes drifting up off the stage, in each contender's colour ----
      const per = innerWidth < 760 ? 18 : 36;
      const count = per * n;
      const seed = new Float32Array(count * 4);
      const tint = new Float32Array(count * 3);
      contenders.forEach((c, i) => {
        const col = new Color(c.color);
        for (let k = 0; k < per; k++) {
          const q = i * per + k;
          seed.set([(Math.random() - 0.5) * (W + 1), (Math.random() - 0.5) * (D + 1), Math.random(), 0.03 + Math.random() * 0.06], q * 4);
          tint.set([col.r, col.g, col.b], q * 3);
        }
      });
      const pGeo = own(new BufferGeometry());
      pGeo.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
      pGeo.setAttribute('aSeed', new BufferAttribute(seed, 4));
      pGeo.setAttribute('aColor', new BufferAttribute(tint, 3));
      const pMat = own(
        new ShaderMaterial({
          vertexShader: moteVertex,
          fragmentShader: moteFragment,
          uniforms: { uTime: { value: 0 }, uPixelRatio: { value: dpr } },
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          premultipliedAlpha: true,
        }),
      );
      const motes = new Points(pGeo, pMat);
      motes.frustumCulled = false;
      world.add(motes);

      // ---- camera: looks down on the grid at a fixed angle; distance fitted so it all shows ----
      // Steep enough that the front row never hides the row behind it.
      const elev = narrow ? 0.95 : 0.9; // radians above the floor
      const top = artY + medal + (contenders.some((c) => c.champion) ? 1.45 : 0.75);
      // Aim at the middle of everything on stage, so the fit is even top and bottom.
      const look = new Vector3(0, top * 0.42, (artZ + D / 2 + 0.55) / 2);
      const probe = [
        ...[-1, 1].flatMap((sx) => [-1, 1].flatMap((sz) => [0, H].map((y) => new Vector3((sx * W) / 2, y, (sz * D) / 2 + (sz > 0 ? 0.55 : 0))))),
        // The badges, with room for the crown and the name plate above them.
        new Vector3(artX(0) - medal * 1.2, top, artZ),
        new Vector3(artX(n - 1) + medal * 1.2, artY + medal + 0.75, artZ),
      ];
      const place = (dist: number, yaw: number, lift: number) => {
        camera.position.set(Math.sin(yaw) * Math.cos(elev + lift) * dist, look.y + Math.sin(elev + lift) * dist, look.z + Math.cos(yaw) * Math.cos(elev + lift) * dist);
        camera.lookAt(look);
        camera.updateMatrixWorld();
      };
      const fits = (dist: number) => {
        place(dist, 0, 0);
        return probe.every((p, k) => {
          const q = p.clone().project(camera);
          // The badges' probes leave room above for the HTML name plate.
          return Math.abs(q.x) < 0.95 && q.y < (k >= 8 ? 0.84 : 0.95) && q.y > -0.9;
        });
      };
      let dist = 12;
      let px = 0;
      let py = 0;
      let light = false;
      let plateW = 0;
      const setLight = (on: boolean) => {
        light = on;
        floorMat.color.set(on ? 0xb4bcc8 : 0x0d1017);
        tileMat.color.set(on ? 0xd3d9e2 : 0x242b3a);
        edgeMat.color.set(on ? 0x0a63d6 : 0x3aa0ff);
        hemi.color.set(on ? 0xffffff : 0xbfdcff);
        hemi.groundColor.set(on ? 0x9aa3b2 : 0x0b0d12);
        hemi.intensity = on ? 0.8 : 0.7;
        key.intensity = on ? 1.8 : 2.2;
        rim.intensity = on ? 0.4 : 1.1;
        scene.environmentIntensity = on ? 0.5 : 0.55;
        renderer.toneMappingExposure = on ? 0.88 : 1.05;
        // Additive glows read as white smudges on a pale stage; the gold caps carry the lead alone.
        for (const c of cols3) if (c.halo) c.halo.visible = !on;
        pMat.blending = on ? NormalBlending : AdditiveBlending;
        pMat.needsUpdate = true;
      };
      setLight(getTheme() === 'light');

      return {
        resize: () => {
          let lo = 4;
          let hi = 60;
          for (let k = 0; k < 22; k++) {
            const mid = (lo + hi) / 2;
            if (fits(mid)) hi = mid;
            else lo = mid;
          }
          dist = hi;
        },
        frame: (t, dt, still) => {
          const isLight = getTheme() === 'light';
          if (isLight !== light) setLight(isLight);
          const time = still ? 30 : t;
          const at = (d: number) => (still ? 1 : (t - d) / 0.9);

          tileMat.opacity = still ? 1 : easeOut(t / 0.6);
          edgeMat.opacity = (light ? 0.5 : 0.4) * tileMat.opacity;
          for (const tl of tiles) {
            const k = easeOut(at(tl.delay));
            tl.mesh.position.y = (1 - k) * -0.25;
          }
          for (const c of cols3) {
            const k = still ? 1 : easeBack((t - c.delay) / 1.1);
            const h = c.height * Math.max(0.001, k);
            c.mesh.scale.y = Math.max(0.001, k);
            if (c.cap) c.cap.position.y = h + 0.035;
            if (c.halo) {
              c.halo.position.y = h + 0.06;
              const on = Math.min(1, Math.max(0, at(c.delay + 0.8)));
              (c.halo.material as SpriteMaterial).opacity = on * ((light ? 0.25 : 0.4) + Math.sin(time * 2.4 + c.delay * 7) * 0.1);
            }
          }
          tags.forEach((d, j) => {
            const k = still ? 1 : Math.min(1, Math.max(0, (t - tagDelay[j]) / 0.4));
            d.style.opacity = String(k);
          });
          floaters.forEach((f, i) => {
            const k = still ? 1 : easeOut((t - 0.3 - i * 0.12) / 0.9);
            f.g.position.y = artY + (1 - k) * 0.6 + Math.sin(time * 1.1 + f.base) * 0.06;
            f.g.scale.setScalar(0.7 + k * 0.3);
            f.ring.rotation.z = Math.sin(time * 0.4 + f.base) * 0.25;
            f.ring.rotation.y = Math.sin(time * 0.7 + f.base) * 0.18;
            if (f.art.map) f.art.opacity = Math.min(k, f.art.opacity + (still ? 1 : dt * 2.2));
            for (const child of f.g.children) if (child.userData.crown) child.position.y = medal + 0.5 + Math.sin(time * 2) * 0.04;
            f.g.lookAt(camera.position);
          });
          if (vs) {
            const k = still ? 1 : easeOut((t - 0.6) / 0.8);
            vs.scale.setScalar(Math.max(0.001, k));
            (vs.children[1] as Mesh).rotation.z = time * 0.9;
            vs.lookAt(camera.position);
          }
          pMat.uniforms.uTime.value = time;

          // A short glide in from higher and further, then a slow sway nudged by the pointer.
          px += (pointer.x - px) * 0.05;
          py += (pointer.y - py) * 0.05;
          const intro = still ? 1 : easeOut(t / 1.8);
          const yaw = (still ? 0 : Math.sin(t * 0.15) * 0.06) + px * 0.08;
          place(dist * (1 + (1 - intro) * 0.18), yaw, (1 - intro) * 0.18 - py * 0.03);

          const w = el.clientWidth;
          const h = el.clientHeight;
          const scratch = new Vector3();
          // Plates never get wider than the gap between neighbouring tiles' plates.
          if (cols > 1) {
            const x0 = scratch.copy(tagAt[0]).project(camera).x;
            const x1 = scratch.copy(tagAt[1]).project(camera).x;
            const room = Math.round(((x1 - x0) / 2) * w - 8);
            if (room !== plateW) el.style.setProperty('--sd-w', `${(plateW = room)}px`);
          }
          tags.forEach((d, j) => {
            scratch.copy(tagAt[j]).project(camera);
            d.style.transform = `translate(-50%, 4px) translate(${((scratch.x + 1) / 2) * w}px, ${((1 - scratch.y) / 2) * h}px)`;
          });
          plates.forEach((d, i) => {
            const f = floaters[i];
            if (!f) return;
            // In the badge's own frame (it faces the camera), so the plate sits just above it or its crown.
            f.g.updateMatrixWorld();
            f.g.localToWorld(scratch.set(0, medal + (contenders[i]?.champion ? 0.9 : 0.2), 0)).project(camera);
            d.style.transform = `translate(-50%, -100%) translate(${((scratch.x + 1) / 2) * w}px, ${((1 - scratch.y) / 2) * h}px)`;
          });
        },
        dispose: () => {
          scene.environment = null;
          for (const o of owned) o.dispose();
          for (const t of textures) t.dispose();
        },
      };
    },
    // A long lens: little perspective growth toward the front, so rows read evenly.
    { fov: 22, z: 16, antialias: true },
  );
  return () => {
    removeEventListener('pointermove', onMove);
    for (const d of [...tags, ...plates]) d.remove();
    stop?.();
  };
}

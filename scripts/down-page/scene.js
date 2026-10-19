// The 503 page's "we got three-crowned" scene. Bundled (three.js included, minified) by
// scripts/bundle-down-scene.mjs and inlined into public/down.html, so the down page stays one file.
//
// Our two princess towers and king tower (shaped like the game's, outlined like a hologram) stand
// with full health bars. Three of the enemy's red-banded crowns drop out of the sky one after
// another: each impact drains a tower's health bar, sends out a shockwave, sparks, dust and
// rubble, and lights up one crown in the page's 0–3 counter (a `crowned` event on window). Then
// the crowns rise into a row over a red ribbon, like the game's results screen. Tap "Watch again"
// to replay. Reduced motion shows the final frame. No WebGL: the static crown icon stays.
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  Fog,
  GridHelper,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Points,
  PointsMaterial,
  RingGeometry,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const host = document.getElementById('stage');
const replayBtn = document.getElementById('replay');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const crowned = (n) => dispatchEvent(new CustomEvent('crowned', { detail: n }));

// Timeline (seconds): a beat to see the towers standing, three hits, then the results row.
const DROP = 0.7;
const HITS = [1.5, 2.75, 4.05];
const FINALE = 5.1;
const FINALE_LEN = 1.1;
const END = FINALE + FINALE_LEN + 0.3;

const ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.pow(1 - k, 3));
const easeInOut = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.redraw = (...a) => {
    const g = c.getContext('2d');
    g.clearRect(0, 0, w, h);
    draw(g, ...a);
    t.needsUpdate = true;
  };
  return t;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function start() {
  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return; // no WebGL: the static crown icon stays
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Three red crowns smash our three towers one after another: we got three-crowned');
  host.prepend(renderer.domElement);
  host.classList.add('live');

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 2, 0.1, 100);
  const look = new Vector3(0, 2.15, -0.2);
  // The floor fades into the page background instead of ending at a hard edge.
  scene.fog = new Fog(0x07080a, 11, 24);
  // A soft studio environment for reflections: it's what makes the gold read as real metal.
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;

  scene.add(new HemisphereLight(0xbcd6ff, 0x161a22, 0.7));
  scene.add(new AmbientLight(0x8ca6c8, 0.25));
  const sun = new DirectionalLight(0xfff1dc, 2.4);
  sun.position.set(-4, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  sun.shadow.bias = -0.0008;
  sun.shadow.radius = 4;
  scene.add(sun);
  const rim = new DirectionalLight(0x3aa0ff, 1.8);
  rim.position.set(4, 3, -6);
  scene.add(rim);
  const flash = new PointLight(0xffd27a, 0, 10);
  scene.add(flash);

  const mat = (color, o = {}) => new MeshStandardMaterial({ color, roughness: 0.75, ...o });
  // Reflections are for the gold; stone and plaster keep only a little, or they wash out white.
  const stone = mat(0x5a606a, { roughness: 0.85, envMapIntensity: 0.3 });
  const stoneDark = mat(0x3e434b, { roughness: 0.9, envMapIntensity: 0.3 });
  const ivory = mat(0xe4ddd0, { roughness: 0.6, envMapIntensity: 0.45 });
  const red = mat(0xc8283a, { roughness: 0.5, emissive: 0x3a0008, emissiveIntensity: 0.35 });
  const plaque = mat(0x2a2e36, { roughness: 0.5 });
  const gold = mat(0xffc23d, { metalness: 1, roughness: 0.26, emissive: 0x4a2a00, emissiveIntensity: 0.35 });
  const goldInner = mat(0xd9962a, { metalness: 1, roughness: 0.4 });
  const skin = mat(0xf1c29a, { roughness: 0.55 });

  // The "digital" look: every block is outlined with a thin glowing edge, like a hologram of the arena.
  const edgeBlue = new LineBasicMaterial({ color: 0x8ccbff, transparent: true, opacity: 0.4, blending: AdditiveBlending, depthWrite: false });
  const edgeGold = new LineBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false });
  function edged(mesh, m = edgeBlue) {
    mesh.add(new LineSegments(new EdgesGeometry(mesh.geometry, 28), m));
    return mesh;
  }
  const box = (w, h, d, material, x, y, z) => {
    const m = edged(new Mesh(new BoxGeometry(w, h, d), material));
    m.position.set(x, y, z);
    return m;
  };
  const shadows = (o) => o.traverse((m) => m.isMesh && (m.castShadow = m.receiveShadow = true));

  // ---- holographic arena floor: dark stone, a blue grid, the river and bridges ----
  // The floor fades out at its edge, so there's no horizon line against the page.
  const fade = canvasTexture(256, 256, (g) => {
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, '#fff');
    r.addColorStop(0.55, '#fff');
    r.addColorStop(1, '#000');
    g.fillStyle = r;
    g.fillRect(0, 0, 256, 256);
  });
  fade.redraw();
  const floor = new Mesh(new CircleGeometry(11, 64), mat(0x161a21, { roughness: 1, alphaMap: fade, transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new GridHelper(18, 36, 0x3aa0ff, 0x3aa0ff);
  grid.material.transparent = true;
  grid.material.opacity = 0.12;
  grid.material.depthWrite = false;
  grid.position.y = 0.005;
  scene.add(grid);
  const river = new Mesh(new PlaneGeometry(18, 0.7), new MeshBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0.32 }));
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.01, 2.1);
  scene.add(river);
  for (const x of [-2.2, 2.2]) {
    const b = box(0.9, 0.08, 1, stoneDark, x, 0.04, 2.1);
    b.receiveShadow = true;
    scene.add(b);
  }

  // ---- the gold crown on a tower's front plaque ----
  function emblem(w) {
    const g = new Group();
    g.add(box(w, w * 0.62, 0.05, plaque, 0, 0, 0));
    const cw = w * 0.62;
    g.add(box(cw, cw * 0.28, 0.06, gold, 0, -cw * 0.12, 0.03));
    for (const k of [-1, 0, 1]) g.add(box(cw * 0.22, cw * 0.22, 0.06, gold, (k * cw) / 2.6, cw * 0.13, 0.03));
    return g;
  }

  // ---- the people on top ----
  function miniCrown(r, y) {
    const g = new Group();
    g.add(new Mesh(new CylinderGeometry(r, r, r * 0.7, 16), gold));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const m = new Mesh(new BoxGeometry(r * 0.42, r * 0.5, r * 0.18), gold);
      m.position.set(Math.sin(a) * r * 0.9, r * 0.55, Math.cos(a) * r * 0.9);
      m.rotation.y = a;
      g.add(m);
    }
    g.position.y = y;
    return g;
  }
  function princess(y) {
    const g = new Group();
    const dress = new Mesh(new ConeGeometry(0.21, 0.44, 16), red);
    dress.position.y = y + 0.22;
    const head = new Mesh(new SphereGeometry(0.135, 18, 14), skin);
    head.position.y = y + 0.54;
    const hair = new Mesh(new SphereGeometry(0.15, 18, 14), mat(0xa04a1c, { roughness: 0.6 }));
    hair.position.set(0, y + 0.58, -0.04);
    hair.scale.set(1, 0.9, 1);
    const bow = new Mesh(new TorusGeometry(0.21, 0.016, 6, 24, Math.PI), mat(0x8a4a1c));
    bow.rotation.set(0, 0, Math.PI / 2);
    bow.position.set(0.17, y + 0.38, 0.14);
    g.add(dress, hair, head, bow, miniCrown(0.075, y + 0.71));
    return g;
  }
  function king(y) {
    const g = new Group();
    const body = edged(new Mesh(new CylinderGeometry(0.22, 0.3, 0.5, 18), red));
    body.position.y = y + 0.25;
    const collar = new Mesh(new TorusGeometry(0.2, 0.05, 8, 24), ivory);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = y + 0.5;
    const head = new Mesh(new SphereGeometry(0.17, 18, 14), skin);
    head.position.y = y + 0.66;
    const beard = new Mesh(new SphereGeometry(0.13, 16, 12), mat(0x4a2a14));
    beard.scale.set(1.1, 0.75, 0.7);
    beard.position.set(0, y + 0.58, 0.1);
    g.add(body, collar, head, beard, miniCrown(0.11, y + 0.86));
    return g;
  }

  // ---- health bars, like the game's: a blue bar with the hit points on it ----
  function hpBar(max) {
    const tex = canvasTexture(256, 64, (g, frac) => {
      roundRect(g, 4, 10, 248, 44, 12);
      g.fillStyle = 'rgba(8,12,20,.85)';
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = 'rgba(140,203,255,.55)';
      g.stroke();
      if (frac > 0) {
        roundRect(g, 10, 16, Math.max(24, 236 * frac), 32, 8);
        const f = g.createLinearGradient(0, 16, 0, 48);
        f.addColorStop(0, frac > 0.3 ? '#7cc6ff' : '#ff8a8a');
        f.addColorStop(1, frac > 0.3 ? '#1f78e0' : '#c8283a');
        g.fillStyle = f;
        g.fill();
      }
      g.font = '800 28px "Space Grotesk", system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.lineWidth = 6;
      g.strokeStyle = '#06204a';
      g.fillStyle = '#fff';
      const txt = Math.round(max * frac).toLocaleString('en-US');
      g.strokeText(txt, 128, 34);
      g.fillText(txt, 128, 34);
    });
    tex.redraw(1);
    const sprite = new Sprite(new SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.renderOrder = 10;
    return { sprite, tex, max, shown: 1 };
  }

  // ---- towers, shaped like the game's: a stone tower with a white parapet and red trim, the gold
  // crown on the front and the princess or king on top. Built from blocks so they can fall apart;
  // child 0 is the stone body that stays standing as a stump. ----
  function tower(x, z, s, who, hp) {
    const g = new Group();
    const w = 1.1 * s;
    const h = 1.05 * s;
    // A square, slightly tapered body (a 4-sided cylinder turned 45°).
    const body = edged(new Mesh(new CylinderGeometry((w * 0.92) / Math.SQRT2, w / Math.SQRT2, h, 4, 1), stone));
    body.rotation.y = Math.PI / 4;
    body.position.y = h / 2 + 0.1 * s;
    g.add(body);
    g.add(box(w * 1.12, 0.12 * s, w * 1.12, stoneDark, 0, 0.06 * s, 0)); // plinth
    for (const k of [0.36, 0.68]) g.add(box(w * (1 - k * 0.08) + 0.02, 0.035 * s, w * (1 - k * 0.08) + 0.02, stoneDark, 0, 0.1 * s + h * k, 0));
    const top = 0.1 * s + h;
    const pw = w * 1.22;
    g.add(box(pw, 0.16 * s, pw, ivory, 0, top + 0.08 * s, 0)); // platform
    const ph = 0.24 * s;
    const py = top + 0.16 * s + ph / 2;
    const c = pw / 2 - 0.12 * s;
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.26 * s, ph * 1.15, 0.26 * s, ivory, a * c, py + ph * 0.07, b * c));
    for (const sgn of [-1, 1]) {
      g.add(box(pw - 0.5 * s, ph * 0.7, 0.07 * s, red, 0, py - ph * 0.1, sgn * c));
      g.add(box(0.07 * s, ph * 0.7, pw - 0.5 * s, red, sgn * c, py - ph * 0.1, 0));
    }
    const e = emblem(w * 0.5);
    e.position.set(0, 0.1 * s + h * 0.55, (w * 0.96) / 2 + 0.02);
    e.rotation.x = -0.04;
    g.add(e);
    g.add(who(top + 0.16 * s));
    shadows(g);
    g.position.set(x, 0, z);
    scene.add(g);
    // What each part looked like, so a replay can rebuild the tower.
    const saved = g.children.map((ch) => ({ ch, visible: ch.visible, sy: ch.scale.y, py: ch.position.y }));
    const bar = hpBar(hp);
    bar.sprite.scale.set(1.25 * s, 0.31 * s, 1);
    bar.sprite.position.set(x, top + 1.25 * s, z);
    scene.add(bar.sprite);
    return { g, topY: top + 0.9 * s, scale: s, saved, bar };
  }
  // Left princess, right princess, then the king: the order a three-crown goes.
  const towers = [tower(-2.2, 0.4, 1, princess, 4008), tower(2.2, 0.4, 1, princess, 4008), tower(0, -1.3, 1.4, king, 6408)];

  // ---- crowns, shaped like the game's: a gold castle-rim crown on a coloured band with gold
  // diamond studs. They're the enemy's crowns (red), the ones that three-crowned us. ----
  function crown() {
    const g = new Group();
    const R = 0.5;
    const r = 0.42;
    const band = edged(new Mesh(new CylinderGeometry(0.56, 0.56, 0.26, 48), mat(0xe2283c, { roughness: 0.32, emissive: 0x4a0010, emissiveIntensity: 0.4 })), edgeGold);
    const outer = new Mesh(new CylinderGeometry(R, R * 0.97, 0.32, 48, 1, true), gold);
    outer.position.y = 0.29;
    const inner = new Mesh(new CylinderGeometry(r, r, 0.32, 48, 1, true), goldInner.clone());
    inner.material.side = BackSide;
    inner.position.y = 0.29;
    const lip = new Mesh(new RingGeometry(r, R, 48), gold.clone());
    lip.material.side = DoubleSide;
    lip.rotation.x = -Math.PI / 2;
    lip.position.y = 0.45;
    g.add(band, outer, inner, lip);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const m = edged(new Mesh(new BoxGeometry(0.27, 0.24, R - r + 0.02), gold), edgeGold);
      m.position.set(Math.sin(a) * (R + r) * 0.5, 0.57, Math.cos(a) * (R + r) * 0.5);
      m.rotation.y = a;
      g.add(m);
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const st = new Mesh(new OctahedronGeometry(0.1), gold);
      st.scale.set(1, 1, 0.45);
      st.rotation.y = a;
      st.position.set(Math.sin(a) * 0.57, 0, Math.cos(a) * 0.57);
      g.add(st);
    }
    for (const ch of g.children) ch.position.y -= 0.28; // pivot at the crown's middle
    shadows(g);
    g.visible = false;
    scene.add(g);
    return g;
  }
  const crowns = towers.map(() => crown());
  // In the results row the king's crown sits in the middle, a little higher and bigger.
  const ROW = [
    { x: -1.55, y: 3.2, s: 1.05 },
    { x: 1.55, y: 3.2, s: 1.05 },
    { x: 0, y: 3.42, s: 1.2 },
  ];
  const ROW_Z = 1.3;

  // The red ribbon behind the results row, like the game's "Winner!" banner.
  const ribbonTex = canvasTexture(1024, 200, (g) => {
    g.beginPath();
    g.moveTo(0, 30);
    g.lineTo(90, 30);
    g.lineTo(90, 170);
    g.lineTo(0, 170);
    g.lineTo(40, 100);
    g.closePath();
    g.moveTo(1024, 30);
    g.lineTo(934, 30);
    g.lineTo(934, 170);
    g.lineTo(1024, 170);
    g.lineTo(984, 100);
    g.closePath();
    g.fillStyle = '#8e1424';
    g.fill();
    roundRect(g, 70, 14, 884, 172, 14);
    const f = g.createLinearGradient(0, 14, 0, 186);
    f.addColorStop(0, '#ff5a6a');
    f.addColorStop(0.55, '#d0243a');
    f.addColorStop(1, '#8e1424');
    g.fillStyle = f;
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = '#ffd36b';
    g.stroke();
  });
  ribbonTex.redraw();
  const ribbon = new Mesh(new PlaneGeometry(5.6, 1.1), new MeshBasicMaterial({ map: ribbonTex, transparent: true, depthWrite: false, opacity: 0 }));
  ribbon.position.set(0, 3.0, ROW_Z - 0.7);
  ribbon.visible = false;
  scene.add(ribbon);

  // ---- impact effects: shockwave ring, gold sparks, dust and rubble ----
  const shockwaves = towers.map(() => {
    const m = new Mesh(new RingGeometry(0.82, 1, 64), new MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.visible = false;
    scene.add(m);
    return { m, t: -1 };
  });

  const SPARKS = 140;
  const sparkPos = new Float32Array(SPARKS * 3);
  const sparkVel = new Float32Array(SPARKS * 3);
  const sparkGeo = new BufferGeometry();
  sparkGeo.setAttribute('position', new BufferAttribute(sparkPos, 3));
  const sparkMat = new PointsMaterial({ color: 0xffd36b, size: 0.07, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
  scene.add(new Points(sparkGeo, sparkMat));
  let sparkT = 9;

  const debris = [];
  const chunk = new BoxGeometry(1, 1, 1);
  const DUST = 360;
  const dustPos = new Float32Array(DUST * 3);
  const dustVel = [];
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute('position', new BufferAttribute(dustPos, 3));
  const dustMat = new PointsMaterial({ color: 0xc9ccd2, size: 0.09, transparent: true, opacity: 0, depthWrite: false });
  scene.add(new Points(dustGeo, dustMat));
  let dustT = 9;

  const breakTower = (t) => {
    t.g.children.forEach((c, i) => (c.visible = i <= 1));
    t.g.children[0].scale.y = 0.38;
    t.g.children[0].position.y *= 0.38;
  };
  let shake = 0;
  let kick = 0;

  function impact(i) {
    const t = towers[i];
    const p = t.g.position;
    breakTower(t);
    for (let k = 0; k < 26; k++) {
      const s = 0.12 + Math.random() * 0.22 * t.scale;
      const q = Math.random();
      const m = edged(new Mesh(chunk, q < 0.55 ? stone : q < 0.75 ? stoneDark : q < 0.9 ? ivory : red));
      m.castShadow = true;
      m.scale.setScalar(s);
      m.position.set(p.x + (Math.random() - 0.5) * 0.9 * t.scale, 0.4 + Math.random() * t.topY, p.z + (Math.random() - 0.5) * 0.9 * t.scale);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      scene.add(m);
      debris.push({ m, v: new Vector3((Math.random() - 0.5) * 4.5, 2 + Math.random() * 3.5, (Math.random() - 0.3) * 3.5), r: new Vector3(Math.random() * 8, Math.random() * 8, 0) });
    }
    for (let k = 0; k < DUST; k++) {
      dustPos.set([p.x + (Math.random() - 0.5) * 0.6, 0.3 + Math.random() * t.topY, p.z + (Math.random() - 0.5) * 0.6], k * 3);
      const a = Math.random() * Math.PI * 2;
      const sp = 0.6 + Math.random() * 2.2;
      dustVel[k] = [Math.cos(a) * sp, 0.3 + Math.random() * 1.2, Math.sin(a) * sp];
    }
    dustT = 0;
    for (let k = 0; k < SPARKS; k++) {
      sparkPos.set([p.x, t.topY * 0.85, p.z], k * 3);
      const a = Math.random() * Math.PI * 2;
      const up = Math.random();
      const sp = 2.5 + Math.random() * 3.5;
      sparkVel.set([Math.cos(a) * sp * (1 - up * 0.5), 2 + up * 5, Math.sin(a) * sp * (1 - up * 0.5)], k * 3);
    }
    sparkT = 0;
    const sw = shockwaves[i];
    sw.m.position.set(p.x, 0.03, p.z);
    sw.m.visible = true;
    sw.t = 0;
    shake = 0.32 * t.scale;
    kick = 1;
    flash.position.set(p.x, t.topY, p.z + 0.8);
    flash.intensity = 35;
    crowned(i + 1);
  }

  // ---- blue embers drifting up through the whole scene ----
  const EMBERS = 140;
  const emberPos = new Float32Array(EMBERS * 3);
  const emberSeed = [];
  for (let i = 0; i < EMBERS; i++) emberSeed.push([(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 5, Math.random(), 0.05 + Math.random() * 0.1]);
  const emberGeo = new BufferGeometry();
  emberGeo.setAttribute('position', new BufferAttribute(emberPos, 3));
  scene.add(new Points(emberGeo, new PointsMaterial({ color: 0x8ccbff, size: 0.06, transparent: true, opacity: 0.8, blending: AdditiveBlending, depthWrite: false })));

  // ---- framing: back off on narrow screens so all three towers fit ----
  let dist = 9;
  function size() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    dist = Math.max(8, 15 / camera.aspect);
    camera.updateProjectionMatrix();
  }
  size();
  new ResizeObserver(size).observe(host);

  // ---- state, so the whole thing can play again ----
  let t0 = performance.now();
  let done = towers.map(() => false);
  let finished = false;
  function reset() {
    for (const tw of towers) {
      for (const s of tw.saved) {
        s.ch.visible = s.visible;
        s.ch.scale.y = s.sy;
        s.ch.position.y = s.py;
      }
      tw.bar.shown = 1;
      tw.bar.tex.redraw(1);
      tw.bar.sprite.material.opacity = 1;
    }
    for (const d of debris) scene.remove(d.m);
    debris.length = 0;
    for (const c of crowns) c.visible = false;
    for (const sw of shockwaves) sw.m.visible = false;
    ribbon.visible = false;
    dustT = sparkT = 9;
    done = towers.map(() => false);
    finished = false;
    replayBtn?.setAttribute('hidden', '');
    crowned(0);
    t0 = performance.now();
  }
  replayBtn?.addEventListener('click', reset);
  crowned(0);

  // Where a crown is before the finale: falling, or hovering over its ruined tower.
  function crownBefore(i, t, out) {
    const tw = towers[i];
    const p = tw.g.position;
    const restY = tw.topY + 0.5 * tw.scale;
    if (t < HITS[i]) {
      const k = (t - (HITS[i] - DROP)) / DROP;
      out.pos.set(p.x, restY + (1 - k * k) * 8, p.z);
      out.rot.set(0.3, k * 7, 0);
    } else {
      const since = t - HITS[i];
      // Bounce up off the rubble, then settle into a slow hover.
      const bounce = Math.max(0, Math.sin(Math.min(1, since / 0.45) * Math.PI)) * 0.45 * (1 - Math.min(1, since / 0.45));
      out.pos.set(p.x, restY - 0.15 + Math.min(1, since / 1.2) * 0.25 + bounce + Math.sin(t * 1.6 + i) * 0.06, p.z);
      out.rot.set(0.32, 7 + since * 0.9, 0);
    }
    out.s = tw.scale * 1.05;
  }
  const a = { pos: new Vector3(), rot: new Vector3(), s: 1 };

  let last = t0;
  function frame(now) {
    const t = still ? 99 : (now - t0) / 1000;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    towers.forEach((tw, i) => {
      const c = crowns[i];
      if (t < HITS[i] - DROP) return;
      c.visible = true;
      if (t >= HITS[i] && !done[i]) {
        done[i] = true;
        if (still) {
          breakTower(tw);
          crowned(i + 1);
        } else impact(i);
      }
      // Health bar: drains on impact, then fades away.
      const since = t - HITS[i];
      if (since >= 0) {
        const frac = Math.max(0, 1 - since / 0.3);
        if (Math.abs(frac - tw.bar.shown) > 0.004 || (frac === 0 && tw.bar.shown !== 0)) {
          tw.bar.shown = frac;
          tw.bar.tex.redraw(frac);
        }
        tw.bar.sprite.material.opacity = Math.max(0, 1 - Math.max(0, since - 0.5) / 0.4);
      }
      crownBefore(i, t, a);
      // Finale: rise into the results row, turning to face us.
      const k = easeInOut((t - FINALE - [0, 0.12, 0.06][i]) / FINALE_LEN);
      if (k > 0) {
        const r = ROW[i];
        const bob = Math.sin(t * 1.4 + i * 1.3) * 0.05;
        a.pos.lerp(new Vector3(r.x, r.y + bob, ROW_Z), k);
        const spin = a.rot.y % (Math.PI * 2);
        a.rot.set(a.rot.x + (0.22 - a.rot.x) * k, spin + (Math.PI * 2 - spin) * k, 0);
        a.s += (r.s - a.s) * k;
      }
      c.position.copy(a.pos);
      c.rotation.set(a.rot.x, a.rot.y, a.rot.z);
      c.scale.setScalar(a.s);
    });

    // Ribbon unfurls behind the row.
    const rk = ease((t - FINALE - 0.35) / 0.6);
    ribbon.visible = rk > 0;
    ribbon.scale.set(Math.max(0.001, rk), 1, 1);
    ribbon.material.opacity = rk * 0.95;

    if (!finished && t >= END) {
      finished = true;
      if (!still) replayBtn?.removeAttribute('hidden');
    }

    for (const d of debris) {
      if (d.m.position.y <= d.m.scale.x / 2) {
        d.m.position.y = d.m.scale.x / 2;
        d.v.set(d.v.x * 0.6, 0, d.v.z * 0.6);
        d.r.multiplyScalar(0.8);
      } else d.v.y -= 9.8 * dt;
      d.m.position.addScaledVector(d.v, dt);
      d.m.rotation.x += d.r.x * dt;
      d.m.rotation.y += d.r.y * dt;
    }

    dustT += dt;
    dustMat.opacity = Math.max(0, 0.75 - dustT * 0.45);
    if (dustMat.opacity > 0) {
      for (let k = 0; k < DUST; k++) {
        const v = dustVel[k];
        dustPos[k * 3] += v[0] * dt;
        dustPos[k * 3 + 1] += v[1] * dt;
        dustPos[k * 3 + 2] += v[2] * dt;
        v[0] *= 0.96;
        v[2] *= 0.96;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }
    sparkT += dt;
    sparkMat.opacity = Math.max(0, 1 - sparkT / 0.9);
    if (sparkMat.opacity > 0) {
      for (let k = 0; k < SPARKS; k++) {
        sparkVel[k * 3 + 1] -= 9.8 * dt;
        sparkPos[k * 3] += sparkVel[k * 3] * dt;
        sparkPos[k * 3 + 1] = Math.max(0.02, sparkPos[k * 3 + 1] + sparkVel[k * 3 + 1] * dt);
        sparkPos[k * 3 + 2] += sparkVel[k * 3 + 2] * dt;
      }
      sparkGeo.attributes.position.needsUpdate = true;
    }
    for (const sw of shockwaves) {
      if (sw.t < 0) continue;
      sw.t += dt;
      const k = sw.t / 0.65;
      sw.m.scale.setScalar(0.3 + ease(k) * 3.2);
      sw.m.material.opacity = Math.max(0, 0.9 * (1 - k));
      if (k >= 1) {
        sw.m.visible = false;
        sw.t = -1;
      }
    }
    for (let k = 0; k < EMBERS; k++) {
      const s = emberSeed[k];
      const life = (s[2] + t * s[3]) % 1;
      emberPos.set([s[0] + Math.sin(t * 0.7 + k) * 0.2, life * 5, s[1]], k * 3);
    }
    emberGeo.attributes.position.needsUpdate = true;

    // Camera: a slow push in during the intro, a small punch on each impact, and shake.
    flash.intensity *= 0.86;
    shake *= 0.88;
    kick *= 0.85;
    const push = still ? 0 : 1 - ease(t / 1.6);
    const d = dist * (1 + push * 0.12) * (1 - kick * 0.03);
    camera.position.set(0, d * 0.34 + 1.3, d);
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;
    camera.lookAt(look.x + sx, look.y + sy, look.z);
    ribbon.lookAt(camera.position.x, ribbon.position.y, camera.position.z);
    renderer.render(scene, camera);
    if (!still) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (host) start();

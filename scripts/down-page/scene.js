// The 503 page's "we got three-crowned" scene. Bundled (three.js included, minified) and inlined
// into public/down.html by scripts/build-down-page.mjs, so the down page stays one file.
//
// Our two princess towers and king tower (shaped like the game's, outlined like a hologram) stand
// in a row; three of the enemy's red-banded crowns drop out of the sky one after another and smash
// them to rubble (dust, a flash, a little camera shake). Then the crowns hover over the ruins.
// Reduced motion shows the final frame. No WebGL: the static crown stays.
import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  Fog,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
  AdditiveBlending,
  BackSide,
  DoubleSide,
  EdgesGeometry,
  GridHelper,
  LineBasicMaterial,
  LineSegments,
  OctahedronGeometry,
  RingGeometry,
} from 'three';

const host = document.getElementById('stage');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

function start() {
  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return; // no WebGL: the static crown icon stays
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  host.classList.add('live');

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 2, 0.1, 100);
  const look = new Vector3(0, 2.05, -0.2);
  // The floor fades into the page background instead of ending at a hard edge.
  scene.fog = new Fog(0x07080a, 10, 22);

  scene.add(new AmbientLight(0x8ca6c8, 0.9));
  const sun = new DirectionalLight(0xdfe9ff, 2.2);
  sun.position.set(-3, 6, 5);
  scene.add(sun);
  const rim = new DirectionalLight(0x3aa0ff, 1.6);
  rim.position.set(4, 3, -5);
  scene.add(rim);
  const flash = new PointLight(0xffd27a, 0, 9);
  scene.add(flash);

  const mat = (color, o = {}) => new MeshStandardMaterial({ color, roughness: 0.75, ...o });
  const stone = mat(0x7f858f, { roughness: 0.9 });
  const stoneDark = mat(0x555b65, { roughness: 0.95 });
  const ivory = mat(0xe8e2d6, { roughness: 0.7 });
  const red = mat(0xc8283a, { roughness: 0.55, emissive: 0x3a0008, emissiveIntensity: 0.4 });
  const plaque = mat(0x2a2e36, { roughness: 0.6 });
  // Bright and only a little metallic: with nothing to reflect, real metal reads brown.
  const gold = mat(0xffbe33, { metalness: 0.25, roughness: 0.3, emissive: 0x8a5200, emissiveIntensity: 0.55 });
  const goldInner = mat(0xd9962a, { metalness: 0.2, roughness: 0.4, emissive: 0x5a3400, emissiveIntensity: 0.5 });
  const skin = mat(0xf1c29a, { roughness: 0.6 });

  // The "digital" look: every block is outlined with a thin glowing edge, like a hologram of the arena.
  const edgeBlue = new LineBasicMaterial({ color: 0x8ccbff, transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false });
  const edgeGold = new LineBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false });
  function edged(mesh, m = edgeBlue) {
    mesh.add(new LineSegments(new EdgesGeometry(mesh.geometry, 28), m));
    return mesh;
  }
  const box = (w, h, d, material, x, y, z) => {
    const m = edged(new Mesh(new BoxGeometry(w, h, d), material));
    m.position.set(x, y, z);
    return m;
  };

  // ---- holographic arena floor: dark stone, a blue grid, the river and bridges ----
  const floor = new Mesh(new CircleGeometry(40, 64), mat(0x14171d, { roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const grid = new GridHelper(30, 60, 0x3aa0ff, 0x3aa0ff);
  grid.material.transparent = true;
  grid.material.opacity = 0.13;
  grid.material.depthWrite = false;
  grid.position.y = 0.005;
  scene.add(grid);
  const river = new Mesh(new PlaneGeometry(18, 0.7), new MeshBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0.35 }));
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.01, 2.1);
  scene.add(river);
  for (const x of [-2.2, 2.2]) scene.add(box(0.9, 0.08, 1, stoneDark, x, 0.04, 2.1));

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
    const band = new Mesh(new CylinderGeometry(r, r, r * 0.7, 16), gold);
    g.add(band);
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
    const dress = new Mesh(new ConeGeometry(0.2, 0.42, 14), red);
    dress.position.y = y + 0.21;
    const head = new Mesh(new SphereGeometry(0.13, 16, 12), skin);
    head.position.y = y + 0.52;
    const hair = new Mesh(new SphereGeometry(0.145, 16, 12), mat(0xa04a1c));
    hair.position.set(0, y + 0.56, -0.04);
    hair.scale.set(1, 0.9, 1);
    // Her bow, held out front.
    const bow = new Mesh(new TorusGeometry(0.2, 0.014, 6, 20, Math.PI), mat(0x8a4a1c));
    bow.rotation.set(0, 0, Math.PI / 2);
    bow.position.set(0.16, y + 0.36, 0.14);
    g.add(dress, hair, head, bow, miniCrown(0.07, y + 0.68));
    return g;
  }
  function king(y) {
    const g = new Group();
    const body = edged(new Mesh(new CylinderGeometry(0.22, 0.3, 0.5, 16), red));
    body.position.y = y + 0.25;
    const collar = new Mesh(new TorusGeometry(0.2, 0.05, 8, 20), ivory);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = y + 0.5;
    const head = new Mesh(new SphereGeometry(0.17, 16, 12), skin);
    head.position.y = y + 0.66;
    const beard = new Mesh(new SphereGeometry(0.13, 14, 10), mat(0x4a2a14));
    beard.scale.set(1.1, 0.75, 0.7);
    beard.position.set(0, y + 0.58, 0.1);
    g.add(body, collar, head, beard, miniCrown(0.11, y + 0.86));
    return g;
  }

  // ---- towers, shaped like the game's: a stone tower with a white parapet and red trim, the gold
  // crown on the front and the princess or king on top. Built from blocks so they can fall apart;
  // child 0 is the stone body that stays standing as a stump. ----
  function tower(x, z, s, who) {
    const g = new Group();
    const w = 1.1 * s;
    const h = 1.05 * s;
    // A square, slightly tapered body (a 4-sided cylinder turned 45°).
    const body = edged(new Mesh(new CylinderGeometry((w * 0.92) / Math.SQRT2, w / Math.SQRT2, h, 4, 1), stone));
    body.rotation.y = Math.PI / 4;
    body.position.y = h / 2 + 0.1 * s;
    g.add(body);
    g.add(box(w * 1.12, 0.12 * s, w * 1.12, stoneDark, 0, 0.06 * s, 0)); // plinth
    // Stone courses across the body.
    for (const k of [0.36, 0.68]) g.add(box(w * (1 - k * 0.08) + 0.02, 0.035 * s, w * (1 - k * 0.08) + 0.02, stoneDark, 0, 0.1 * s + h * k, 0));
    const top = 0.1 * s + h;
    const pw = w * 1.22;
    g.add(box(pw, 0.16 * s, pw, ivory, 0, top + 0.08 * s, 0)); // platform
    // Parapet: white corner blocks, red trim between them.
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
    g.position.set(x, 0, z);
    scene.add(g);
    return { g, topY: top + 0.9 * s, scale: s };
  }
  // Left princess, right princess, then the king: the order a three-crown goes.
  const towers = [tower(-2.2, 0.4, 1, princess), tower(2.2, 0.4, 1, princess), tower(0, -1.3, 1.4, king)];

  // ---- crowns, shaped like the game's: a gold castle-rim crown on a coloured band with gold
  // diamond studs. They're the enemy's crowns (red), the ones that three-crowned us. ----
  function crown(scale) {
    const g = new Group();
    const R = 0.5;
    const r = 0.42;
    const band = edged(new Mesh(new CylinderGeometry(0.56, 0.56, 0.26, 48), mat(0xe2283c, { roughness: 0.35, emissive: 0x4a0010, emissiveIntensity: 0.45 })), edgeGold);
    band.position.y = 0;
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
    // Castle-rim merlons: flat-faced gold blocks around the top.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const m = edged(new Mesh(new BoxGeometry(0.27, 0.24, R - r + 0.02), gold), edgeGold);
      m.position.set(Math.sin(a) * (R + r) * 0.5, 0.57, Math.cos(a) * (R + r) * 0.5);
      m.rotation.y = a;
      g.add(m);
    }
    // Gold diamond studs on the band.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const st = new Mesh(new OctahedronGeometry(0.1), gold);
      st.scale.set(1, 1, 0.45);
      st.rotation.y = a;
      st.position.set(Math.sin(a) * 0.57, 0, Math.cos(a) * 0.57);
      g.add(st);
    }
    // Pivot at the crown's middle.
    for (const ch of g.children) ch.position.y -= 0.28;
    g.scale.setScalar(scale);
    g.visible = false;
    scene.add(g);
    return g;
  }
  const crowns = towers.map((t) => crown(t.scale * 1.05));

  // ---- debris and dust ----
  const debris = [];
  const chunk = new BoxGeometry(1, 1, 1);
  function shatter(t) {
    const p = t.g.position;
    for (let i = 0; i < 26; i++) {
      const s = 0.12 + Math.random() * 0.22 * t.scale;
      const q = Math.random();
      const m = edged(new Mesh(chunk, q < 0.55 ? stone : q < 0.75 ? stoneDark : q < 0.9 ? ivory : red));
      m.scale.setScalar(s);
      m.position.set(p.x + (Math.random() - 0.5) * 0.9 * t.scale, 0.4 + Math.random() * t.topY, p.z + (Math.random() - 0.5) * 0.9 * t.scale);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      scene.add(m);
      debris.push({ m, v: new Vector3((Math.random() - 0.5) * 4.5, 2 + Math.random() * 3.5, (Math.random() - 0.3) * 3.5), r: new Vector3(Math.random() * 8, Math.random() * 8, 0) });
    }
    // What's left standing: a broken stump on its plinth.
    t.g.children.forEach((c, i) => (c.visible = i <= 1));
    t.g.children[0].scale.y = 0.38;
    t.g.children[0].position.y *= 0.38;
  }
  const dustN = 360;
  const dustPos = new Float32Array(dustN * 3);
  const dustVel = [];
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute('position', new BufferAttribute(dustPos, 3));
  const dustMat = new PointsMaterial({ color: 0xc9ccd2, size: 0.09, transparent: true, opacity: 0, depthWrite: false });
  scene.add(new Points(dustGeo, dustMat));
  let dustT = 9;
  function puff(t) {
    const p = t.g.position;
    for (let i = 0; i < dustN; i++) {
      dustPos.set([p.x + (Math.random() - 0.5) * 0.6, 0.3 + Math.random() * t.topY, p.z + (Math.random() - 0.5) * 0.6], i * 3);
      const a = Math.random() * Math.PI * 2;
      const sp = 0.6 + Math.random() * 2.2;
      dustVel[i] = [Math.cos(a) * sp, 0.3 + Math.random() * 1.2, Math.sin(a) * sp];
    }
    dustT = 0;
  }
  // Blue embers drifting up through the whole scene.
  const emberN = 140;
  const emberPos = new Float32Array(emberN * 3);
  const emberSeed = [];
  for (let i = 0; i < emberN; i++) emberSeed.push([(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 5, Math.random(), 0.05 + Math.random() * 0.1]);
  const emberGeo = new BufferGeometry();
  emberGeo.setAttribute('position', new BufferAttribute(emberPos, 3));
  scene.add(new Points(emberGeo, new PointsMaterial({ color: 0x8ccbff, size: 0.06, transparent: true, opacity: 0.8, blending: AdditiveBlending, depthWrite: false })));

  // ---- timeline ----
  const DROP = 0.75; // seconds a crown takes to fall
  const hits = [1.4, 2.5, 3.7]; // when each crown lands (a beat first, to see the towers standing)
  const done = towers.map(() => false);
  let shake = 0;

  function size() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Narrow screens: back off so all three towers fit.
    const dist = Math.max(7.6, 14.5 / camera.aspect);
    camera.position.set(0, dist * 0.34 + 1.3, dist);
    camera.updateProjectionMatrix();
  }
  size();
  new ResizeObserver(size).observe(host);

  const t0 = performance.now();
  let last = t0;
  function frame(now) {
    const t = still ? 99 : (now - t0) / 1000;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    towers.forEach((tw, i) => {
      const c = crowns[i];
      const land = hits[i];
      const restY = tw.topY + 0.5 * tw.scale;
      if (t < land - DROP) return;
      c.visible = true;
      if (t < land) {
        // Falling: accelerate in from above, spinning.
        const k = (t - (land - DROP)) / DROP;
        c.position.set(tw.g.position.x, restY + (1 - k * k) * 7, tw.g.position.z);
        c.rotation.set(0.3, k * 6, 0);
        return;
      }
      if (!done[i]) {
        done[i] = true;
        if (!still) {
          shatter(tw);
          puff(tw);
          shake = 0.35 * tw.scale;
          flash.position.set(tw.g.position.x, tw.topY, tw.g.position.z + 0.8);
          flash.intensity = 30;
        } else {
          tw.g.children.forEach((ch, j) => (ch.visible = j <= 1));
          tw.g.children[0].scale.y = 0.38;
          tw.g.children[0].position.y *= 0.38;
        }
      }
      // Landed: rise to hover over the ruin, slowly turning and bobbing.
      const since = t - land;
      const hover = restY - 0.15 + Math.min(1, since / 1.2) * 0.25;
      c.position.set(tw.g.position.x, hover + Math.sin(t * 1.6 + i) * 0.08, tw.g.position.z);
      // Tipped toward the camera so the crown reads as a crown, not a ring.
      c.rotation.set(0.32, 6 + since * 0.8, 0);
    });

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
      for (let i = 0; i < dustN; i++) {
        const v = dustVel[i];
        dustPos[i * 3] += v[0] * dt;
        dustPos[i * 3 + 1] += v[1] * dt;
        dustPos[i * 3 + 2] += v[2] * dt;
        v[0] *= 0.96;
        v[2] *= 0.96;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }
    for (let i = 0; i < emberN; i++) {
      const s = emberSeed[i];
      const life = (s[2] + t * s[3]) % 1;
      emberPos.set([s[0] + Math.sin(t * 0.7 + i) * 0.2, life * 5, s[1]], i * 3);
    }
    emberGeo.attributes.position.needsUpdate = true;

    flash.intensity *= 0.86;
    shake *= 0.88;
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;
    camera.lookAt(look.x + sx, look.y + sy, look.z);
    renderer.render(scene, camera);
    if (!still) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (host) start();

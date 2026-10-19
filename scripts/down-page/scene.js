// The 503 page's "we got three-crowned" scene. Bundled (three.js included, minified) and inlined
// into public/down.html by scripts/build-down-page.mjs, so the down page stays one file.
//
// Our two princess towers and king tower stand in a row; three gold crowns drop out of the sky one
// after another and smash them to rubble (dust, a flash, a little camera shake). Then the crowns
// hover over the ruins. Reduced motion shows the final frame. No WebGL: the static crown stays.
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
  const look = new Vector3(0, 1.7, -0.2);
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

  const stone = new MeshStandardMaterial({ color: 0x8d939e, roughness: 0.9 });
  const stoneDark = new MeshStandardMaterial({ color: 0x5c626c, roughness: 0.95 });
  const blue = new MeshStandardMaterial({ color: 0x2a7ae0, roughness: 0.6, emissive: 0x0a2a66, emissiveIntensity: 0.5 });
  const gold = new MeshStandardMaterial({ color: 0xf5c84a, metalness: 0.85, roughness: 0.28, emissive: 0x4a3000, emissiveIntensity: 0.6 });
  const ruby = new MeshStandardMaterial({ color: 0xff3d55, metalness: 0.3, roughness: 0.2, emissive: 0x550010 });

  // ---- arena floor and river ----
  const floor = new Mesh(new CircleGeometry(40, 64), new MeshStandardMaterial({ color: 0x1a1d23, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const river = new Mesh(new PlaneGeometry(18, 0.7), new MeshBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0.35 }));
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.01, 2.1);
  scene.add(river);
  for (const x of [-2.2, 2.2]) {
    const bridge = new Mesh(new BoxGeometry(0.9, 0.08, 1), stoneDark);
    bridge.position.set(x, 0.04, 2.1);
    scene.add(bridge);
  }

  // ---- towers: built from blocks so they can fall apart ----
  function battlements(g, w, y, d) {
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const b = new Mesh(new BoxGeometry(w * 0.26, w * 0.26, w * 0.26), stone);
      b.position.set((x * w) / 2 - x * w * 0.13, y, (z * d) / 2 - z * d * 0.13);
      g.add(b);
    }
  }
  function princessTower(x, z) {
    const g = new Group();
    const base = new Mesh(new CylinderGeometry(0.55, 0.65, 1.2, 10), stone);
    base.position.y = 0.6;
    const top = new Mesh(new BoxGeometry(1.15, 0.22, 1.15), stoneDark);
    top.position.y = 1.31;
    const banner = new Mesh(new BoxGeometry(0.42, 0.5, 0.04), blue);
    banner.position.set(0, 0.75, 0.62);
    g.add(base, top, banner);
    battlements(g, 1.15, 1.55, 1.15);
    g.position.set(x, 0, z);
    scene.add(g);
    return { g, topY: 1.7, scale: 1 };
  }
  function kingTower(x, z) {
    const g = new Group();
    const base = new Mesh(new BoxGeometry(1.7, 1.5, 1.7), stone);
    base.position.y = 0.75;
    const top = new Mesh(new BoxGeometry(1.95, 0.26, 1.95), stoneDark);
    top.position.y = 1.63;
    const banner = new Mesh(new BoxGeometry(0.7, 0.7, 0.04), blue);
    banner.position.set(0, 0.85, 0.87);
    const cannon = new Mesh(new CylinderGeometry(0.16, 0.2, 0.9, 12), stoneDark);
    cannon.rotation.x = Math.PI / 2.4;
    cannon.position.set(0, 2.05, 0.25);
    g.add(base, top, banner, cannon);
    battlements(g, 1.95, 1.92, 1.95);
    g.position.set(x, 0, z);
    scene.add(g);
    return { g, topY: 2.2, scale: 1.35 };
  }
  // Left princess, right princess, then the king: the order a three-crown goes.
  const towers = [princessTower(-2.2, 0.4), princessTower(2.2, 0.4), kingTower(0, -1.3)];

  // ---- crowns ----
  function crown(scale) {
    const g = new Group();
    const band = new Mesh(new CylinderGeometry(0.5, 0.56, 0.3, 28, 1, true), gold);
    band.material.side = 2; // double-sided
    const rimBottom = new Mesh(new TorusGeometry(0.555, 0.045, 8, 36), gold);
    rimBottom.rotation.x = Math.PI / 2;
    rimBottom.position.y = -0.15;
    g.add(band, rimBottom);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spike = new Mesh(new ConeGeometry(0.13, 0.42, 8), gold);
      spike.position.set(Math.sin(a) * 0.5, 0.36, Math.cos(a) * 0.5);
      const ball = new Mesh(new SphereGeometry(0.075, 12, 8), gold);
      ball.position.set(Math.sin(a) * 0.5, 0.6, Math.cos(a) * 0.5);
      g.add(spike, ball);
    }
    const gem = new Mesh(new SphereGeometry(0.1, 14, 10), ruby);
    gem.position.set(0, 0, 0.55);
    g.add(gem);
    g.scale.setScalar(scale);
    g.visible = false;
    scene.add(g);
    return g;
  }
  const crowns = towers.map((t) => crown(t.scale * 1.15));

  // ---- debris and dust ----
  const debris = [];
  const chunk = new BoxGeometry(1, 1, 1);
  function shatter(t) {
    const p = t.g.position;
    for (let i = 0; i < 26; i++) {
      const s = 0.12 + Math.random() * 0.22 * t.scale;
      const m = new Mesh(chunk, Math.random() < 0.7 ? stone : stoneDark);
      m.scale.setScalar(s);
      m.position.set(p.x + (Math.random() - 0.5) * 0.9 * t.scale, 0.4 + Math.random() * t.topY, p.z + (Math.random() - 0.5) * 0.9 * t.scale);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      scene.add(m);
      debris.push({ m, v: new Vector3((Math.random() - 0.5) * 4.5, 2 + Math.random() * 3.5, (Math.random() - 0.3) * 3.5), r: new Vector3(Math.random() * 8, Math.random() * 8, 0) });
    }
    // What's left standing: a broken stump.
    t.g.children.forEach((c, i) => (c.visible = i === 0));
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
  const hits = [0.7, 1.9, 3.2]; // when each crown lands
  const done = towers.map(() => false);
  let shake = 0;

  function size() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Narrow screens: back off so all three towers fit.
    const dist = Math.max(9.5, 17 / camera.aspect);
    camera.position.set(0, dist * 0.36 + 1.2, dist);
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
          tw.g.children.forEach((ch, j) => (ch.visible = j === 0));
          tw.g.children[0].scale.y = 0.38;
          tw.g.children[0].position.y *= 0.38;
        }
      }
      // Landed: rise to hover over the ruin, slowly turning and bobbing.
      const since = t - land;
      const hover = restY + 0.25 + Math.min(1, since / 1.2) * 0.35;
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

'use client';

import { useEffect, useRef } from 'react';
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, TextureLoader, type Texture } from 'three';
import { mountThree } from './three';

/** Same-origin URL for official art (see /api/art); local art is used as-is. */
const artUrl = (src: string) => (src.startsWith('/') ? src : `/api/art?src=${encodeURIComponent(src)}`);

/**
 * A deck held like a hand of cards: the eight card arts on a 3D arc that bobs gently, follows
 * the cursor and lifts the card under it. Decorative (aria-hidden); the real card grid stays in
 * the DOM next to it.
 */
export function CardFan3D({ images, height = 320 }: { images: string[]; height?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const key = images.join('|');

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const srcs = key.split('|').filter(Boolean);
    let target = { x: 0, y: 0, inside: false };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      target = { x, y, inside: Math.abs(x) <= 1 && Math.abs(y) <= 1 };
    };
    addEventListener('pointermove', onMove, { passive: true });

    const stop = mountThree(
      el,
      ({ scene, camera }) => {
        const loader = new TextureLoader();
        const geo = new PlaneGeometry(1.16, 1.71);
        const group = new Group();
        const cards: { mesh: Mesh; mat: MeshBasicMaterial; base: { x: number; y: number; z: number; ry: number; rz: number } }[] = [];
        const textures: Texture[] = [];
        const n = srcs.length;
        srcs.forEach((src, i) => {
          const mat = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
          loader.load(
            artUrl(src),
            (tex) => {
              tex.colorSpace = SRGBColorSpace;
              tex.anisotropy = 4;
              textures.push(tex);
              mat.map = tex;
              mat.needsUpdate = true;
            },
            undefined,
            () => {},
          );
          const mesh = new Mesh(geo, mat);
          // A wide arc, the middle cards a little higher, like a hand of cards.
          const k = n > 1 ? i / (n - 1) - 0.5 : 0;
          const a = k * 1.5;
          const R = 4.6;
          const base = { x: Math.sin(a) * R, y: -k * k * 1.6 + 0.15, z: (Math.cos(a) - 1) * R * 0.6 + i * 0.002, ry: -a * 0.6, rz: -k * 0.3 };
          mesh.position.set(base.x, base.y, base.z);
          mesh.rotation.set(0, base.ry, base.rz);
          mesh.renderOrder = i;
          group.add(mesh);
          cards.push({ mesh, mat, base });
        });
        scene.add(group);
        camera.position.set(0, 0.1, 5);

        let mx = 0;
        let my = 0;
        return {
          frame: (t, dt, still) => {
            mx += (target.x - mx) * 0.06;
            my += (target.y - my) * 0.06;
            group.rotation.y = still ? 0 : mx * 0.25;
            group.rotation.x = still ? 0 : my * 0.12;
            cards.forEach(({ mesh, mat, base }, i) => {
              // Fade in left to right once loaded.
              if (mat.map) mat.opacity = Math.min(1, mat.opacity + dt * 2.5 * (still ? 10 : 1) * (t > i * 0.08 ? 1 : 0));
              const near = target.inside ? Math.max(0, 1 - Math.abs(mesh.position.x / 4.6 - mx * 0.75) * 3.5) : 0;
              const bob = still ? 0 : Math.sin(t * 1.3 + i * 0.7) * 0.04;
              mesh.position.y += (base.y + bob + near * 0.28 - mesh.position.y) * 0.15;
              mesh.position.z += (base.z + near * 0.35 - mesh.position.z) * 0.15;
              const sc = 1 + near * 0.08;
              mesh.scale.set(sc, sc, 1);
            });
          },
          resize: (w, h) => {
            // Keep the whole fan in view on narrow screens.
            const aspect = w / h;
            camera.position.z = aspect < 2.2 ? 5 * (2.2 / aspect) * 0.9 : 5;
          },
          dispose: () => {
            geo.dispose();
            cards.forEach((c) => c.mat.dispose());
            textures.forEach((t) => t.dispose());
          },
        };
      },
      { fov: 40, z: 5, antialias: true },
    );
    return () => {
      removeEventListener('pointermove', onMove);
      stop?.();
    };
  }, [key]);

  return <div ref={host} aria-hidden data-fx="card-fan" style={{ position: 'relative', width: '100%', height }} />;
}

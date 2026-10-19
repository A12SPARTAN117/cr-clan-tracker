// Bundles the 503 page's three.js scene (scripts/down-page/scene.js) into one minified file,
// scripts/down-page/scene.bundle.js, which build-down-page.mjs inlines into public/down.html.
// The bundle is committed, so deploys don't need esbuild. Rerun after editing scene.js:
//   node scripts/bundle-down-scene.mjs
import { build } from 'esbuild';
import path from 'node:path';

const dir = path.resolve(import.meta.dirname, 'down-page');
const r = await build({
  entryPoints: [path.join(dir, 'scene.js')],
  outfile: path.join(dir, 'scene.bundle.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  legalComments: 'none',
  metafile: true,
});
const bytes = Object.values(r.metafile.outputs)[0].bytes;
console.log(`[down-scene] scene.bundle.js ${(bytes / 1024).toFixed(0)} KB`);

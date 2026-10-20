import path from 'node:path';
import { defineConfig } from 'vitest/config';

const r = (p: string) => path.resolve(import.meta.dirname, p);

/**
 * Three suites:
 * - unit: pure logic (tags, war calendar, modes, decks, scores, meta aggregation on fixtures)
 * - ui:   React components in jsdom
 * - data: live accuracy checks against the Clash Royale API (needs CR_API_KEY in .env)
 */
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: {
      '@': r('src'),
      'server-only': r('tests/stubs/empty.ts'),
      'next/cache': r('tests/stubs/next-cache.ts'),
      'next/server': r('tests/stubs/next-server.ts'),
    },
  },
  test: {
    projects: [
      { extends: true, test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' } },
      { extends: true, test: { name: 'ui', include: ['tests/ui/**/*.test.tsx'], environment: 'jsdom', setupFiles: ['tests/setup-dom.ts'] } },
      {
        extends: true,
        test: { name: 'data', include: ['tests/data/**/*.test.ts'], environment: 'node', setupFiles: ['tests/setup-env.ts'], testTimeout: 180_000, hookTimeout: 180_000 },
      },
    ],
  },
});

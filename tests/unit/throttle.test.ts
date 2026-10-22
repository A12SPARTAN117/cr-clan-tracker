import { beforeEach, describe, expect, it } from 'vitest';
import { onceEvery, resetOnce } from '@/lib/throttle';

const MIN = 60_000;

describe('onceEvery', () => {
  beforeEach(resetOnce);

  it('lets the first call through and holds repeats inside the window', () => {
    expect(onceEvery('seen:A', 15 * MIN, 0)).toBe(true);
    expect(onceEvery('seen:A', 15 * MIN, 14 * MIN)).toBe(false);
    expect(onceEvery('seen:A', 15 * MIN, 15 * MIN)).toBe(true);
  });

  it('counts each key on its own', () => {
    expect(onceEvery('seen:A', 15 * MIN, 0)).toBe(true);
    expect(onceEvery('seen:B', 15 * MIN, 0)).toBe(true);
    expect(onceEvery('track:A', 15 * MIN, 0)).toBe(true);
  });

  it('a held call does not move the window', () => {
    onceEvery('seen:A', 15 * MIN, 0);
    onceEvery('seen:A', 15 * MIN, 10 * MIN);
    expect(onceEvery('seen:A', 15 * MIN, 15 * MIN)).toBe(true);
  });
});

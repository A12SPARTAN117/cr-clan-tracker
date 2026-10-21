import { describe, expect, it } from 'vitest';
import { mvpOf } from '@/app/clan/[tag]/manage/shared';

describe('war MVP', () => {
  it('awards the most fame in each finished race, counting repeat winners and shared tops', () => {
    // Newest race first, as the dashboard lists them.
    const m = mvpOf([
      { label: 'S12 · W3', members: [{ tag: 'A', fame: 3600 }, { tag: 'B', fame: 3600 }, { tag: 'C', fame: 900 }] },
      { label: 'S12 · W2', members: [{ tag: 'A', fame: 3200 }, { tag: 'B', fame: 2000 }] },
      { label: 'S12 · W1', members: [{ tag: 'A', fame: 0 }] },
    ]);
    expect(m.get('A')).toEqual({ count: 2, last: 'S12 · W3', fame: 3600 });
    expect(m.get('B')).toEqual({ count: 1, last: 'S12 · W3', fame: 3600 });
    expect(m.has('C')).toBe(false);
  });
});

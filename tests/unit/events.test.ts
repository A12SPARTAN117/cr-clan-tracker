import { describe, expect, it } from 'vitest';
import { boardState } from '@/lib/events';

const H = 3600_000;
const now = Date.parse('2026-10-20T12:00:00Z');
const ago = (h: number) => new Date(now - h * H);

describe('live event boards', () => {
  it('shows a board seen for the first time', () => {
    expect(boardState(undefined, 'a:1', now)).toEqual({ live: true, changed: false });
  });

  it('hides a board that has not moved two hours after it was first seen', () => {
    expect(boardState({ sig: 'a:1', firstSeenAt: ago(1), changedAt: null }, 'a:1', now).live).toBe(true);
    expect(boardState({ sig: 'a:1', firstSeenAt: ago(3), changedAt: null }, 'a:1', now).live).toBe(false);
  });

  it('shows a board as soon as its standings move', () => {
    expect(boardState({ sig: 'a:1', firstSeenAt: ago(300), changedAt: null }, 'a:2', now)).toEqual({ live: true, changed: true });
  });

  it('keeps a board live for 48 hours after it last moved', () => {
    expect(boardState({ sig: 'a:1', firstSeenAt: ago(300), changedAt: ago(47) }, 'a:1', now).live).toBe(true);
    expect(boardState({ sig: 'a:1', firstSeenAt: ago(300), changedAt: ago(49) }, 'a:1', now).live).toBe(false);
  });
});

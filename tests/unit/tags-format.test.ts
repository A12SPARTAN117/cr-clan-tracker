import { describe, expect, it } from 'vitest';
import { agoShort, dstr, fmt, parseApiDate, tenureShort } from '@/lib/format';
import { checkTag, cleanTag, searchHref, surelyTag } from '@/lib/tags';

describe('tags', () => {
  it('cleans and validates tags', () => {
    expect(cleanTag('  #q9yly80p ')).toBe('Q9YLY80P');
    expect(checkTag('')).toEqual({ kind: 'empty' });
    expect(checkTag('#Q9')).toEqual({ kind: 'short', tag: 'Q9' });
    expect(checkTag('#Q9YLY80P')).toEqual({ kind: 'valid', tag: 'Q9YLY80P' });
    // O is not a tag character (only 0 2 8 9 P Y L Q G R J C U V are).
    expect(checkTag('#Q9YLY8OP')).toEqual({ kind: 'invalid', bad: 'O' });
  });

  it('tells tags from names', () => {
    expect(surelyTag('#PLQ')).toBe(true);
    expect(surelyTag('Q9YLY80P')).toBe(true); // has digits
    expect(surelyTag('CLUP')).toBe(false); // tag letters only, could be a name
    expect(surelyTag('rosa parks')).toBe(false);
  });

  it('routes search input', () => {
    expect(searchHref('#Q9YLY80P')).toBe('/t/Q9YLY80P');
    expect(searchHref('rosa parks')).toBe('/search?q=rosa%20parks');
    expect(searchHref('CLUP')).toBe('/search?q=CLUP');
    expect(searchHref('#HELLO')).toBeNull(); // a mistyped tag, not a search
    expect(searchHref('a')).toBeNull();
  });
});

describe('format', () => {
  it('formats numbers with separators and a dash for missing values', () => {
    expect(fmt(137471)).toBe('137,471');
    expect(fmt(0)).toBe('0');
    expect(fmt(null)).toBe('—');
    expect(fmt(undefined)).toBe('—');
  });

  it('parses the API timestamp format', () => {
    expect(parseApiDate('20261014T073649.000Z')?.toISOString()).toBe('2026-10-14T07:36:49.000Z');
    expect(parseApiDate('garbage')).toBeNull();
    expect(parseApiDate(null)).toBeNull();
  });

  it('prints short durations', () => {
    expect(agoShort(0.5)).toBe('now');
    expect(agoShort(5.9)).toBe('5h');
    expect(agoShort(49)).toBe('2d');
    expect(tenureShort(12)).toBe('12d');
    expect(tenureShort(120)).toBe('4mo');
    expect(tenureShort(500)).toBe('1.4y');
    expect(dstr(new Date('2026-06-02T12:00:00Z'))).toBe('02 Jun 2026');
  });
});

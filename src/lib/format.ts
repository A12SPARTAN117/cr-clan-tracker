const nf = new Intl.NumberFormat('en-US');
export const fmt = (n: number | null | undefined) => (n == null ? '—' : nf.format(n));

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "02 Jun 2026" */
export function dstr(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Parses the API's compact timestamps like 20261013T020316.000Z. */
export function parseApiDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(s);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
}

/** "now" / "5h" / "3d" */
export function agoShort(hours: number): string {
  if (hours < 1) return 'now';
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** "12d" / "4mo" / "1.2y" */
export function tenureShort(days: number): string {
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

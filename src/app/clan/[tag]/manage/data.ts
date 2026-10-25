import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { applyHistory, getDashboard, type Dashboard } from '@/lib/clan/dashboard';
import { getClan, tags } from '@/lib/cr/api';
import { getClanHistory } from '@/lib/history';

export type DashboardPage = { ok: true; data: Dashboard } | { ok: false; status: number };

/**
 * The dashboard with its stored history merged in, cached per clan for 10 minutes, so the page
 * reads nothing per request. Starting history tracking and roster indexing go through /api/seen.
 */
export async function dashboardPage(tag: string): Promise<DashboardPage> {
  'use cache';
  cacheTag(tags.clan(tag));
  const r = await getClan(tag);
  if (!r.ok) {
    if (r.status === 404) cacheLife('cr');
    else cacheLife('crError');
    return { ok: false, status: r.status };
  }
  const [data, history] = await Promise.all([getDashboard(tag), getClanHistory(tag)]);
  if (!data) {
    cacheLife('crError');
    return { ok: false, status: 0 };
  }
  cacheLife('pageTenMinutes');
  return { ok: true, data: applyHistory(data, history) };
}

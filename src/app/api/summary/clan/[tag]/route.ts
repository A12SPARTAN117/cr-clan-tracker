import { connection } from 'next/server';
import { clanSummary } from '@/lib/summary';
import { checkTag } from '@/lib/tags';

export async function GET(_req: Request, ctx: RouteContext<'/api/summary/clan/[tag]'>) {
  await connection();
  const c = checkTag((await ctx.params).tag);
  if (c.kind !== 'valid') return Response.json({ error: 'invalid tag' }, { status: 400 });
  const s = await clanSummary(c.tag, Date.now());
  return s ? Response.json(s) : Response.json({ error: 'not found' }, { status: 404 });
}

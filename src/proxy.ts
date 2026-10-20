import { NextResponse, type NextRequest } from 'next/server';
import { checkPage, slowDownPage } from '@/lib/pageLimit';

/**
 * Runs before the pages that cost Clash Royale API calls and turns away a visitor who requests
 * far more of them than a person could read (see lib/pageLimit). Everything else, including
 * static files and our API routes (which have their own limits), never reaches this.
 */
export function proxy(req: NextRequest) {
  const wait = checkPage(req.nextUrl.pathname, req.headers);
  if (!wait) return NextResponse.next();
  return new NextResponse(slowDownPage(wait), {
    status: 429,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': String(wait), 'Cache-Control': 'no-store' },
  });
}

export const config = {
  matcher: ['/player/:path*', '/clan/:path*', '/t/:path*', '/compare', '/search', '/decks/:path+'],
};

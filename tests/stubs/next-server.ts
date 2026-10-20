// Request-time helpers are no-ops in tests; after() runs its callback straight away.
export const connection = async () => {};
export const after = (fn: () => unknown) => {
  void Promise.resolve().then(fn);
};
// Just enough of NextResponse for src/proxy.ts.
export class NextResponse extends Response {
  static next() {
    return new NextResponse(null, { status: 200, headers: { 'x-middleware-next': '1' } });
  }
}
export type NextRequest = Request & { nextUrl: URL };

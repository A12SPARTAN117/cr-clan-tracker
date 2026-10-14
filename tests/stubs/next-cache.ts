// Outside Next.js the cache directives are no-ops.
export function cacheLife(...args: unknown[]) {
  void args;
}
export function cacheTag(...args: unknown[]) {
  void args;
}
export function revalidateTag(...args: unknown[]) {
  void args;
}

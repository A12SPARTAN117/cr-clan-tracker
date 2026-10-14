// Outside Next.js the cache directives are no-ops.
export const cacheLife = (_profile?: unknown) => {};
export const cacheTag = (..._tags: string[]) => {};
export const revalidateTag = (..._args: unknown[]) => {};

// Request-time helpers are no-ops in tests; after() runs its callback straight away.
export const connection = async () => {};
export const after = (fn: () => unknown) => {
  void Promise.resolve().then(fn);
};

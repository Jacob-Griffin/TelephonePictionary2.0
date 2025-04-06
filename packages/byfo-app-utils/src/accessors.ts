export function useAccessor<T extends { accessorList: readonly (keyof T)[] }>(
  context: T & {
    _store?: { [K in keyof T]?: T[K] };
    _watcherMap?: { [prop in keyof T]?: { [id: string]: (v: T[prop]) => void } };
  },
) {
  context._store = {};
  context._watcherMap = {};
  for (const prop of context.accessorList) {
    const key = prop as keyof T;
    const existingValue = context[prop];
    Object.defineProperty(context, key, {
      get() {
        return context._store?.[key];
      },
      set(v) {
        context._store![key] = v;
        const watchers = context._watcherMap![key] ?? {};
        Object.values(watchers).forEach((watcher: (val: typeof v) => void) => watcher(v));
      },
    });
    if (existingValue !== undefined) {
      context[prop] = existingValue;
    }
  }

  return function on<P extends T['accessorList'][number]>(
    prop: P,
    fn: (v: T[P]) => void,
    { instant }: { instant?: boolean } = {},
  ): () => void {
    const watchers = context._watcherMap![prop] ?? {};
    let id = Math.floor(Math.random() * 10000).toString();
    while (id in watchers) {
      id = Math.floor(Math.random() * 10000).toString();
    }
    watchers[id] = fn;
    context._watcherMap![prop] = watchers;
    if (instant) {
      fn(context[prop]);
    }
    return () => {
      const watchers = context._watcherMap![prop];
      if (!watchers) {
        return;
      }
      delete watchers[id];
      context._watcherMap![prop] = watchers;
    };
  };
}

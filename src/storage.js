// The only file that touches browser storage. Every access is guarded, including
// reaching `localStorage` itself, which can throw in private modes and some WebViews.
export function createStorage() {
  return {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Blocked or full: settings stay in memory for this session.
      }
    },
  };
}

// The system "reduce motion" preference as { matches(), subscribe(fn) }; subscribe returns an unsubscribe.
export function createSystemReducedMotion() {
  let query = null;
  try {
    query = window.matchMedia('(prefers-reduced-motion: reduce)');
  } catch {
    query = null;
  }
  return {
    matches: () => Boolean(query?.matches),
    subscribe(fn) {
      if (!query) return () => {};
      const listener = () => fn();
      query.addEventListener('change', listener);
      return () => query.removeEventListener('change', listener);
    },
  };
}

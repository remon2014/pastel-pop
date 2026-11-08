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
// matchMedia is passed in for tests; by default it is the browser's. Older Safari only has addListener.
export function createSystemReducedMotion(matchMedia = (q) => window.matchMedia(q)) {
  let query = null;
  try {
    query = matchMedia('(prefers-reduced-motion: reduce)');
  } catch {
    query = null;
  }
  return {
    matches: () => Boolean(query?.matches),
    subscribe(fn) {
      const listener = () => fn();
      if (typeof query?.addEventListener === 'function') {
        query.addEventListener('change', listener);
        return () => query.removeEventListener('change', listener);
      }
      if (typeof query?.addListener === 'function') {
        query.addListener(listener);
        return () => query.removeListener(listener);
      }
      return () => {};
    },
  };
}

// Wraps a loop host and counts distinct frame callbacks waiting to run.
// A second loop would show as 2. Measured, not assumed.
export function countPending(host) {
  const pending = new Set();
  return {
    host: {
      ...host,
      schedule(fn) {
        const id = host.schedule((...args) => {
          pending.delete(id);
          fn(...args);
        });
        pending.add(id);
        return id;
      },
      cancel(id) {
        pending.delete(id);
        host.cancel(id);
      },
    },
    count: () => pending.size,
  };
}

import { DEV_FPS_WINDOW_MS } from '../config.js';

// Measured frames per second: frames seen in the last window, divided by the time they span.
// Times are in milliseconds, passed in, so this runs in Node tests.
export function createFpsCounter(windowMs = DEV_FPS_WINDOW_MS) {
  let stamps = [];

  function prune(now) {
    stamps = stamps.filter((t) => now - t <= windowMs);
  }

  return {
    tick(now) {
      stamps.push(now);
      prune(now);
    },
    fps(now) {
      prune(now);
      if (stamps.length < 2) return 0;
      const span = stamps[stamps.length - 1] - stamps[0];
      return span > 0 ? ((stamps.length - 1) * 1000) / span : 0;
    },
  };
}

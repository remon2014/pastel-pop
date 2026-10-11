// The one game loop (D-003). The only module that calls requestAnimationFrame.
import { MAX_FRAME_SECONDS } from '../config.js';

// Browser defaults. Looked up when called, so importing this file touches no window or document.
export function browserHost() {
  return {
    now: () => performance.now(),
    schedule: (fn) => requestAnimationFrame(fn),
    cancel: (id) => cancelAnimationFrame(id),
    isHidden: () => document.hidden,
    onVisibilityChange: (fn) => document.addEventListener('visibilitychange', fn),
  };
}

// host: { now() in ms, schedule(fn) -> id, cancel(id), isHidden(), onVisibilityChange(fn) }
// update(elapsedSeconds) is called once per frame while running.
export function createLoop(update, host, maxFrame = MAX_FRAME_SECONDS) {
  let wanted = false; // start() called and stop() not yet
  let frameId = null;
  let lastTime = null; // null means the next frame has no previous frame to measure from
  let lastElapsed = 0;
  let clampedFrames = 0;

  function frame() {
    frameId = null;
    if (!wanted || host.isHidden()) return;
    const time = host.now();
    let elapsed = lastTime === null ? 0 : Math.max(0, (time - lastTime) / 1000);
    lastTime = time;
    if (elapsed > maxFrame) {
      elapsed = maxFrame;
      clampedFrames++;
    }
    lastElapsed = elapsed;
    update(elapsed);
    // update may have called stop()
    if (wanted && frameId === null) frameId = host.schedule(frame);
  }

  function halt() {
    if (frameId !== null) host.cancel(frameId);
    frameId = null;
    lastTime = null;
  }

  function begin() {
    if (frameId === null && wanted && !host.isHidden()) frameId = host.schedule(frame);
  }

  host.onVisibilityChange(() => {
    if (host.isHidden()) halt();
    else begin();
  });

  return {
    start() {
      if (wanted) return;
      wanted = true;
      lastTime = null;
      begin();
    },
    stop() {
      wanted = false;
      halt();
    },
    get running() {
      return frameId !== null;
    },
    get lastElapsed() {
      return lastElapsed;
    },
    get clampedFrames() {
      return clampedFrames;
    },
  };
}

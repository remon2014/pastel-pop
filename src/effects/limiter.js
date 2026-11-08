// The effects safety rules as plain logic (D-005, WB 4 to 6). No DOM, window or settings import.
// request() always answers with a form; it never returns null and never queues anything.
import { PALETTE } from '../colorManager.js';
import {
  CALM_ARRIVALS_PER_SECOND,
  CALM_PULSE_MAX_RATE,
  DIM_LUMINANCE_CAP,
  DIM_SECONDS,
  DUSK,
  FLASH_LIMIT,
  FLASH_WINDOW_SECONDS,
  SHAKE_SECONDS,
  SHAKE_STARTS_PER_SECOND,
  STORY_ARRIVALS_PER_SECOND,
  STORY_PULSE_MAX_RATE,
  WOBBLE_SECONDS,
} from '../config.js';
import { dimFraction } from './colors.js';
import { createPulseClock } from './pulseClock.js';

const EPS = 1e-9;

// Drops starts that have left the 1 s window (now - 1, now], in place.
function prune(starts, now) {
  while (starts.length > 0 && starts[0] <= now - FLASH_WINDOW_SECONDS + EPS) starts.shift();
  return starts;
}

export function createLimiter() {
  const clock = createPulseClock();
  const pulses = new Map();
  const flashes = [];
  const arrivals = [];
  const shakes = [];
  const reacting = new Map();
  const dim = dimFraction(
    PALETTE.map((c) => c.hex),
    DUSK,
    DIM_LUMINANCE_CAP,
  );
  let reduceMotion = false;
  let shakeUntil = -Infinity;

  const reservedBeats = () => Math.ceil(clock.rate - EPS);
  const room = (now) => FLASH_LIMIT - reservedBeats() - prune(flashes, now).length;
  // When enough old flashes have left the window for `needed` more to fit.
  const freeAt = (needed) => flashes[flashes.length + reservedBeats() + needed - FLASH_LIMIT - 1] + 1;

  function updateClock() {
    clock.setRate(Math.max(0, ...pulses.values()));
  }

  function pulse({ mode, now, circleId, rate }) {
    const max = mode === 'calm' ? CALM_PULSE_MAX_RATE : STORY_PULSE_MAX_RATE;
    if (!(rate > 0) || rate > max + EPS) return { form: 'refused' };
    const was = pulses.get(circleId);
    pulses.set(circleId, rate);
    const before = clock.rate;
    updateClock();
    if (room(now) < 0) {
      // Taps already use the room this pulse needs: start once enough have left the window.
      const at = freeAt(0);
      if (was === undefined) pulses.delete(circleId);
      else pulses.set(circleId, was);
      clock.setRate(before);
      return { form: 'waitUntil', at };
    }
    return { form: 'full' };
  }

  function arrival({ mode, now }) {
    const calm = mode === 'calm';
    const perSecond = calm ? CALM_ARRIVALS_PER_SECOND : STORY_ARRIVALS_PER_SECOND;
    prune(arrivals, now);
    let at = now;
    if (arrivals.length >= perSecond) at = arrivals[arrivals.length - perSecond] + FLASH_WINDOW_SECONDS;
    // Story arrivals pay a flash; in Calm the pop pays for the arrival and itself.
    if (!calm && room(now) < 1) at = Math.max(at, freeAt(1));
    if (at > now + EPS) return { form: 'waitUntil', at };
    arrivals.push(now);
    if (!calm) flashes.push(now);
    return { form: 'full' };
  }

  function pop({ mode, now }) {
    const calm = mode === 'calm';
    if (reduceMotion) return { form: calm ? 'plainFade' : 'fade' };
    if (room(now) < 1) return { form: calm ? 'plainFade' : 'quiet' };
    flashes.push(now);
    return { form: 'full' };
  }

  function shake({ mode, now }) {
    if (mode === 'calm') return { form: 'refused' };
    if (reduceMotion) return { form: 'dim', amount: dim };
    prune(shakes, now);
    if (now < shakeUntil - EPS || shakes.length >= SHAKE_STARTS_PER_SECOND) return { form: 'quiet' };
    shakes.push(now);
    shakeUntil = now + SHAKE_SECONDS;
    return { form: 'full' };
  }

  function wobble({ mode, now, circleId }) {
    if (mode !== 'calm') return { form: 'refused' };
    if (now < (reacting.get(circleId) ?? -Infinity) - EPS) return { form: 'ignored' };
    reacting.set(circleId, now + (reduceMotion ? DIM_SECONDS : WOBBLE_SECONDS));
    return reduceMotion ? { form: 'dim', amount: dim } : { form: 'full' };
  }

  const handlers = {
    pulse,
    arrival,
    pop,
    shake,
    wobble,
    targetGlow: () => ({ form: 'full' }),
    travelLight: ({ mode }) => {
      if (mode === 'calm') return { form: 'refused' };
      return { form: reduceMotion ? 'ignored' : 'full' };
    },
  };

  return {
    clock,
    get dimFraction() {
      return dim;
    },
    setReduceMotion(on) {
      reduceMotion = Boolean(on);
    },
    request(req) {
      const handle = handlers[req.kind];
      return handle ? handle(req) : { form: 'refused' };
    },
    stopPulse(id) {
      pulses.delete(id);
      updateClock();
    },
  };
}

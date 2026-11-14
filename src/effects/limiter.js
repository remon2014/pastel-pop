// The effects safety rules as plain logic (D-005, WB 4 to 6). No DOM, window or settings import.
// request() always answers with a form; it never returns null and never queues anything.
import { PALETTE } from '../palette.js';
import {
  CALM_ARRIVALS_PER_SECOND,
  CALM_PULSE_MAX_RATE,
  DIM_LUMINANCE_CAP,
  DIM_SECONDS,
  DUSK,
  FLASH_LIMIT,
  FLASH_BUDGET_WINDOW_SECONDS,
  FLASH_WINDOW_SECONDS,
  PULSE_TICK_SECONDS,
  SHAKE_SECONDS,
  SHAKE_STARTS_PER_SECOND,
  STORY_ARRIVALS_PER_SECOND,
  STORY_PULSE_MAX_RATE,
  WOBBLE_SECONDS,
} from '../config.js';
import { dimFraction } from './colors.js';

const EPS = 1e-9;

// Drops starts that have left the 1 s window (now - 1, now], in place.
function prune(starts, now) {
  while (starts.length > 0 && starts[0] <= now - FLASH_WINDOW_SECONDS + EPS) starts.shift();
  return starts;
}

// Flash logs use the closed budget window [now - W, now]: only starts strictly older than W leave it.
function pruneBudget(starts, now) {
  while (starts.length > 0 && starts[0] < now - FLASH_BUDGET_WINDOW_SECONDS - EPS) starts.shift();
  return starts;
}

// Options let a test set the arrival rates; the defaults are the config values.
export function createLimiter({
  storyArrivalsPerSecond = STORY_ARRIVALS_PER_SECOND,
  calmArrivalsPerSecond = CALM_ARRIVALS_PER_SECOND,
} = {}) {
  const pulses = new Map();
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

  // Flash grants (pops and Story arrivals) are logged; at most FLASH_LIMIT in a closed window.
  // Pulse beats are soft (D-011): they are never logged and never take or reserve budget.
  const taps = [];
  const fired = [];
  let lastTick = 0;

  const tickOf = (t) => Math.floor(t / PULSE_TICK_SECONDS + EPS);
  const used = (now) => pruneBudget(taps, now).length;

  // Decide every pulse beat up to `now`, in time order. A due beat is always granted.
  function advance(now) {
    const target = tickOf(now);
    if (pulses.size > 0) {
      for (let k = lastTick + 1; k <= target; k++) {
        const due = [...pulses.values()].some((period) => k % period === 0);
        if (due) fired.push(k * PULSE_TICK_SECONDS);
      }
    }
    lastTick = Math.max(lastTick, target);
  }

  const canFlash = (now) => used(now) < FLASH_LIMIT;

  // Earliest time canFlash may be true again (advice for a `waitUntil` answer).
  function flashFreeAt(now) {
    // The window is closed, so a flash may start only just after the oldest one has left it.
    if (taps.length < FLASH_LIMIT) return now;
    return Math.max(now, taps[taps.length - FLASH_LIMIT] + FLASH_BUDGET_WINDOW_SECONDS + 2 * EPS);
  }

  // Beats sit on shared ticks, so a period must be a whole multiple of the tick length.
  function pulse({ mode, circleId, rate }) {
    const max = mode === 'calm' ? CALM_PULSE_MAX_RATE : STORY_PULSE_MAX_RATE;
    if (!(rate > 0) || rate > max + EPS) return { form: 'refused' };
    const period = Math.round(1 / rate / PULSE_TICK_SECONDS);
    if (period < 1 || Math.abs(period * PULSE_TICK_SECONDS * rate - 1) > EPS) return { form: 'refused' };
    pulses.set(circleId, period);
    return { form: 'full' };
  }

  function arrival({ mode, now }) {
    const calm = mode === 'calm';
    const perSecond = calm ? calmArrivalsPerSecond : storyArrivalsPerSecond;
    prune(arrivals, now);
    let at = now;
    if (arrivals.length >= perSecond) at = arrivals[arrivals.length - perSecond] + FLASH_WINDOW_SECONDS;
    // Story arrivals pay a flash; in Calm the pop pays for the arrival and itself.
    if (!calm && !canFlash(now)) at = Math.max(at, flashFreeAt(now));
    if (at > now + EPS) return { form: 'waitUntil', at };
    arrivals.push(now);
    if (!calm) taps.push(now);
    return { form: 'full' };
  }

  function pop({ mode, now }) {
    const calm = mode === 'calm';
    if (reduceMotion) return { form: calm ? 'plainFade' : 'fade' };
    if (!canFlash(now)) return { form: calm ? 'plainFade' : 'quiet' };
    taps.push(now);
    return { form: 'full' };
  }

  function shake({ mode, now }) {
    if (mode === 'calm') return { form: 'refused' };
    prune(shakes, now);
    if (now < shakeUntil - EPS || shakes.length >= SHAKE_STARTS_PER_SECOND) return { form: 'quiet' };
    shakes.push(now);
    shakeUntil = now + (reduceMotion ? DIM_SECONDS : SHAKE_SECONDS);
    return reduceMotion ? { form: 'dim', amount: dim } : { form: 'full' };
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
    get dimFraction() {
      return dim;
    },
    setReduceMotion(on) {
      reduceMotion = Boolean(on);
    },
    request(req) {
      advance(req.now);
      const handle = handlers[req.kind];
      return handle ? handle(req) : { form: 'refused' };
    },
    // Beats granted since the last call (the drawing side plays these). Every due beat appears.
    takeBeats(now) {
      advance(now);
      return fired.splice(0);
    },
    // A circle has left: its reaction entry is no longer needed.
    forget(circleId) {
      reacting.delete(circleId);
    },
    stopPulse(id, now) {
      advance(now);
      pulses.delete(id);
    },
  };
}

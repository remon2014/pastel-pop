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
  FLASH_BUDGET_WINDOW_SECONDS,
  FLASH_WINDOW_SECONDS,
  PULSE_TICK_SECONDS,
  SHAKE_SECONDS,
  SHAKE_STARTS_PER_SECOND,
  STORY_ARRIVALS_PER_SECOND,
  STORY_PULSE_MAX_RATE,
  TAP_FLASHES_WITH_PULSE,
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

export function createLimiter() {
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

  // Taps and pulse beats are logged separately; together they may never reach FLASH_LIMIT in a window.
  const beats = [];
  const taps = [];
  const fired = [];
  let lastTick = 0;
  let pulseStoppedAt = -Infinity;

  const tickOf = (t) => Math.floor(t / PULSE_TICK_SECONDS + EPS);
  const used = (now) => pruneBudget(beats, now).length + pruneBudget(taps, now).length;
  const pulseRecent = (now) => pulses.size > 0 || now <= pulseStoppedAt + FLASH_BUDGET_WINDOW_SECONDS + EPS;

  // Decide every pulse beat up to `now`, in time order. A beat that does not fit is skipped.
  function advance(now) {
    const target = tickOf(now);
    if (pulses.size > 0) {
      for (let k = lastTick + 1; k <= target; k++) {
        const t = k * PULSE_TICK_SECONDS;
        const due = [...pulses.values()].some((period) => k % period === 0);
        if (due && used(t) < FLASH_LIMIT) {
          beats.push(t);
          fired.push(t);
        }
      }
    }
    lastTick = Math.max(lastTick, target);
  }

  // The one test every tap flash passes: fewer than FLASH_LIMIT granted in the last second,
  // and while a pulse runs (or just ran) at most TAP_FLASHES_WITH_PULSE tap flashes in that second.
  function canFlash(now) {
    if (used(now) >= FLASH_LIMIT) return false;
    return !pulseRecent(now) || taps.length < TAP_FLASHES_WITH_PULSE;
  }

  // Earliest time canFlash may be true again (advice for a `waitUntil` answer).
  function flashFreeAt(now) {
    const logged = [...beats, ...taps].sort((x, y) => x - y);
    let at = now;
    // The window is closed, so a flash may start only just after the oldest one has left it.
    const free = (t) => t + FLASH_BUDGET_WINDOW_SECONDS + 2 * EPS;
    if (logged.length >= FLASH_LIMIT) at = free(logged[logged.length - FLASH_LIMIT]);
    if (pulses.size === 0) at = Math.max(at, free(pulseStoppedAt));
    return at;
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
    const perSecond = calm ? CALM_ARRIVALS_PER_SECOND : STORY_ARRIVALS_PER_SECOND;
    prune(arrivals, now);
    let at = now;
    if (arrivals.length >= perSecond) at = arrivals[arrivals.length - perSecond] + FLASH_WINDOW_SECONDS;
    // Story arrivals pay a flash; in Calm the pop pays for the arrival and itself.
    // While a pulse runs it owns the budget: the circle arrives quietly (no brightness) and pays nothing.
    const quiet = !calm && pulseRecent(now);
    if (!calm && !quiet && !canFlash(now)) at = Math.max(at, flashFreeAt(now));
    if (at > now + EPS) return { form: 'waitUntil', at };
    arrivals.push(now);
    if (quiet) return { form: 'quiet' };
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
    // Beats granted since the last call (the drawing side plays these). Skipped beats never appear.
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
      if (pulses.size === 0) pulseStoppedAt = now;
    },
  };
}

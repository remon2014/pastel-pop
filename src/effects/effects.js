// The effects layer's state (D-005, D-010): wraps the one limiter and turns each answer into plain
// effect state. No canvas, DOM or settings import; the settings object is passed in. Drawing is in drawEffects.js.
import {
  ARRIVAL_SECONDS,
  DIM_SECONDS,
  FLASH_WINDOW_SECONDS,
  MAX_BEAT_LATENESS,
  PLAIN_FADE_SECONDS,
  POP_SECONDS,
  PULSE_BEAT_SECONDS,
  QUIET_FADE_SECONDS,
  SHAKE_MAX_PIXELS,
  SHAKE_SECONDS,
  SHAKE_SWINGS,
  WOBBLE_PIXELS,
  WOBBLE_SECONDS,
} from '../config.js';
import { createLimiter } from './limiter.js';

const EPS = 1e-9;

// How long each drawn answer lasts, by `kind.form`. An answer not in this table draws nothing
// (`ignored`, `refused`, a held or over-budget shake, pulses between beats, glow and travelling light).
const SECONDS = {
  'arrival.full': ARRIVAL_SECONDS,
  'pop.full': POP_SECONDS,
  'pop.quiet': QUIET_FADE_SECONDS,
  'pop.fade': PLAIN_FADE_SECONDS,
  'pop.plainFade': PLAIN_FADE_SECONDS,
  'shake.full': SHAKE_SECONDS,
  'shake.dim': DIM_SECONDS,
  'wobble.full': WOBBLE_SECONDS,
  'wobble.dim': DIM_SECONDS,
  'pulse.beat': PULSE_BEAT_SECONDS,
};

// Whole-pixel sideways offset: a decaying wave of `swings` half-swings.
export function swingOffset(progress, maxPixels, swings) {
  return Math.round(maxPixels * (1 - progress) * Math.sin(Math.PI * swings * progress));
}

function offsetFor(effect) {
  if (effect.kind === 'shake' && effect.form === 'full') {
    return swingOffset(effect.progress, SHAKE_MAX_PIXELS, SHAKE_SWINGS);
  }
  if (effect.kind === 'wobble' && effect.form === 'full') {
    return swingOffset(effect.progress, WOBBLE_PIXELS, 2);
  }
  return 0;
}

function prune(times, now) {
  while (times.length > 0 && times[0] <= now - FLASH_WINDOW_SECONDS + EPS) times.shift();
}

export function createEffects() {
  const limiter = createLimiter();
  const active = [];
  const held = new Map();
  const flashes = [];
  const beats = [];
  const shakeStarts = [];
  let clock = 0;
  const peaks = { flashes: 0, shakesRunning: 0, shakesBegun: 0 };

  const runningShakes = () => active.filter((e) => e.kind === 'shake' && e.form === 'full').length;

  function begin(effect, now) {
    active.push(effect);
    if (effect.kind === 'shake' && effect.form === 'full') {
      shakeStarts.push(now);
      prune(shakeStarts, now);
      peaks.shakesBegun = Math.max(peaks.shakesBegun, shakeStarts.length);
      peaks.shakesRunning = Math.max(peaks.shakesRunning, runningShakes());
    }
  }

  // Flash start times, kept in time order (a beat seen late is older than a tap already logged).
  // The peak is the most flashes in any window (t - 1 s, t] ending at a flash.
  function countFlash(at) {
    let i = flashes.length;
    while (i > 0 && flashes[i - 1] > at) i--;
    flashes.splice(i, 0, at);
    while (flashes[0] <= flashes[flashes.length - 1] - 2 * FLASH_WINDOW_SECONDS) flashes.shift();
    for (const end of flashes) peaks.flashes = Math.max(peaks.flashes, flashesIn(end));
  }

  const flashesIn = (end) => flashes.filter((t) => t <= end + EPS && t > end - FLASH_WINDOW_SECONDS + EPS).length;

  // A flash is a brightening that pays the budget: a Story arrival, a full pop or burst, a pulse beat.
  // A Calm arrival and its pop are one flash, paid by the pop (the limiter's rule).
  const isFlash = (kind, form, mode) =>
    form === 'full' && (kind === 'pop' || kind === 'pulse' || (kind === 'arrival' && mode === 'story'));

  function show(req, form, amount, now) {
    const seconds = SECONDS[`${req.kind}.${form}`];
    if (seconds === undefined) return;
    if (isFlash(req.kind, form, req.mode)) countFlash(now);
    begin(
      {
        kind: req.kind,
        form,
        mode: req.mode,
        circleId: req.circleId,
        x: req.x,
        y: req.y,
        radius: req.radius,
        color: req.color,
        start: now,
        seconds,
        progress: 0,
        strength: amount ?? 1,
        offsetX: 0,
      },
      now,
    );
  }

  // req: { kind, mode, now, circleId, rate?, x, y, radius (widths), color (hex) }. Returns the limiter's { form }.
  function request(req) {
    clock = Math.max(clock, req.now);
    const answer = limiter.request(req);
    if (answer.form === 'waitUntil') held.set(req.circleId, { req, at: answer.at });
    else show(req, answer.form, answer.amount, req.now);
    return answer;
  }

  function update(now) {
    clock = Math.max(clock, now);
    for (const [id, wait] of [...held]) {
      if (wait.at > now + EPS) continue;
      held.delete(id);
      request({ ...wait.req, now });
    }
    for (const t of limiter.takeBeats(now)) {
      // A beat seen late (after a gap) is dropped unseen. The limiter still counted it, which errs safe.
      if (now - t > MAX_BEAT_LATENESS) continue;
      countFlash(t);
      beats.push(t);
      begin(
        { kind: 'pulse', form: 'beat', start: t, seconds: PULSE_BEAT_SECONDS, progress: 0, strength: 1, offsetX: 0 },
        t,
      );
    }
    for (let i = active.length - 1; i >= 0; i--) {
      const effect = active[i];
      effect.progress = Math.min(1, (now - effect.start) / effect.seconds);
      if (now >= effect.start + effect.seconds - EPS) {
        active.splice(i, 1);
        continue;
      }
      effect.offsetX = offsetFor(effect);
    }
    prune(beats, now);
    prune(shakeStarts, now);
  }

  return {
    request,
    update,
    // Applies effective Reduce motion now and on every change; returns the unsubscribe.
    bindSettings(settings) {
      limiter.setReduceMotion(settings.effectiveReduceMotion());
      return settings.subscribe((on) => limiter.setReduceMotion(on));
    },
    stopPulse: (id, now) => limiter.stopPulse(id, now),
    forget: (circleId) => limiter.forget(circleId),
    // True while an arrival for this circle is waiting for its turn.
    isHeld: (circleId) => held.has(circleId),
    // Effect states in the order they began. Read-only for drawers.
    get active() {
      return active;
    },
    shakeOffset: () => active.reduce((sum, e) => (e.kind === 'shake' ? sum + e.offsetX : sum), 0),
    wobbleOffset: (circleId) =>
      active.reduce((sum, e) => (e.kind === 'wobble' && e.circleId === circleId ? sum + e.offsetX : sum), 0),
    // The layer's own numbers, for F-16's comparison with the pixels.
    flashCount: () => flashesIn(clock),
    beatCount: () => beats.length,
    shakesBegunCount: () => shakeStarts.length,
    shakesRunning: runningShakes,
    peaks,
    resetPeaks() {
      peaks.flashes = flashesIn(clock);
      peaks.shakesRunning = runningShakes();
      peaks.shakesBegun = shakeStarts.length;
    },
  };
}

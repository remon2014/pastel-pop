// Game world rules with no drawing and no browser (D-003).
// The play area is `width` wide (1.0 in the game) and `height` tall, both in play-area widths.
// A circle is { x, y, vx, vy, radius } in widths and widths per second. Callers may add fields
// (the game adds a colour). Time comes in as elapsed seconds; randomness comes in as a function
// returning a number from 0 up to (not including) 1.
import {
  BASE_SPEED_WIDTHS,
  CIRCLE_DIAMETER_DP,
  CIRCLE_MAX_DIAMETER_DP,
  CIRCLE_MIN_DIAMETER_DP,
  CIRCLE_REFERENCE_WIDTH_DP,
  LEVEL_SPEED_STEP,
} from '../config.js';

// Radius in widths for a play area `widthDp` CSS pixels wide: a fixed fraction of the width,
// but never smaller than the floor diameter in dp.
export function circleRadius(widthDp) {
  const fraction = CIRCLE_DIAMETER_DP / 2 / CIRCLE_REFERENCE_WIDTH_DP;
  const floor = CIRCLE_MIN_DIAMETER_DP / 2 / widthDp;
  const cap = CIRCLE_MAX_DIAMETER_DP / 2 / widthDp;
  return Math.max(Math.min(fraction, cap), floor);
}

// Speed multiplier for a level (1.0 at level 1).
export function levelMultiplier(level) {
  return 1 + (level - 1) * LEVEL_SPEED_STEP;
}

export function speedFor(multiplier) {
  return BASE_SPEED_WIDTHS * multiplier;
}

// Allowed range for a circle's centre on one axis. If the circle is too big to fit, both ends
// are the middle, so it sits centred.
function range(size, radius) {
  const lo = Math.min(radius, size / 2);
  return [lo, size - lo];
}

// New circle fully inside the bounds, heading in a random direction at the given speed.
export function spawnCircle(bounds, radius, speed, random) {
  const [x0, x1] = range(bounds.width, radius);
  const [y0, y1] = range(bounds.height, radius);
  const angle = random() * Math.PI * 2;
  return {
    x: x0 + random() * (x1 - x0),
    y: y0 + random() * (y1 - y0),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
  };
}

// Moves one axis and reflects at both walls. Folding the path back and forth means any step size
// ends inside the range, with the velocity flipped once per wall crossed.
function moveAxis(circle, axis, size, seconds) {
  const [lo, hi] = range(size, circle.radius);
  const span = hi - lo;
  const vel = axis === 'x' ? 'vx' : 'vy';
  if (span <= 0) {
    circle[axis] = lo;
    return;
  }
  const t = circle[axis] + circle[vel] * seconds - lo;
  const folds = Math.floor(t / span);
  const rest = t - folds * span;
  const flipped = Math.abs(folds) % 2 === 1;
  const along = flipped ? span - rest : rest;
  circle[axis] = lo + Math.min(span, Math.max(0, along));
  if (flipped) circle[vel] = -circle[vel];
}

export function stepCircle(circle, bounds, seconds) {
  moveAxis(circle, 'x', bounds.width, seconds);
  moveAxis(circle, 'y', bounds.height, seconds);
}

export function stepCircles(circles, bounds, seconds) {
  for (const circle of circles) stepCircle(circle, bounds, seconds);
}

// After the bounds change (resize, rotation), pull every circle back inside. Speeds are kept.
export function fitCircles(circles, bounds) {
  for (const circle of circles) {
    const [x0, x1] = range(bounds.width, circle.radius);
    const [y0, y1] = range(bounds.height, circle.radius);
    circle.x = Math.min(x1, Math.max(x0, circle.x));
    circle.y = Math.min(y1, Math.max(y0, circle.y));
  }
}

// True when the whole circle is inside the bounds.
export function isInside(circle, bounds) {
  const r = circle.radius;
  return r <= circle.x && circle.x <= bounds.width - r && r <= circle.y && circle.y <= bounds.height - r;
}

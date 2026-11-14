// Rules of the interim start scene, with no drawing and no browser. Randomness comes in as a function
// returning a number from 0 up to (not including) 1; time comes in as elapsed seconds.
import { INTERIM_PER_COLOUR, REFILL_STAGGER_S } from '../config.js';

// `count` distinct colours chosen at random from the palette.
export function pickColours(palette, count, random) {
  const pool = [...palette];
  const chosen = [];
  while (chosen.length < count && pool.length > 0) {
    chosen.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return chosen;
}

// A random colour among those on screen, or null when no circle is left. The same colour may come up again.
export function pickTarget(circles, random) {
  if (circles.length === 0) return null;
  const colours = [...new Set(circles.map((circle) => circle.color))];
  return colours[Math.floor(random() * colours.length)];
}

// How many circles of each colour are missing from `circles`.
function missingByColour(circles, colours, perColour) {
  return colours.map((color) => ({
    color,
    missing: perColour - circles.filter((circle) => circle.color === color).length,
  }));
}

// The colour of the next circle to add, or null when every colour has its full count.
export function nextRefillColour(circles, colours, perColour = INTERIM_PER_COLOUR) {
  return missingByColour(circles, colours, perColour).find((entry) => entry.missing > 0)?.color ?? null;
}

// True when some colour of the scene has no circle left on screen: time to refill.
export function colourCleared(circles, colours) {
  return colours.some((color) => !circles.some((circle) => circle.color === color));
}

// Staggered refill. `state` is { refilling, wait }. Call every frame with the elapsed seconds; it returns the
// colours to add now (usually none, one per stagger interval). Once started it runs until every colour is full,
// and the first arrival comes at once so the empty scene never lingers.
export function stepRefill(state, circles, colours, seconds, stagger = REFILL_STAGGER_S) {
  const arrivals = [];
  if (!state.refilling) return arrivals;
  state.wait -= seconds;
  const pending = [...circles];
  while (state.wait <= 0) {
    const color = nextRefillColour(pending, colours);
    if (!color) {
      state.refilling = false;
      state.wait = 0;
      break;
    }
    arrivals.push(color);
    pending.push({ color });
    state.wait += stagger;
  }
  return arrivals;
}

export function startRefill(state) {
  state.refilling = true;
  state.wait = 0;
}

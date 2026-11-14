import { MIN_TOUCH_DP, TAP_REACH } from '../config.js';

export function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

// Smallest tap radius in widths for a play area `widthDp` wide: half the minimum touch size.
export function minTapRadius(widthDp) {
  return MIN_TOUCH_DP / 2 / widthDp;
}

// The circle a tap at (x, y) in widths hits, or null. A circle's tap area is its radius times `reach`,
// never under `minRadius`. Among circles in reach the matching one (`matchId`) is taken, otherwise the nearest.
export function findHit(circles, x, y, matchId, { reach = TAP_REACH, minRadius = 0 } = {}) {
  let best = null;
  let bestMatches = false;
  let bestDistance = Infinity;
  for (const circle of circles) {
    const distance = getDistance(x, y, circle.x, circle.y);
    if (distance > Math.max(circle.radius * reach, minRadius)) continue;
    const matches = circle.color.id === matchId;
    if (matches === bestMatches ? distance < bestDistance : matches) {
      best = circle;
      bestMatches = matches;
      bestDistance = distance;
    }
  }
  return best;
}

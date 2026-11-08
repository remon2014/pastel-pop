// Colour maths for the effects rules. Canvas-free.

function channels(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function linear(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminanceOf([r, g, b]) {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function relativeLuminance(hex) {
  return luminanceOf(channels(hex));
}

export function isSaturatedRed(hex, ratio) {
  const [r, g, b] = channels(hex);
  const sum = r + g + b;
  return sum > 0 && r / sum >= ratio;
}

// How far (0 to 1) the lightest colour may ease towards the background so its relative luminance
// drops by no more than `cap`. Recomputed from the hex values, so it follows palette changes.
export function dimFraction(hexes, backgroundHex, cap) {
  const lightest = hexes.reduce((a, b) => (relativeLuminance(b) > relativeLuminance(a) ? b : a));
  const from = channels(lightest);
  const to = channels(backgroundHex);
  const base = luminanceOf(from);
  const drop = (f) => base - luminanceOf(from.map((c, i) => c + (to[i] - c) * f));
  if (drop(1) <= cap) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (drop(mid) <= cap) lo = mid;
    else hi = mid;
  }
  return lo;
}

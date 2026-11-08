// Canvas-free sizing of the one low-resolution canvas (D-004). All sizes in CSS px unless named otherwise.
import { INTERNAL_WIDTH_TARGET, MAX_COLUMN_ASPECT, SWATCH_SCALE } from '../config.js';

// Allowance so float error (360 x 1.15 = 413.99999...) does not lose an internal pixel.
const FLOAT_ALLOWANCE = 1e-6;

const isUsable = (n) => Number.isFinite(n) && n > 0;

// Returns a frozen view, or null when the window has no usable size.
export function computeView(cssWidth, cssHeight, dpr, target = INTERNAL_WIDTH_TARGET) {
  if (!isUsable(cssWidth) || !isUsable(cssHeight)) return null;
  const ratio = isUsable(dpr) ? dpr : 1;
  const scale = Math.max(1, Math.round((cssWidth * ratio) / target));
  const internalWidth = Math.floor((cssWidth * ratio) / scale + FLOAT_ALLOWANCE);
  const internalHeight = Math.floor((cssHeight * ratio) / scale + FLOAT_ALLOWANCE);
  if (internalWidth < 1 || internalHeight < 1) return null;
  const cssPerInternal = scale / ratio;
  return Object.freeze({
    scale,
    internalWidth,
    internalHeight,
    cssPerInternal,
    playCssWidth: internalWidth * cssPerInternal,
    playCssHeight: internalHeight * cssPerInternal,
    dpr: ratio,
    target,
  });
}

// Canvas-relative CSS px to world units (play-area widths).
export function cssToWorld(view, cssX, cssY) {
  return { x: cssX / view.playCssWidth, y: cssY / view.playCssWidth };
}

// A world circle as whole internal pixels: square size and top-left corner.
export function circlePixels(view, circle) {
  const size = Math.max(1, Math.round(2 * circle.radius * view.internalWidth));
  return {
    size,
    left: Math.round(circle.x * view.internalWidth - size / 2),
    top: Math.round(circle.y * view.internalWidth - size / 2),
  };
}

const inset = (n) => (Number.isFinite(n) && n > 0 ? n : 0);

// The play column in CSS px from the window size and safe-area insets { top, right, bottom, left }:
// the visible screen inside the insets, narrowed to maxAspect (width / height) and centred.
// Returns { left, top, width, height }, or null when nothing usable is left.
export function columnRect(winWidth, winHeight, insets, maxAspect = MAX_COLUMN_ASPECT) {
  const left = inset(insets?.left);
  const top = inset(insets?.top);
  const availWidth = winWidth - left - inset(insets?.right);
  const height = winHeight - top - inset(insets?.bottom);
  if (!isUsable(availWidth) || !isUsable(height)) return null;
  const width = Math.min(availWidth, height * maxAspect);
  return { left: left + (availWidth - width) / 2, top, width, height };
}

// Target swatch size in whole internal pixels: SWATCH_SCALE times a play circle of the given radius (widths).
export function swatchPixels(view, radius) {
  return Math.round(SWATCH_SCALE * circlePixels(view, { x: 0, y: 0, radius }).size);
}

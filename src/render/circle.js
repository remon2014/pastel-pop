// circle.js
import { circlePixels } from './view.js';
import { drawSymbol } from './symbols.js';

// Whole-pixel rows of a filled disc in a size x size square: one { offset, width } per row.
// arc() blends edge pixels even with smoothing off, so discs are built from whole-pixel rows.
export function discRows(size) {
  const radius = size / 2;
  const rows = [];
  for (let row = 0; row < size; row++) {
    const dy = row + 0.5 - radius;
    const half = Math.sqrt(Math.max(0, radius * radius - dy * dy));
    // Pixel centres within `half` of the middle: even sizes have centres at +-0.5, +-1.5; odd at 0, +-1.
    const width = size % 2 === 0 ? 2 * Math.round(half) : 2 * Math.floor(half) + 1;
    rows.push({ offset: (size - width) / 2, width });
  }
  return rows;
}

const rowCache = new Map();

// discRows by size, so drawing does not rebuild the rows every frame.
function cachedRows(size) {
  let rows = rowCache.get(size);
  if (!rows) {
    rows = discRows(size);
    rowCache.set(size, rows);
  }
  return rows;
}

// Fills a whole-pixel disc of `size` internal pixels with its top-left corner at (left, top).
export function fillDisc(ctx, left, top, size, color) {
  ctx.fillStyle = color;
  const rows = cachedRows(size);
  for (let row = 0; row < rows.length; row++) {
    ctx.fillRect(left + rows[row].offset, top + row, rows[row].width, 1);
  }
}

// Draws a world circle (positions and radius in play-area widths) onto the internal-resolution canvas.
export function drawCircle(ctx, circle, view) {
  const { size, left, top } = circlePixels(view, circle);
  fillDisc(ctx, left, top, size, circle.color.hex);
  drawSymbol(ctx, circle.color.id, left + size / 2, top + size / 2, size / 2);
}

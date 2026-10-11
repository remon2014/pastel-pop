// circle.js
import { drawSymbol } from './symbols.js';

// Draws a world circle (positions and radius in play-area widths) at `scale` pixels per width.
export function drawCircle(ctx, circle, scale) {
  const x = circle.x * scale;
  const y = circle.y * scale;
  const radius = circle.radius * scale;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = circle.color.hex;
  ctx.fill();
  drawSymbol(ctx, circle.color.id, x, y, radius);
}

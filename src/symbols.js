// Placeholder symbols: solid silhouettes drawn with canvas paths until pixel art exists.
// Each function fills one shape centred on (cx, cy); s is half the symbol's width.
import { INK, SYMBOL_SIZE } from './config.js';

function polygon(ctx, points) {
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

function drawStar(ctx, cx, cy, s) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? s : s * 0.42;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  polygon(ctx, points);
}

function drawCloud(ctx, cx, cy, s) {
  const base = cy + s * 0.45;
  ctx.moveTo(cx - s, base);
  ctx.arc(cx - s * 0.6, base - s * 0.35, s * 0.35, Math.PI / 2, Math.PI * 1.5);
  ctx.arc(cx - s * 0.1, base - s * 0.65, s * 0.55, Math.PI * 1.1, Math.PI * 1.9);
  ctx.arc(cx + s * 0.55, base - s * 0.4, s * 0.4, Math.PI * 1.5, Math.PI / 2);
  ctx.closePath();
}

function drawKite(ctx, cx, cy, s) {
  polygon(ctx, [
    [cx, cy - s],
    [cx + s * 0.55, cy - s * 0.1],
    [cx, cy + s],
    [cx - s * 0.55, cy - s * 0.1],
  ]);
}

function drawLeaf(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.7, -s * 0.2, 0, s * 0.75);
  ctx.quadraticCurveTo(-s * 0.7, -s * 0.2, 0, -s);
  ctx.closePath();
  ctx.rect(-s * 0.07, s * 0.6, s * 0.14, s * 0.4);
  ctx.restore();
}

function drawMoon(ctx, cx, cy, s) {
  // The crescent's mass sits left of its outer arc's centre, so shift it right to look centred.
  const mx = cx + s * 0.27;
  ctx.arc(mx, cy, s, Math.PI * 0.35, Math.PI * 1.65);
  ctx.arc(mx + s * 0.5, cy, s * 0.8, Math.PI * 1.35, Math.PI * 0.65, true);
  ctx.closePath();
}

const DRAWERS = { star: drawStar, cloud: drawCloud, kite: drawKite, leaf: drawLeaf, moon: drawMoon };

// Draws the symbol for a colour id in Ink, sized relative to the circle radius.
export function drawSymbol(ctx, id, cx, cy, circleRadius) {
  ctx.beginPath();
  DRAWERS[id](ctx, cx, cy, circleRadius * SYMBOL_SIZE);
  ctx.fillStyle = INK;
  ctx.fill();
}

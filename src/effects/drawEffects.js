// Draws the effect state into the internal-resolution canvas (D-005, D-010). One small drawer per look,
// chosen from one table; a drawer only reads state and decides nothing about timing, budget or motion.
// Colours: the circle's own palette colour, Dusk and the config placeholders. Shapes are whole-pixel.
import { discRows, drawCircle, fillDisc } from '../render/circle.js';
import {
  BURST_DOTS,
  DUSK,
  EFFECT_COLORS,
  POP_GROW_PIXELS,
  POP_RING_MAX_RADIUS_FRACTION,
  PULSE_BAR_HEIGHT,
  PULSE_BAR_TOP,
  PULSE_BAR_WIDTH_FRACTION,
  QUIET_MIN_SCALE,
} from '../config.js';
import { circlePixels } from '../render/view.js';
import { pulseBarAlpha } from './colors.js';

const GROW_PHASE = 0.3;

// A one-pixel ring of `size` internal px across, top-left at (left, top).
function strokeDisc(ctx, left, top, size, color) {
  ctx.fillStyle = color;
  const outer = discRows(size);
  const inner = size > 2 ? discRows(size - 2) : [];
  for (let row = 0; row < outer.length; row++) {
    const o = outer[row];
    const i = inner[row - 1];
    if (!i) {
      ctx.fillRect(left + o.offset, top + row, o.width, 1);
      continue;
    }
    const innerStart = o.offset + 1 + i.offset;
    ctx.fillRect(left + o.offset, top + row, innerStart - o.offset, 1);
    const innerEnd = innerStart + i.width;
    ctx.fillRect(left + innerEnd, top + row, o.offset + o.width - innerEnd, 1);
  }
}

// A disc `grow` px bigger on every side than the effect's circle, centred on it.
function discAround(ctx, pixels, grow, color) {
  fillDisc(ctx, pixels.left - grow, pixels.top - grow, pixels.size + 2 * grow, color);
}

function ringAround(ctx, pixels, grow, color) {
  strokeDisc(ctx, pixels.left - grow, pixels.top - grow, pixels.size + 2 * grow, color);
}

function calmPop(ctx, e, pixels) {
  if (e.progress < GROW_PHASE) {
    ctx.globalAlpha = 1 - e.progress / GROW_PHASE;
    discAround(ctx, pixels, POP_GROW_PIXELS, e.color);
    return;
  }
  const t = (e.progress - GROW_PHASE) / (1 - GROW_PHASE);
  const reach = Math.max(POP_GROW_PIXELS, Math.floor((pixels.size / 2) * POP_RING_MAX_RADIUS_FRACTION));
  ctx.globalAlpha = 1 - t;
  ringAround(ctx, pixels, POP_GROW_PIXELS + Math.round(t * (reach - POP_GROW_PIXELS)), e.color);
}

// Placeholder burst: dots travelling out, kept inside the circle's own area.
function storyBurst(ctx, e, pixels) {
  const reach = (pixels.size / 2) * 0.8 * e.progress;
  const cx = pixels.left + pixels.size / 2;
  const cy = pixels.top + pixels.size / 2;
  ctx.globalAlpha = 1 - e.progress;
  ctx.fillStyle = e.color;
  for (let i = 0; i < BURST_DOTS; i++) {
    const angle = (i / BURST_DOTS) * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(angle) * reach) - 1, Math.round(cy + Math.sin(angle) * reach) - 1, 2, 2);
  }
}

// Fades in the circle's own colour; `shrink` lets it get smaller (not under Reduce motion).
function fade(ctx, e, pixels, shrink) {
  const scale = shrink ? 1 - (1 - QUIET_MIN_SCALE) * e.progress : 1;
  const size = Math.max(1, Math.round(pixels.size * scale));
  const inset = (pixels.size - size) / 2;
  ctx.globalAlpha = 1 - e.progress;
  fillDisc(ctx, Math.round(pixels.left + inset), Math.round(pixels.top + inset), size, e.color);
}

// A faint own-colour halo one pixel wider than the circle, fading out. No ring, nothing brighter than the fill.
function arrivalHalo(ctx, e, pixels) {
  ctx.globalAlpha = 0.5 * (1 - e.progress);
  discAround(ctx, pixels, POP_GROW_PIXELS, e.color);
}

// Dusk over the tapped circle, up to the limiter's amount, easing in and out.
function dim(ctx, e, pixels) {
  ctx.globalAlpha = e.strength * (1 - Math.abs(2 * e.progress - 1));
  discAround(ctx, pixels, 0, DUSK);
}

// Placeholder time bar at the top of the play area; the screen itself never changes. It stands at its base
// while a pulse runs and a beat lifts it to the peak and back (soft: pulseBar.test.js). Drawn last, so no
// other effect is over it.
function drawPulseBar(ctx, effects, view) {
  if (!effects.pulseOn()) return;
  let progress = 1;
  for (const e of effects.active) if (e.kind === 'pulse') progress = e.progress;
  const width = Math.round(view.internalWidth * PULSE_BAR_WIDTH_FRACTION);
  ctx.globalAlpha = pulseBarAlpha(progress);
  ctx.fillStyle = EFFECT_COLORS.lowTimePulse;
  ctx.fillRect(Math.round((view.internalWidth - width) / 2), PULSE_BAR_TOP, width, PULSE_BAR_HEIGHT);
}

// Shake and wobble are offsets (see drawWithShake and drawCircleWithEffects), so they have no drawer here.
// Pulse beats have none either: drawPulseBar reads them.
const DRAWERS = {
  'arrival.full': arrivalHalo,
  'pop.full.calm': calmPop,
  'pop.full.story': storyBurst,
  'pop.quiet': (ctx, e, pixels) => fade(ctx, e, pixels, true),
  'pop.fade': (ctx, e, pixels) => fade(ctx, e, pixels, false),
  'pop.plainFade': (ctx, e, pixels) => fade(ctx, e, pixels, false),
  'shake.dim': dim,
  'wobble.dim': dim,
};

function drawerFor(e) {
  return DRAWERS[`${e.kind}.${e.form}.${e.mode}`] ?? DRAWERS[`${e.kind}.${e.form}`];
}

export function drawEffects(ctx, effects, view) {
  for (const e of effects.active) {
    const drawer = drawerFor(e);
    if (!drawer) continue;
    drawer(ctx, e, e.radius ? circlePixels(view, e) : null, view);
  }
  drawPulseBar(ctx, effects, view);
  ctx.globalAlpha = 1;
}

// Draws the world and then the effects, with the whole play area moved by the current shake.
export function drawFrame(ctx, effects, view, drawWorld) {
  ctx.save();
  ctx.translate(effects.shakeOffset(), 0);
  drawWorld();
  drawEffects(ctx, effects, view);
  ctx.restore();
}

// A world circle drawn where its wobble puts it.
export function drawCircleWithEffects(ctx, effects, circle, view) {
  const offset = effects.wobbleOffset(circle.id);
  if (offset === 0) {
    drawCircle(ctx, circle, view);
    return;
  }
  ctx.save();
  ctx.translate(offset, 0);
  drawCircle(ctx, circle, view);
  ctx.restore();
}

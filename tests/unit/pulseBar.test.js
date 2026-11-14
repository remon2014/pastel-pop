// F-16b criterion (5): every pulse drawer is soft (D-011, WB 6 rule 7a). Computed from the palette and
// src/config.js, so a hex or opacity change re-runs it. A new pulse drawer must be added here.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PALETTE } from '../../src/colorManager.js';
import { DUSK, EFFECT_COLORS, SATURATED_RED_RATIO } from '../../src/config.js';
import { pulseBarAlpha } from '../../src/effects/colors.js';

const MAX_CHANGE = 0.07;
const STEPS = 200;

const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const lin = (c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

// The 8-bit sRGB colour the canvas shows for `top` at `alpha` over `under`.
const composite = (top, alpha, under) => top.map((c, i) => Math.round(alpha * c + (1 - alpha) * under[i]));

const backgrounds = [DUSK, ...PALETTE.map((c) => c.hex)];

test('the bar pulse is soft over Dusk and every palette colour: luminance change 0.07 or less, never saturated red', () => {
  const bar = rgb(EFFECT_COLORS.lowTimePulse);
  for (const hex of backgrounds) {
    const under = rgb(hex);
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i <= STEPS; i++) {
      const shown = composite(bar, pulseBarAlpha(i / STEPS), under);
      const l = luminance(shown);
      min = Math.min(min, l);
      max = Math.max(max, l);
      assert.ok(shown[0] / (shown[0] + shown[1] + shown[2]) < SATURATED_RED_RATIO, `${hex}: saturated red`);
    }
    assert.ok(max - min <= MAX_CHANGE, `${hex}: bar changes luminance by ${(max - min).toFixed(3)}`);
    // The bar appearing or going away (a pulse start or stop) is no bigger step than the limit either.
    const bare = luminance(under);
    assert.ok(Math.abs(max - bare) <= MAX_CHANGE && Math.abs(min - bare) <= MAX_CHANGE, `${hex}: bar start step`);
  }
});

test('the bar opacity stays between 0 and 1 and sits on the base when the beat ends', () => {
  for (let i = 0; i <= STEPS; i++) {
    const a = pulseBarAlpha(i / STEPS);
    assert.ok(a >= 0 && a <= 1);
  }
  assert.ok(pulseBarAlpha(0) > pulseBarAlpha(1), 'a beat lifts the bar above its base');
});

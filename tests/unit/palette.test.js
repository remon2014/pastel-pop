import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PALETTE } from '../../src/colorManager.js';
import { DUSK, INK } from '../../src/config.js';

// WCAG 2 relative luminance and contrast ratio, as used in docs/game-design.md.
function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const MIN_CONTRAST = 3;

test('the palette has the five agreed colours', () => {
  assert.deepEqual(
    PALETTE.map((c) => c.id),
    ['star', 'cloud', 'kite', 'leaf', 'moon'],
  );
});

test('every colour has a unique id, name, colour word and hex', () => {
  for (const key of ['id', 'name', 'colorWord', 'hex']) {
    const values = PALETTE.map((c) => c[key]);
    assert.equal(new Set(values).size, PALETTE.length, `${key} values must be unique`);
  }
});

test('every hex is a six-digit colour', () => {
  for (const c of PALETTE) assert.match(c.hex, /^#[0-9A-F]{6}$/i, c.id);
});

test('every circle colour reaches 3:1 contrast against the Dusk background', () => {
  for (const c of PALETTE) {
    assert.ok(contrast(c.hex, DUSK) >= MIN_CONTRAST, `${c.id} is ${contrast(c.hex, DUSK).toFixed(2)}:1`);
  }
});

test('the Ink symbol reaches 3:1 contrast on every circle colour', () => {
  for (const c of PALETTE) {
    assert.ok(contrast(INK, c.hex) >= MIN_CONTRAST, `${c.id} is ${contrast(INK, c.hex).toFixed(2)}:1`);
  }
});

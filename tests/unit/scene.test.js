import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INTERIM_CIRCLE_COUNT, INTERIM_COLOURS, INTERIM_PER_COLOUR, REFILL_STAGGER_S } from '../../src/config.js';
import {
  colourCleared,
  nextRefillColour,
  pickColours,
  pickTarget,
  startRefill,
  stepRefill,
} from '../../src/logic/scene.js';
import { PALETTE } from '../../src/palette.js';

const [A, B, C] = PALETTE;
const on = (...colors) => colors.map((color) => ({ color }));
const lcg = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

test('the interim scene is 3 colours of 2 circles, 6 in all', () => {
  assert.equal(INTERIM_COLOURS * INTERIM_PER_COLOUR, INTERIM_CIRCLE_COUNT);
  assert.equal(INTERIM_CIRCLE_COUNT, 6);
});

test('pickColours gives distinct palette colours', () => {
  const random = lcg(1);
  for (let i = 0; i < 50; i++) {
    const picked = pickColours(PALETTE, INTERIM_COLOURS, random);
    assert.equal(picked.length, INTERIM_COLOURS);
    assert.equal(new Set(picked).size, INTERIM_COLOURS);
  }
});

test('pickTarget never returns a colour that is not on screen', () => {
  const random = lcg(7);
  const circles = on(A, A, C);
  for (let i = 0; i < 200; i++) assert.ok([A, C].includes(pickTarget(circles, random)));
});

test('pickTarget can return the same colour again, and reaches every colour on screen', () => {
  const seen = new Set();
  const random = lcg(3);
  for (let i = 0; i < 200; i++) seen.add(pickTarget(on(A, A, B), random));
  assert.deepEqual([...seen].sort(), [A, B].sort());
  assert.equal(pickTarget(on(A), Math.random), A);
});

test('pickTarget returns null when nothing is left', () => {
  assert.equal(pickTarget([], Math.random), null);
});

test('colourCleared is true as soon as one scene colour has no circle', () => {
  assert.equal(colourCleared(on(A, A, B, B), [A, B]), false);
  assert.equal(colourCleared(on(A, B, B), [A, B]), false);
  assert.equal(colourCleared(on(B, B), [A, B]), true);
});

test('nextRefillColour names a colour below its count, or null when full', () => {
  assert.equal(nextRefillColour(on(A, A, B), [A, B]), B);
  assert.equal(nextRefillColour(on(A, A, B, B), [A, B]), null);
});

test('refill adds one circle at a time, REFILL_STAGGER_S apart, up to 2 of each', () => {
  const colours = [A, B];
  const circles = on(B, B);
  const state = { refilling: false, wait: 0 };
  assert.deepEqual(stepRefill(state, circles, colours, 1), []);
  startRefill(state);
  const times = [];
  const dt = 0.05;
  for (let t = 0; t < 2 && state.refilling; t += dt) {
    for (const color of stepRefill(state, circles, colours, dt)) {
      circles.push({ color });
      times.push(t);
    }
  }
  assert.equal(circles.length, 4);
  assert.equal(circles.filter((c) => c.color === A).length, 2);
  assert.equal(times.length, 2);
  assert.ok(Math.abs(times[1] - times[0] - REFILL_STAGGER_S) < dt + 1e-9);
  assert.equal(state.refilling, false);
});

test('a long frame still adds at most one circle per stagger interval', () => {
  const state = { refilling: false, wait: 0 };
  startRefill(state);
  const first = stepRefill(state, [], [A, B, C], 0.1);
  assert.equal(first.length, 1);
  assert.equal(stepRefill(state, on(A), [A, B, C], 0.1).length, 0);
});

test('refill does nothing once every colour is full', () => {
  const state = { refilling: true, wait: 0 };
  assert.deepEqual(stepRefill(state, on(A, A, B, B), [A, B], 1), []);
  assert.equal(state.refilling, false);
});

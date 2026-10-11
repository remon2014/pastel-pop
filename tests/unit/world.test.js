import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  fitCircles,
  isInside,
  levelMultiplier,
  circleRadius,
  spawnCircle,
  speedFor,
  stepCircle,
  stepCircles,
} from '../../src/logic/world.js';

const BOUNDS = { width: 1, height: 1.8 };
const STEP_RATES = [30, 60, 90, 120];

// Small deterministic random source (mulberry32).
function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('speed is 0.25 widths per second at 1.0x', () => {
  assert.equal(speedFor(1), 0.25);
  assert.equal(speedFor(levelMultiplier(1)), 0.25);
});

test('level multiplier is 1.0 at level 1 and grows by 0.2 a level', () => {
  assert.equal(levelMultiplier(1), 1);
  assert.ok(Math.abs(levelMultiplier(2) - 1.2) < 1e-12);
  assert.ok(Math.abs(levelMultiplier(6) - 2) < 1e-12);
});

test('a circle covers the same distance in 1 s at every step rate', () => {
  for (const rate of STEP_RATES) {
    const circle = { x: 0.3, y: 0.9, vx: 0.25, vy: 0, radius: 0.05 };
    for (let i = 0; i < rate; i++) stepCircle(circle, BOUNDS, 1 / rate);
    assert.ok(Math.abs(circle.x - 0.3 - 0.25) / 0.25 < 0.001, `rate ${rate}: x=${circle.x}`);
  }
});

test('distance with bounces is the same at every step rate', () => {
  const finals = STEP_RATES.map((rate) => {
    const circle = { x: 0.4, y: 0.5, vx: 0.18, vy: 0.31, radius: 0.09 };
    for (let i = 0; i < rate * 7; i++) stepCircle(circle, BOUNDS, 1 / rate);
    return circle;
  });
  for (const c of finals) {
    assert.ok(Math.abs(c.x - finals[0].x) < 1e-6 && Math.abs(c.y - finals[0].y) < 1e-6);
  }
});

test('a circle never leaves the bounds over a long run at any step size', () => {
  for (const step of [1 / 30, 1 / 60, 1 / 90, 1 / 120, 0.1]) {
    const random = seeded(7);
    const circles = [];
    for (let i = 0; i < 20; i++) circles.push(spawnCircle(BOUNDS, 0.09, speedFor(3), random));
    for (let i = 0; i < 20000; i++) {
      stepCircles(circles, BOUNDS, step);
      for (const c of circles) assert.ok(isInside(c, BOUNDS), `step ${step}, i ${i}`);
    }
  }
});

test('a huge step still ends inside the bounds and keeps its speed', () => {
  const circle = { x: 0.5, y: 0.5, vx: 0.9, vy: -0.7, radius: 0.09 };
  stepCircle(circle, BOUNDS, 25);
  assert.ok(isInside(circle, BOUNDS));
  assert.equal(Math.hypot(circle.vx, circle.vy), Math.hypot(0.9, 0.7));
});

test('a circle reaching a wall is reflected', () => {
  const circle = { x: 0.9, y: 0.5, vx: 0.25, vy: 0, radius: 0.1 };
  stepCircle(circle, BOUNDS, 1);
  assert.ok(circle.vx < 0);
  assert.ok(Math.abs(circle.x - (0.9 - 0.25)) < 1e-9);
});

test('changing the bounds pulls every circle back inside', () => {
  const random = seeded(3);
  const circles = [];
  for (let i = 0; i < 15; i++) circles.push(spawnCircle(BOUNDS, 0.09, 0.25, random));
  for (const smaller of [
    { width: 1, height: 0.6 },
    { width: 1, height: 1.2 },
    { width: 1, height: 0.25 },
  ]) {
    fitCircles(circles, smaller);
    for (const c of circles) assert.ok(isInside(c, smaller));
  }
});

test('circle size is 64 dp across at 360 dp wide', () => {
  assert.ok(Math.abs(circleRadius(360) * 2 * 360 - 64) < 1e-9);
});

test('circle size is never under 48 dp across, including on very narrow screens', () => {
  for (let width = 200; width <= 1280; width += 10) {
    assert.ok(circleRadius(width) * 2 * width >= 48 - 1e-9, `width ${width}`);
  }
});

test('circle size is held at the 48 dp floor on a 240 dp wide screen', () => {
  assert.ok(Math.abs(circleRadius(240) * 2 * 240 - 48) < 1e-9);
});

test('circle size stops growing at the provisional 112 dp maximum on wide screens', () => {
  assert.ok(Math.abs(circleRadius(1280) * 2 * 1280 - 112) < 1e-9);
  assert.ok(Math.abs(circleRadius(630) * 2 * 630 - 112) < 1e-9);
  assert.ok(circleRadius(600) * 2 * 600 < 112);
});

test('spawning places every circle fully inside the bounds', () => {
  const random = seeded(11);
  for (const bounds of [BOUNDS, { width: 1, height: 0.5 }, { width: 1, height: 2.2 }]) {
    for (let i = 0; i < 500; i++) {
      assert.ok(isInside(spawnCircle(bounds, circleRadius(360), speedFor(1), random), bounds));
    }
  }
});

test('spawned circles move at the requested speed', () => {
  const c = spawnCircle(BOUNDS, 0.09, speedFor(1.4), seeded(5));
  assert.ok(Math.abs(Math.hypot(c.vx, c.vy) - 0.35) < 1e-12);
});

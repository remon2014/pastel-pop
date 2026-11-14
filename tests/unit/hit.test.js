import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MIN_TOUCH_DP, TAP_REACH } from '../../src/config.js';
import { findHit, getDistance, minTapRadius } from '../../src/logic/hit.js';

const circle = (id, x, y, radius = 0.1) => ({ x, y, radius, color: { id } });

test('a tap on a circle returns it', () => {
  const a = circle('star', 0.5, 0.5);
  assert.equal(findHit([a], 0.5, 0.5, 'star'), a);
});

test('a tap within reach of nothing returns null', () => {
  assert.equal(findHit([circle('star', 0.5, 0.5)], 0.9, 0.9, 'star'), null);
  assert.equal(findHit([], 0.5, 0.5, 'star'), null);
});

test('the widened edge: just inside hits, just outside misses', () => {
  const a = circle('star', 0.5, 0.5, 0.1);
  const edge = 0.1 * TAP_REACH;
  assert.equal(findHit([a], 0.5 + edge - 0.001, 0.5, 'star'), a);
  assert.equal(findHit([a], 0.5 + edge + 0.001, 0.5, 'star'), null);
  assert.ok(0.1 * TAP_REACH > 0.1);
});

test('the matching circle underneath an overlap wins, even when the other is nearer or on top', () => {
  const matching = circle('star', 0.45, 0.5);
  const other = circle('cloud', 0.55, 0.5);
  assert.equal(findHit([matching, other], 0.53, 0.5, 'star'), matching);
  assert.equal(findHit([other, matching], 0.53, 0.5, 'star'), matching);
});

test('with no matching circle in reach, the nearest is taken', () => {
  const near = circle('cloud', 0.5, 0.5);
  const far = circle('kite', 0.6, 0.5);
  assert.equal(findHit([far, near], 0.54, 0.5, 'star'), near);
});

test('a matching circle out of reach does not beat a non-matching one in reach', () => {
  const inReach = circle('cloud', 0.5, 0.5);
  const matching = circle('star', 0.9, 0.5);
  assert.equal(findHit([matching, inReach], 0.5, 0.5, 'star'), inReach);
});

test('the minimum-size floor widens a tiny circle to half the minimum touch size', () => {
  const tiny = circle('star', 0.5, 0.5, 0.01);
  const floor = minTapRadius(360);
  assert.equal(floor, MIN_TOUCH_DP / 2 / 360);
  assert.equal(findHit([tiny], 0.5 + floor - 0.001, 0.5, 'star', { minRadius: floor }), tiny);
  assert.equal(findHit([tiny], 0.5 + floor + 0.001, 0.5, 'star', { minRadius: floor }), null);
  assert.equal(findHit([tiny], 0.5 + 0.05, 0.5, 'star'), null);
});

test('getDistance is zero for the same point', () => {
  assert.equal(getDistance(12, 34, 12, 34), 0);
});

test('getDistance measures a 3-4-5 triangle', () => {
  assert.equal(getDistance(0, 0, 3, 4), 5);
});

test('getDistance is the same in both directions', () => {
  assert.equal(getDistance(-2, 7, 10, -9), getDistance(10, -9, -2, 7));
});

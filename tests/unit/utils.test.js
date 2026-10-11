import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDistance } from '../../src/utils.js';

test('getDistance is zero for the same point', () => {
  assert.equal(getDistance(12, 34, 12, 34), 0);
});

test('getDistance measures a 3-4-5 triangle', () => {
  assert.equal(getDistance(0, 0, 3, 4), 5);
});

test('getDistance is the same in both directions', () => {
  assert.equal(getDistance(-2, 7, 10, -9), getDistance(10, -9, -2, 7));
});

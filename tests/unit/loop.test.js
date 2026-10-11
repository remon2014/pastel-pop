import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_FRAME_SECONDS } from '../../src/config.js';
import { createLoop } from '../../src/core/loop.js';

// Fake clock, scheduler and page visibility. frame(ms) advances the clock and runs the pending callback.
function setup() {
  const env = { time: 1000, hidden: false, pending: new Map(), nextId: 1, listeners: [], calls: [] };
  const host = {
    now: () => env.time,
    schedule: (fn) => {
      env.pending.set(env.nextId, fn);
      return env.nextId++;
    },
    cancel: (id) => env.pending.delete(id),
    isHidden: () => env.hidden,
    onVisibilityChange: (fn) => env.listeners.push(fn),
  };
  const loop = createLoop((dt) => env.calls.push(dt), host);
  env.loop = loop;
  env.frame = (ms) => {
    env.time += ms;
    const callbacks = [...env.pending.values()];
    env.pending.clear();
    for (const fn of callbacks) fn();
  };
  env.setHidden = (hidden) => {
    env.hidden = hidden;
    for (const fn of env.listeners) fn();
  };
  return env;
}

test('starting twice gives one update per frame', () => {
  const env = setup();
  env.loop.start();
  env.loop.start();
  assert.equal(env.pending.size, 1);
  env.frame(16);
  env.frame(16);
  assert.equal(env.calls.length, 2);
  assert.equal(env.pending.size, 1);
});

test('elapsed time is in seconds', () => {
  const env = setup();
  env.loop.start();
  env.frame(16);
  env.frame(20);
  assert.ok(Math.abs(env.calls[1] - 0.02) < 1e-9);
  assert.equal(env.loop.lastElapsed, env.calls[1]);
});

test('no frame exceeds the maximum', () => {
  const env = setup();
  env.loop.start();
  for (const ms of [16, 90, 150, 1000, 8]) env.frame(ms);
  assert.ok(env.calls.every((dt) => dt <= MAX_FRAME_SECONDS));
});

test('a 5 s gap advances by no more than the maximum and is counted', () => {
  const env = setup();
  env.loop.start();
  env.frame(16);
  env.frame(5000);
  assert.equal(env.calls[1], MAX_FRAME_SECONDS);
  assert.equal(env.loop.clampedFrames, 1);
  env.frame(16);
  assert.equal(env.loop.clampedFrames, 1);
});

test('hidden stops updates and returning resumes without a jump', () => {
  const env = setup();
  env.loop.start();
  env.frame(16);
  env.setHidden(true);
  assert.equal(env.loop.running, false);
  env.frame(10000);
  assert.equal(env.calls.length, 1);
  env.time += 10000;
  env.setHidden(false);
  assert.equal(env.loop.running, true);
  env.frame(16);
  env.frame(16);
  assert.equal(env.calls.length, 3);
  assert.ok(env.calls[2] <= 0.016 + 1e-9, 'first frame after returning delivers no gap');
  assert.equal(env.pending.size, 1);
});

test('starting while hidden waits until the page is visible', () => {
  const env = setup();
  env.hidden = true;
  env.loop.start();
  assert.equal(env.pending.size, 0);
  env.setHidden(false);
  assert.equal(env.pending.size, 1);
});

test('pause and resume 20 times quickly leaves one loop and normal elapsed times', () => {
  const env = setup();
  env.loop.start();
  env.frame(16);
  for (let i = 0; i < 20; i++) {
    env.loop.stop();
    env.loop.start();
  }
  assert.equal(env.pending.size, 1);
  env.frame(16);
  env.frame(16);
  assert.equal(env.calls.length, 3);
  assert.ok(env.calls.slice(1).every((dt) => dt <= 0.016 + 1e-9));
});

test('stop then start does not deliver the stopped time', () => {
  const env = setup();
  env.loop.start();
  env.frame(16);
  env.loop.stop();
  env.time += 3000;
  env.loop.start();
  env.frame(16);
  assert.ok(env.calls[1] <= 0.016 + 1e-9);
  assert.equal(env.loop.clampedFrames, 0);
});

test('update is never called after stop', () => {
  const env = setup();
  env.loop.start();
  env.frame(16);
  env.loop.stop();
  env.frame(16);
  env.setHidden(true);
  env.setHidden(false);
  env.frame(16);
  assert.equal(env.calls.length, 1);
  assert.equal(env.loop.running, false);
});

test('stop called from inside update ends the loop', () => {
  const env = setup();
  let count = 0;
  const host = {
    now: () => env.time,
    schedule: (fn) => env.pending.set(99, fn) && 99,
    cancel: (id) => env.pending.delete(id),
    isHidden: () => false,
    onVisibilityChange: () => {},
  };
  const loop = createLoop(() => {
    count++;
    loop.stop();
  }, host);
  loop.start();
  env.frame(16);
  env.frame(16);
  assert.equal(count, 1);
  assert.equal(env.pending.size, 0);
});

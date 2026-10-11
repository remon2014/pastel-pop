import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFpsCounter } from '../../src/dev/fpsCounter.js';
import { countPending } from '../../src/dev/pendingCounter.js';
import { parseDevQuery } from '../../src/dev/sceneName.js';

const names = ['loop', 'circles'];

test('no dev parameter means normal play', () => {
  assert.equal(parseDevQuery('', names).kind, 'off');
  assert.equal(parseDevQuery('?x=1', names).kind, 'off');
});
test('?dev alone lists scenes', () => {
  assert.equal(parseDevQuery('?dev', names).kind, 'list');
  assert.equal(parseDevQuery('?dev=', names).kind, 'list');
});
test('?dev=<known> opens that scene', () => {
  assert.deepEqual(parseDevQuery('?dev=loop', names), { kind: 'scene', name: 'loop' });
});
test('unknown scene name is reported', () => {
  assert.deepEqual(parseDevQuery('?dev=nope', names), { kind: 'unknown', name: 'nope' });
});

test('fps counter reads the display rate', () => {
  const c = createFpsCounter(1000);
  for (let i = 0; i <= 120; i++) c.tick(i * (1000 / 60));
  assert.ok(Math.abs(c.fps(120 * (1000 / 60)) - 60) < 0.5);
});
test('fps counter falls to 0 when frames stop', () => {
  const c = createFpsCounter(1000);
  for (let i = 0; i < 30; i++) c.tick(i * 16);
  assert.ok(c.fps(480) > 0);
  assert.equal(c.fps(480 + 1500), 0);
});
test('fps counter is 0 with fewer than two frames', () => {
  const c = createFpsCounter(1000);
  assert.equal(c.fps(0), 0);
  c.tick(5);
  assert.equal(c.fps(6), 0);
});

function fakeHost() {
  const queue = new Map();
  let next = 1;
  return {
    queue,
    schedule: (fn) => {
      queue.set(next, fn);
      return next++;
    },
    cancel: (id) => queue.delete(id),
  };
}
test('pending counter counts distinct waiting callbacks', () => {
  const base = fakeHost();
  const p = countPending(base);
  assert.equal(p.count(), 0);
  p.host.schedule(() => {});
  p.host.schedule(() => {});
  assert.equal(p.count(), 2);
});
test('pending counter drops a callback when it runs or is cancelled', () => {
  const base = fakeHost();
  const p = countPending(base);
  const a = p.host.schedule(() => {});
  p.host.schedule(() => {});
  p.host.cancel(a);
  assert.equal(p.count(), 1);
  const [[id, fn]] = [...base.queue];
  base.queue.delete(id);
  fn();
  assert.equal(p.count(), 0);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSystemReducedMotion } from '../../src/storage.js';

test('uses addEventListener when present', () => {
  const calls = [];
  const query = {
    matches: true,
    addEventListener: (t, f) => calls.push(['add', t, f]),
    removeEventListener: (t, f) => calls.push(['remove', t, f]),
  };
  const sys = createSystemReducedMotion(() => query);
  assert.equal(sys.matches(), true);
  const off = sys.subscribe(() => {});
  off();
  assert.deepEqual(
    calls.map((c) => c[0]),
    ['add', 'remove'],
  );
});

test('falls back to addListener on older Safari and notifies', () => {
  let registered = null;
  let removed = null;
  const query = {
    matches: false,
    addListener: (f) => {
      registered = f;
    },
    removeListener: (f) => {
      removed = f;
    },
  };
  const sys = createSystemReducedMotion(() => query);
  let heard = 0;
  const off = sys.subscribe(() => heard++);
  registered();
  assert.equal(heard, 1);
  off();
  assert.equal(removed, registered);
});

test('with no listener methods or no matchMedia: not reduced, never notifies, no throw', () => {
  for (const mm of [
    () => ({ matches: false }),
    () => null,
    () => {
      throw new Error('none');
    },
  ]) {
    const sys = createSystemReducedMotion(mm);
    assert.equal(sys.matches(), false);
    assert.doesNotThrow(() => sys.subscribe(() => {})());
  }
});

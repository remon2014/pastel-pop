import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '../../src/config.js';
import { createSettings } from '../../src/settings.js';

function fakeStorage(initial) {
  const data = new Map(initial === undefined ? [] : [[SETTINGS_KEY, initial]]);
  return { get: (k) => data.get(k) ?? null, set: (k, v) => data.set(k, v), data };
}

function fakeSystem(matches = false) {
  const env = { matches, listeners: new Set() };
  env.api = {
    matches: () => env.matches,
    subscribe: (fn) => {
      env.listeners.add(fn);
      return () => env.listeners.delete(fn);
    },
  };
  env.change = (v) => {
    env.matches = v;
    for (const fn of env.listeners) fn();
  };
  return env;
}

const make = (initial, sys = fakeSystem()) => {
  const storage = fakeStorage(initial);
  return { storage, sys, s: createSettings({ storage, systemReducedMotion: sys.api }) };
};

test('empty storage gives the defaults', () => {
  const { s } = make();
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) assert.equal(s.get(k), v);
});

test('values persist to a new instance', () => {
  const a = make();
  a.s.set('musicVolume', 0.2);
  a.s.set('vibration', true);
  const b = createSettings({ storage: a.storage, systemReducedMotion: fakeSystem().api });
  assert.equal(b.get('musicVolume'), 0.2);
  assert.equal(b.get('vibration'), true);
});

test('only the five settings and a version are stored', () => {
  const { s, storage } = make();
  s.set('muted', true);
  const keys = Object.keys(JSON.parse(storage.data.get(SETTINGS_KEY))).sort();
  assert.deepEqual(keys, ['effectsVolume', 'musicVolume', 'muted', 'reduceMotion', 'version', 'vibration']);
});

test('mute leaves volumes alone and unmute restores them', () => {
  const { s } = make();
  s.set('musicVolume', 0.3);
  s.set('effectsVolume', 0.9);
  s.set('muted', true);
  assert.equal(s.get('musicVolume'), 0.3);
  assert.equal(s.get('effectsVolume'), 0.9);
  s.set('muted', false);
  assert.equal(s.get('musicVolume'), 0.3);
  assert.equal(s.get('effectsVolume'), 0.9);
});

test('broken JSON gives all defaults without error', () => {
  const { s } = make('{not json');
  assert.equal(s.get('musicVolume'), DEFAULT_SETTINGS.musicVolume);
});

test('unknown version gives all defaults', () => {
  const { s } = make(JSON.stringify({ version: 99, vibration: true, musicVolume: 0.1 }));
  assert.equal(s.get('vibration'), false);
  assert.equal(s.get('musicVolume'), DEFAULT_SETTINGS.musicVolume);
});

test('non-object JSON gives defaults', () => {
  for (const text of ['null', '5', '"x"', '[]']) {
    assert.equal(make(text).s.get('muted'), false);
  }
});

test('wrong types fall back per field only', () => {
  const { s } = make(
    JSON.stringify({ version: 1, vibration: 'yes', muted: true, musicVolume: '0.2', effectsVolume: 0.4 }),
  );
  assert.equal(s.get('vibration'), DEFAULT_SETTINGS.vibration);
  assert.equal(s.get('musicVolume'), DEFAULT_SETTINGS.musicVolume);
  assert.equal(s.get('muted'), true);
  assert.equal(s.get('effectsVolume'), 0.4);
});

test('out-of-range volumes are clamped to 0 to 1', () => {
  const { s } = make(JSON.stringify({ version: 1, musicVolume: 5, effectsVolume: -2 }));
  assert.equal(s.get('musicVolume'), 1);
  assert.equal(s.get('effectsVolume'), 0);
  s.set('musicVolume', 7);
  assert.equal(s.get('musicVolume'), 1);
});

test('effective Reduce motion is switch OR system, and follows the system live', () => {
  const { s, sys } = make();
  assert.equal(s.effectiveReduceMotion(), false);
  sys.change(true);
  assert.equal(s.effectiveReduceMotion(), true);
  sys.change(false);
  s.set('reduceMotion', true);
  assert.equal(s.effectiveReduceMotion(), true);
});

test('subscribers hear every change with effective Reduce motion, including system changes', () => {
  const { s, sys } = make();
  const heard = [];
  s.subscribe((v) => heard.push(v));
  s.set('vibration', true);
  sys.change(true);
  s.set('reduceMotion', true);
  sys.change(false);
  assert.deepEqual(heard, [false, true, true, true]);
});

test('unsubscribe stops notifications', () => {
  const { s } = make();
  const heard = [];
  const off = s.subscribe((v) => heard.push(v));
  off();
  s.set('muted', true);
  assert.equal(heard.length, 0);
});

test('settings are kept in memory: later storage changes are not re-read', () => {
  const { s, storage } = make();
  s.set('musicVolume', 0.1);
  storage.data.set(SETTINGS_KEY, '{}');
  assert.equal(s.get('musicVolume'), 0.1);
});

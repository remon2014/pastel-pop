// Effect state tests (F-15), written from the F-15 row and WB v0.8 section 6: shake bounds, stale beats,
// arrivals waiting, forget. State only: no canvas, no look.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { PULSE_BEAT_SECONDS, SHAKE_MAX_PIXELS, SHAKE_SECONDS, SHAKE_SWINGS, WOBBLE_SECONDS } from '../../src/config.js';
import { createEffects } from '../../src/effects/effects.js';

const circle = { x: 0.5, y: 0.5, radius: 0.09, color: '#EDD894' };
const ask = (fx, kind, mode, now, extra = {}) => fx.request({ kind, mode, now, circleId: 'a', ...circle, ...extra });

function fakeSettings(on) {
  const listeners = new Set();
  return {
    effectiveReduceMotion: () => on,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    change(next) {
      on = next;
      for (const fn of [...listeners]) fn(on);
    },
    listeners,
  };
}

// Offsets of a Story shake started at 0, sampled every 5 ms.
function shakeOffsets(fx) {
  const out = [];
  for (let t = 0; t < SHAKE_SECONDS + 0.05; t += 0.005) {
    fx.update(t);
    out.push(fx.shakeOffset());
  }
  return out;
}

describe('effect state', () => {
  test('shake: whole pixels, within 2 px, over by 200 ms, decaying, at most 2 swings', () => {
    const fx = createEffects();
    assert.equal(ask(fx, 'shake', 'story', 0).form, 'full');
    const offsets = shakeOffsets(fx);
    assert.ok(offsets.every((o) => Number.isInteger(o) && Math.abs(o) <= 2 && Math.abs(o) <= SHAKE_MAX_PIXELS));
    assert.equal(offsets.at(-1), 0, 'back at rest after 200 ms');
    assert.equal(fx.shakesRunning(), 0);
    const signs = offsets.map(Math.sign).filter((s) => s !== 0);
    const swings = signs.filter((s, i) => i > 0 && s !== signs[i - 1]).length + 1;
    assert.ok(swings <= SHAKE_SWINGS, `swings ${swings}`);
  });

  test('shake: never more than one running, never more than 2 begun in a second', () => {
    const fx = createEffects();
    for (let t = 0; t < 3; t += 0.01) {
      fx.update(t);
      ask(fx, 'shake', 'story', t);
    }
    assert.equal(fx.peaks.shakesRunning, 1);
    assert.ok(fx.peaks.shakesBegun <= 2);
  });

  test('Calm never shakes; the wobble moves its own circle only', () => {
    const fx = createEffects();
    assert.equal(ask(fx, 'shake', 'calm', 0).form, 'refused');
    assert.equal(fx.active.length, 0);
    assert.equal(ask(fx, 'wobble', 'calm', 0).form, 'full');
    let moved = false;
    for (let t = 0; t < WOBBLE_SECONDS; t += 0.01) {
      fx.update(t);
      assert.equal(fx.shakeOffset(), 0);
      assert.equal(fx.wobbleOffset('b'), 0);
      if (fx.wobbleOffset('a') !== 0) moved = true;
    }
    assert.ok(moved);
  });

  test('Reduce motion: shake and wobble become a dim, with no offset', () => {
    const settings = fakeSettings(true);
    const fx = createEffects();
    fx.bindSettings(settings);
    assert.equal(ask(fx, 'shake', 'story', 0).form, 'dim');
    fx.update(0.1);
    assert.equal(fx.shakeOffset(), 0);
    assert.equal(fx.active[0].form, 'dim');
    assert.ok(fx.active[0].strength > 0 && fx.active[0].strength <= 1);
  });

  test('bindSettings applies the setting now and on change, and returns the unsubscribe', () => {
    const settings = fakeSettings(false);
    const fx = createEffects();
    const unsubscribe = fx.bindSettings(settings);
    assert.equal(ask(fx, 'pop', 'calm', 0).form, 'full');
    settings.change(true);
    assert.equal(ask(fx, 'pop', 'calm', 5).form, 'plainFade');
    unsubscribe();
    assert.equal(settings.listeners.size, 0);
    settings.change(false);
    assert.equal(ask(fx, 'pop', 'calm', 10).form, 'plainFade', 'no longer listening');
  });

  test('stale beats: after a gap, old beats are dropped unseen, and the limiter has still granted them', () => {
    const fx = createEffects();
    ask(fx, 'pulse', 'story', 0, { rate: 2 });
    fx.update(0.5);
    assert.equal(fx.active.filter((e) => e.kind === 'pulse').length, 1);
    fx.update(5.3);
    assert.equal(fx.active.filter((e) => e.kind === 'pulse' && 5.3 - e.start > PULSE_BEAT_SECONDS).length, 0);
    assert.equal(fx.flashCount(), 0, 'nothing old was drawn');
    assert.equal(fx.beatCount(), 0);
    fx.update(5.5);
    assert.equal(fx.active.filter((e) => e.kind === 'pulse').length, 1, 'fresh beats are drawn again');
    assert.equal(fx.flashCount(), 1);
  });

  test('arrivals wait for waitUntil and start no earlier', () => {
    const fx = createEffects();
    const arrivals = () => fx.active.filter((e) => e.kind === 'arrival');
    for (let i = 0; i < 3; i++) assert.equal(ask(fx, 'arrival', 'story', i * 0.01, { circleId: `c${i}` }).form, 'full');
    const wait = ask(fx, 'arrival', 'story', 0.05, { circleId: 'late' });
    assert.equal(wait.form, 'waitUntil');
    assert.ok(fx.isHeld('late'));
    fx.update(wait.at - 0.01);
    assert.ok(fx.isHeld('late'), 'still waiting just before');
    assert.equal(arrivals().filter((e) => e.circleId === 'late').length, 0);
    fx.update(wait.at);
    assert.ok(!fx.isHeld('late'));
    const started = arrivals().find((e) => e.circleId === 'late');
    assert.ok(started, 'arrival began');
    assert.ok(started.start >= wait.at);
  });

  test('forget empties the reaction entry so a later wobble is not ignored', () => {
    const fx = createEffects();
    assert.equal(ask(fx, 'wobble', 'calm', 0).form, 'full');
    assert.equal(ask(fx, 'wobble', 'calm', 0.1).form, 'ignored');
    fx.forget('a');
    assert.equal(ask(fx, 'wobble', 'calm', 0.1).form, 'full');
  });

  test('ignored, refused and held answers draw nothing', () => {
    const fx = createEffects();
    ask(fx, 'wobble', 'calm', 0);
    fx.update(0);
    const before = fx.active.length;
    ask(fx, 'wobble', 'calm', 0.1);
    ask(fx, 'shake', 'calm', 0.1);
    assert.equal(fx.active.length, before);
  });
});

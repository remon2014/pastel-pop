// Effect state tests (F-15), written from the F-15 row and WB v0.8 section 6: shake bounds, stale beats,
// arrivals waiting, forget. State only: no canvas, no look.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { MAX_BEAT_LATENESS, SHAKE_MAX_PIXELS, SHAKE_SECONDS, SHAKE_SWINGS, WOBBLE_SECONDS } from '../../src/config.js';
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
    assert.equal(fx.active.filter((e) => e.kind === 'pulse' && 5.3 - e.start > MAX_BEAT_LATENESS).length, 0);
    assert.equal(fx.flashCount(), 0, 'nothing old was drawn');
    assert.equal(fx.beatCount(), 0);
    fx.update(5.5);
    assert.equal(fx.active.filter((e) => e.kind === 'pulse').length, 1, 'fresh beats are drawn again');
    assert.equal(fx.flashCount(), 1);
  });

  test('a quiet arrival during the pulse draws nothing and counts no flash', () => {
    const fx = createEffects();
    ask(fx, 'pulse', 'story', 0, { rate: 2 });
    assert.equal(ask(fx, 'arrival', 'story', 0.1, { circleId: 'n' }).form, 'quiet');
    fx.update(0.1);
    assert.equal(fx.active.length, 0, 'no halo, nothing added');
    assert.equal(fx.flashCount(), 0);
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

  test('late beats: with long frames, drawn flashes stay at 3 a second and no two beats share a frame', () => {
    const gaps = [0.083, 0.1, 0.05, 0.1, 0.07, 0.1];
    for (const rate of [2, 1]) {
      const fx = createEffects();
      ask(fx, 'pulse', 'story', 0, { rate });
      const seen = new Set();
      const drawn = [];
      let now = 0;
      for (let i = 0; i < 400; i++) {
        now += gaps[i % gaps.length];
        fx.update(now);
        let beatsThisFrame = 0;
        for (const e of fx.active) {
          if (e.kind !== 'pulse' || seen.has(e)) continue;
          seen.add(e);
          beatsThisFrame++;
          drawn.push(now);
        }
        assert.ok(beatsThisFrame <= 1, 'two beats drawn in one frame');
        if (i % 3 === 0 && ask(fx, 'pop', 'story', now).form === 'full') drawn.push(now);
      }
      for (const t of drawn) {
        const n = drawn.filter((x) => x <= t + 1e-9 && x > t - 1 + 1e-9).length;
        assert.ok(n <= 3, `${n} drawn in one second ending at ${t}`);
      }
      assert.ok(seen.size > 0, 'some beats are still drawn');
    }
  });

  test('a beat seen more than MAX_BEAT_LATENESS after its tick is not drawn; one inside it is', () => {
    const fx = createEffects();
    ask(fx, 'pulse', 'story', 0, { rate: 2 });
    fx.update(0.43);
    fx.update(0.5 + MAX_BEAT_LATENESS + 0.03);
    assert.equal(fx.active.filter((e) => e.kind === 'pulse').length, 0, 'drawn late: dropped');
    fx.update(1.0 + MAX_BEAT_LATENESS - 0.01);
    assert.equal(fx.active.filter((e) => e.kind === 'pulse').length, 1, 'within the threshold: drawn');
  });

  test('after a long gap two overdue beats are not drawn together in one frame', () => {
    const fx = createEffects();
    ask(fx, 'pulse', 'story', 0, { rate: 2 });
    fx.update(0.01);
    fx.update(1.083);
    assert.equal(fx.active.filter((e) => e.kind === 'pulse').length, 0);
    assert.equal(fx.flashCount(), 0);
  });

  test('the layer count uses closed windows: a tap, then pulse beats, peaks at exactly 3', () => {
    const fx = createEffects();
    assert.equal(ask(fx, 'pop', 'story', 0).form, 'full');
    assert.equal(ask(fx, 'pulse', 'story', 0.2, { rate: 2 }).form, 'full');
    for (let t = 0.25; t <= 1.5; t += 0.25) fx.update(t);
    assert.equal(fx.peaks.flashes, 3, 'tap at 0 plus beats at 0.5 and 1.0');
    assert.equal(fx.flashCount(), 3, 'beats at 0.5, 1.0 and 1.5 are inside [0.45, 1.5]');
  });

  describe('Reduce motion turned on mid-effect', () => {
    const bound = () => {
      const settings = fakeSettings(false);
      const fx = createEffects();
      fx.bindSettings(settings);
      return { settings, fx };
    };
    const peakOffset = (fx, from) => {
      let max = 0;
      for (let t = from; t < from + 0.7; t += 0.01) {
        fx.update(t);
        max = Math.max(max, Math.abs(fx.shakeOffset()));
      }
      return max;
    };

    test('a running shake stops at once and no dim replaces it', () => {
      const { settings, fx } = bound();
      ask(fx, 'shake', 'story', 0);
      fx.update(0.03);
      assert.notEqual(fx.shakeOffset(), 0, 'the shake is moving');
      settings.change(true);
      assert.equal(fx.shakeOffset(), 0);
      assert.equal(fx.shakesRunning(), 0);
      assert.equal(peakOffset(fx, 0.04), 0);
      assert.equal(fx.active.filter((e) => e.form === 'dim').length, 0, 'no substitute dim');
    });

    test('a running wobble, Calm ring and Story burst are removed with no replacement', () => {
      const { settings, fx } = bound();
      ask(fx, 'wobble', 'calm', 0);
      ask(fx, 'pop', 'calm', 0, { circleId: 'p1' });
      ask(fx, 'pop', 'story', 0, { circleId: 'p2' });
      fx.update(0.03);
      assert.notEqual(fx.wobbleOffset('a'), 0);
      settings.change(true);
      fx.update(0.04);
      assert.equal(fx.wobbleOffset('a'), 0);
      assert.equal(fx.active.length, 0);
    });

    test('a quiet fade keeps fading without shrinking and runs to its end', () => {
      const { settings, fx } = bound();
      for (let i = 0; i < 3; i++) ask(fx, 'pop', 'story', i * 0.01, { circleId: `p${i}` });
      assert.equal(ask(fx, 'pop', 'story', 0.04, { circleId: 'q' }).form, 'quiet');
      fx.update(0.05);
      settings.change(true);
      fx.update(0.06);
      assert.equal(fx.active.filter((e) => e.form === 'quiet').length, 0, 'no shrink left');
      assert.ok(fx.active.some((e) => e.kind === 'pop' && e.form === 'fade' && e.circleId === 'q'));
      fx.update(0.6);
      assert.equal(fx.active.length, 0, 'everything ran to its end');
    });

    test('a plain fade is not cut', () => {
      const { settings, fx } = bound();
      for (let i = 0; i < 3; i++) ask(fx, 'pop', 'calm', i * 0.01, { circleId: `c${i}` });
      assert.equal(ask(fx, 'pop', 'calm', 0.04, { circleId: 'plain' }).form, 'plainFade');
      fx.update(0.05);
      const count = fx.active.filter((e) => e.form === 'plainFade').length;
      assert.equal(count, 1);
      settings.change(true);
      fx.update(0.06);
      assert.equal(fx.active.filter((e) => e.form === 'plainFade').length, count);
    });

    test('the bar pulse is not cut', () => {
      const { settings, fx } = bound();
      ask(fx, 'pulse', 'story', 0, { rate: 2 });
      fx.update(0.5);
      settings.change(true);
      fx.update(0.55);
      assert.equal(fx.active.filter((e) => e.kind === 'pulse').length, 1);
    });

    test('a change event that leaves Reduce motion off does not cut a running shake', () => {
      const { settings, fx } = bound();
      ask(fx, 'shake', 'story', 0);
      fx.update(0.03);
      const offset = fx.shakeOffset();
      settings.change(false);
      assert.equal(fx.shakeOffset(), offset);
      assert.equal(fx.shakesRunning(), 1);
    });

    test('turning Reduce motion off never changes a running effect', () => {
      const { settings, fx } = bound();
      settings.change(true);
      ask(fx, 'shake', 'story', 0);
      fx.update(0.1);
      const dim = fx.active[0];
      const copy = { ...dim };
      settings.change(false);
      assert.equal(fx.active[0], dim);
      assert.deepEqual({ ...dim }, copy);
      fx.update(0.3);
      assert.equal(dim.form, 'dim');
      assert.equal(fx.shakeOffset(), 0);
      assert.equal(fx.active.length, 1, 'the dim runs to its end');
    });
  });
});

// Written from docs/wellbeing.md sections 4 to 6 and docs/game-design.md (Sensory safety,
// Reduce motion on), not from the code. Test numbers match the F-14 row in docs/foundations-plan.md.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { PALETTE } from '../../src/colorManager.js';
import * as config from '../../src/config.js';
import { createLimiter } from '../../src/effects/limiter.js';

const EPS = 1e-9;
const FORMS = ['full', 'quiet', 'dim', 'fade', 'plainFade', 'ignored', 'waitUntil', 'refused'];
const DUSK = '#332C2E';

const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const lin = (c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

// Largest number of events in any window (t - 1 s, t] ending at an event (shakes, arrivals).
function maxInOneSecond(times) {
  let max = 0;
  for (const t of times) {
    max = Math.max(max, times.filter((x) => x <= t + EPS && x > t - 1 + EPS).length);
  }
  return max;
}

// Largest number of flashes in any closed window [t - W, t] ending at a flash, W = 1.05 s (WB 6 rule 5).
function maxFlashes(times) {
  let max = 0;
  for (const t of times) {
    max = Math.max(max, times.filter((x) => x <= t + EPS && x >= t - 1.05 - EPS).length);
  }
  return max;
}

function story() {
  const l = createLimiter();
  return { l, req: (kind, now, extra = {}) => l.request({ kind, mode: 'story', now, ...extra }) };
}
function calm() {
  const l = createLimiter();
  return { l, req: (kind, now, extra = {}) => l.request({ kind, mode: 'calm', now, ...extra }) };
}

// 3 fingers tapping 10 times a second for 10 s; returns times of granted bright pops.
function tapStorm(req, seconds = 10) {
  const granted = [];
  for (let i = 0; i < seconds * 10; i++) {
    for (let finger = 0; finger < 3; finger++) {
      const { form } = req('pop', i / 10, { circleId: finger });
      assert.ok(FORMS.includes(form), `every tap gets a form, got ${form}`);
      if (form === 'full') granted.push(i / 10);
    }
  }
  return granted;
}

describe('effects rules', () => {
  test('1 flash budget: 10 taps a second with 3 fingers never grants more than 3 flashes in any second', () => {
    const { req } = story();
    const granted = tapStorm(req);
    assert.ok(maxFlashes(granted) <= 3);
    assert.ok(granted.length >= 25, 'taps still get their share of the budget');
  });

  test('1b flash budget in Calm: ring pops stay at 3 a second, extras become a plain fade', () => {
    const { req } = calm();
    const forms = [];
    const granted = [];
    for (let i = 0; i < 100; i++) {
      const { form } = req('pop', i / 10, { circleId: 1 });
      forms.push(form);
      if (form === 'full') granted.push(i / 10);
    }
    assert.ok(maxFlashes(granted) <= 3);
    assert.ok(forms.every((f) => f === 'full' || f === 'plainFade'));
    assert.ok(forms.includes('plainFade'));
  });

  test('2 pulse plus taps and arrivals: the pulse keeps every beat, and flashes get the normal budget', () => {
    const { l, req } = story();
    assert.equal(req('pulse', 0, { circleId: 'bar', rate: 2 }).form, 'full');
    const forms = [];
    const grants = [];
    for (let i = 0; i < 100; i++) {
      for (let finger = 0; finger < 3; finger++) {
        const { form } = req('pop', i / 10, { circleId: finger });
        forms.push(form);
        if (form === 'full') grants.push(i / 10);
      }
      const arrival = req('arrival', i / 10, { circleId: `a${i}` });
      forms.push(arrival.form);
      if (arrival.form === 'full') grants.push(i / 10);
    }
    assert.ok(
      forms.every((f) => f === 'full' || f === 'quiet' || f === 'waitUntil'),
      'taps and arrivals never get a quiet arrival form',
    );
    assert.ok(forms.includes('full'), 'taps and arrivals flash while the pulse runs');
    assert.ok(grants.length >= 25, 'they get their normal share of the budget');
    assert.ok(maxFlashes(grants) <= 3, 'no closed 1.05 s window holds more than 3 flashes');
    const expected = Array.from({ length: 20 }, (_, k) => (k + 1) / 2);
    assert.deepEqual(l.takeBeats(10), expected, 'exactly 20 beats in 10 s, none skipped');
    l.stopPulse('bar', 10);
  });

  test('2a during the pulse Story arrivals are full; the one past the arrival rate limit waits; arrivals take no beats', () => {
    const { l, req } = story();
    req('pulse', 0, { circleId: 'bar', rate: 2 });
    assert.deepEqual(req('arrival', 0.1, { circleId: 1 }), { form: 'full' });
    assert.deepEqual(req('arrival', 0.2, { circleId: 2 }), { form: 'full' });
    assert.deepEqual(req('arrival', 0.3, { circleId: 3 }), { form: 'full' });
    const wait = req('arrival', 0.35, { circleId: 4 });
    assert.equal(wait.form, 'waitUntil', 'the arrival rate limit still holds');
    assert.ok(wait.at >= 1.1 - EPS, 'it waits at least 1 s after the first arrival (the arrival rate limit)');
    assert.deepEqual(l.takeBeats(2.0), [0.5, 1, 1.5, 2], 'arrivals took nothing from the pulse');
  });

  test('2c lowering a pulse rate keeps one clock and every beat', () => {
    const { l, req } = story();
    req('pulse', 0, { circleId: 'bar', rate: 2 });
    req('pulse', 1.0, { circleId: 'bar', rate: 0.5 });
    assert.deepEqual(l.takeBeats(1.5), [0.5, 1]);
  });

  // Pulse at 1 a second from 0, a pop at 1.35, then a faster pulse (raised or a second id) from 1.4.
  function fasterPulseKeepsBudget(secondId) {
    const { l, req } = story();
    req('pulse', 0, { circleId: 'a', rate: 1 });
    const pops = [];
    if (req('pop', 1.35, { circleId: 1 }).form === 'full') pops.push(1.35);
    assert.equal(req('pulse', 1.4, { circleId: secondId, rate: 2 }).form, 'full', 'a pulse is full or refused');
    for (let t = 1.4; t < 4; t += 0.05) if (req('pop', t, { circleId: 2 }).form === 'full') pops.push(t);
    assert.deepEqual(l.takeBeats(4), [1, 1.5, 2, 2.5, 3, 3.5, 4], 'one clock, every beat');
    assert.ok(maxFlashes(pops) <= 3);
  }

  test('2d raising a pulse rate keeps one clock, every beat and at most 3 tap flashes in any window', () => {
    fasterPulseKeepsBudget('a');
  });

  test('2e a second pulse id at a faster rate keeps one clock, every beat and at most 3 tap flashes in any window', () => {
    fasterPulseKeepsBudget('b');
  });

  test('2f reviewer trace: p0 at 2 a second, p1 at 1 a second, stop p0 at 2.6457: no second holds more than 3 flashes (closed windows of 1.05 s)', () => {
    const { l, req } = story();
    req('pulse', 0, { circleId: 'p0', rate: 2 });
    req('pulse', 0.2, { circleId: 'p1', rate: 1 });
    const grants = [];
    l.takeBeats(2.1445);
    if (req('pop', 2.1445, { circleId: 1 }).form === 'full') grants.push(2.1445);
    l.takeBeats(2.6457);
    l.stopPulse('p0', 2.6457);
    for (let t = 2.6457; t < 6; t += 0.01) {
      l.takeBeats(t);
      if (req('pop', t, { circleId: 2 }).form === 'full') grants.push(t);
      if (req('arrival', t, { circleId: 3 }).form === 'full') grants.push(t);
    }
    assert.ok(maxFlashes(grants) <= 3);
  });

  test('3c a pulse period must be a whole multiple of 0.5 s: 1.5 a second and 0.4 s periods are refused', () => {
    assert.equal(story().req('pulse', 0, { circleId: 'a', rate: 1.5 }).form, 'refused');
    assert.equal(story().req('pulse', 0, { circleId: 'a', rate: 2.5 }).form, 'refused');
    assert.equal(story().req('pulse', 0, { circleId: 'a', rate: 1 }).form, 'full');
    assert.equal(story().req('pulse', 0, { circleId: 'a', rate: 0.1 }).form, 'full');
    assert.equal(calm().req('pulse', 0, { circleId: 'a', rate: 0.5 }).form, 'full');
  });

  test('3 pulse rate: Story allows 2 a second, Calm one every 2 s; faster is refused', () => {
    assert.equal(story().req('pulse', 0, { circleId: 'a', rate: 2 }).form, 'full');
    assert.equal(story().req('pulse', 0, { circleId: 'a', rate: 2.5 }).form, 'refused');
    assert.equal(calm().req('pulse', 0, { circleId: 'a', rate: 0.5 }).form, 'full');
    assert.equal(calm().req('pulse', 0, { circleId: 'a', rate: 1 }).form, 'refused');
  });

  test('3b a refused pulse takes no beats from the budget', () => {
    const { req } = story();
    req('pulse', 0, { circleId: 'a', rate: 3 });
    assert.equal(tapStorm(req, 2).length >= 5, true);
  });

  test('4 one clock: pulses started at different moments beat at the same instants', () => {
    const { l, req } = story();
    req('pulse', 0.13, { circleId: 'a', rate: 2 });
    req('pulse', 0.41, { circleId: 'b', rate: 2 });
    assert.deepEqual(l.takeBeats(1.6), [0.5, 1, 1.5], 'two pulses on one tick are one beat');
    const other = story();
    other.req('pulse', 0.4, { circleId: 'c', rate: 2 });
    assert.deepEqual(
      other.l.takeBeats(1.6),
      [0.5, 1, 1.5],
      'a pulse started elsewhere in time beats on the same ticks',
    );
  });

  test('5 shake: a second shake during a shake neither restarts nor extends it; Calm never shakes', () => {
    const { req } = story();
    assert.equal(req('shake', 0).form, 'full');
    assert.notEqual(req('shake', 0.1).form, 'full');
    assert.notEqual(req('shake', 0.15).form, 'full');
    assert.equal(req('shake', 0.21).form, 'full', 'the first shake ended on time, not extended');
    const c = calm();
    for (let i = 0; i < 40; i++) assert.equal(c.req('shake', i / 10).form, 'refused');
  });

  test('12 shake bounds: at most 2 start in any second, never overlap, position only and within size limits', () => {
    const { req } = story();
    const starts = [];
    for (let i = 0; i < 200; i++) if (req('shake', i * 0.05).form === 'full') starts.push(i * 0.05);
    assert.ok(starts.length >= 8);
    assert.ok(maxInOneSecond(starts) <= 2);
    for (let i = 1; i < starts.length; i++) assert.ok(starts[i] - starts[i - 1] >= 0.2 - EPS);
    assert.ok(config.SHAKE_MAX_PIXELS <= 2);
    assert.ok(config.SHAKE_SECONDS <= 0.2);
    assert.ok(config.SHAKE_SWINGS <= 2);
  });

  test('6b Story Reduce motion dim: one at a time, never extended, at most 2 starting in a second', () => {
    const { l, req } = story();
    l.setReduceMotion(true);
    assert.equal(req('shake', 0).form, 'dim');
    assert.notEqual(req('shake', 0.1).form, 'dim');
    const starts = [];
    for (let i = 0; i < 200; i++) if (req('shake', 1 + i * 0.05).form === 'dim') starts.push(1 + i * 0.05);
    assert.ok(maxInOneSecond(starts) <= 2);
    for (let i = 1; i < starts.length; i++) assert.ok(starts[i] - starts[i - 1] >= 0.2 - EPS);
  });

  test('6c turning Reduce motion on mid-shake: a dim cannot start inside the 2-a-second shake limit', () => {
    const { l, req } = story();
    assert.equal(req('shake', 0).form, 'full');
    l.setReduceMotion(true);
    assert.equal(req('shake', 0.2).form, 'dim');
    assert.equal(req('shake', 0.8).form, 'quiet');
  });

  test('12b a shake does not count as a flash', () => {
    const { req } = story();
    req('shake', 0);
    req('shake', 0.2);
    const forms = [0, 1, 2].map((i) => req('pop', 0.3, { circleId: i }).form);
    assert.deepEqual(forms, ['full', 'full', 'full']);
  });

  describe('6 Reduce motion swaps', () => {
    test('Story shake becomes dim', () => {
      const { l, req } = story();
      l.setReduceMotion(true);
      assert.equal(req('shake', 0).form, 'dim');
      l.setReduceMotion(false);
      assert.equal(req('shake', 1).form, 'full');
    });
    test('Calm wobble becomes dim', () => {
      const { l, req } = calm();
      l.setReduceMotion(true);
      assert.equal(req('wobble', 0, { circleId: 1 }).form, 'dim');
    });
    test('Story burst becomes small fade, even when the budget is free', () => {
      const { l, req } = story();
      l.setReduceMotion(true);
      assert.equal(req('pop', 0, { circleId: 1 }).form, 'fade');
    });
    test('Calm pop becomes a plain fade with no ring', () => {
      const { l, req } = calm();
      l.setReduceMotion(true);
      assert.equal(req('pop', 0, { circleId: 1 }).form, 'plainFade');
    });
    test('travelling light is removed, in Story only', () => {
      const { l, req } = story();
      assert.equal(req('travelLight', 0).form, 'full');
      l.setReduceMotion(true);
      assert.equal(req('travelLight', 1).form, 'ignored');
    });
    test('low-time pulse and target glow are unchanged', () => {
      const s = story();
      s.l.setReduceMotion(true);
      assert.equal(s.req('pulse', 0, { circleId: 'bar', rate: 2 }).form, 'full');
      const c = calm();
      c.l.setReduceMotion(true);
      assert.equal(c.req('targetGlow', 0).form, 'full');
    });
  });

  test('7 no saturated red: no effect colour has R/(R+G+B) of 0.8 or more', () => {
    const colours = [...PALETTE.map((c) => c.hex), DUSK, ...Object.values(config.EFFECT_COLORS)];
    for (const hex of colours) {
      const [r, g, b] = rgb(hex);
      assert.ok(r / (r + g + b) < 0.8, `${hex} is saturated red`);
    }
    assert.equal(config.SATURATED_RED_RATIO, 0.8);
  });

  test('8 same results at 60, 90 and 120 steps a second', () => {
    const TICKS = 360;
    function run(stepsPerSecond, offsetTicks) {
      const { l, req } = story();
      const stepTicks = TICKS / stepsPerSecond;
      const log = [];
      const taps = [];
      req('pulse', 0, { circleId: 'bar', rate: 2 });
      for (let step = 0; step <= 8 * stepsPerSecond; step++) {
        const tick = step * stepTicks;
        const now = tick / TICKS;
        // Events are due every 36 ticks (0.1 s), shifted by offsetTicks; each runs on the next step.
        const due = Math.floor((tick - offsetTicks) / 36) - Math.floor((tick - stepTicks - offsetTicks) / 36);
        if (tick < offsetTicks || due < 1) continue;
        for (let f = 0; f < 3; f++) {
          const form = req('pop', now, { circleId: f }).form;
          log.push(`${tick}:pop:${f}:${form}`);
          if (form === 'full') taps.push(now);
        }
        log.push(`${tick}:shake:${req('shake', now).form}`);
        const arrival = req('arrival', now);
        log.push(`${tick}:arrival:${JSON.stringify(arrival)}`);
        if (arrival.form === 'full') taps.push(now);
      }
      const beats = l.takeBeats(10);
      l.stopPulse('bar', 10);
      return { log, taps, beats };
    }
    const aligned = [60, 90, 120].map((r) => run(r, 0));
    assert.deepEqual(aligned[1].log, aligned[0].log);
    assert.deepEqual(aligned[2].log, aligned[0].log);
    for (const r of [60, 90, 120]) {
      const { taps, beats } = run(r, 13);
      assert.ok(maxFlashes(taps) <= 3, `${r} steps a second`);
      assert.equal(beats.length, 20, `${r} steps a second: every beat kept`);
    }
  });

  test('9 Calm arrivals: at most 2 begin in any second, extras wait and none is dropped; arrival plus pop is one flash', () => {
    const { req } = calm();
    const wanted = 50;
    const started = [];
    const waiting = [];
    let asked = 0;
    for (let step = 0; step <= 3000; step++) {
      const now = step / 100;
      for (const w of [...waiting]) {
        const res = req('arrival', now);
        if (res.form === 'full') {
          started.push(now);
          waiting.splice(waiting.indexOf(w), 1);
        } else {
          assert.equal(res.form, 'waitUntil');
          assert.ok(res.at > now);
        }
      }
      if (step % 10 === 0 && asked < wanted) {
        asked++;
        const res = req('arrival', now);
        if (res.form === 'full') started.push(now);
        else {
          assert.equal(res.form, 'waitUntil');
          waiting.push(asked);
        }
      }
    }
    assert.equal(started.length, wanted, 'every arrival eventually begins');
    assert.ok(maxInOneSecond(started) <= 2);
    // Two arrivals just began; the arrival does not take a flash of its own, so 3 pops still fit.
    const c = calm();
    c.req('arrival', 0);
    c.req('arrival', 0.1);
    const pops = [0, 1, 2].map((i) => c.req('pop', 0.2, { circleId: i }).form);
    assert.deepEqual(pops, ['full', 'full', 'full']);
  });

  test('9b waitUntil names the moment the next arrival may begin', () => {
    const { req } = calm();
    req('arrival', 0);
    req('arrival', 0.2);
    const res = req('arrival', 0.3);
    assert.equal(res.form, 'waitUntil');
    assert.ok(Math.abs(res.at - 1) < 1e-6);
    assert.equal(req('arrival', res.at).form, 'full');
  });

  test('10 Calm wobble: a circle already wobbling or dimming ignores further wrong taps', () => {
    const { l, req } = calm();
    assert.equal(req('wobble', 0, { circleId: 7 }).form, 'full');
    assert.equal(req('wobble', 0.1, { circleId: 7 }).form, 'ignored');
    assert.equal(req('wobble', 0.1, { circleId: 8 }).form, 'full');
    assert.equal(req('wobble', 1, { circleId: 7 }).form, 'full', 'free again once it settles');
    l.setReduceMotion(true);
    assert.equal(req('wobble', 2, { circleId: 7 }).form, 'dim');
    assert.equal(req('wobble', 2.4, { circleId: 7 }).form, 'ignored', 'still dimming at 0.4 s');
    assert.equal(req('wobble', 3, { circleId: 7 }).form, 'dim');
  });

  test('11 Reduce motion dim changes the lightest colour by 0.07 relative luminance or less', () => {
    const { l, req } = calm();
    const f = l.dimFraction;
    assert.ok(f > 0 && f < 1);
    const lightest = PALETTE.map((c) => c.hex).sort((a, b) => luminance(rgb(b)) - luminance(rgb(a)))[0];
    const from = rgb(lightest);
    const to = rgb(DUSK);
    const dimmed = from.map((c, i) => c + (to[i] - c) * f);
    const change = luminance(from) - luminance(dimmed);
    assert.ok(change <= 0.07 + 1e-6, `change ${change}`);
    assert.ok(change > 0.05, 'the dim is still a visible cue, not zero');
    assert.equal(config.DIM_LUMINANCE_CAP, 0.07);
    l.setReduceMotion(true);
    assert.equal(req('wobble', 5, { circleId: 2 }).amount, f);
    const s = story();
    s.l.setReduceMotion(true);
    assert.equal(s.req('shake', 5).amount, f, 'Story shake dim uses the same cap');
  });

  test('13 Story arrivals count in the flash budget; over-budget bursts go quiet and do not count', () => {
    const { req } = story();
    for (let i = 0; i < 3; i++) assert.equal(req('arrival', 0).form, 'full');
    const wait = req('arrival', 0.1);
    assert.equal(wait.form, 'waitUntil');
    assert.ok(wait.at > 0.1);
    assert.equal(req('pop', 0.1, { circleId: 1 }).form, 'quiet');
    assert.equal(req('pop', 0.2, { circleId: 2 }).form, 'quiet');
    assert.equal(req('arrival', 1).form, 'waitUntil', 'the closed 1.05 s window still holds the arrivals at 0');
    assert.equal(req('arrival', 1.06).form, 'full', 'quiet pops took nothing from the budget');
    assert.ok(config.QUIET_FADE_SECONDS <= 0.45);
  });

  test('14 property: 5,000 mixed runs, no window starting at a flash grant holds more than 3 flashes (closed windows of 1.05 s), and no pulse beat is skipped', () => {
    let seed = 20261108;
    const random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pick = (list) => list[Math.floor(random() * list.length)];
    const RATES = [2, 1, 0.5, 0.25, 0.1, 1.5, 3];
    for (let run = 0; run < 5000; run++) {
      const isCalm = random() < 0.2;
      const { l, req } = isCalm ? calm() : story();
      const steps = pick([60, 90, 120]);
      const tapRate = pick([3, 10, 20]);
      const fingers = pick([1, 2, 3]);
      const running = new Set();
      const grants = [];
      // Every pulse's intervals as { from, to, period } in ticks, to know which beats were due.
      const open = new Map();
      const spans = [];
      const closeSpan = (id, at) => {
        const span = open.get(id);
        if (span) spans.push({ ...span, to: at });
        open.delete(id);
      };
      const beatGrants = [];
      for (let step = 0; step <= 6 * steps; step++) {
        const now = step / steps;
        if (random() < 0.02) {
          const id = pick(['a', 'b', 'c']);
          if (random() < 0.4) {
            l.stopPulse(id, now);
            closeSpan(id, now);
            running.delete(id);
          } else {
            const rate = pick(RATES);
            if (req('pulse', now, { circleId: id, rate }).form === 'full') {
              closeSpan(id, now);
              open.set(id, { from: now, period: Math.round(1 / rate / config.PULSE_TICK_SECONDS) });
              running.add(id);
            }
          }
        }
        beatGrants.push(...l.takeBeats(now));
        if (random() < tapRate / steps) {
          for (let f = 0; f < fingers; f++) {
            if (req('pop', now, { circleId: f }).form === 'full') grants.push(now);
            if (!isCalm && random() < 0.2 && req('arrival', now).form === 'full') grants.push(now);
          }
        }
      }
      // Beats are free (D-011): whatever taps and arrivals did, no due beat is ever skipped.
      const endAt = 6;
      beatGrants.push(...l.takeBeats(endAt));
      for (const id of [...open.keys()]) closeSpan(id, Infinity);
      for (let k = 1; k <= endAt / config.PULSE_TICK_SECONDS; k++) {
        const t = k * config.PULSE_TICK_SECONDS;
        const due = spans.some((sp) => sp.from <= t - EPS && t <= sp.to + EPS && k % sp.period === 0);
        if (due)
          assert.ok(
            beatGrants.some((b) => Math.abs(b - t) < EPS),
            `run ${run}: beat at ${t} was skipped`,
          );
      }
      grants.sort((x, y) => x - y);
      for (const g of grants) {
        const inWindow = grants.filter((x) => x >= g - EPS && x <= g + 1.05 + EPS).length;
        assert.ok(inWindow <= 3, `run ${run}: ${inWindow} flashes in the second from ${g}`);
      }
    }
  });

  test('15 closed window: a flash may begin only if fewer than 3 began in [t - 1.05 s, t]', () => {
    const { req } = story();
    for (let i = 0; i < 3; i++) assert.equal(req('pop', i * 0.01, { circleId: i }).form, 'full');
    assert.equal(req('pop', 1.04, { circleId: 3 }).form, 'quiet', 'the start at 0 is still inside [t - 1.05, t]');
    assert.equal(req('pop', 1.05, { circleId: 4 }).form, 'quiet', 'exactly W old is still inside (closed)');
    assert.equal(req('pop', 1.061, { circleId: 5 }).form, 'full', 'only starts older than W leave the window');
  });

  test('16 the late-beat drop threshold fits inside the window margin', () => {
    assert.ok(config.MAX_BEAT_LATENESS <= config.FLASH_WINDOW_MARGIN_SECONDS);
    assert.ok(Math.abs(config.FLASH_BUDGET_WINDOW_SECONDS - 1.05) < EPS);
  });
});

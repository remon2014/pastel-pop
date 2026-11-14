import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CEILING_DBFS,
  DEFAULT_SETTINGS,
  DUCK_RAMP_SECONDS,
  EFFECT_QUICK_RELEASE_SECONDS,
  LIMITER,
  MASTER_GAIN,
  MAX_EFFECT_VOICES,
  MIN_WRONG_TAP_QUIETER_DB,
  SOUND_FORMS,
  TONES,
} from '../../src/config.js';
import {
  busGain,
  createVoices,
  duckFactor,
  envelopeGain,
  limiterTrim,
  pickNote,
  ramp,
  soundFor,
} from '../../src/effects/voices.js';

test('voice cap: a 5th sound replaces the oldest and the count never passes the cap', () => {
  const v = createVoices();
  for (let i = 0; i < MAX_EFFECT_VOICES; i++) assert.equal(v.start(`s${i}`, i * 0.01, 1), null);
  assert.equal(v.count(0.05), MAX_EFFECT_VOICES);
  assert.equal(v.start('s4', 0.05, 1), 's0');
  assert.equal(v.count(0.05), MAX_EFFECT_VOICES);
  assert.equal(v.start('s5', 0.06, 1), 's1');
  assert.equal(v.count(0.06), MAX_EFFECT_VOICES);
});

test('voice cap: 30 sounds a second never exceed the cap; ended sounds free their place', () => {
  const v = createVoices();
  let highest = 0;
  for (let i = 0; i < 90; i++) {
    v.start(`s${i}`, i / 30, 0.25);
    highest = Math.max(highest, v.count(i / 30));
  }
  assert.equal(highest, MAX_EFFECT_VOICES);
  assert.equal(v.count(10), 0);
});

test('voice cap: clear forgets every sound', () => {
  const v = createVoices();
  v.start('a', 0, 1);
  v.clear();
  assert.equal(v.count(0.1), 0);
  assert.equal(v.start('b', 0.1, 1), null);
});

test('envelope: starts silent, fades in over 15 ms, fades out to silence, never a step', () => {
  const env = { fadeIn: 0.015, total: 0.25, fadeOut: 0.12 };
  assert.equal(envelopeGain(0, env), 0);
  assert.ok(Math.abs(envelopeGain(0.0075, env) - 0.5) < 1e-9);
  assert.equal(envelopeGain(0.1, env), 1);
  assert.ok(envelopeGain(0.2, env) < 1 && envelopeGain(0.2, env) > 0);
  assert.equal(envelopeGain(0.25, env), 0);
  let last = 0;
  for (let t = 0; t <= 0.25; t += 0.001) {
    const g = envelopeGain(t, env);
    assert.ok(Math.abs(g - last) <= 0.11, `step of ${Math.abs(g - last)} at ${t}`);
    last = g;
  }
});

test('ramp: music fade-in starts at 0 and climbs evenly to 1; zero length is complete', () => {
  assert.equal(ramp(0, 1.5), 0);
  assert.ok(Math.abs(ramp(0.75, 1.5) - 0.5) < 1e-9);
  assert.equal(ramp(9, 1.5), 1);
  assert.equal(ramp(0, 0), 1);
});

test('bus gain: muted is silent, volume is clamped and monotonic', () => {
  assert.equal(busGain(0.8, true), 0);
  assert.equal(busGain(0, false), 0);
  assert.equal(busGain(1, false), 1);
  assert.equal(busGain(2, false), 1);
  assert.equal(busGain(-1, false), 0);
  assert.ok(busGain(0.3, false) < busGain(0.6, false));
});

test('duck: nothing to duck when the total already fits the budget', () => {
  assert.equal(duckFactor({ newLevel: 1, budget: 1.5, sounding: [] }), 1);
  assert.equal(duckFactor({ newLevel: 1, budget: 1.5, sounding: [0.5] }), 1);
});

test('duck: playing sounds are lowered so the new sound at full level plus the rest is the budget', () => {
  const f = duckFactor({ newLevel: 1, budget: 1.5, sounding: [1, 1] });
  assert.ok(Math.abs(f - 0.25) < 1e-12);
  assert.ok(Math.abs(1 + f * 2 - 1.5) < 1e-12);
});

test('duck: simulated bursts of 4 sounds keep the combined target within the budget, the newest at full level', () => {
  const budget = 1.5;
  for (const gap of [0, 1, 2]) {
    let levels = [];
    for (let i = 0; i < 40; i++) {
      const f = duckFactor({ newLevel: 1, budget, sounding: levels });
      assert.ok(f >= 0 && f <= 1);
      levels = levels.map((l) => l * f);
      levels.push(1);
      if (levels.length > MAX_EFFECT_VOICES) levels.shift();
      assert.ok(levels.reduce((a, b) => a + b, 0) <= budget + 1e-9, `gap ${gap} step ${i}`);
      assert.equal(levels[levels.length - 1], 1);
    }
  }
});

test('duck: never raises a sound, and a budget below the new sound mutes the others rather than going negative', () => {
  for (const sounding of [[0.2], [1, 1, 1], [0.01, 5]]) {
    const f = duckFactor({ newLevel: 1, budget: 1.5, sounding });
    assert.ok(f <= 1 && f >= 0);
  }
  assert.equal(duckFactor({ newLevel: 2, budget: 1.5, sounding: [1] }), 0);
});

test('duck ramp is at least 30 ms', () => {
  assert.ok(DUCK_RAMP_SECONDS >= 0.03);
});

test('limiter trim: undoes the compressor makeup gain from the config numbers (2.198 for -12 dB, ratio 20)', () => {
  const trim = limiterTrim(LIMITER);
  assert.ok(Math.abs(1 / trim - 2.198) < 0.001, `makeup ${1 / trim}`);
  assert.ok(Math.abs(limiterTrim({ thresholdDb: 0, ratio: 20 }) - 1) < 1e-12);
  assert.ok(limiterTrim({ thresholdDb: -24, ratio: 20 }) < trim);
});

test('soundFor: full, quiet, fade, plainFade and dim play; ignored, refused and the rest are silent', () => {
  for (const form of ['full', 'quiet', 'fade', 'plainFade']) {
    assert.equal(soundFor('pop', form), 'pop', form);
    assert.equal(soundFor('wobble', form), 'wrong', form);
  }
  assert.equal(soundFor('wobble', 'dim'), 'wrong');
  for (const form of ['ignored', 'refused', 'waitUntil', 'beat']) assert.equal(soundFor('pop', form), null, form);
  assert.equal(soundFor('arrival', 'full'), null);
  assert.equal(soundFor('pulse', 'full'), null);
  assert.ok(SOUND_FORMS.every((f) => f !== 'ignored' && f !== 'refused'));
});

test('tones: sine or triangle, main pitch 250 to 800 Hz, and the wrong tap is at least 6 dB under the pop', () => {
  for (const tone of Object.values(TONES)) {
    assert.ok(['sine', 'triangle'].includes(tone.wave));
    for (const hz of tone.notes) assert.ok(hz >= 250 && hz <= 800, `${hz} Hz`);
  }
  const db = 20 * Math.log10(TONES.wrong.level / TONES.pop.level);
  assert.ok(db <= -MIN_WRONG_TAP_QUIETER_DB, `${db} dB`);
  assert.equal(TONES.wrong.notes.length, 1);
});

test('fades: pop in 15 ms and out 60 ms or more, wrong tap in 30 ms, replaced sound out in 30 ms', () => {
  assert.equal(TONES.pop.fadeIn, 0.015);
  assert.ok(TONES.pop.fadeOut >= 0.06);
  assert.equal(TONES.wrong.fadeIn, 0.03);
  assert.equal(EFFECT_QUICK_RELEASE_SECONDS, 0.03);
  assert.equal(envelopeGain(0, TONES.wrong), 0);
});

test('master: fixed gain 0.5, limiter -12 dBFS ratio 20, ceiling -6 dBFS (0.5 linear)', () => {
  assert.equal(MASTER_GAIN, 0.5);
  assert.equal(LIMITER.thresholdDb, -12);
  assert.equal(LIMITER.ratio, 20);
  assert.equal(CEILING_DBFS, -6);
  assert.ok(Math.abs(10 ** (CEILING_DBFS / 20) - 0.501) < 0.001);
});

test('slider defaults: music 0.5 and effects 0.35, each mapped to gain as value squared', () => {
  assert.equal(DEFAULT_SETTINGS.musicVolume, 0.5);
  assert.equal(DEFAULT_SETTINGS.effectsVolume, 0.35);
  assert.equal(busGain(0.5, false), 0.25);
  assert.ok(Math.abs(busGain(0.35, false) - 0.1225) < 1e-12);
});

test('pickNote: never repeats and never rises twice in a row, over many random runs', () => {
  const { notes } = TONES.pop;
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  let last = null;
  let risesInARow = 0;
  for (let i = 0; i < 5000; i++) {
    const next = pickNote(notes, last, rand);
    assert.ok(notes.includes(next.note));
    if (last) assert.notEqual(next.note, last.note);
    risesInARow = next.rose ? risesInARow + 1 : 0;
    assert.ok(risesInARow <= 1, 'two rises in a row');
    last = next;
  }
});

test('pickNote: works with a one-note set', () => {
  const first = pickNote([262], null, () => 0.5);
  assert.equal(pickNote([262], first, () => 0.5).note, 262);
});

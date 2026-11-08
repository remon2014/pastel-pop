import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFlashMeter, SHAKE_AREA_MAX } from '../../src/dev/flashMeter.js';

const W = 8;
const H = 8;
const FPS = 60;

function frame(fn) {
  const px = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const [r, g, b] = fn(x, y);
      px.set([r, g, b, 255], (y * W + x) * 4);
    }
  return px;
}
const grey = (v) => () => [v, v, v];

// Runs `seconds` of frames; state(timeSeconds) gives the grey level 0-255.
function run(meter, seconds, state, fps = FPS) {
  for (let i = 0; i <= seconds * fps; i++) {
    const t = i / fps;
    meter.addFrame(t, frame(grey(state(t))));
  }
}
// Square wave: `rate` flashes a second between dark and bright.
const square = (rate, dark, bright) => (t) => (Math.floor(t * rate * 2 + 1e-6) % 2 === 0 ? dark : bright);

test('a 5-a-second pattern reads 5', () => {
  const m = createFlashMeter(W, H);
  run(m, 1, square(5, 0, 255));
  assert.equal(m.flashes.highest, 5);
  assert.equal(m.flashes.total, 5);
});

test('a 2-a-second pattern reads 3 or under', () => {
  const m = createFlashMeter(W, H);
  run(m, 3, square(2, 0, 255));
  assert.ok(m.flashes.highest <= 3);
  assert.ok(m.flashes.highest >= 2);
});

test('changes under 0.10 read 0', () => {
  const m = createFlashMeter(W, H);
  run(m, 2, square(5, 100, 108)); // about 0.012 apart in luminance
  assert.equal(m.flashes.total, 0);
});

test('both states at 0.80 or above read 0', () => {
  const m = createFlashMeter(W, H);
  run(m, 2, square(5, 235, 255)); // luminance about 0.83 and 1.0
  assert.equal(m.flashes.total, 0);
});

test('a darker state just under 0.80 counts', () => {
  const m = createFlashMeter(W, H);
  run(m, 1, square(5, 225, 255)); // luminance about 0.75 and 1.0
  assert.equal(m.flashes.total, 5);
});

test('onsets in many cells in the same frame merge into one', () => {
  const m = createFlashMeter(W, H);
  run(m, 1, square(1, 0, 255));
  assert.equal(m.flashes.total, 1);
  assert.equal(m.flashes.highest, 1);
});

test('a change drawn over several frames is stamped where it began', () => {
  const m = createFlashMeter(W, H);
  const levels = [0, 0, 60, 130, 255, 255, 130, 0, 0];
  for (const [i, v] of levels.entries()) m.addFrame(i / FPS, frame(grey(v)));
  assert.equal(m.flashes.total, 1);
  // the onset is frame 2 (first frame above 0), so a closed window from there to 1 s later holds it
  assert.equal(m.flashes.inWindow(2 / FPS + 1), 1);
  assert.equal(m.flashes.inWindow(2 / FPS + 1.01), 0);
});

test('the window is closed: flashes exactly 1 s apart are both in a 1 s window', () => {
  const m = createFlashMeter(W, H);
  // flash starting at t = 0.25 and another at t = 1.25, 60 frames later
  for (let i = 0; i <= 150; i++) {
    const t = i / FPS;
    const on = (t >= 0.25 && t < 0.35) || (t >= 1.25 && t < 1.35);
    m.addFrame(t, frame(grey(on ? 255 : 0)));
  }
  assert.equal(m.flashes.total, 2);
  assert.equal(m.flashes.highest, 2);
});

test('flashes just over 1 s apart are not in one window', () => {
  const m = createFlashMeter(W, H);
  for (let i = 0; i <= 150; i++) {
    const t = i / FPS;
    const on = (t >= 0.25 && t < 0.35) || (t >= 1.3 && t < 1.4);
    m.addFrame(t, frame(grey(on ? 255 : 0)));
  }
  assert.equal(m.flashes.total, 2);
  assert.equal(m.flashes.highest, 1);
});

// A bright bar on a dark ground.
const bar = (left) => (x) => (x >= left && x < left + 4 ? [255, 255, 255] : [0, 0, 0]);

test('a shifted frame reads 0 when the offset is given, and counts raw', () => {
  const m = createFlashMeter(16, 4);
  const w16 = (left) => {
    const px = new Uint8ClampedArray(16 * 4 * 4);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 16; x++) px.set([...bar(left)(x), 255], (y * 16 + x) * 4);
    return px;
  };
  let left = 4;
  let shift = 0;
  m.addFrame(0, w16(left));
  for (let i = 1; i <= 30; i++) {
    shift = i % 2 === 0 ? -4 : 4;
    left += shift;
    m.addFrame(i / FPS, w16(left), shift);
  }
  assert.equal(m.flashes.total, 0);
  assert.ok(m.rawFlashes.total > 0);
});

test('saturated red flashing reads as red flashes, grey does not', () => {
  const m = createFlashMeter(W, H);
  for (let i = 0; i <= FPS; i++) {
    const t = i / FPS;
    m.addFrame(
      t,
      frame(() => (Math.floor(t * 8) % 2 === 0 ? [20, 20, 20] : [200, 10, 10])),
    );
  }
  assert.ok(m.redFlashes.total > 0);
  const g = createFlashMeter(W, H);
  run(g, 1, square(4, 0, 255));
  assert.equal(g.redFlashes.total, 0);
});

test('a steady picture reads 0', () => {
  const m = createFlashMeter(W, H);
  run(m, 1, grey(120));
  assert.equal(m.flashes.total, 0);
});

test('cells swinging in opposite phases still read one flash per swing pair', () => {
  const m = createFlashMeter(W, H);
  for (let i = 0; i <= FPS; i++) {
    const t = i / FPS;
    const high = Math.floor(t * 10 + 1e-6) % 2 === 1;
    m.addFrame(
      t,
      frame((x) => (x < W / 2 === high ? [255, 255, 255] : [0, 0, 0])),
    );
  }
  assert.equal(m.flashes.total, 5);
});

test('a shaking frame where more than 10% of the area changes is over the cap', () => {
  const m = createFlashMeter(W, H);
  m.addFrame(0, frame(grey(0)));
  m.addFrame(
    1 / FPS,
    frame((x) => (x < 2 ? [255, 255, 255] : [0, 0, 0])),
    1,
    true,
  ); // 25% changed
  assert.ok(m.shakeArea.highest > SHAKE_AREA_MAX);
  assert.equal(m.shakeArea.highest, 0.25);
});

test('a shaking frame where 10% or less changes is under the cap', () => {
  const m = createFlashMeter(W, H);
  m.addFrame(0, frame(grey(0)));
  m.addFrame(
    1 / FPS,
    frame((x, y) => (x === 0 && y < 6 ? [255, 255, 255] : [0, 0, 0])),
    1,
    true,
  ); // 6 of 64
  assert.ok(m.shakeArea.highest <= SHAKE_AREA_MAX);
  assert.equal(m.shakeArea.highest, 6 / 64);
});

test('changes that stay under 0.10 or have both states at 0.80 or above are not counted as area', () => {
  const m = createFlashMeter(W, H);
  m.addFrame(0, frame(grey(240)));
  m.addFrame(1 / FPS, frame(grey(255)), 1, true);
  assert.equal(m.shakeArea.highest, 0);
});

test('the area is only taken while a shake is running', () => {
  const m = createFlashMeter(W, H);
  m.addFrame(0, frame(grey(0)));
  m.addFrame(1 / FPS, frame(grey(255)), 0, false);
  assert.equal(m.shakeArea.highest, 0);
});

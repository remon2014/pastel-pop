import assert from 'node:assert/strict';
import { test } from 'node:test';
import { circleRadius } from '../../src/logic/world.js';
import { MAX_COLUMN_ASPECT } from '../../src/config.js';
import { circlePixels, columnRect, computeView, cssToWorld, swatchPixels } from '../../src/render/view.js';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} is not near ${b}`);

function expectView(v, scale, iw, ih, cssPer, playW, playH) {
  assert.equal(v.scale, scale);
  assert.equal(v.internalWidth, iw);
  assert.equal(v.internalHeight, ih);
  near(v.cssPerInternal, cssPer);
  near(v.playCssWidth, playW, 0.01);
  near(v.playCssHeight, playH, 0.01);
}

test('V1 360x800 at dpr 1', () => expectView(computeView(360, 800, 1, 180), 2, 180, 400, 2, 360, 800));
test('V2 360x800 at dpr 2', () => expectView(computeView(360, 800, 2, 180), 4, 180, 400, 2, 360, 800));
test('V3 360x800 at dpr 3', () => expectView(computeView(360, 800, 3, 180), 6, 180, 400, 2, 360, 800));
test('V4 412x915 at dpr 2.625', () =>
  expectView(computeView(412, 915, 2.625, 180), 6, 180, 400, 6 / 2.625, 411.43, 914.29));

test('V5 grid: whole scale, tight fit, never larger than the window', () => {
  for (const w of [320, 360, 412, 768, 1280]) {
    for (const h of [640, 800, 915]) {
      for (const dpr of [1, 1.5, 2, 2.625, 3]) {
        const v = computeView(w, h, dpr, 180);
        const label = `${w}x${h}@${dpr}`;
        assert.ok(Number.isInteger(v.scale) && v.scale >= 1, label);
        assert.ok(v.internalWidth * v.scale <= w * dpr + 1e-6, label);
        assert.ok((v.internalWidth + 1) * v.scale > w * dpr - 1e-6, label);
        assert.ok(v.internalHeight * v.scale <= h * dpr + 1e-6, label);
        assert.ok((v.internalHeight + 1) * v.scale > h * dpr - 1e-6, label);
        assert.ok(v.playCssWidth <= w + 1e-6 && v.playCssHeight <= h + 1e-6, label);
      }
    }
  }
});

test('V6 scale rounds to nearest (306 / 180 = 1.7)', () => {
  const v = computeView(306, 600, 1, 180);
  assert.equal(v.scale, 2);
  assert.equal(v.internalWidth, 153);
});

test('V7 scale is never 0', () => {
  const v = computeView(80, 100, 1, 180);
  assert.equal(v.scale, 1);
  assert.equal(v.internalWidth, 80);
  assert.equal(v.internalHeight, 100);
});

test('V8 float error does not lose an internal pixel', () => {
  assert.equal(computeView(360, 800, 1.15, 180).internalWidth, 207);
});

test('V9 unusable sizes give null', () => {
  for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(computeView(bad, 800, 1, 180), null, `width ${bad}`);
    assert.equal(computeView(360, bad, 1, 180), null, `height ${bad}`);
  }
});

test('V10 a bad dpr counts as 1', () => {
  const expected = computeView(360, 800, 1, 180);
  for (const bad of [0, Number.NaN, undefined]) assert.deepEqual(computeView(360, 800, bad, 180), expected);
});

test('V11 height under one internal pixel gives null', () => {
  assert.equal(computeView(360, 1, 1, 180), null);
});

test('V12 target 240', () => {
  const a = computeView(360, 800, 2, 240);
  assert.equal(a.scale, 3);
  assert.equal(a.internalWidth, 240);
  near(a.playCssWidth, 360);
  const b = computeView(360, 800, 3, 240);
  assert.equal(b.scale, 5);
  assert.equal(b.internalWidth, 216);
  near(b.playCssWidth, 360);
});

test('V13 game circle at 360 wide is 32 internal px, 64 CSS px', () => {
  for (const dpr of [1, 2, 3]) {
    const v = computeView(360, 800, dpr, 180);
    const c = circlePixels(v, { x: 0.37, y: 0.61, radius: circleRadius(v.playCssWidth) });
    assert.equal(c.size, 32);
    assert.ok(Number.isInteger(c.left) && Number.isInteger(c.top));
    near(c.size * v.cssPerInternal, 64);
  }
});

test('V14 drawn diameter is within one internal pixel of ideal', () => {
  for (const [w, h] of [
    [360, 800],
    [412, 915],
    [1280, 800],
  ]) {
    for (const dpr of [1, 2, 2.625, 3]) {
      for (const target of [180, 240]) {
        const v = computeView(w, h, dpr, target);
        const radius = circleRadius(v.playCssWidth);
        const c = circlePixels(v, { x: 0.5, y: 0.5, radius });
        const ideal = 2 * radius * v.playCssWidth;
        const label = `${w}x${h}@${dpr} t${target}`;
        assert.ok(Math.abs(c.size * v.cssPerInternal - ideal) <= v.cssPerInternal + 1e-9, label);
      }
    }
  }
});

test('V15 cssToWorld', () => {
  const a = computeView(360, 800, 1, 180);
  assert.deepEqual(cssToWorld(a, 0, 0), { x: 0, y: 0 });
  const corner = cssToWorld(a, a.playCssWidth, a.playCssHeight);
  near(corner.x, 1);
  near(corner.y, 800 / 360);
  const mid = cssToWorld(a, 180, 400);
  near(mid.x, 0.5);
  near(mid.y, 400 / 360);
  const b = computeView(412, 915, 2.625, 180);
  const bc = cssToWorld(b, b.playCssWidth, b.playCssHeight);
  near(bc.x, 1);
  near(bc.y, b.internalHeight / b.internalWidth);
});

const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
const ASPECT = 9 / 16;

test('C1 phones keep full width (360x800, 412x915)', () => {
  assert.deepEqual(columnRect(360, 800, NO_INSETS, ASPECT), { left: 0, top: 0, width: 360, height: 800 });
  assert.deepEqual(columnRect(412, 915, NO_INSETS, ASPECT), { left: 0, top: 0, width: 412, height: 915 });
});

test('C2 1280x800 gets a centred 450x800 column', () => {
  assert.deepEqual(columnRect(1280, 800, NO_INSETS, ASPECT), { left: 415, top: 0, width: 450, height: 800 });
});

test('C3 landscape phone 800x360 gets a narrow centred column', () => {
  const c = columnRect(800, 360, NO_INSETS, ASPECT);
  near(c.width, 202.5);
  near(c.left, (800 - 202.5) / 2);
  assert.equal(c.height, 360);
});

test('C4 insets trim the screen first, and the column never passes them', () => {
  const c = columnRect(360, 800, { top: 47, right: 10, bottom: 34, left: 20 }, ASPECT);
  assert.equal(c.top, 47);
  assert.equal(c.height, 800 - 47 - 34);
  assert.equal(c.left, 20);
  assert.equal(c.width, 330);
  const wide = columnRect(1280, 800, { top: 0, right: 0, bottom: 0, left: 100 }, ASPECT);
  near(wide.left + wide.width / 2, 100 + (1280 - 100) / 2);
});

test('C5 bad sizes and bad insets', () => {
  assert.equal(columnRect(0, 800, NO_INSETS, ASPECT), null);
  assert.equal(columnRect(360, NaN, NO_INSETS, ASPECT), null);
  assert.equal(columnRect(360, 800, { top: 400, bottom: 400, left: 0, right: 0 }, ASPECT), null);
  assert.deepEqual(columnRect(360, 800, { top: -5, right: NaN }, ASPECT), { left: 0, top: 0, width: 360, height: 800 });
  assert.deepEqual(columnRect(360, 800, undefined, ASPECT), { left: 0, top: 0, width: 360, height: 800 });
});

test('C6 default aspect is the config constant', () => {
  assert.equal(columnRect(1280, 800, NO_INSETS).width, 800 * MAX_COLUMN_ASPECT);
});

test('S1 swatch is about 1.5 times a play circle (360x800, dpr 1, 2, 3)', () => {
  for (const dpr of [1, 2, 3]) {
    const view = computeView(360, 800, dpr, 180);
    const radius = circleRadius(view.playCssWidth);
    const circle = circlePixels(view, { x: 0, y: 0, radius }).size;
    assert.equal(circle, 32);
    assert.equal(swatchPixels(view, radius), 48);
  }
});

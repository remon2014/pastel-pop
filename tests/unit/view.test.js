import assert from 'node:assert/strict';
import { test } from 'node:test';
import { circleRadius } from '../../src/logic/world.js';
import { circlePixels, computeView, cssToWorld } from '../../src/render/view.js';

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

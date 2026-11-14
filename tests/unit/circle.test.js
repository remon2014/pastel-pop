import assert from 'node:assert/strict';
import { test } from 'node:test';
import { discRows } from '../../src/render/circle.js';

for (const size of [1, 2, 7, 16, 32]) {
  test(`discRows(${size}) is a symmetric whole-pixel disc inside its square`, () => {
    const rows = discRows(size);
    assert.equal(rows.length, size);
    assert.equal(Math.max(...rows.map((r) => r.width)), size);
    rows.forEach((r, i) => {
      const mirror = rows[size - 1 - i];
      assert.deepEqual(r, mirror, `row ${i} mirrors row ${size - 1 - i}`);
      assert.ok(Number.isInteger(r.offset) && Number.isInteger(r.width), `row ${i} is whole pixels`);
      assert.ok(r.width >= 1 && r.offset >= 0 && r.offset + r.width <= size, `row ${i} inside`);
      assert.equal(r.offset, size - r.offset - r.width, `row ${i} symmetric left to right`);
    });
  });
}

test('discRows(7) matches the hand-worked disc', () => {
  const widths = [3, 5, 7, 7, 7, 5, 3];
  const expected = widths.map((width) => ({ offset: (7 - width) / 2, width }));
  assert.deepEqual(discRows(7), expected);
});

test('the top row is narrower than the middle row from size 7 up', () => {
  for (const size of [7, 8, 16, 32]) {
    const rows = discRows(size);
    assert.ok(rows[0].width < rows[Math.floor(size / 2)].width, `size ${size}`);
  }
});

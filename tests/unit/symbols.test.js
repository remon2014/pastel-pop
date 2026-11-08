import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PALETTE } from '../../src/colorManager.js';
import { hasSymbol } from '../../src/symbols.js';

test('every palette entry has a symbol drawer', () => {
  for (const { id } of PALETTE) assert.ok(hasSymbol(id), `no symbol drawer for "${id}"`);
});

test('an unknown id has no symbol drawer', () => {
  assert.equal(hasSymbol('nope'), false);
});

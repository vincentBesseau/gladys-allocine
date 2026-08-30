import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, validateConfig } from '../src/config.js';

test('normalizeConfig trims, uppercases and defaults cinema_id', () => {
  assert.deepEqual(normalizeConfig(), { cinema_id: '' });
  assert.deepEqual(normalizeConfig({ cinema_id: ' p0905 ' }), { cinema_id: 'P0905' });
});

test('validateConfig throws when cinema_id is empty', () => {
  assert.throws(() => validateConfig({ cinema_id: '' }), /Find my cinema/);
});

test('validateConfig throws when cinema_id does not look like P0905', () => {
  assert.throws(() => validateConfig({ cinema_id: 'abc' }), /must look like P0905/);
  assert.throws(() => validateConfig({ cinema_id: 'P905' }), /must look like P0905/);
});

test('validateConfig accepts a well-formed cinema_id', () => {
  assert.doesNotThrow(() => validateConfig({ cinema_id: 'P0905' }));
});

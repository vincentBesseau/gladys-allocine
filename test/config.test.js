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

test('validateConfig throws when cinema_id is not a 5-character code', () => {
  assert.throws(() => validateConfig({ cinema_id: 'ABC' }), /must look like P0905/);
  assert.throws(() => validateConfig({ cinema_id: 'P905' }), /must look like P0905/);
  assert.throws(() => validateConfig({ cinema_id: 'P09055' }), /must look like P0905/);
  assert.throws(() => validateConfig({ cinema_id: 'P090!' }), /must look like P0905/);
});

test('validateConfig accepts any 5-character AlloCiné internalId', () => {
  // Letter + four digits, the common shape.
  assert.doesNotThrow(() => validateConfig({ cinema_id: 'P0905' }));
  // Codes with letters in other positions are just as valid: Vichy is G028P,
  // Lyon's Ciné Théâtre Marcel Pagnol is G0FQ8.
  assert.doesNotThrow(() => validateConfig({ cinema_id: 'G028P' }));
  assert.doesNotThrow(() => validateConfig({ cinema_id: 'G0FQ8' }));
});

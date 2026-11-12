import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, validateConfig, resolveWidgetCinemaId } from '../src/config.js';

test('normalizeConfig trims, uppercases and defaults cinema_id', () => {
  assert.deepEqual(normalizeConfig(), { cinema_id: '' });
  assert.deepEqual(normalizeConfig({ cinema_id: ' p0905 ' }), { cinema_id: 'P0905' });
});

test('validateConfig throws when cinema_id is empty', () => {
  assert.throws(() => validateConfig({ cinema_id: '' }), /Find my cinema/);
});

test('validateConfig throws when cinema_id is not a letter followed by four alphanumerics', () => {
  assert.throws(() => validateConfig({ cinema_id: 'ABC' }), /must look like P0905/);
  assert.throws(() => validateConfig({ cinema_id: 'P905' }), /must look like P0905/);
  assert.throws(() => validateConfig({ cinema_id: 'P09055' }), /must look like P0905/);
  assert.throws(() => validateConfig({ cinema_id: 'P090!' }), /must look like P0905/);
});

test('validateConfig rejects a code that does not start with a letter', () => {
  // AlloCiné theater ids always start with a letter; a digit-first code is one
  // copied from the wrong place (e.g. an old "csalle" reference like 5914Z) and
  // would 404 on every showtimes fetch, so it is caught at config time.
  assert.throws(() => validateConfig({ cinema_id: '5914Z' }), /must look like P0905/);
  assert.throws(() => validateConfig({ cinema_id: '02828' }), /must look like P0905/);
});

test('validateConfig accepts a well-formed AlloCiné internalId', () => {
  // Letter + four digits, the common shape.
  assert.doesNotThrow(() => validateConfig({ cinema_id: 'P0905' }));
  // Codes with letters in other positions are just as valid: Vichy is G028P,
  // Lyon's Ciné Théâtre Marcel Pagnol is G0FQ8.
  assert.doesNotThrow(() => validateConfig({ cinema_id: 'G028P' }));
  assert.doesNotThrow(() => validateConfig({ cinema_id: 'G0FQ8' }));
});

test('resolveWidgetCinemaId prefers the widget setting, trimmed and uppercased', () => {
  assert.equal(resolveWidgetCinemaId({ cinema_id: 'P0001' }, { cinema_id: ' g028p ' }), 'G028P');
});

test('resolveWidgetCinemaId falls back to the integration cinema when the setting is empty or absent', () => {
  assert.equal(resolveWidgetCinemaId({ cinema_id: 'P0001' }, { cinema_id: '' }), 'P0001');
  assert.equal(resolveWidgetCinemaId({ cinema_id: 'P0001' }, { cinema_id: '   ' }), 'P0001');
  assert.equal(resolveWidgetCinemaId({ cinema_id: 'P0001' }, {}), 'P0001');
  assert.equal(resolveWidgetCinemaId({ cinema_id: 'P0001' }), 'P0001');
});

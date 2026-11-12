import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, validateConfig, resolveWidgetCinema } from '../src/config.js';

test('normalizeConfig reads the default cinema (slot 1 keeps the historical keys)', () => {
  assert.deepEqual(normalizeConfig(), { cinema_id: '', cinemas: [] });
  assert.deepEqual(normalizeConfig({ cinema_id: ' p0905 ', cinema_name: ' Le Rex ' }), {
    cinema_id: 'P0905',
    cinemas: [{ id: 'P0905', name: 'Le Rex' }],
  });
});

test('normalizeConfig collects up to five cinemas in slot order, skipping empty slots', () => {
  const config = normalizeConfig({
    cinema_id: 'p0905',
    cinema_name: 'One',
    cinema_id_2: '',
    cinema_id_3: 'g028p',
    cinema_name_3: 'Three',
  });

  assert.equal(config.cinema_id, 'P0905');
  assert.deepEqual(config.cinemas, [
    { id: 'P0905', name: 'One' },
    { id: 'G028P', name: 'Three' },
  ]);
});

test('validateConfig throws when no cinema is set', () => {
  assert.throws(() => validateConfig({ cinema_id: '', cinemas: [] }), /Find my cinema/);
});

test('validateConfig rejects any badly-formatted cinema id (incl. digit-first like 5914Z)', () => {
  assert.throws(() => validateConfig({ cinema_id: '5914Z' }), /must look like P0905/);
  assert.throws(() => validateConfig({ cinema_id: 'P905' }), /must look like P0905/);
  assert.throws(
    () =>
      validateConfig({
        cinema_id: 'P0905',
        cinemas: [
          { id: 'P0905', name: '' },
          { id: '5914Z', name: '' },
        ],
      }),
    /must look like P0905/,
  );
});

test('validateConfig accepts well-formed AlloCiné internalIds', () => {
  assert.doesNotThrow(() => validateConfig({ cinema_id: 'P0905' }));
  assert.doesNotThrow(() => validateConfig({ cinema_id: 'G028P' }));
  assert.doesNotThrow(() =>
    validateConfig({
      cinema_id: 'P0905',
      cinemas: [
        { id: 'P0905', name: '' },
        { id: 'G0FQ8', name: '' },
      ],
    }),
  );
});

test('resolveWidgetCinema picks the cinema at the selected slot', () => {
  const config = normalizeConfig({
    cinema_id: 'P0905',
    cinema_name: 'One',
    cinema_id_2: 'G028P',
    cinema_name_2: 'Two',
  });

  assert.deepEqual(resolveWidgetCinema(config, { cinema: '2' }), { id: 'G028P', name: 'Two' });
});

test('resolveWidgetCinema falls back to the first cinema when the slot is missing or out of range', () => {
  const config = normalizeConfig({ cinema_id: 'P0905', cinema_name: 'One', cinema_id_2: 'G028P' });

  assert.deepEqual(resolveWidgetCinema(config, {}), { id: 'P0905', name: 'One' });
  assert.deepEqual(resolveWidgetCinema(config, { cinema: '5' }), { id: 'P0905', name: 'One' });
  assert.deepEqual(resolveWidgetCinema(config), { id: 'P0905', name: 'One' });
});

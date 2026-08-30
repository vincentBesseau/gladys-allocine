import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { searchCinemas } from '../src/allocine/cinemas.js';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

// Trimmed down from a real, live response for query "44000" (Nantes' postal
// code) - includes both independent (Katorza) and chain (Pathé) theaters,
// exactly what this integration is for.
const sampleResponse = {
  values: {
    cities: [{ node: { __typename: 'City', id: 101187, name: 'Nantes', zip: '44000' } }],
    theaters: [
      {
        node: {
          __typename: 'Theater',
          id: 'VGhlYXRlcjpQMDA1Mg==',
          internalId: 'P0052',
          name: 'Katorza',
          location: { zip: '44000', city: 'Nantes' },
        },
      },
      {
        node: {
          __typename: 'Theater',
          id: 'VGhlYXRlcjpQMDE5Ng==',
          internalId: 'P0196',
          name: 'Pathé Nantes Centre ville',
          location: { zip: '44000', city: 'Nantes' },
        },
      },
    ],
  },
};

test('searches allocine.fr live and normalizes the theater list', async () => {
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return { ok: true, json: async () => sampleResponse };
  };

  const results = await searchCinemas('44000');

  assert.equal(calledUrl, 'https://www.allocine.fr/_/localization_city/44000');
  assert.deepEqual(results, [
    { id: 'P0052', name: 'Katorza', city: 'Nantes', postalCode: '44000' },
    { id: 'P0196', name: 'Pathé Nantes Centre ville', city: 'Nantes', postalCode: '44000' },
  ]);
});

test('URL-encodes the query', async () => {
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return { ok: true, json: async () => ({ values: { theaters: [] } }) };
  };

  await searchCinemas('UGC Lyon');

  assert.equal(calledUrl, 'https://www.allocine.fr/_/localization_city/UGC%20Lyon');
});

test('returns an empty array without calling the API when the query is blank', async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return { ok: true, json: async () => ({}) };
  };

  assert.deepEqual(await searchCinemas(''), []);
  assert.deepEqual(await searchCinemas('   '), []);
  assert.equal(
    called,
    false,
    'the live search endpoint requires a non-empty query and 404s otherwise',
  );
});

test('returns an empty array when the response has no theaters', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ values: { cities: [] } }) });

  assert.deepEqual(await searchCinemas('this-does-not-exist'), []);
});

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { nearbyCinemas } from '../src/allocine/nearby.js';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

// A tiny 3-commune "department" for a house in Nantes: Nantes itself, then
// Saint-Herblain and Rezé further out.
const communesByDepartment = [
  { nom: 'Nantes', centre: { coordinates: [-1.5603, 47.2382] } },
  { nom: 'Saint-Herblain', centre: { coordinates: [-1.6392, 47.2115] } },
  { nom: 'Rezé', centre: { coordinates: [-1.5636, 47.1868] } },
];

const theatersByCommune = {
  Nantes: [
    { node: { internalId: 'P0052', name: 'Katorza', location: { city: 'Nantes', zip: '44000' } } },
  ],
  'Saint-Herblain': [
    {
      node: {
        internalId: 'P0666',
        // Deliberately mentions "Nantes" in its own name, to prove
        // distance is attributed by the theater's own city, not by
        // whichever commune query happened to find it.
        name: 'UGC Ciné Cité Atlantis - Nantes',
        location: { city: 'Saint-Herblain', zip: '44800' },
      },
    },
  ],
  Rezé: [
    { node: { internalId: 'P0403', name: 'Saint-Paul', location: { city: 'Rezé', zip: '44400' } } },
  ],
};

function fetchRouter() {
  return async (url) => {
    const href = url.toString();

    if (href.includes('geo.api.gouv.fr/communes?lat=')) {
      return { ok: true, json: async () => [{ nom: 'Nantes', codeDepartement: '44' }] };
    }

    if (href.includes('geo.api.gouv.fr/departements/44/communes')) {
      return { ok: true, json: async () => communesByDepartment };
    }

    const match = href.match(/_\/localization_city\/(.+)$/);

    if (match) {
      const commune = decodeURIComponent(match[1]);

      return {
        ok: true,
        json: async () => ({ values: { theaters: theatersByCommune[commune] ?? [] } }),
      };
    }

    throw new Error(`Unexpected fetch: ${href}`);
  };
}

test('finds cinemas across nearby communes, nearest first, attributed to their own city', async () => {
  globalThis.fetch = fetchRouter();

  const results = await nearbyCinemas({ latitude: 47.2184, longitude: -1.5536 }, 10);

  assert.equal(results.length, 3);
  assert.deepEqual(
    results.map((r) => r.id),
    ['P0052', 'P0403', 'P0666'],
  );

  const ugc = results.find((r) => r.id === 'P0666');

  assert.equal(ugc.city, 'Saint-Herblain');
  assert.ok(
    ugc.distanceKm > 5,
    'distance should reflect Saint-Herblain, not the closer Nantes query',
  );
});

test('respects the limit', async () => {
  globalThis.fetch = fetchRouter();

  const results = await nearbyCinemas({ latitude: 47.2184, longitude: -1.5536 }, 2);

  assert.equal(results.length, 2);
});

test('returns an empty array when the house is outside any known commune', async () => {
  globalThis.fetch = async (url) => {
    if (url.toString().includes('geo.api.gouv.fr/communes?lat=')) {
      return { ok: true, json: async () => [] };
    }

    throw new Error(`Unexpected fetch: ${url}`);
  };

  assert.deepEqual(await nearbyCinemas({ latitude: 0, longitude: 0 }), []);
});

test('skips a commune whose allocine.fr search fails, without failing the batch', async () => {
  globalThis.fetch = async (url) => {
    const href = url.toString();

    if (href.includes('geo.api.gouv.fr/communes?lat=')) {
      return { ok: true, json: async () => [{ nom: 'Nantes', codeDepartement: '44' }] };
    }

    if (href.includes('geo.api.gouv.fr/departements/44/communes')) {
      return { ok: true, json: async () => communesByDepartment };
    }

    if (href.includes('Saint-Herblain')) {
      return { ok: false, status: 500 };
    }

    const match = href.match(/_\/localization_city\/(.+)$/);
    const commune = decodeURIComponent(match[1]);

    return {
      ok: true,
      json: async () => ({ values: { theaters: theatersByCommune[commune] ?? [] } }),
    };
  };

  const results = await nearbyCinemas({ latitude: 47.2184, longitude: -1.5536 }, 10);

  assert.ok(!results.some((r) => r.id === 'P0666'));
  assert.ok(results.some((r) => r.id === 'P0052'));
});

// -----------------------------------------------------------------------------
// "Cinemas near the Gladys house" for AlloCiné.
//
// Unlike gladys-ugc/gladys-cgr/gladys-pathe, allocine.fr's own search
// (cinemas.js) is text-only (city/postal code/name) - there is no live
// "near me" endpoint on the site itself, and its theater pages carry an
// address but no lat/lon (verified live), so there is no first-party
// per-theater coordinate to sort by directly.
//
// Instead, this uses France's free, no-key geo.api.gouv.fr (Etalab, the
// government's own open geo API):
//   1. Resolve the Gladys house's lat/lon to its commune (city) and
//      department.
//   2. List every commune in that department, each with its own centroid
//      coordinates (one bulk call, no per-commune request needed) - a
//      typical French department has 200-400 communes, cheap to fetch and
//      sort locally.
//   3. Take the N nearest communes to the house and search allocine.fr's
//      own live endpoint for each name (bounded concurrency).
//   4. A cinema's distance is read back from its OWN reported city against
//      the same commune/distance table - not the query that happened to
//      surface it - so a cinema whose name mentions a bigger neighboring
//      city (e.g. "UGC ... - Nantes" actually located in Saint-Herblain)
//      is still attributed the correct town's distance.
//
// This is commune-centroid accuracy (town-center-ish), not exact per-address
// distance - the same kind of best-effort approximation the sibling
// integrations make from their own limited data, and cinemas outside the
// house's own department are not considered (a house near a department
// border may miss a genuinely closer cinema just across it).
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { distanceKm } from './geo.js';
import { searchCinemas } from './cinemas.js';

const logger = createLogger({ name: 'allocine-nearby' });

const GEO_API_BASE = 'https://geo.api.gouv.fr';
const REQUEST_TIMEOUT_MS = 15_000;
const USER_AGENT = 'gladys-allocine integration (github.com/vincentBesseau/gladys-allocine)';

// How many of the nearest communes to actually search allocine.fr for -
// bounded to keep this comfortably within Gladys's action timeout (one
// allocine.fr call per commune, run concurrently).
const COMMUNES_TO_SEARCH = 15;
const SEARCH_CONCURRENCY = 5;

function normalize(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); // strip combining diacritics left by NFD normalization
}

async function geoApiGet(path) {
  const url = `${GEO_API_BASE}/${path}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`geo.api.gouv.fr HTTP ${response.status} on ${path}`);
  }

  return response.json();
}

async function forEachWithConcurrency(items, concurrency, mapper) {
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = items[nextIndex];
      nextIndex += 1;
      await mapper(current);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
}

/**
 * The communes of the Gladys house's own department, nearest first, each
 * with its straight-line distance from the house.
 * @param {{latitude: number, longitude: number}} origin
 * @returns {Promise<Array<{name: string, distanceKm: number}>>}
 */
async function nearestCommunes(origin) {
  const [commune] = await geoApiGet(
    `communes?lat=${origin.latitude}&lon=${origin.longitude}&fields=nom,codeDepartement`,
  );

  if (!commune?.codeDepartement) {
    return [];
  }

  const communes = await geoApiGet(
    `departements/${commune.codeDepartement}/communes?fields=nom,centre`,
  );

  return communes
    .filter((c) => c.centre?.coordinates)
    .map((c) => ({
      name: c.nom,
      distanceKm: distanceKm(origin, {
        latitude: c.centre.coordinates[1],
        longitude: c.centre.coordinates[0],
      }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Cinemas near the Gladys house, nearest first, each with a `distanceKm`
 * field. Only considers the house's own department (see file header) - can
 * return fewer than `limit` results, including zero for a department with
 * very few communes searched or no cinema found there.
 * @param {{latitude: number, longitude: number}} origin
 * @param {number} [limit]
 * @returns {Promise<Array<{id: string, name: string, city: string, postalCode: string, distanceKm: number}>>}
 */
export async function nearbyCinemas(origin, limit = 10) {
  const communes = (await nearestCommunes(origin)).slice(0, COMMUNES_TO_SEARCH);

  if (communes.length === 0) {
    return [];
  }

  const distanceByCity = new Map(communes.map((c) => [normalize(c.name), c.distanceKm]));
  const found = new Map();

  await forEachWithConcurrency(communes, SEARCH_CONCURRENCY, async (commune) => {
    let theaters;

    try {
      theaters = await searchCinemas(commune.name);
    } catch (error) {
      logger.debug(`Unable to search allocine.fr for commune "${commune.name}"`, error);

      return;
    }

    for (const theater of theaters) {
      if (found.has(theater.id)) {
        continue;
      }

      // Attribute the theater's OWN city's distance, not the commune that
      // happened to surface it (its name may mention a different, bigger
      // neighboring city - see file header).
      const theaterDistance = distanceByCity.get(normalize(theater.city ?? ''));

      if (theaterDistance === undefined) {
        continue;
      }

      found.set(theater.id, { ...theater, distanceKm: Math.round(theaterDistance * 10) / 10 });
    }
  });

  return [...found.values()].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, limit);
}

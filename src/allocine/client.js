// -----------------------------------------------------------------------------
// Thin HTTP client for allocine.fr's own public endpoints.
//
// allocine.fr's own pages call these exact endpoints (verified live: no
// authentication, no session cookie, no User-Agent filter of any kind - a
// plain, honest, self-identifying User-Agent works fine here, unlike
// gladys-pathe) to power the theater search box and the showtimes list on
// its own pages. This integration calls the same first-party endpoints.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';

const logger = createLogger({ name: 'allocine-client' });

const BASE_URL = 'https://www.allocine.fr';
const REQUEST_TIMEOUT_MS = 15_000;
const USER_AGENT = 'gladys-allocine integration (github.com/vincentBesseau/gladys-allocine)';

async function allocineFetch(path, { method = 'GET' } = {}) {
  const url = `${BASE_URL}/${path}`;

  logger.debug(`allocine.fr request -> ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`allocine.fr HTTP ${response.status} on ${path}`);
  }

  return response.json();
}

/**
 * @param {string} path - path under allocine.fr, e.g. "_/localization_city/nantes".
 * @returns {Promise<any>} The parsed JSON body.
 */
export function allocineGet(path) {
  return allocineFetch(path, { method: 'GET' });
}

/**
 * @param {string} path - path under allocine.fr, e.g. "_/showtimes/theater-P0052/d-2026-08-30/".
 * @returns {Promise<any>} The parsed JSON body.
 */
export function allocinePost(path) {
  return allocineFetch(path, { method: 'POST' });
}

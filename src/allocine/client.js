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

/**
 * GET a text (HTML) page — used to read a film page for its trailer. Supports a
 * byte-range cap (`rangeBytes`) so only the head of a large page is downloaded,
 * and a per-call timeout shorter than the default so one slow page cannot eat
 * the whole widget ack budget.
 * @param {string} path - path under allocine.fr, e.g. "film/fichefilm_gen_cfilm=123.html".
 * @param {object} [options]
 * @param {number} [options.timeoutMs]
 * @param {number} [options.rangeBytes] - when set, request only bytes 0..rangeBytes-1.
 * @returns {Promise<string>} The response body as text.
 */
export async function allocineGetText(path, { timeoutMs = REQUEST_TIMEOUT_MS, rangeBytes } = {}) {
  const url = `${BASE_URL}/${path}`;
  const headers = { 'User-Agent': USER_AGENT };

  if (rangeBytes) {
    headers.Range = `bytes=0-${rangeBytes - 1}`;
  }

  logger.debug(`allocine.fr request -> GET ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });

  // 206 Partial Content is the expected answer to a Range request; treat it as
  // success alongside 200.
  if (!response.ok && response.status !== 206) {
    throw new Error(`allocine.fr HTTP ${response.status} on ${path}`);
  }

  return response.text();
}

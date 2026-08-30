import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { allocineGet, allocinePost } from '../src/allocine/client.js';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

test('allocineGet builds the request URL and uses GET', async () => {
  let calledUrl;
  let calledOptions;
  globalThis.fetch = async (url, options) => {
    calledUrl = url;
    calledOptions = options;
    return { ok: true, json: async () => ({}) };
  };

  await allocineGet('_/localization_city/nantes');

  assert.equal(calledUrl, 'https://www.allocine.fr/_/localization_city/nantes');
  assert.equal(calledOptions.method, 'GET');
});

test('allocinePost builds the request URL and uses POST', async () => {
  let calledUrl;
  let calledOptions;
  globalThis.fetch = async (url, options) => {
    calledUrl = url;
    calledOptions = options;
    return { ok: true, json: async () => ({}) };
  };

  await allocinePost('_/showtimes/theater-P0052/d-2026-08-30/');

  assert.equal(calledUrl, 'https://www.allocine.fr/_/showtimes/theater-P0052/d-2026-08-30/');
  assert.equal(calledOptions.method, 'POST');
});

test('sends an honest, self-identifying user-agent', async () => {
  let calledOptions;
  globalThis.fetch = async (url, options) => {
    calledOptions = options;
    return { ok: true, json: async () => ({}) };
  };

  await allocineGet('_/localization_city/nantes');

  assert.match(calledOptions.headers['User-Agent'], /gladys-allocine/);
});

test('throws on a non-2xx response', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 404 });

  await assert.rejects(() => allocineGet('_/localization_city/'), /allocine\.fr HTTP 404/);
});

test('returns the parsed JSON body', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ hello: 'world' }) });

  assert.deepEqual(await allocineGet('_/localization_city/nantes'), { hello: 'world' });
});

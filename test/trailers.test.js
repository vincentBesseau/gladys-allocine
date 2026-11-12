import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fetchTrailerUrl, attachTrailers } from '../src/allocine/trailers.js';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

test('fetchTrailerUrl builds the player URL from the cmedia found in the film page', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 206,
    text: async () =>
      '<a href="/video/player_gen_cmedia=20645145&amp;cfilm=1000039483.html">BA</a>',
  });

  assert.equal(
    await fetchTrailerUrl('1000039483'),
    'https://www.allocine.fr/video/player_gen_cmedia=20645145&cfilm=1000039483.html',
  );
});

test('fetchTrailerUrl returns undefined when the page has no trailer player', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => '<html>no trailer</html>',
  });

  assert.equal(await fetchTrailerUrl('1000039483'), undefined);
});

test('fetchTrailerUrl returns undefined when the request fails, never throws', async () => {
  globalThis.fetch = async () => {
    throw new Error('network down');
  };

  assert.equal(await fetchTrailerUrl('1000039483'), undefined);
});

test('attachTrailers sets trailerUrl only on films that advertise a trailer', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 206,
    text: async () => 'player_gen_cmedia=999&cfilm=1',
  });

  const movies = [{ id: '1', hasTrailer: true }, { id: '2', hasTrailer: false }, { id: '3' }];

  await attachTrailers(movies);

  assert.equal(
    movies[0].trailerUrl,
    'https://www.allocine.fr/video/player_gen_cmedia=999&cfilm=1.html',
  );
  assert.equal(movies[1].trailerUrl, undefined);
  assert.equal(movies[2].trailerUrl, undefined);
});

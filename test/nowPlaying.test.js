import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fetchNowPlaying } from '../src/allocine/nowPlaying.js';

const realFetch = globalThis.fetch;

const sample = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('./fixtures/showtimes-sample.json', import.meta.url)),
    'utf-8',
  ),
);

const realNow = new Date('2026-08-30T12:00:00');

afterEach(() => {
  globalThis.fetch = realFetch;
});

test('parses films playing today, with showtimes, dropping ones with no session or no release date', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(url, 'https://www.allocine.fr/_/showtimes/theater-P0052/d-2026-08-30/');
    return { ok: true, json: async () => sample };
  };

  const movies = await fetchNowPlaying('P0052', { now: realNow });

  assert.equal(
    movies.length,
    2,
    'the film with no session today and the one with no release date are dropped',
  );

  const [dubbed, original] = movies;

  assert.deepEqual(dubbed, {
    id: '327993',
    title: "L'Inconnue",
    releaseDate: '2026-08-26',
    overview: 'A bientôt 40 ans, David Zimmerman est photographe mais personne ne le sait.',
    posterUrl: 'https://fr.web.img3.acsta.net/img/af/a2/afa2a4e9bb49e003bceb86c209f46033.jpg',
    sourceUrl: 'https://www.allocine.fr/film/fichefilm_gen_cfilm=327993.html',
    hasTrailer: false,
    showtimes: [
      { time: '14:00', version: 'VF' },
      { time: '20:30', version: 'VF' },
    ],
  });

  assert.deepEqual(original.showtimes, [{ time: '18:15', version: 'VOST' }]);
});

test('excludes a film with no showtime today at this cinema', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => sample });

  const movies = await fetchNowPlaying('P0052', { now: realNow });

  assert.ok(!movies.some((movie) => movie.title === 'No Sessions Today'));
});

test('excludes a film with no parseable release date, without failing the batch', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => sample });

  const movies = await fetchNowPlaying('P0052', { now: realNow });

  assert.ok(!movies.some((movie) => movie.title === 'No Release Date'));
});

test('returns an empty array when nothing plays today', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ error: false, results: [] }) });

  assert.deepEqual(await fetchNowPlaying('P0052'), []);
});

test('carries the hasTrailer flag from AlloCiné onto the movie', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      error: false,
      results: [
        {
          movie: {
            internalId: 42,
            title: 'With trailer',
            flags: { hasTrailer: true },
            releases: [{ releaseDate: { date: '2026-01-01' } }],
          },
          showtimes: { multiple: [{ startsAt: '2026-08-30T20:00:00' }] },
        },
      ],
    }),
  });

  const [movie] = await fetchNowPlaying('P0052', { now: realNow });

  assert.equal(movie.hasTrailer, true);
});

test('treats no.showtime.error as an empty program, not an error', async () => {
  // AlloCiné returns this when the cinema has no showtimes for the day.
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ error: true, message: 'no.showtime.error', results: [] }),
  });

  assert.deepEqual(await fetchNowPlaying('P0052'), []);
});

test('throws when allocine.fr reports an error', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ error: true, message: 'Unknown theater' }),
  });

  await assert.rejects(() => fetchNowPlaying('P9999'), /Unknown theater/);
});

// -----------------------------------------------------------------------------
// Trailer lookup for one AlloCiné film.
//
// Unlike the showtimes endpoint, AlloCiné exposes no JSON endpoint for a film's
// trailer: the film object only carries a `hasTrailer` flag. The trailer's
// player page id (`cmedia`) lives in the film's HTML page, near the top — so we
// fetch just the head of that page (a byte-range request) and read the id from
// it, then build the public player URL. Best-effort and fragile by nature (it
// reads markup): any failure just leaves the film without a trailer link, never
// breaks the widget.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { allocineGetText } from './client.js';

const logger = createLogger({ name: 'allocine-trailers' });

// Films are enriched one HTTP call at a time (attachTrailers): a single slow
// page must not eat the whole widget ack budget, so this is much shorter than
// the client's default timeout.
const TRAILER_TIMEOUT_MS = 5_000;

// The player `cmedia` reference sits near the top of the film page; fetching
// only the head keeps a ~350 KB page down to a small range request.
const FILM_PAGE_HEAD_BYTES = 65_536;

/**
 * @param {string} filmId - AlloCiné film internalId.
 * @returns {Promise<string|undefined>} The trailer player-page URL, or undefined when none is found.
 */
export async function fetchTrailerUrl(filmId) {
  try {
    const html = await allocineGetText(`film/fichefilm_gen_cfilm=${filmId}.html`, {
      timeoutMs: TRAILER_TIMEOUT_MS,
      rangeBytes: FILM_PAGE_HEAD_BYTES,
    });

    const match = html.match(/player_gen_cmedia=(\d+)/);

    if (!match) {
      return undefined;
    }

    return `https://www.allocine.fr/video/player_gen_cmedia=${match[1]}&cfilm=${filmId}.html`;
  } catch (error) {
    // No trailer is a normal outcome, not a failure worth surfacing: the film
    // itself still has valid data, it just won't have a trailer link.
    logger.debug(`AlloCiné film ${filmId}: unable to fetch a trailer`, error);

    return undefined;
  }
}

/**
 * Attach a `trailerUrl` to every movie that advertises a trailer (`hasTrailer`)
 * and does not already have one. One HTTP call per such film, sequentially, so
 * a cinema with a long program does not open a dozen connections at once. A
 * missing or failed lookup just leaves the field unset — never fails the batch.
 * Mutates the movies in place and returns them.
 * @param {Array<object>} movies
 */
export async function attachTrailers(movies = []) {
  for (const movie of movies) {
    if (!movie || !movie.hasTrailer || movie.trailerUrl) {
      continue;
    }

    const trailerUrl = await fetchTrailerUrl(movie.id);

    if (trailerUrl) {
      movie.trailerUrl = trailerUrl;
    }
  }

  return movies;
}

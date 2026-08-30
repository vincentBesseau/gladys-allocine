// -----------------------------------------------------------------------------
// "Now playing" for one cinema, by AlloCiné theater ID.
//
// allocine.fr's own theater pages call this exact endpoint (verified live:
// no authentication, no session cookie) to render the day's showtimes: one
// POST per theater and date returns every film playing there, each already
// carrying its full details (title, synopsis, poster, release date) AND its
// showtimes for that day in the same response - no cross-referencing or
// per-film follow-up call needed, unlike gladys-pathe.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { allocinePost } from './client.js';

const logger = createLogger({ name: 'allocine-now-playing' });

// Showtimes come pre-grouped by allocine.fr itself: "multiple" is the dubbed
// French version, and the three "original_*" groups are all original-version
// variants (subtitled or not) - collapsed here into a single VOST label,
// same best-effort approximation the sibling integrations make from their
// own raw tags.
const VERSION_GROUPS = ['original', 'original_st', 'original_sme', 'multiple'];

function todayDateKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function versionLabel(group) {
  return group === 'multiple' ? 'VF' : 'VOST';
}

function extractShowtimes(showtimesByGroup = {}) {
  const showtimes = [];

  for (const group of VERSION_GROUPS) {
    const sessions = showtimesByGroup[group];

    if (!Array.isArray(sessions)) {
      continue;
    }

    for (const session of sessions) {
      if (typeof session.startsAt !== 'string') {
        continue;
      }

      showtimes.push({ time: session.startsAt.slice(11, 16), version: versionLabel(group) });
    }
  }

  return showtimes;
}

function toMovie(result) {
  const movie = result.movie ?? {};
  const releaseDate = movie.releases?.[0]?.releaseDate?.date;

  if (!movie.internalId || !movie.title || !releaseDate) {
    logger.debug(
      `AlloCiné film ${movie.internalId} (${movie.title}) is missing a required field, skipping it`,
    );

    return null;
  }

  // A film with no showtime today at this cinema (e.g. all sessions already
  // passed) shouldn't show up as a poster with nothing to click on - same
  // rule as the sibling integrations.
  const showtimes = extractShowtimes(result.showtimes);

  if (showtimes.length === 0) {
    return null;
  }

  return {
    id: String(movie.internalId),
    title: movie.title,
    releaseDate,
    overview: movie.synopsis || undefined,
    posterUrl: movie.poster?.url || undefined,
    sourceUrl: `https://www.allocine.fr/film/fichefilm_gen_cfilm=${movie.internalId}.html`,
    showtimes,
  };
}

/**
 * Fetch and parse the films currently playing at a cinema, including their
 * showtimes.
 * @param {string} cinemaId - AlloCiné theater ID, e.g. "P0052".
 * @param {object} [options]
 * @param {Date} [options.now] - Overridable for tests; defaults to the real current time.
 * @returns {Promise<Array<{id: string, title: string, releaseDate: string, overview?: string, posterUrl?: string, sourceUrl: string, showtimes?: Array<{time: string, version?: string}>}>>}
 */
export async function fetchNowPlaying(cinemaId, { now = new Date() } = {}) {
  const dateKey = todayDateKey(now);
  const data = await allocinePost(`_/showtimes/theater-${cinemaId}/d-${dateKey}/`);

  if (data.error) {
    throw new Error(data.message || `allocine.fr returned an error for cinema ${cinemaId}`);
  }

  const movies = (data.results ?? []).map(toMovie).filter(Boolean);

  logger.info(`AlloCiné cinema ${cinemaId}: ${movies.length} film(s) currently playing`);

  return movies;
}

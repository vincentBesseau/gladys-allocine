// -----------------------------------------------------------------------------
// Entry point of the Gladys external integration.
//
// This is a "provider" type integration (Gladys capabilities/provider-type.md):
// it has no device surface, and declares two capabilities instead — a
// dashboard widget (capabilities/dashboard-widgets.md, "now_playing") and a
// scene trigger (capabilities/scene-triggers-and-actions.md, "new_film") —
// for the films currently playing at ONE configured cinema. It also exposes
// a "Find my cinema" action to look up the cinema's AlloCiné ID.
//
// Environment variables provided by the Gladys supervisor to the container:
//   - GLADYS_HOST_API_URL         (host API URL)
//   - GLADYS_INTEGRATION_TOKEN    (integration-scoped JWT)
//   - GLADYS_INTEGRATION_SELECTOR (integration identifier)
// The SDK reads them automatically: `new GladysIntegration()` is enough.
// -----------------------------------------------------------------------------

import { GladysIntegration, logger } from '@gladysassistant/integration-sdk';
import { normalizeConfig, validateConfig, resolveWidgetCinema } from './src/config.js';
import { searchCinemas } from './src/allocine/cinemas.js';
import { nearbyCinemas } from './src/allocine/nearby.js';
import { fetchNowPlaying } from './src/allocine/nowPlaying.js';
import { attachTrailers } from './src/allocine/trailers.js';
import { buildNowPlayingContent, resolvePosterUrl, MAX_GRID_ITEMS } from './src/allocine/widget.js';
import { fitImageForWidget } from './src/image.js';
import { startNewFilmPolling, stopNewFilmPolling } from './src/allocine/newFilmPolling.js';

const gladys = new GladysIntegration();

let config = normalizeConfig();

// How many cinemas to show when the "Find my cinema" query is left empty
// and the house is located.
const NEARBY_CINEMAS_LIMIT = 10;

function formatCinemaLine(cinema) {
  const distance = cinema.distanceKm === undefined ? '' : ` (${cinema.distanceKm} km)`;

  return `${cinema.name} — ${cinema.city}${distance} (ID: ${cinema.id})`;
}

/**
 * Cinemas near the first located Gladys house, or `null` when there is no
 * house, no house has been located (`latitude`/`longitude` null), or
 * `getHouses()` fails (e.g. `location` not yet granted for this install).
 */
async function findNearbyCinemas() {
  let houses;

  try {
    houses = await gladys.getHouses();
  } catch (error) {
    logger.debug('Unable to fetch houses for geolocation', error);

    return null;
  }

  const house = houses?.[0];

  if (!house || house.latitude === null || house.longitude === null) {
    return null;
  }

  return nearbyCinemas(house, NEARBY_CINEMAS_LIMIT);
}

gladys.onAction('search_cinemas', async (fields) => {
  const query = (fields.query || '').trim();

  let results;

  if (query) {
    results = await searchCinemas(query);

    logger.info(`Action search_cinemas <- query="${query}", ${results.length} result(s)`);
  } else {
    results = await findNearbyCinemas();

    if (results) {
      logger.info(`Action search_cinemas <- no query, ${results.length} cinema(s) near the house`);
    } else {
      results = [];

      logger.info('Action search_cinemas <- no query and no located house');
    }
  }

  if (results.length === 0) {
    return {
      en: 'No cinema matches this search. Leave the field empty and set a location on your Gladys house to search nearby cinemas instead.',
      fr: 'Aucun cinéma ne correspond à cette recherche. Laissez le champ vide et renseignez la position de votre maison Gladys pour chercher parmi les cinémas proches.',
    };
  }

  return results.map(formatCinemaLine).join('\n');
});

gladys.onWidgetGet('now_playing', async (options = {}) => {
  // Each widget instance picks one of the configured cinemas through its
  // `cinema` setting (a 1..5 slot); when unset it falls back to the first
  // configured cinema. This lets one dashboard show several cinemas, chosen from
  // the cinemas set up once in the integration config.
  const cinema = resolveWidgetCinema(config, options.settings);

  validateConfig({ cinema_id: cinema.id });

  logger.info(`onWidgetGet(now_playing) <- cinema ${cinema.id}`);

  const movies = await fetchNowPlaying(cinema.id);

  // Resolve trailer links for the films actually shown (one page read each),
  // best-effort — a missing trailer never fails the widget.
  await attachTrailers(movies.slice(0, MAX_GRID_ITEMS));

  return buildNowPlayingContent(movies, { title: cinema.name });
});

gladys.onWidgetGetImage(async (imageKey) => {
  const posterUrl = resolvePosterUrl(imageKey);

  if (!posterUrl) {
    throw new Error(`onWidgetGetImage: unknown image key "${imageKey}"`);
  }

  const response = await fetch(posterUrl);

  if (!response.ok) {
    throw new Error(`onWidgetGetImage: allocine.fr HTTP ${response.status} on ${posterUrl}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());

  // Gladys caps widget images (300 KB): downscale what the site serves above it.
  const fitted = await fitImageForWidget(bytes);

  return fitted.toString('base64');
});

gladys.onConfigUpdated(async (newConfig) => {
  logger.info('onConfigUpdated -> new configuration received');

  config = normalizeConfig(newConfig);

  try {
    validateConfig(config);

    await gladys.setConnectionStatus(true);
    startNewFilmPolling(gladys, () => fetchNowPlaying(config.cinema_id));
  } catch (error) {
    await gladys.setConnectionStatus(false, {
      en: error.message,
      fr: error.message,
    });
  }
});

gladys.on('connected', async () => {
  config = normalizeConfig(await gladys.getConfig());

  try {
    validateConfig(config);

    await gladys.setConnectionStatus(true);
    startNewFilmPolling(gladys, () => fetchNowPlaying(config.cinema_id));
  } catch (error) {
    await gladys.setConnectionStatus(false, {
      en: error.message,
      fr: error.message,
    });
  }
});

gladys.handleShutdown(async () => stopNewFilmPolling());

logger.info('Starting the AlloCiné integration...');

gladys.connect().catch((error) => {
  logger.error('Initial connection to Gladys failed', error);

  process.exit(1);
});

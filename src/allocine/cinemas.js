// -----------------------------------------------------------------------------
// Cinema search backed by allocine.fr's own live search endpoint.
//
// Unlike gladys-ugc/gladys-cgr/gladys-pathe, there is no hand-maintained
// static list here: with ~2000 active cinema establishments nationally
// (chains and independents alike, per the CNC's own public directory), a
// static list would be both huge and quickly stale. allocine.fr already
// runs this exact search for its own "find a theater" box, so this just
// calls the same first-party, unauthenticated endpoint live.
// -----------------------------------------------------------------------------

import { allocineGet } from './client.js';

/**
 * @param {string} [query] - city, postal code or cinema name fragment. There
 *   is no "list everything" here (unlike the sibling integrations): the
 *   endpoint itself requires a non-empty query, so a blank one just returns
 *   no results rather than erroring.
 * @returns {Promise<Array<{id: string, name: string, city: string, postalCode: string}>>}
 */
export async function searchCinemas(query = '') {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const data = await allocineGet(`_/localization_city/${encodeURIComponent(trimmed)}`);
  const theaters = data.values?.theaters ?? [];

  return theaters.map(({ node }) => ({
    id: node.internalId,
    name: node.name,
    city: node.location?.city,
    postalCode: node.location?.zip,
  }));
}

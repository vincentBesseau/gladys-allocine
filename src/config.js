const DEFAULTS = Object.freeze({
  cinema_id: '',
});

export function normalizeConfig(input = {}) {
  return {
    cinema_id: String(input.cinema_id ?? DEFAULTS.cinema_id)
      .trim()
      .toUpperCase(),
  };
}

export function validateConfig(config) {
  if (!config.cinema_id) {
    throw new Error('Run the "Find my cinema" action and set a cinema ID.');
  }

  // AlloCiné theater internalIds are 5-character alphanumeric codes. Most are a
  // letter followed by four digits (e.g. P0905), but not all: some carry
  // letters in other positions too — Vichy is G028P, Lyon's Ciné Théâtre Marcel
  // Pagnol is G0FQ8. A stricter "letter + four digits" check wrongly rejected
  // those, leaving the integration "disconnected" for an ID its own "Find my
  // cinema" action had just returned.
  if (!/^[A-Z0-9]{5}$/.test(config.cinema_id)) {
    throw new Error('Cinema ID must look like P0905 or G028P (see the "Find my cinema" action).');
  }
}

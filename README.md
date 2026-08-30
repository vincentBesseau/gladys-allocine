# gladys-allocine

[![Latest version](https://img.shields.io/github/v/tag/vincentBesseau/gladys-allocine?label=version)](https://github.com/vincentBesseau/gladys-allocine/tags)
[![CI](https://github.com/vincentBesseau/gladys-allocine/actions/workflows/ci.yml/badge.svg)](https://github.com/vincentBesseau/gladys-allocine/actions/workflows/ci.yml)
[![Docker pulls](https://ghcr-badge.elias.eu.org/shield/vincentBesseau/gladys-allocine/gladys-allocine)](https://github.com/vincentBesseau/gladys-allocine/pkgs/container/gladys-allocine)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://www.apache.org/licenses/LICENSE-2.0)
[![Gladys](https://img.shields.io/badge/gladys-%3E%3D4.90.0-6f42c1)](https://gladysassistant.com)

AlloCiné integration for [Gladys Assistant](https://gladysassistant.com):
movies currently playing at **any French cinema — chain or independent** —
shown in the "Upcoming Releases" widget (Gladys core contract B.19, `movies`
external-integration type).

## Why this one covers every cinema

[`gladys-ugc`](https://github.com/vincentBesseau/gladys-ugc),
[`gladys-cgr`](https://github.com/vincentBesseau/gladys-cgr) and
[`gladys-pathe`](https://github.com/vincentBesseau/gladys-pathe) each cover
one chain, because each chain's own site was the cleanest source for that
chain specifically. Independent cinemas don't share a single platform —
each runs its own ticketing software — so no chain-by-chain approach can
reach them.

AlloCiné's own site (`allocine.fr`) already aggregates showtimes for
essentially every cinema in France — roughly 2000 active establishments per
the [CNC's public
directory](https://www.data.gouv.fr/datasets/liste-des-etablissements-cinematographiques-actifs-1),
chains and independents alike — and its own pages call a first-party JSON
endpoint to render them:

- `POST allocine.fr/_/showtimes/theater-<id>/d-<date>/` returns every film
  playing at a cinema on a given day, each already carrying its full detail
  (title, synopsis, poster, release date) **and** its showtimes in the same
  response — no cross-referencing or per-film follow-up call needed, unlike
  `gladys-pathe`.
- `GET allocine.fr/_/localization_city/<query>` is the same live search
  allocine.fr's own "find a theater" box uses.

Both verified live with a plain, cookie-less HTTP client: no authentication,
no session, and — unlike `gladys-pathe` — no User-Agent filter of any kind;
a self-identifying User-Agent works fine. Tested end to end against
**Katorza**, an independent art-house cinema in Nantes, as well as chain
theaters (UGC, Pathé) that also show up in the same search — confirming one
integration really does cover both.

## What it does

- Configure one cinema by its AlloCiné theater ID (e.g. `P0052`).
- `movies.getUpcoming` returns the films playing there today, each with its
  showtimes (`movie.showtimes`, Gladys core B.19).
- A **Find my cinema** action searches allocine.fr live by city, postal
  code, or cinema name. Unlike the sibling integrations, the query is
  **required**: with ~2000 cinemas nationally there is no sensible "list
  everything" default, and the search endpoint itself 404s on an empty
  query.

Version labels (VF/VOST) are a best-effort read of how allocine.fr itself
groups showtimes (`multiple` = dubbed French, the `original*` groups =
original-version, subtitled or not) — the same kind of approximation the
sibling integrations make from their own raw data.

## Development

```bash
npm install
npm test
npm run lint
npm run format:check
```

Conventions: ESM, native `fetch` (no HTTP client dependency), `node --test`
(no test framework dependency) — matching `gladys-ugc`, `gladys-cgr` and
`gladys-pathe`. No static cinema list here (see above): both cinema search
and showtimes are live calls.

### SDK dependency (temporary)

`onMoviesGetUpcoming` was added to the official SDK in
[GladysAssistant/integration-sdk-js#32](https://github.com/GladysAssistant/integration-sdk-js/pull/32),
not yet merged/published. `package.json` points
`@gladysassistant/integration-sdk` at that branch directly:

```json
"@gladysassistant/integration-sdk": "github:vincentBesseau/integration-sdk-js#feature/movies-type"
```

Switch this back to a published `^x.y.z` version once that PR is merged and
released.

## Related integrations

Chain-specific siblings, useful when you always want one specific chain
without typing a search:

- [`gladys-ugc`](https://github.com/vincentBesseau/gladys-ugc) — UGC
- [`gladys-cgr`](https://github.com/vincentBesseau/gladys-cgr) — CGR
- [`gladys-pathe`](https://github.com/vincentBesseau/gladys-pathe) — Pathé

## Publishing checklist

- [ ] `gladys_version` in `gladys-assistant-integration.json` is a
      placeholder (`>=4.90.0`) — set it to the actual Gladys release that
      ships the `movies` integration type (Gladys core PR
      [GladysAssistant/Gladys#3061](https://github.com/GladysAssistant/Gladys/pull/3061))
      once it is released.
- [ ] Swap the SDK dependency to a published version (see above).
- [x] Add a `cover.png` (referenced by `cover_image` in the manifest) — 800x534, under 150 KB.
- [ ] Run **Release** (GitHub Actions) once ready to cut `v0.1.0` and publish
      the image to `ghcr.io/vincentbesseau/gladys-allocine`.

## License

Apache-2.0

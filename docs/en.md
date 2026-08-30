# AlloCiné

Movies currently playing at any French cinema — chain or independent —
shown in Gladys's "Upcoming Releases" widget.

## Important: unofficial integration

This integration reads the same public showtimes data that **allocine.fr
already serves to any visitor** of its site — the same content you would
see by opening your cinema's page in a browser, nothing more. It is not
developed, endorsed, or affiliated with AlloCiné. AlloCiné can change its
site at any time and break this integration without notice.

No paid API, no credential extracted from an app, no bypass of anti-bot
protection is used: only the public endpoints the site already uses for
itself.

## Configuration

1. Open the integration's **Configuration** tab.
2. Run the **Find my cinema** action, typing a city, postal code, or cinema
   name (the field is required: with ~2000 cinemas in France, there's no
   sensible full list to show by default). The result is shown under the
   button as `Cinema name — City (ID: P0052)`.
3. Copy the ID of your cinema into the **Cinema ID** field, then save.

The films playing today at that cinema then appear in the dashboard's
"Upcoming Releases" widget. Clicking a poster opens the film's detail card,
which shows a table of today's showtimes at that cinema (time and version,
VF/VOST).

## Known limitations (v1)

- One cinema at a time per installation of the integration.
- Only today's films and showtimes (no view of tomorrow or later days).
- No trailer (the endpoint used doesn't include one; could be added with an
  extra call in the future).
- Finding a cinema always requires typing something: no full list, and no
  proximity search yet (unlike `gladys-ugc`/`gladys-cgr`/`gladys-pathe`).

## Troubleshooting

The integration logs everything it does: check the integration logs from the
Gladys interface (or `docker logs` on the host) with `LOG_LEVEL=debug` for
full detail.

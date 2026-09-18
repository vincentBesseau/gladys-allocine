# AlloCiné

Movies currently playing at any French cinema — chain or independent — as a
dashboard widget, with a scene trigger for when a new film joins the
program.

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
2. Run the **Find my cinema** action: leave the field empty to list the 10
   cinemas nearest your Gladys house (limited to the house's own department
   — see "Known limitations" below), or type a city, postal code, or cinema
   name to search nationally. The result is shown under the button as
   `Cinema name — City (12.3 km) (ID: P0052)` (the distance only appears
   for a proximity search).
3. Copy the ID of your cinema into the **Cinema ID** field, then save.

Add the integration's **now_playing** widget to a Gladys dashboard to see the
films playing today at that cinema: poster, a booking link and today's
showtimes (time and version, VF/VOST).

## Scene trigger

The integration also declares a **new_film** scene trigger: create a scene
with this trigger to react when a film not seen before appears in the
program (send a message, for example). The trigger exposes the film's
title, release date, today's showtimes and booking link as scene variables.
The integration checks for new films twice a day.

## Known limitations (v1)

- One cinema at a time per installation of the integration.
- Only today's films and showtimes (no view of tomorrow or later days).
- No trailer (the endpoint used doesn't include one; could be added with an
  extra call in the future).
- The proximity search is limited to the Gladys house's own department: a
  cinema just across the department border may not show up. Type its city
  directly in that case.

## Troubleshooting

The integration logs everything it does: check the integration logs from the
Gladys interface (or `docker logs` on the host) with `LOG_LEVEL=debug` for
full detail.

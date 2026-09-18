import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNowPlayingContent,
  resolvePosterUrl,
  imageKeyOf,
  joinShowtimes,
} from '../src/allocine/widget.js';

test('buildNowPlayingContent returns an empty component list for an empty program', () => {
  const content = buildNowPlayingContent([]);

  assert.deepEqual(content, { version: 1, ttl_seconds: 900, components: [] });
});

test('buildNowPlayingContent renders a card-list item with showtimes and a book link (AlloCiné never sets trailerUrl)', () => {
  const movie = {
    id: '327993',
    title: "L'Inconnue",
    releaseDate: '2026-08-27',
    overview: 'Une femme sans passé refait sa vie.',
    posterUrl: 'https://fr.web.img6.acsta.net/pictures/inconnue-affiche.jpg',
    sourceUrl: 'https://www.allocine.fr/film/fichefilm_gen_cfilm=327993.html',
    showtimes: [
      { time: '14:00', version: 'VF' },
      { time: '19:30', version: 'VOSTF' },
    ],
  };

  const content = buildNowPlayingContent([movie]);

  assert.equal(content.version, 1);
  assert.equal(content.components.length, 1);

  const [cardList] = content.components;
  assert.equal(cardList.type, 'card-list');
  assert.equal(cardList.display, 'grid');
  assert.equal(cardList.items.length, 1);

  const [item] = cardList.items;
  assert.equal(item.title, "L'Inconnue");
  assert.equal(item.subtitle, '14:00 VF, 19:30 VOSTF');
  assert.equal(item.description, 'Une femme sans passé refait sa vie.');
  assert.equal(item.image, 'poster-327993');
  assert.deepEqual(item.links, [{ url: movie.sourceUrl, label: { en: 'Book', fr: 'Réserver' } }]);
});

test('buildNowPlayingContent omits description and image when the movie has neither', () => {
  const movie = {
    id: '1',
    title: 'A',
    releaseDate: '2026-01-01',
    sourceUrl: 'https://www.allocine.fr/film/fichefilm_gen_cfilm=1.html',
  };

  const [{ items }] = buildNowPlayingContent([movie]).components;

  assert.equal(items[0].description, undefined);
  assert.equal(items[0].image, undefined);
});

test('buildNowPlayingContent caps items at 12, the grid content-budget bound', () => {
  const movies = Array.from({ length: 15 }).map((value, index) => ({
    id: String(index),
    title: `Movie ${index}`,
    releaseDate: '2026-01-01',
    sourceUrl: `https://www.allocine.fr/film/fichefilm_gen_cfilm=${index}.html`,
  }));

  const [{ items }] = buildNowPlayingContent(movies).components;

  assert.equal(items.length, 12);
});

test('resolvePosterUrl returns the poster URL published for a previously-built item, and undefined for an unknown key', () => {
  const movie = {
    id: '999',
    title: 'A',
    releaseDate: '2026-01-01',
    posterUrl: 'https://fr.web.img6.acsta.net/pictures/poster-999.jpg',
    sourceUrl: 'https://www.allocine.fr/film/fichefilm_gen_cfilm=999.html',
  };

  buildNowPlayingContent([movie]);

  assert.equal(
    resolvePosterUrl(imageKeyOf('999')),
    'https://fr.web.img6.acsta.net/pictures/poster-999.jpg',
  );
  assert.equal(resolvePosterUrl('poster-unknown'), undefined);
});

test('imageKeyOf builds a stable, id-derived key', () => {
  assert.equal(imageKeyOf('327993'), 'poster-327993');
});

test('joinShowtimes flattens showtimes, keeping a bare time when there is no version', () => {
  assert.equal(joinShowtimes(undefined), undefined);
  assert.equal(joinShowtimes([]), undefined);
  assert.equal(joinShowtimes([{ time: '20:15' }]), '20:15');
  assert.equal(
    joinShowtimes([{ time: '14:00', version: 'VF' }, { time: '20:15' }]),
    '14:00 VF, 20:15',
  );
});

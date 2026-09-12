import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, demo, clone, synthetic, response, memoryStorage } from './fixtures.mjs';
import { validateCatalog, validateFeed, parseJSON, createStore, validProfile, validStatuses, validVisit, loadFeed, fetchJSON } from '../assets/data.js';
const fixedNow = Date.parse('2026-09-12T22:05:00Z');

test('Mitgelieferter Katalog und alle 14 DEMO-Fälle validieren', () => {
  assert.equal(validateCatalog(catalog).products.length, 109); assert.equal(validateFeed(demo).items.length, 14);
});
test('Beschädigtes JSON, unbekanntes Schema und Grenzen werden abgelehnt', () => {
  assert.throws(() => parseJSON('{broken')); assert.throws(() => parseJSON(' '.repeat(100), 20));
  for (const change of [f => f.schema_version = 9, f => f.items.push(f.items[0]), f => f.items[0].title = 'x'.repeat(501), f => f.items[0].revision = '1', f => f.items[0].updated_at = 'invalid', f => f.items[0].product_ids = 'Edge', f => f.items[0].summary_source_id = 'missing', f => f.items[0].canonical_url = 'javascript:alert(1)']) {
    const feed = clone(demo); change(feed); assert.throws(() => validateFeed(feed));
  }
});
test('Bewusst leerer gültiger Feed ist Erfolg, fehlende items sind Fehler', async () => {
  const empty = clone(demo); empty.items = []; assert.equal(validateFeed(empty).items.length, 0);
  const result = await loadFeed({ fetchImpl: async () => response(empty), now: fixedNow });
  assert.equal(result.transport, 'lokal'); assert.equal(result.feed.items.length, 0);
  delete empty.items; assert.throws(() => validateFeed(empty));
});
test('Quellenbezug, falsche Scores, Known-Issue-CVSS und Multi-CVE-Fakten prüfen', () => {
  for (const change of [f => f.items[1].cvss[0].score = 11, f => f.items[1].cvss[0].version = '9.9', f => f.items[1].cvss[0].source_id = 'missing', f => f.items[1].type = 'known_issue', f => f.items[1].versions[0].product_id = 'not-associated', f => f.items[1].sources[0].url = 'data:text/html,evil']) {
    const feed = clone(demo); change(feed); assert.throws(() => validateFeed(feed));
  }
  const feed = clone(demo); feed.data_mode = 'live'; feed.items = [synthetic(1, ['CVE-9999-0001', 'CVE-9999-0002'])];
  assert.ok(validateFeed(feed)); feed.items[0].cvss[0].cve_id = null; assert.throws(() => validateFeed(feed));
});
test('DEMO erlaubt keine erfundenen öffentlichen CVEs oder unmarkierten IDs', () => {
  const feed = clone(demo); feed.items[0].cve_ids = ['CVE-9999-0001']; assert.throws(() => validateFeed(feed));
  feed.items[0].cve_ids = []; feed.items[0].id = 'REAL-LOOKING'; assert.throws(() => validateFeed(feed));
});
test('Lokaler Datenmodus wird unabhängig vom Transport geführt', async () => {
  const result = await loadFeed({ fetchImpl: async () => response(demo), now: fixedNow });
  assert.equal(result.transport, 'lokal'); assert.equal(result.feed.data_mode, 'demo'); assert.equal(result.stale, false);
});
test('Livefeed -> validierter Cache -> lokaler DEMO-Fallback', async () => {
  const backend = memoryStorage(), store = createStore({ storage: backend });
  const url = 'https://example.invalid/feed.json';
  const live = clone(demo); live.data_mode = 'live';
  const loaded = await loadFeed({ externalFeedURL: url, store, fetchImpl: async () => response(live), now: fixedNow });
  assert.equal(loaded.transport, 'live');
  const cached = await loadFeed({ externalFeedURL: url, store, fetchImpl: async () => { throw new Error('offline'); }, now: fixedNow });
  assert.equal(cached.transport, 'cache'); assert.equal(cached.feed.data_mode, 'live');
  const fallback = await loadFeed({ externalFeedURL: url + '?other', store, fetchImpl: async u => { if (u.startsWith('https:')) throw new Error('offline'); return response(demo); }, now: fixedNow });
  assert.equal(fallback.transport, 'fallback'); assert.equal(fallback.feed.data_mode, 'demo');
});
test('Ungültige HTTP-200-Antwort überschreibt keinen guten Cache', async () => {
  const backend = memoryStorage(), store = createStore({ storage: backend }), url = 'https://example.invalid/feed.json';
  await loadFeed({ externalFeedURL: url, store, fetchImpl: async () => response(demo), now: fixedNow });
  const before = backend.entries.get('swissploit.hub.feed-cache');
  const cached = await loadFeed({ externalFeedURL: url, store, fetchImpl: async () => response({}), now: fixedNow });
  assert.equal(cached.transport, 'cache'); assert.equal(backend.entries.get('swissploit.hub.feed-cache'), before);
});
test('Bewusst leerer externer Feed darf den Cache aktualisieren', async () => {
  const backend = memoryStorage(), store = createStore({ storage: backend }), url = 'https://example.invalid/feed.json';
  const empty = clone(demo); empty.items = [];
  const loaded = await loadFeed({ externalFeedURL: url, store, fetchImpl: async () => response(empty), now: fixedNow });
  assert.equal(loaded.transport, 'live'); assert.equal(loaded.feed.items.length, 0);
  const cached = await loadFeed({ externalFeedURL: url, store, fetchImpl: async () => { throw new Error('offline'); }, now: fixedNow });
  assert.equal(cached.feed.items.length, 0);
});
test('Cache wird erneut validiert; beschädigter Cache fällt auf JSON zurück', async () => {
  const backend = memoryStorage(); backend.setItem('swissploit.hub.feed-cache', '{bad');
  const loaded = await loadFeed({ externalFeedURL: 'https://example.invalid/feed.json', store: createStore({ storage: backend }), fetchImpl: async url => { if (url.startsWith('https:')) throw new Error(); return response(demo); }, now: fixedNow });
  assert.equal(loaded.transport, 'fallback');
});
test('Keine Daten bleiben ein sichtbarer Fehler, niemals ein leerer Erfolg', async () => {
  const loaded = await loadFeed({ fetchImpl: async () => { throw new Error('not found'); } });
  assert.equal(loaded.feed, null); assert.equal(loaded.transport, 'error'); assert.ok(loaded.warnings.length);
});
test('Unsichere externe URL wird niemals angefragt', async () => {
  const called = []; const result = await loadFeed({ externalFeedURL: 'http://example.invalid/feed', fetchImpl: async url => { called.push(url); return response(demo); }, now: fixedNow });
  assert.equal(result.transport, 'fallback'); assert.equal(called.some(url => url.startsWith('http:')), false);
});
test('HTTP, Content-Type, Antwortgrösse und Timeout validieren', async () => {
  await assert.rejects(fetchJSON('local', { fetchImpl: async () => new Response('{}', { status: 503 }) }));
  await assert.rejects(fetchJSON('local', { fetchImpl: async () => new Response('<html>200 OK</html>', { headers: { 'Content-Type': 'text/html' } }) }));
  await assert.rejects(fetchJSON('local', { limit: 20, fetchImpl: async () => response('x'.repeat(21)) }));
  await assert.rejects(fetchJSON('local', { timeoutMs: 20, fetchImpl: () => new Promise(() => {}) }), /Zeitlimit/);
});
test('Fester Datenstand, konfigurierbare Staleness', async () => {
  const loaded = await loadFeed({ fetchImpl: async () => response(demo), now: fixedNow + 48 * 3600000 });
  assert.equal(loaded.stale, true); assert.equal(loaded.feed.generated_at, demo.generated_at);
});
test('Gesperrter/quota-begrenzter Speicher nutzt In-Memory-Fallback', () => {
  for (const backend of [{ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }, { getItem() { return null; }, setItem() { throw new Error('quota'); } }]) {
    const warnings = [], store = createStore({ storage: backend, onWarning: text => warnings.push(text) });
    assert.deepEqual(store.get('profile', [], validProfile), []);
    store.set('profile', ['microsoft.edge'], validProfile);
    assert.deepEqual(store.get('profile', [], validProfile), ['microsoft.edge']); assert.ok(warnings.length);
  }
});
test('Korruption, Speicher-Schema und Grössenbegrenzung', () => {
  const backend = memoryStorage(), warnings = [], store = createStore({ storage: backend, onWarning: text => warnings.push(text) });
  backend.setItem('swissploit.hub.profile', '{broken'); assert.deepEqual(store.get('profile', [], validProfile), []);
  backend.setItem('swissploit.hub.visit', JSON.stringify({ schema_version: 9, value: '2026-09-12T10:00:00Z' }));
  assert.equal(store.get('visit', null, validVisit), null);
  assert.equal(store.set('profile', ['a'.repeat(200)], validProfile), false);
  assert.equal(store.set('profile', ['microsoft.edge'], validProfile, 8), false); assert.ok(warnings.length >= 4);
  assert.equal(validStatuses({ bad: { status: 'safe', revision: '1', updated_at: '2026-09-12T10:00:00Z' } }), false);
});

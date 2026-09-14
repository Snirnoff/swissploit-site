import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  configuredDataBaseURL, validateManifest, validateProductFeed, mergeProductFeeds,
  createSecurityDataClient, loadSelectedFeeds,
} from '../assets/contract.js';

const root = new URL('../../../swissploit-security-data/docs/', import.meta.url);
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const manifest = validateManifest(await json('manifest.json'));
const product = id => manifest.available_products.find(entry => entry.product_id === id);
const feed = async (id, kind) => validateProductFeed(await json(product(id).paths[kind]), { expectedProductId: id, expectedKind: kind });

test('Reales Manifest-Schema, Frische und Produktpfade werden validiert', () => {
  assert.equal(manifest.schema_version, 2);
  assert.equal(manifest.generated_at, '2026-09-14T18:54:15.697Z');
  assert.equal(manifest.feed_status, 'degraded');
  assert.equal(manifest.available_products.length, 29);
});

test('Windows 11, Edge und FortiOS Briefs entsprechen dem realen Vertrag', async () => {
  for (const id of ['microsoft.windows-11', 'microsoft.edge', 'fortinet.fortios']) {
    const value = await feed(id, 'brief');
    assert.equal(value.product_id, id);
    assert.ok(value.items.length <= 25);
    assert.equal(value.brief_item_count, value.items.length);
  }
});

test('Kanonische Deduplizierung bewahrt beide Windows-Kontexte und getrennte Fixes', async () => {
  const merged = mergeProductFeeds(await Promise.all([
    feed('microsoft.windows-11', 'current'),
    feed('microsoft.windows-server', 'current'),
  ]));
  const issue = merged.filter(item => item.id === 'cve:CVE-2026-81963');
  assert.equal(issue.length, 1);
  assert.deepEqual(issue[0].selected_product_ids.sort(), ['microsoft.windows-11', 'microsoft.windows-server']);
  assert.equal(issue[0].collector_priority.label, 'P1');
  assert.ok(issue[0].kev_evidence.length);
  const fixes = new Map(issue[0].versions.map(row => [row.product_id, row.fixed]));
  assert.match(fixes.get('microsoft.windows-11'), /10\.0\.26200\.9445/);
  assert.equal(fixes.get('microsoft.windows-server'), '10.0.26100.33438');
});

test('Edge behält Edge-Kontext; FortiOS-Advisory funktioniert ohne CVE', async () => {
  const edge = mergeProductFeeds([await feed('microsoft.edge', 'brief')]);
  assert.ok(edge.length);
  assert.ok(edge.every(item => item.selected_product_ids.includes('microsoft.edge')));
  const forti = mergeProductFeeds([await feed('fortinet.fortios', 'brief')]);
  const advisory = forti.find(item => item.cve_ids.length === 0);
  assert.ok(advisory);
  assert.match(advisory.id, /^adv:fortinet-psirt:/);
});

test('Client lädt nur ausgewählte Briefs, isoliert Fehler und cached Current pro Sitzung', async () => {
  const windows = product('microsoft.windows-11');
  const briefData = await json(windows.paths.brief), currentData = await json(windows.paths.current);
  const requests = [];
  const client = createSecurityDataClient({
    baseURL: 'https://data.example/',
    fetchImpl: async url => {
      requests.push(url);
      if (url.endsWith('manifest.json')) return new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/json' } });
      if (url.endsWith(windows.paths.brief)) return new Response(JSON.stringify(briefData), { headers: { 'Content-Type': 'application/json' } });
      if (url.endsWith(windows.paths.current)) return new Response(JSON.stringify(currentData), { headers: { 'Content-Type': 'application/json' } });
      throw new Error('unavailable');
    },
  });
  const loadedManifest = await client.loadManifest();
  const initial = await loadSelectedFeeds(client, loadedManifest, ['microsoft.windows-11'], 'brief');
  assert.equal(initial.feeds.length, 1);
  assert.equal(requests.some(url => url.endsWith('current.json') || url.endsWith('known-exploited.json')), false);
  await client.loadProduct(windows, 'current');
  await client.loadProduct(windows, 'current');
  assert.equal(requests.filter(url => url.endsWith(windows.paths.current)).length, 1);
  const partial = await loadSelectedFeeds(client, loadedManifest, ['microsoft.windows-11', 'microsoft.edge'], 'brief');
  assert.equal(partial.feeds.length, 1);
  assert.equal(partial.failures[0].product_id, 'microsoft.edge');
});

test('Historische Meldungen sind nur im Known-Exploited-Feed zulässig', async () => {
  const known = await feed('fortinet.fortios', 'known_exploited');
  assert.ok(known.items.some(item => item.lifecycle === 'HISTORICAL'));
  const invalid = structuredClone(known);
  invalid.feed_kind = 'current';
  assert.throws(() => validateProductFeed(invalid, { expectedProductId: invalid.product_id, expectedKind: 'current' }), /Historische/);
});

test('Windows 11 + Edge + FortiOS Brief-Stack merged ohne doppelte IDs', async () => {
  const merged = mergeProductFeeds(await Promise.all([
    feed('microsoft.windows-11', 'brief'), feed('microsoft.edge', 'brief'), feed('fortinet.fortios', 'brief'),
  ]));
  assert.equal(new Set(merged.map(item => item.id)).size, merged.length);
  assert.ok(merged.some(item => item.selected_product_ids.includes('microsoft.edge')));
  assert.ok(merged.some(item => item.selected_product_ids.includes('fortinet.fortios')));
});
test('Datenbasis ist über genau einen statischen Meta-Wert konfigurierbar', () => {
  const documentRef = { querySelector: () => ({ content: 'https://static.example/security/' }) };
  assert.equal(configuredDataBaseURL({ documentRef, moduleURL: 'https://site.example/assets/contract.js' }), 'https://static.example/security/');
});

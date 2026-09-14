import { CONFIG, fetchJSON } from './data.js';
import { safeURL } from './logic.js';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const array = (value, max = 10000) => Array.isArray(value) && value.length <= max;
const text = (value, max = 5000) => typeof value === 'string' && value.length > 0 && value.length <= max;
const timestamp = value => text(value, 40) && Number.isFinite(Date.parse(value));
const productId = value => text(value, 180) && /^[a-z0-9][a-z0-9.-]*$/.test(value);
const issueId = value => text(value, 180) && /^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(value);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const unique = values => [...new Set(values)];
const feedKinds = ['brief', 'current', 'known_exploited'];
const lifecycle = ['NEW', 'CHANGED', 'CURRENT', 'HISTORICAL'];

export function configuredDataBaseURL({ documentRef = globalThis.document, moduleURL = import.meta.url } = {}) {
  const configured = documentRef?.querySelector('meta[name="swissploit-security-data-base"]')?.content?.trim() || '/security-data/';
  return new URL(configured.endsWith('/') ? configured : `${configured}/`, moduleURL).href;
}

export function validateManifest(manifest) {
  assert(object(manifest) && manifest.schema_version === 2, 'Unbekanntes Manifest-Schema.');
  assert(timestamp(manifest.generated_at) && text(manifest.collector_version, 80), 'Ungültige Manifest-Metadaten.');
  assert(['ok', 'degraded'].includes(manifest.feed_status), 'Ungültiger Feedstatus.');
  assert(object(manifest.source_health_summary) && Number.isSafeInteger(manifest.source_health_summary.success_count)
    && Number.isSafeInteger(manifest.source_health_summary.failure_count), 'Ungültige Quellenübersicht.');
  assert(array(manifest.available_products, 2000), 'Ungültige Produktliste.');
  const seen = new Set();
  for (const product of manifest.available_products) {
    assert(object(product) && productId(product.product_id) && !seen.has(product.product_id), 'Ungültige oder doppelte Produkt-ID.');
    seen.add(product.product_id);
    for (const field of ['knowledge_count', 'current_count', 'brief_count', 'known_exploited_count', 'historical_count'])
      assert(Number.isSafeInteger(product[field]) && product[field] >= 0, `Ungültiger Produktzähler: ${field}.`);
    assert(object(product.paths) && feedKinds.every(kind => text(product.paths[kind], 300)
      && !product.paths[kind].startsWith('/') && !product.paths[kind].includes('..')), 'Ungültiger Produktpfad.');
  }
  return manifest;
}

function validateIssue(item, kind) {
  assert(object(item) && issueId(item.id) && text(item.title, 1000), 'Ungültige Meldung.');
  assert((item.vulnerability_published_at === null || timestamp(item.vulnerability_published_at)) && timestamp(item.activity_at), 'Ungültige Meldungszeit.');
  assert(lifecycle.includes(item.lifecycle), 'Ungültiger Lebenszyklus.');
  assert(kind === 'known_exploited' || item.lifecycle !== 'HISTORICAL', 'Historische Meldung im aktuellen Feed.');
  assert(array(item.product_ids, 200) && item.product_ids.every(productId), 'Ungültiger Produktbezug.');
  assert(array(item.cve_ids, 100) && item.cve_ids.every(value => /^CVE-\d{4}-\d{4,19}$/.test(value)), 'Ungültige CVE-ID.');
  assert(object(item.priority) && /^P[1-4]$/.test(item.priority.label)
    && Number.isFinite(item.priority.score) && array(item.priority.reasons, 100), 'Ungültige Collector-Priorität.');
  assert(item.cvss === null || (object(item.cvss) && Number.isFinite(item.cvss.score)), 'Ungültige CVSS-Angabe.');
  assert(item.kev === null || (object(item.kev) && typeof item.kev.listed === 'boolean'), 'Ungültige KEV-Angabe.');
  assert(item.exploitation === null || (object(item.exploitation) && typeof item.exploitation.confirmed === 'boolean'), 'Ungültige Ausnutzungsangabe.');
  assert(array(item.affected_versions, 500) && array(item.fixed_versions, 500), 'Ungültige Versionsangaben.');
  assert(item.fixed_versions.every(row => object(row) && productId(row.product_id) && array(row.versions, 500)), 'Ungültige behobene Version.');
  assert(array(item.sources, 200) && item.sources.length && item.sources.every(source => object(source)
    && text(source.source, 160) && safeURL(source.url)), 'Ungültige Quellenangabe.');
}

export function validateProductFeed(feed, { expectedProductId, expectedKind } = {}) {
  assert(object(feed) && feed.schema_version === 2 && timestamp(feed.generated_at), 'Unbekanntes Produktfeed-Schema.');
  assert(productId(feed.product_id) && feedKinds.includes(feed.feed_kind), 'Ungültige Produktfeed-Metadaten.');
  assert(!expectedProductId || feed.product_id === expectedProductId, 'Produktfeed gehört zu einem anderen Produkt.');
  assert(!expectedKind || feed.feed_kind === expectedKind, 'Unerwartete Produktfeed-Art.');
  assert(array(feed.items, 10000) && feed.items.length === feed.issue_count, 'Ungültige Meldungsanzahl.');
  assert(new Set(feed.items.map(item => item?.id)).size === feed.items.length, 'Doppelte kanonische ID im Produktfeed.');
  feed.items.forEach(item => validateIssue(item, feed.feed_kind));
  if (feed.feed_kind === 'brief') assert(Number.isSafeInteger(feed.total_current_count) && Number.isSafeInteger(feed.brief_item_count)
    && feed.brief_item_count === feed.items.length && typeof feed.has_more === 'boolean', 'Ungültige Brief-Metadaten.');
  return feed;
}

const sourceType = value => value === 'vendor' ? 'vendor' : value === 'government_registry' ? 'cisa' : 'cve';
const sourceKey = source => `${source.source}:${source.advisory_id || ''}:${source.url}`;
const sourceId = (source, index) => `contract-source-${index}-${source.source}`.replace(/[^a-zA-Z0-9._:/-]/g, '-');
const PRIORITY_REASON_LABELS = { CISA_KEV: 'In CISA KEV gelistet', CONFIRMED_EXPLOITATION: 'Aktive Ausnutzung bestätigt',
  CVSS_AVAILABLE: 'CVSS-Bewertung verfügbar', CVSS_CRITICAL: 'Kritische CVSS-Bewertung', CVSS_HIGH: 'Hohe CVSS-Bewertung',
  CVSS_UNKNOWN: 'CVSS-Bewertung unbekannt', EPSS_HIGH_PROBABILITY: 'Hohe EPSS-Wahrscheinlichkeit', EPSS_TOP_PERCENTILE: 'Hohes EPSS-Perzentil',
  RECENT_PUBLICATION: 'Kürzlich veröffentlicht' };
export const ACTIVITY_LABELS = {
  NEW_VULNERABILITY: 'Neue Schwachstelle', NEW_VENDOR_ADVISORY: 'Neues Hersteller-Advisory', NEW_KEV: 'Neu als aktiv ausgenutzt gelistet',
  EXPLOITATION_CONFIRMED: 'Aktive Ausnutzung bestätigt', NEW_FIX: 'Neuer Hersteller-Fix', AFFECTED_VERSION_CHANGE: 'Betroffene Versionen geändert',
  FIXED_VERSION_CHANGE: 'Behobene Versionen geändert', MEANINGFUL_CVSS_CHANGE: 'Relevante CVSS-Änderung', MEANINGFUL_VENDOR_UPDATE: 'Relevantes Hersteller-Update',
};

function adaptIssue(item, selectedProductId) {
  const sources = item.sources.map((source, index) => ({ id: sourceId(source, index), key: sourceKey(source), label: source.source,
    type: sourceType(source.source_type), url: source.url, evidence: ['identity', 'products', 'summary', 'action', 'cvss', 'exploit', 'kev', 'versions'] }));
  const findSource = name => sources.find(source => source.label === name)?.id || sources[0].id;
  const cvss = item.cvss ? [{ score: item.cvss.score, version: item.cvss.version || item.cvss.reported_version || 'unbekannt',
    vector: item.cvss.vector, source_id: findSource(item.cvss.source), cve_id: item.cve_ids.length === 1 ? item.cve_ids[0] : null }] : [];
  const versions = item.fixed_versions.map(row => ({ product_id: row.product_id, affected: null,
    fixed: row.versions.length ? row.versions.join(', ') : null, source_id: findSource(row.source) }));
  return {
    id: item.id, alias_ids: [item.id, ...item.cve_ids], records: [], type: 'vulnerability', title: item.title,
    revision: 1, revision_key: `${item.lifecycle}:${item.activity_at}:${item.activity_reason}`,
    published_at: item.vulnerability_published_at || item.activity_at, updated_at: item.activity_at, activity_reason: item.activity_reason,
    activity_label: ACTIVITY_LABELS[item.activity_reason] || null, lifecycle: item.lifecycle,
    product_ids: [...item.product_ids], selected_product_ids: [selectedProductId], unresolved_products: [], cve_ids: [...item.cve_ids],
    sources, canonical_url: sources[0].url, advisory: item.cve_ids.length ? null : { id: item.sources[0].advisory_id || item.id, verified: true }, summary: item.summary, summary_source_id: sources[0].id,
    recommended_action: item.recommendation, action_source_id: sources[0].id, cvss,
    exploit_evidence: item.exploitation?.confirmed ? [{ status: 'confirmed', source_id: findSource(item.exploitation.sources?.[0]), cve_id: item.cve_ids.length === 1 ? item.cve_ids[0] : null }] : [],
    kev_evidence: item.kev?.listed ? [{ status: 'listed', source_id: findSource(item.kev.sources?.[0]), cve_id: item.cve_ids.length === 1 ? item.cve_ids[0] : null }] : [],
    versions, patch_available: item.patch_available, collector_priority: { ...structuredClone(item.priority), reasons: item.priority.reasons.map(reason => PRIORITY_REASON_LABELS[reason] || 'Aufgrund gelieferter Priorität') }, raw_records: [{ product_id: selectedProductId, item }],
  };
}

export function mergeProductFeeds(feeds) {
  const merged = new Map();
  for (const feed of feeds) for (const raw of feed.items) {
    const next = adaptIssue(raw, feed.product_id), known = merged.get(raw.id);
    if (!known) { merged.set(raw.id, next); continue; }
    known.selected_product_ids = unique([...known.selected_product_ids, feed.product_id]);
    known.product_ids = unique([...known.product_ids, ...next.product_ids]);
    known.alias_ids = unique([...known.alias_ids, ...next.alias_ids]);
    known.sources = [...new Map([...known.sources, ...next.sources].map(source => [source.key, source])).values()];
    known.cvss = [...new Map([...known.cvss, ...next.cvss].map(row => [JSON.stringify(row), row])).values()];
    known.exploit_evidence = [...new Map([...known.exploit_evidence, ...next.exploit_evidence].map(row => [JSON.stringify(row), row])).values()];
    known.kev_evidence = [...new Map([...known.kev_evidence, ...next.kev_evidence].map(row => [JSON.stringify(row), row])).values()];
    known.versions = [...new Map([...known.versions, ...next.versions].map(row => [`${row.product_id}:${row.fixed}:${row.source_id}`, row])).values()];
    known.raw_records.push(...next.raw_records);
    if (next.collector_priority.score > known.collector_priority.score) known.collector_priority = next.collector_priority;
    if (Date.parse(next.updated_at) > Date.parse(known.updated_at)) {
      known.updated_at = next.updated_at; known.lifecycle = next.lifecycle; known.activity_reason = next.activity_reason; known.activity_label = next.activity_label;
    }
    known.revision_key = known.raw_records.map(row => `${row.product_id}:${row.item.lifecycle}:${row.item.activity_at}:${row.item.activity_reason}`).sort().join('|');
  }
  return [...merged.values()];
}

export function createSecurityDataClient({ baseURL = configuredDataBaseURL(), fetchImpl = globalThis.fetch, timeoutMs = CONFIG.timeoutMs } = {}) {
  const cache = new Map(), url = path => new URL(path, baseURL).href;
  const load = async (key, path, validator, limit) => {
    if (!cache.has(key)) cache.set(key, fetchJSON(url(path), { fetchImpl, timeoutMs, limit }).then(validator).catch(error => { cache.delete(key); throw error; }));
    return cache.get(key);
  };
  return {
    baseURL,
    loadManifest: () => load('manifest', 'manifest.json', validateManifest, 500_000),
    loadSourceHealth: () => load('source-health', 'source-health.json', value => value, 500_000),
    loadProduct(product, kind) {
      assert(feedKinds.includes(kind), 'Unbekannte Produktfeed-Art.');
      return load(`${kind}:${product.product_id}`, product.paths[kind],
        value => validateProductFeed(value, { expectedProductId: product.product_id, expectedKind: kind }), 2_000_000);
    },
  };
}

export async function loadSelectedFeeds(client, manifest, selectedIds, kind) {
  const products = new Map(manifest.available_products.map(product => [product.product_id, product]));
  const requested = unique(selectedIds).map(id => products.get(id)).filter(Boolean);
  const settled = await Promise.allSettled(requested.map(product => client.loadProduct(product, kind)));
  return { feeds: settled.filter(result => result.status === 'fulfilled').map(result => result.value),
    failures: settled.flatMap((result, index) => result.status === 'rejected' ? [{ product_id: requested[index].product_id, error: result.reason }] : []) };
}

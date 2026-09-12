import { safeURL, normalizeCVE, canonicalURL } from './logic.js';

export const CONFIG = Object.freeze({
  externalFeedURL: '', // Disabled. Only a reviewed HTTPS JSON feed belongs here.
  catalogURL: new URL('../data/product-catalog.json', import.meta.url).href,
  localFeedURL: new URL('../data/fallback-feed.json', import.meta.url).href,
  linkBase: '', // Empty uses the actual preview origin/path, never an assumed production URL.
  timeoutMs: 6000, staleAfterMs: 24 * 60 * 60 * 1000,
});
export const MAX_FEED_BYTES = 2_000_000;
const PREFIX = 'swissploit.hub.';
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const str = (value, max = 500, min = 1) => typeof value === 'string' && value.length >= min && value.length <= max;
const id = value => str(value, 180) && /^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(value);
const date = value => str(value, 30) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
const array = (value, max) => Array.isArray(value) && value.length <= max;
const distinct = values => new Set(values).size === values.length;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const TYPES = ['vendor', 'cve', 'cisa', 'news'];
const FIELDS = ['identity', 'products', 'summary', 'action', 'cvss', 'exploit', 'kev', 'versions'];
const bytes = value => new TextEncoder().encode(value).length;

export function parseJSON(text, limit = MAX_FEED_BYTES) {
  assert(typeof text === 'string' && bytes(text) <= limit, 'JSON fehlt oder überschreitet die Grössenbegrenzung.');
  try { return JSON.parse(text); } catch { throw new Error('Die Daten enthalten kein gültiges JSON.'); }
}
export function validateCatalog(catalog) {
  assert(object(catalog) && catalog.schema_version === 1, 'Unbekanntes Katalogschema.');
  assert(array(catalog.vendors, 200) && catalog.vendors.length && array(catalog.products, 2000), 'Ungültiger Produktkatalog.');
  assert(catalog.vendors.every(v => object(v) && id(v.vendor_id) && str(v.label, 120)), 'Ungültiger Hersteller.');
  assert(distinct(catalog.vendors.map(v => v.vendor_id)), 'Doppelte Hersteller-ID.');
  const vendors = new Set(catalog.vendors.map(v => v.vendor_id));
  assert(catalog.products.every(p => object(p) && id(p.product_id) && vendors.has(p.vendor_id)
    && str(p.label, 120) && str(p.category, 60) && array(p.aliases, 30) && p.aliases.every(a => str(a, 120))), 'Ungültiges Produkt.');
  assert(distinct(catalog.products.map(p => p.product_id)), 'Doppelte Produkt-ID.');
  return catalog;
}
export function validateRegistry(registry) {
  assert(object(registry) && registry.schema_version === 1 && array(registry.sources, 300), 'Ungültige Quellenregistry.');
  assert(registry.sources.every(s => object(s) && id(s.id) && str(s.label, 120) && TYPES.includes(s.type)
    && ['inactive', 'demo', 'active'].includes(s.status) && (s.url === null || safeURL(s.url))
    && array(s.vendor_ids, 200) && s.vendor_ids.every(id)), 'Ungültige Quellenbeschreibung.');
  assert(distinct(registry.sources.map(s => s.id)), 'Doppelte Registry-ID.');
  return registry;
}
export function validateFeed(feed) {
  assert(object(feed) && feed.schema_version === 1, 'Unbekanntes Feedschema.');
  assert(['demo', 'live'].includes(feed.data_mode) && date(feed.generated_at)
    && (feed.last_success_at === null || date(feed.last_success_at)), 'Ungültige Feed-Metadaten.');
  assert(feed.last_success_at === null || Date.parse(feed.last_success_at) <= Date.parse(feed.generated_at), 'Letzter Erfolg liegt nach dem Datenstand.');
  validateRegistry(feed);
  assert(array(feed.items, 5000) && distinct(feed.items.map(i => i?.id)), 'Ungültige Meldungsliste oder doppelte IDs.');
  const registryIds = new Set(feed.sources.map(s => s.id));
  const globalSources = new Map();
  for (const item of feed.items) {
    assert(object(item) && id(item.id) && ['vulnerability', 'known_issue', 'security_news'].includes(item.type)
      && str(item.title, 500) && Number.isSafeInteger(item.revision) && item.revision >= 1, 'Ungültige Meldung/Revision.');
    assert(feed.data_mode !== 'demo' || item.id.startsWith('DEMO-'), 'DEMO-Meldungen müssen DEMO-IDs tragen.');
    assert(date(item.published_at) && date(item.updated_at) && Date.parse(item.updated_at) >= Date.parse(item.published_at)
      && Date.parse(item.updated_at) <= Date.parse(feed.generated_at), 'Ungültige Meldungsdaten.');
    assert(array(item.product_ids, 100) && item.product_ids.every(id) && distinct(item.product_ids), 'Ungültige Produkt-IDs.');
    assert(item.product_aliases === undefined || (array(item.product_aliases, 100) && item.product_aliases.every(a => str(a, 120))), 'Ungültige Produkt-Aliase.');
    assert(item.vendor_id === undefined || item.vendor_id === null || id(item.vendor_id), 'Ungültige Herstellerzuordnung.');
    assert(array(item.cve_ids, 100) && item.cve_ids.every(c => normalizeCVE(c))
      && distinct(item.cve_ids.map(normalizeCVE)), 'Ungültige CVE-IDs.');
    assert(feed.data_mode !== 'demo' || item.cve_ids.length === 0, 'Öffentliche DEMO-Fälle verwenden keine erfundenen CVEs.');
    assert(array(item.sources, 100) && item.sources.length > 0, 'Quellen fehlen.');
    for (const source of item.sources) {
      assert(object(source) && id(source.id) && registryIds.has(source.registry_id) && str(source.label, 160)
        && TYPES.includes(source.type) && safeURL(source.url) && array(source.evidence, 20) && source.evidence.length
        && source.evidence.every(e => FIELDS.includes(e)), 'Ungültige oder unsichere Quelle.');
      const registered = feed.sources.find(s => s.id === source.registry_id);
      assert(source.type === registered.type, 'Quellentyp passt nicht zur Registry.');
      const signature = JSON.stringify([source.registry_id, source.url, source.label, source.type]);
      assert(!globalSources.has(source.id) || globalSources.get(source.id) === signature, 'Widersprüchliche Quellen-ID.');
      globalSources.set(source.id, signature);
    }
    assert(distinct(item.sources.map(s => s.id)), 'Doppelte Quellen-ID innerhalb einer Meldung.');
    const hasRef = (sourceId, field) => item.sources.some(s => s.id === sourceId && s.evidence.includes(field));
    const cveScope = cve => cve === null ? item.cve_ids.length < 2 : item.cve_ids.map(normalizeCVE).includes(normalizeCVE(cve));
    assert(safeURL(item.canonical_url) && item.sources.some(s => canonicalURL(s.url) === canonicalURL(item.canonical_url) && s.evidence.includes('identity')), 'Kanonische URL ohne Identitätsbeleg.');
    assert(item.advisory === null || (object(item.advisory) && id(item.advisory.id) && id(item.advisory.vendor_id)
      && typeof item.advisory.verified === 'boolean' && hasRef(item.advisory.source_id, 'identity')
      && item.sources.find(s => s.id === item.advisory.source_id)?.type === 'vendor'), 'Advisory-ID ohne Herstellerbezug.');
    for (const [field, sourceField, evidence] of [['summary', 'summary_source_id', 'summary'], ['recommended_action', 'action_source_id', 'action']]) {
      assert(item[field] === null ? item[sourceField] === null : str(item[field], 5000) && hasRef(item[sourceField], evidence), `Ungültiger Beleg für ${field}.`);
    }
    assert(array(item.cvss, 100), 'Ungültige CVSS-Liste.');
    assert(item.type !== 'known_issue' || item.cvss.length === 0, 'Known Issues dürfen keine CVSS-Bewertung erfinden.');
    for (const v of item.cvss) {
      assert(object(v) && typeof v.score === 'number' && Number.isFinite(v.score) && v.score >= 0 && v.score <= 10
        && ['2.0', '3.0', '3.1', '4.0'].includes(v.version) && (v.vector === null || str(v.vector, 300))
        && hasRef(v.source_id, 'cvss') && cveScope(v.cve_id), 'Ungültige CVSS-Bewertung oder fehlender CVE-Bezug.');
      assert(v.vector === null || (v.version === '2.0' ? /^(CVSS:2\.0\/)?AV:/.test(v.vector) : v.vector.startsWith(`CVSS:${v.version}/`)), 'CVSS-Vektor und Version passen nicht zusammen.');
    }
    for (const [field, statuses, evidence] of [['exploit_evidence', ['confirmed', 'reported', 'unknown'], 'exploit'], ['kev_evidence', ['listed', 'not_listed', 'unknown'], 'kev']]) {
      assert(array(item[field], 100) && item[field].every(e => object(e) && statuses.includes(e.status) && hasRef(e.source_id, evidence) && cveScope(e.cve_id)), 'Ungültige Ausnutzungs-/KEV-Evidenz.');
    }
    assert(array(item.versions, 100) && item.versions.every(v => object(v) && item.product_ids.includes(v.product_id)
      && (v.affected === null || str(v.affected, 300)) && (v.fixed === null || str(v.fixed, 300))
      && hasRef(v.source_id, 'versions')), 'Ungültige Versionsangaben.');
  }
  return feed;
}

export function validProfile(value) { return array(value, 2000) && value.every(id) && distinct(value); }
export function validStatuses(value) {
  return object(value) && Object.keys(value).length <= 5000 && Object.entries(value).every(([key, v]) => id(key)
    && object(v) && ['open', 'reviewed', 'not_affected'].includes(v.status) && str(v.revision, 50000) && date(v.updated_at));
}
export function validVisit(value) { return value === null || date(value); }
export function createStore({ storage, onWarning = () => {} } = {}) {
  let backend;
  const memory = new Map();
  try { backend = storage === undefined ? globalThis.localStorage : storage; }
  catch { onWarning('Browser-Speicher ist gesperrt. Änderungen bleiben nur bis zum Schliessen dieser Seite erhalten.'); }
  const warn = () => onWarning('Lokaler Speicher ist gesperrt, voll oder beschädigt. Für betroffene Daten wird der Sitzungsspeicher verwendet.');
  function decode(raw, validate, maxBytes) {
    const envelope = parseJSON(raw, maxBytes);
    assert(object(envelope) && envelope.schema_version === 1 && validate(envelope.value), 'Ungültiger gespeicherter Wert.');
    return envelope.value;
  }
  return {
    get(key, fallback, validate, maxBytes = 200_000) {
      try {
        if (memory.has(key)) return decode(memory.get(key), validate, maxBytes);
        const raw = backend?.getItem(PREFIX + key);
        if (raw == null) return fallback;
        const value = decode(raw, validate, maxBytes);
        memory.set(key, raw);
        return value;
      } catch { warn(); return fallback; }
    },
    set(key, value, validate, maxBytes = 200_000) {
      try {
        assert(validate(value), 'Ungültiger Speicherwert.');
        const raw = JSON.stringify({ schema_version: 1, value });
        assert(bytes(raw) <= maxBytes, 'Speicherwert zu gross.');
        memory.set(key, raw);
        try { if (backend) backend.setItem(PREFIX + key, raw); else warn(); }
        catch { warn(); }
        return true;
      } catch { warn(); return false; }
    },
  };
}
export async function fetchJSON(url, { fetchImpl = globalThis.fetch, timeoutMs = CONFIG.timeoutMs, limit = MAX_FEED_BYTES } = {}) {
  const controller = new AbortController();
  let timer;
  // Race also bounds stalled/failed stream readers and test transports ignoring abort.
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Zeitlimit beim Laden erreicht.')); }, timeoutMs); });
  const read = async () => {
    const response = await fetchImpl(url, { signal: controller.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error' });
    assert(response.ok, `HTTP-Fehler ${response.status}.`);
    assert(/^(application\/(?:[\w.+-]+\+)?json)(?:\s*;|$)/i.test(response.headers.get('content-type') || ''), 'Antwort ist kein JSON-Dokument.');
    const size = Number(response.headers.get('content-length'));
    assert(!Number.isFinite(size) || size <= limit, 'Antwort ist zu gross.');
    if (!response.body?.getReader) return parseJSON(await response.text(), limit);
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let total = 0, text = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        assert(total <= limit, 'Antwort überschreitet die Grössenbegrenzung.');
        text += decoder.decode(value, { stream: true });
      }
      return parseJSON(text + decoder.decode(), limit);
    } finally { await reader.cancel().catch(() => {}); }
  };
  try { return await Promise.race([read(), timeout]); }
  finally { clearTimeout(timer); controller.abort(); }
}
export async function loadCatalog(options = {}) { return validateCatalog(await fetchJSON(options.url ?? CONFIG.catalogURL, { ...options, limit: 500_000 })); }
export async function loadFeed({ externalFeedURL = CONFIG.externalFeedURL, localFeedURL = CONFIG.localFeedURL,
  store = createStore(), fetchImpl = globalThis.fetch, timeoutMs = CONFIG.timeoutMs, now = Date.now(), staleAfterMs = CONFIG.staleAfterMs } = {}) {
  const warnings = [];
  const result = (feed, transport) => {
    const last = feed.last_success_at || feed.generated_at;
    const stale = now - Date.parse(last) > staleAfterMs;
    if (stale) warnings.push('Der letzte Datenstand ist älter als das konfigurierte Frischefenster (standardmässig 24 Stunden).');
    if (Date.parse(feed.generated_at) > now + 300_000) warnings.push('Der Datenstand liegt in der Zukunft. Gerätezeit und Quelle prüfen.');
    return { feed, transport, stale, warnings };
  };
  if (externalFeedURL) {
    try {
      assert(safeURL(externalFeedURL)?.startsWith('https://'), 'Externer Feed benötigt eine sichere HTTPS-URL.');
      const feed = validateFeed(await fetchJSON(externalFeedURL, { fetchImpl, timeoutMs }));
      // Bind cached data to this exact configured source, including deliberately empty feeds.
      store.set('feed-cache', { url: externalFeedURL, feed }, value => object(value) && value.url === externalFeedURL && !!validateFeed(value.feed), MAX_FEED_BYTES + 4096);
      return result(feed, 'live');
    } catch (error) { warnings.push(`Externer Feed nicht verfügbar: ${error.message}`); }
    const cache = store.get('feed-cache', null, value => object(value) && value.url === externalFeedURL && !!validateFeed(value.feed), MAX_FEED_BYTES + 4096);
    if (cache) { warnings.push('Letzter erneut validierter Browser-Cache wird angezeigt.'); return result(cache.feed, 'cache'); }
  }
  try {
    const feed = validateFeed(await fetchJSON(localFeedURL, { fetchImpl, timeoutMs }));
    if (externalFeedURL) warnings.push('Mitgelieferter Datensatz wird als Ersatz angezeigt.');
    return result(feed, externalFeedURL ? 'fallback' : 'lokal');
  } catch (error) {
    warnings.push(`Lokale Daten nicht verfügbar: ${error.message}`);
    return { feed: null, transport: 'error', stale: false, warnings };
  }
}

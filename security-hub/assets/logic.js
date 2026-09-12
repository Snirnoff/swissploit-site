// Pure rules. No network, browser globals, storage or HTML.
export const RULE_VERSION = 1;
export const TYPE_LABELS = { vulnerability: 'Schwachstelle', known_issue: 'Known Issue', security_news: 'Einordnung' };
export const STATUS_LABELS = { open: 'Offen', reviewed: 'Geprüft', not_affected: 'Nicht betroffen', recheck: 'Erneut prüfen' };
const authority = { vendor: 0, cisa: 0, cve: 1, news: 3 };
const unique = values => [...new Set(values)];
const norm = value => String(value).normalize('NFKC').trim().toLocaleLowerCase('de-CH').replace(/\s+/g, ' ');

export function safeURL(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\u007f]/u.test(value)) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function canonicalURL(value) {
  const safe = safeURL(value);
  if (!safe) return null;
  const url = new URL(safe);
  url.hash = '';
  // No heuristic query removal: query parameters can identify different advisories.
  return url.href;
}
export function normalizeCVE(value) {
  const cve = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return /^CVE-\d{4}-\d{4,19}$/.test(cve) ? cve : null;
}
export function resolveProducts({ product_ids = [], product_aliases = [], vendor_id = null }, catalog) {
  const ids = new Set(), unresolved = [];
  for (const id of product_ids) {
    if (catalog.products.some(p => p.product_id === id)) ids.add(id);
    else unresolved.push(id);
  }
  // Only explicitly structured product labels; never search arbitrary prose.
  for (const label of product_aliases) {
    const matches = catalog.products.filter(p => (!vendor_id || p.vendor_id === vendor_id)
      && [p.label, ...p.aliases].some(alias => norm(alias) === norm(label)));
    if (matches.length === 1) ids.add(matches[0].product_id);
    else unresolved.push(label);
  }
  return { product_ids: [...ids], unresolved, uncertain: unresolved.length > 0 };
}
export function identityFor(item) {
  const cves = unique(item.cve_ids.map(normalizeCVE).filter(Boolean)).sort();
  const advisory = item.advisory?.verified === true ? `${item.advisory.vendor_id}:${item.advisory.id}` : null;
  if (cves.length === 1) return `${item.type}:cve:${cves[0]}`;
  const identity = advisory ? `advisory:${advisory}` : `url:${canonicalURL(item.canonical_url)}`;
  // A bulletin is its own topic. It must never connect distinct single-CVE groups.
  return `${item.type}:${cves.length > 1 ? `bulletin:${cves.join(',')}:` : ''}${identity}`;
}
function rankFor(item, sourceId) {
  return authority[item.sources.find(s => s.id === sourceId)?.type] ?? 9;
}
function dedupeSources(sources) {
  const urls = new Map();
  for (const source of sources) {
    const url = canonicalURL(source.url);
    if (!urls.has(url)) urls.set(url, { ...source, ids: [source.id], evidence: [...source.evidence] });
    else {
      const known = urls.get(url);
      known.ids = unique([...known.ids, source.id]);
      known.evidence = unique([...known.evidence, ...source.evidence]);
      if ((authority[source.type] ?? 9) < (authority[known.type] ?? 9)) {
        known.type = source.type; known.label = source.label;
      }
    }
  }
  return [...urls.values()].sort((a, b) => (authority[a.type] ?? 9) - (authority[b.type] ?? 9));
}
export function groupIssues(items, catalog) {
  const groups = new Map();
  for (const item of items) {
    const key = identityFor(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.values()].map(records => {
    const sorted = [...records].sort((a, b) => rankFor(a, a.summary_source_id) - rankFor(b, b.summary_source_id)
      || Date.parse(b.updated_at) - Date.parse(a.updated_at) || a.id.localeCompare(b.id));
    const primary = sorted[0];
    const mappings = records.map(item => resolveProducts(item, catalog));
    const cves = unique(records.flatMap(i => i.cve_ids.map(normalizeCVE))).sort();
    const id = cves.length === 1 ? cves[0] : [...records].map(i => i.id).sort()[0];
    const sourceRefs = records.flatMap(i => i.sources);
    const evidence = field => {
      const rows = records.flatMap(i => i[field]);
      return [...new Map(rows.map(row => [JSON.stringify(row), row])).values()]
        .sort((a, b) => (authority[sourceRefs.find(s => s.id === a.source_id)?.type] ?? 9) - (authority[sourceRefs.find(s => s.id === b.source_id)?.type] ?? 9));
    };
    const actionRecord = sorted.filter(i => i.recommended_action !== null)
      .sort((a, b) => rankFor(a, a.action_source_id) - rankFor(b, b.action_source_id))[0];
    return {
      ...primary, id, alias_ids: unique(records.map(i => i.id)), records: sorted,
      product_ids: unique(mappings.flatMap(m => m.product_ids)),
      unresolved_products: unique(mappings.flatMap(m => m.unresolved)), cve_ids: cves,
      sources: dedupeSources(sourceRefs),
      cvss: evidence('cvss'), exploit_evidence: evidence('exploit_evidence'), kev_evidence: evidence('kev_evidence'),
      versions: evidence('versions'),
      recommended_action: actionRecord?.recommended_action ?? null,
      action_source_id: actionRecord?.action_source_id ?? null,
      published_at: records.map(i => i.published_at).sort()[0],
      updated_at: records.map(i => i.updated_at).sort().at(-1),
      revision_key: records.map(i => `${i.id}:${i.revision}:${i.updated_at}`).sort().join('|'),
    };
  });
}
export function sourceLabel(item, id) {
  return item.sources.find(s => s.id === id || s.ids?.includes(id))?.label ?? 'Unbekannte Quelle';
}
export function exploitState(item) {
  const statuses = item.exploit_evidence.map(e => e.status);
  return statuses.includes('confirmed') ? 'confirmed' : statuses.includes('reported') ? 'reported' : 'unknown';
}
export function kevState(item) {
  const statuses = item.kev_evidence.map(e => e.status);
  return statuses.includes('listed') ? 'listed' : statuses.includes('not_listed') ? 'not_listed' : 'unknown';
}
export function activeExploitation(item) { return exploitState(item) === 'confirmed' || kevState(item) === 'listed'; }
// Prefer primary/CVE assessments per CVE. Keep all assessments for detail/briefing.
export function severity(item) {
  if (item.type === 'known_issue') return { label: 'Nicht anwendbar', score: null };
  const scoped = new Map();
  for (const assessment of item.cvss) {
    const key = assessment.cve_id ?? 'topic';
    const rank = rankFor({ sources: item.sources.flatMap(s => (s.ids || [s.id]).map(id => ({ ...s, id }))) }, assessment.source_id);
    if (!scoped.has(key) || rank < scoped.get(key).rank) scoped.set(key, { rank, scores: [assessment.score] });
    else if (rank === scoped.get(key).rank) scoped.get(key).scores.push(assessment.score);
  }
  const scores = [...scoped.values()].flatMap(s => s.scores);
  const score = scores.length ? Math.max(...scores) : null;
  return { score, label: score === null ? 'Unbekannt' : score >= 9 ? 'Kritisch' : score >= 7 ? 'Hoch' : score >= 4 ? 'Mittel' : score > 0 ? 'Niedrig' : 'Keine (CVSS 0)' };
}
export function conflicts(item) {
  const results = [];
  for (const [field, key, label] of [['cvss', 'score', 'Abweichende CVSS-Bewertungen'], ['exploit_evidence', 'status', 'Abweichende Ausnutzungsangaben'], ['kev_evidence', 'status', 'Abweichende KEV-Angaben']]) {
    const scopes = unique(item[field].map(e => e.cve_id));
    for (const scope of scopes) {
      const values = unique(item[field].filter(e => e.cve_id === scope && e[key] !== 'unknown').map(e => e[key]));
      if (values.length > 1) results.push(`${label}${scope ? ` zu ${scope}` : ''}: ${values.join(' / ')}. Quellen einzeln prüfen.`);
    }
  }
  if (item.records?.length > 1 && unique(item.records.map(r => r.summary).filter(Boolean)).length > 1) results.push('Mehrere Quellendarstellungen vorhanden; der Überblick folgt der vorrangigen Quelle.');
  return results;
}
export function matchesProfile(item, profile) { return item.product_ids.some(id => profile.includes(id)); }
export function priority(item, profile = []) {
  const relevant = matchesProfile(item, profile);
  const reasons = [profile.length ? relevant ? 'Passt zu deinem Produktprofil.' : 'Ausserhalb deines Produktprofils.' : 'Kein Produktprofil angewendet; alle Produkte sichtbar.'];
  const sev = severity(item);
  let tier = 4;
  if (activeExploitation(item)) {
    tier = 1;
    reasons.push(kevState(item) === 'listed' ? 'KEV-Eintrag belegt; Ausnutzung/KEV als ein Signal gewertet.' : 'Ausnutzung durch eine gelieferte Quelle bestätigt.');
  } else if (sev.score !== null && sev.score >= 9) { tier = 2; reasons.push('Kritische Schwere gemäss vorrangiger CVSS-Quelle (ab 9).'); }
  else if (exploitState(item) === 'reported') { tier = 3; reasons.push('Ausnutzung gemeldet, noch nicht bestätigt.'); }
  else if (sev.score !== null && sev.score >= 7) { tier = 3; reasons.push('Hohe Schwere gemäss vorrangiger CVSS-Quelle (ab 7).'); }
  else if (item.type === 'known_issue') { tier = 3; reasons.push('Bekanntes Update-Problem: betriebliche Auswirkungen prüfen.'); }
  else reasons.push(sev.score === null ? 'Schwere und Ausnutzung nicht ausreichend belegt; weiter einordnen.' : 'Weitere Prüfung anhand der belegten Schwere einplanen.');
  if (item.cve_ids.length > 1) reasons.push('Sammelbulletin: höchste belegte Einzel-CVE-Einstufung; keine Übertragung auf andere CVEs.');
  if (item.unresolved_products?.length) reasons.push('Ein Teil der Produktzuordnung ist unsicher.');
  return { tier, label: ['','Zuerst prüfen','Zeitnah prüfen','Prüfung einplanen','Einordnen'][tier], reasons, relevant, rule_version: RULE_VERSION };
}
export function statusFor(item, statuses = {}) {
  const record = statuses[item.id];
  if (!record) return 'open';
  if (record.status !== 'open' && record.revision !== item.revision_key) return 'recheck';
  return record.status;
}
export function isOpen(item, statuses = {}) { return ['open', 'recheck'].includes(statusFor(item, statuses)); }
export function sortIssues(items, { sort = 'priority', profile = [] } = {}) {
  return [...items].sort((a, b) => (sort === 'priority' ? priority(a, profile).tier - priority(b, profile).tier
    || Number(matchesProfile(b, profile)) - Number(matchesProfile(a, profile)) : 0)
    || Date.parse(b.updated_at) - Date.parse(a.updated_at) || a.id.localeCompare(b.id));
}
export function filterIssues(items, filters, profile, statuses, catalog, now = Date.now()) {
  const labels = new Map(catalog.products.map(p => [p.product_id, p.label]));
  const q = norm(filters.q || '');
  return sortIssues(items.filter(item => {
    if (filters.scope === 'stack' && profile.length && !matchesProfile(item, profile)) return false;
    const status = statusFor(item, statuses);
    if (filters.status === 'open' && !isOpen(item, statuses)) return false;
    if (filters.status && !['open', 'all'].includes(filters.status) && filters.status !== status) return false;
    if (filters.exploited && !activeExploitation(item)) return false;
    if (filters.known && item.type !== 'known_issue') return false;
    if (filters.days !== 'all' && Number(filters.days) > 0 && now - Date.parse(item.updated_at) > Number(filters.days) * 86400000) return false;
    return !q || norm([item.title, item.summary || '', ...item.cve_ids, ...item.product_ids.map(id => labels.get(id) || id)].join(' ')).includes(q);
  }), { sort: filters.sort, profile });
}
export function olderOpenPriorities(items, filters, profile, statuses, now = Date.now()) {
  if (filters.days === 'all' || !Number(filters.days)) return [];
  return sortIssues(items.filter(item => (!profile.length || matchesProfile(item, profile)) && isOpen(item, statuses)
    && priority(item, profile).tier <= 2 && now - Date.parse(item.updated_at) > Number(filters.days) * 86400000), { profile });
}
export function relatedIssues(item, items) {
  return items.filter(other => other.id !== item.id && other.cve_ids.some(cve => item.cve_ids.includes(cve)));
}
export function parseIssueHash(hash) {
  if (!hash.startsWith('#issue=')) return { id: null, error: null };
  try {
    const id = decodeURIComponent(hash.slice(7));
    if (!id || id.length > 180 || /[\u0000-\u001f]/u.test(id)) throw new Error();
    return { id, error: null };
  } catch { return { id: null, error: 'Der Direktlink ist ungültig kodiert oder enthält keine gültige ID.' }; }
}
export function issueLink(id, base) {
  const safe = safeURL(base);
  if (!safe) throw new Error('Ungültige Hub-Linkbasis.');
  const url = new URL(safe); url.search = ''; url.hash = `issue=${encodeURIComponent(id)}`;
  return url.href;
}
export function formatDate(value) {
  return value ? new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Zurich' }).format(new Date(value)) + ' (Zürich)' : 'unbekannt';
}
export function versionLines(item, catalog) {
  const ids = unique([...item.product_ids, ...item.versions.map(v => v.product_id)]);
  return ids.flatMap(id => {
    const label = catalog.products.find(p => p.product_id === id)?.label || id;
    const rows = item.versions.filter(v => v.product_id === id);
    return rows.length ? rows.map(v => `${label}: betroffen ${v.affected ?? 'unbekannt'}; behoben ${v.fixed ?? 'unbekannt'} (${sourceLabel(item, v.source_id)})`)
      : [`${label}: betroffene und behobene Versionen unbekannt`];
  });
}
export const EXPLOIT_LABELS = { confirmed: 'Bestätigt', reported: 'Gemeldet, nicht bestätigt', unknown: 'Unbekannt' };
export const KEV_LABELS = { listed: 'Gelistet', not_listed: 'Nicht gelistet laut Quelle; Ausnutzung dadurch nicht ausgeschlossen', unknown: 'Unbekannt' };
export function cvssLines(item) {
  return item.cvss.length ? item.cvss.map(v => `${v.cve_id ? `${v.cve_id}: ` : ''}${v.score} · CVSS ${v.version} · Vektor ${v.vector ?? 'unbekannt'} · ${sourceLabel(item, v.source_id)}`) : ['Unbekannt / nicht belegt'];
}
export function buildBriefing(item, feed, catalog, base) {
  // Intentionally no personal profile or local status argument.
  const p = priority(item);
  const scope = row => row.cve_id ? `${row.cve_id}: ` : '';
  return [
    `Swissploit Security Hub · ${feed.data_mode === 'demo' ? 'DEMO – vollständig fiktiver Übungsfall, keine reale Herstellerwarnung' : 'Live-Datensatz'}`,
    `Datenstand: ${formatDate(feed.generated_at)} · Letzter erfolgreicher Datenstand: ${formatDate(feed.last_success_at)}`,
    `Thema: ${item.title}`, `ID: ${item.id} · Revision: ${item.revision_key || item.revision}`, `Typ: ${TYPE_LABELS[item.type]}`,
    `CVE: ${item.cve_ids.join(', ') || 'keine angegeben'}`,
    `Produkte: ${item.product_ids.map(id => catalog.products.find(p => p.product_id === id)?.label || id).join(', ') || 'Zuordnung unbekannt'}`,
    ...(item.unresolved_products?.length ? [`Unsichere Zuordnung: ${item.unresolved_products.join(', ')}`] : []),
    `Arbeitspriorität: P${p.tier} · ${p.label} (Regel ${RULE_VERSION}, ohne persönliches Profil)`,
    ...p.reasons.slice(1), `Schwere: ${severity(item).label}`, 'CVSS:', ...cvssLines(item),
    `Ausnutzung: ${EXPLOIT_LABELS[exploitState(item)]}`,
    ...item.exploit_evidence.map(e => `${scope(e)}${EXPLOIT_LABELS[e.status]} (${sourceLabel(item, e.source_id)})`),
    `KEV: ${KEV_LABELS[kevState(item)]}`,
    ...item.kev_evidence.map(e => `${scope(e)}${KEV_LABELS[e.status]} (${sourceLabel(item, e.source_id)})`),
    'Versionen:', ...versionLines(item, catalog),
    `Veröffentlicht: ${formatDate(item.published_at)} · Fachliches Update: ${formatDate(item.updated_at)}`,
    `Überblick: ${item.summary ?? 'Keine belegte Zusammenfassung vorhanden.'}`,
    `Empfohlene Prüfung: ${item.recommended_action ?? 'Originalquellen und Produktzuordnung prüfen. Betroffenheit ist unbekannt.'}`,
    ...conflicts(item),
    ...(item.records?.length > 1 ? item.records.map(r => `Weitere Darstellung (${sourceLabel(item, r.summary_source_id)}): ${r.summary ?? 'unbekannt'}; Handlung: ${r.recommended_action ?? 'unbekannt'}`) : []),
    'Quellen (alle):', ...item.sources.map(s => `${s.label} [${s.type}]: ${s.url}\nBezug: ${s.evidence.join(', ')}`),
    `Hub-Direktlink: ${issueLink(item.id, base)}`,
    'Produktbezug ist keine Erkennung installierter Versionen. Persönlicher Bearbeitungsstand und Profil sind nicht enthalten.',
    ...(feed.data_mode === 'demo' ? ['DEMO: Auch Bewertungen, Versionen, Ausnutzungsangaben und Quellen sind fiktiv. Beispiel-URLs sind keine Herstellerbelege.'] : []),
  ].join('\n');
}
export function mailtoFor(title, body, maxLength = 1800) {
  const subject = `Swissploit Briefing: ${title}`.replace(/[\r\n\u0000-\u001f\u007f]/g, ' ').slice(0, 180);
  const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return href.length <= maxLength ? href : null;
}

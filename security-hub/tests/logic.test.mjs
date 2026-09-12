import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, demo, clone, synthetic } from './fixtures.mjs';
import { resolveProducts, normalizeCVE, groupIssues, severity, exploitState, kevState, priority, conflicts, statusFor,
  filterIssues, olderOpenPriorities, safeURL, buildBriefing, mailtoFor, issueLink, parseIssueHash, relatedIssues } from '../assets/logic.js';
const items = groupIssues(demo.items, catalog);

test('Stabile IDs und exakte strukturierte Aliase, keine Treffer aus Fliesstext', () => {
  assert.deepEqual(resolveProducts({ product_aliases: [' M365 ', 'Microsoft  Edge'] }, catalog).product_ids, ['microsoft.microsoft-365', 'microsoft.edge']);
  for (const alias of ['the edge of the network', 'Office hours', 'Java is mentioned', 'HP', 'Chromium-based browsers']) assert.equal(resolveProducts({ product_aliases: [alias] }, catalog).product_ids.length, 0);
  assert.equal(resolveProducts({ summary: 'Office Edge Java HP' }, catalog).product_ids.length, 0);
  assert.equal(resolveProducts({ product_aliases: ['Edge'], vendor_id: 'apple' }, catalog).uncertain, true);
});
test('Komponenten, Hersteller und ähnliche Produkte bleiben getrennt', () => {
  for (const [alias, expected] of [['Chromium', 'chromium.chromium'], ['Firefox ESR', 'mozilla.firefox-esr'], ['HPE iLO', 'hpe.ilo-server'], ['HP BIOS', 'hp.pc-bios']]) assert.deepEqual(resolveProducts({ product_aliases: [alias] }, catalog).product_ids, [expected]);
  const ambiguous = clone(catalog); ambiguous.products[0].aliases.push('Edge');
  assert.equal(resolveProducts({ product_aliases: ['Edge'] }, ambiguous).uncertain, true);
});
test('Exakte CVE-Normalisierung; keine Teilstring-Deduplizierung', () => {
  assert.equal(normalizeCVE(' cve-9999-0001 '), 'CVE-9999-0001');
  assert.equal(normalizeCVE('CVE-9999-0001 extra'), null);
  const one = synthetic(1), two = synthetic(2, [' cve-9999-0001 ']), three = synthetic(3, ['CVE-9999-00010']);
  const grouped = groupIssues([one, two, three], catalog);
  assert.equal(grouped.length, 2); assert.equal(grouped[0].records.length, 2); assert.equal(grouped[0].sources.length, 1);
});
test('Sammelbulletin verbindet Einzel-CVEs niemals transitiv', () => {
  const one = synthetic(1), two = synthetic(2, ['CVE-9999-0002']), bulletin = synthetic(3, ['CVE-9999-0001','CVE-9999-0002']);
  one.advisory.id = two.advisory.id = bulletin.advisory.id = 'TEST-SHARED';
  const grouped = groupIssues([one, bulletin, two], catalog);
  assert.equal(grouped.length, 3); assert.equal(relatedIssues(grouped[0], grouped).length, 1);
  assert.equal(grouped[2].exploit_evidence.length, 0);
});
test('Ohne CVE nur verifiziertes Advisory oder kanonische URL, niemals ähnlicher Titel', () => {
  const one = clone(demo.items[0]), two = clone(one); two.id = 'DEMO-DUP';
  assert.equal(groupIssues([one, two], catalog).length, 1);
  two.advisory = null; two.canonical_url = 'https://example.invalid/different';
  assert.equal(groupIssues([one, two], catalog).length, 2);
  one.advisory = null; two.canonical_url = one.canonical_url + '#fragment';
  assert.equal(groupIssues([one, two], catalog).length, 1);
  two.type = 'known_issue'; assert.equal(groupIssues([one, two], catalog).length, 2);
});
test('Reihenfolge der Quellen ändert die Gruppenidentität nicht; Revision erfasst alle Quellen', () => {
  const a = synthetic(1), b = synthetic(2); b.revision = 2;
  const first = groupIssues([a,b], catalog)[0], second = groupIssues([b,a], catalog)[0];
  assert.equal(first.id, second.id); assert.equal(first.revision_key, second.revision_key);
  b.revision = 3; assert.notEqual(groupIssues([a,b], catalog)[0].revision_key, first.revision_key);
});
test('Unknown bleibt unknown; KEV-Abwesenheit ist keine Aussage zur Ausnutzung', () => {
  const item = items[2]; assert.equal(severity(item).score, null); assert.equal(exploitState(item), 'unknown'); assert.equal(kevState(item), 'unknown');
  const copy = clone(item); copy.kev_evidence = [{ status: 'not_listed', source_id: copy.sources[0].id, cve_id: null }];
  assert.equal(exploitState(copy), 'unknown'); assert.equal(priority(copy).tier, 4);
});
test('Known Issues ohne fingierte Schwere; Patch erhöht keine Priorität', () => {
  assert.equal(severity(items[7]).label, 'Nicht anwendbar'); assert.equal(priority(items[7]).tier, 3);
  const patched = clone(items[1]); patched.versions = [];
  assert.deepEqual(priority(patched), priority(items[1]));
});
test('Herstellerbewertung vor News, abweichende Belege sichtbar', () => {
  assert.equal(severity(items[4]).score, 7.5); assert.equal(priority(items[4]).tier, 3);
  assert.ok(conflicts(items[4]).some(s => s.includes('7.5 / 9.8')));
});
test('Lesbare Prioritätsgründe, Produkttreffer und keine KEV-Doppelzählung', () => {
  const original = items[8], withoutKEV = clone(original); withoutKEV.kev_evidence = [];
  assert.equal(priority(original).tier, priority(withoutKEV).tier);
  assert.ok(priority(original).reasons.some(r => r.includes('ein Signal')));
  const p = priority(original, ['synology.dsm']); assert.equal(p.relevant, true); assert.ok(p.reasons[0].includes('Passt zu deinem Produktprofil'));
  assert.equal('score' in p, false);
});
test('Neue Revision geprüft/nicht betroffen wird erneut offen; Erstbesuch ohne Status', () => {
  const item = items[0]; assert.equal(statusFor(item), 'open');
  const statuses = { [item.id]: { status: 'reviewed', revision: item.revision_key } };
  assert.equal(statusFor(item, statuses), 'reviewed'); statuses[item.id].revision = 'old'; assert.equal(statusFor(item, statuses), 'recheck');
  statuses[item.id].status = 'not_affected'; assert.equal(statusFor(item, statuses), 'recheck');
});
test('Kombinierbare Filter, leerer Stack zeigt alle, Suche in Produkt und Zusammenfassung', () => {
  const f = { scope: 'stack', status: 'all', days: 'all' };
  assert.equal(filterIssues(items, f, [], {}, catalog).length, 14);
  assert.equal(filterIssues(items, f, ['microsoft.edge'], {}, catalog).length, 1);
  assert.equal(filterIssues(items, { ...f, q: 'Archivverarbeitung', exploited: true }, [], {}, catalog).length, 0);
  assert.equal(filterIssues(items, { ...f, q: '7-Zip' }, [], {}, catalog).length, 1);
  assert.equal(filterIssues(items, { ...f, q: 'Produktzuordnung ist belegt' }, [], {}, catalog).length, 1);
  assert.equal(filterIssues(items, { ...f, known: true }, [], {}, catalog).length, 2);
});
test('Ältere ungeklärte Top-Prioritäten bleiben als Hinweis auffindbar', () => {
  const now = Date.parse('2026-09-12T22:00:00Z');
  assert.ok(olderOpenPriorities(items, { days: '1' }, [], {}, now).some(i => i.id === 'DEMO-002'));
  assert.equal(olderOpenPriorities(items, { days: 'all' }, [], {}, now).length, 0);
});
test('Unsichere URLs, Credentials und Header-Steuerzeichen ablehnen', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,bad', '//example.com', 'https://user:secret@example.com', 'https://example.com/\nno']) assert.equal(safeURL(url), null);
  assert.equal(safeURL('https://example.invalid/demo'), 'https://example.invalid/demo');
});
test('Geteiltes Briefing: DEMO, alle Quellen, vollständige Fakten, keine privaten Notizen', () => {
  const item = clone(items[8]); item.secretProfile = 'PRIVATE-PROFILE'; item.status = 'PRIVATE-STATUS';
  const text = buildBriefing(item, demo, catalog, 'http://127.0.0.1:4173/security-hub/');
  assert.ok(text.includes('DEMO')); assert.ok(text.includes('fiktiv')); assert.ok(text.includes('CVSS 3.1'));
  item.sources.forEach(s => assert.ok(text.includes(s.url)));
  assert.ok(text.includes('http://127.0.0.1:4173/security-hub/#issue=DEMO-009'));
  assert.equal(text.includes('PRIVATE-'), false); assert.ok(text.includes('Datenstand:'));
});
test('Mailto korrekt codiert, empfängerlos und ohne stilles Abschneiden', () => {
  const href = mailtoFor('Titel\r\nBcc: niemand', 'Umlaute ä & # +\nText', 5000);
  assert.ok(href.startsWith('mailto:?subject=')); assert.ok(href.includes('%C3%A4'));
  assert.equal(new URL(href).searchParams.get('subject').includes('\n'), false);
  assert.equal(new URL(href).searchParams.get('body'), 'Umlaute ä & # +\nText');
  assert.equal(mailtoFor('Langes Briefing', 'ä'.repeat(1000)), null);
});
test('Direktlink roundtrip, ungültige Kodierung und lokale Linkbasis', () => {
  const link = issueLink('A/B:1', 'http://127.0.0.1:4173/security-hub/');
  assert.equal(parseIssueHash(new URL(link).hash).id, 'A/B:1');
  assert.ok(parseIssueHash('#issue=%ZZ').error); assert.ok(parseIssueHash('#issue=').error);
  assert.equal(parseIssueHash('#hub-main').id, null); assert.throws(() => issueLink('x', 'javascript:bad'));
});

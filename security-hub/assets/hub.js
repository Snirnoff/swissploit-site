import { CONFIG, createStore, loadCatalog, loadFeed, validProfile, validStatuses, validVisit } from './data.js';
import { groupIssues, priority, severity, conflicts, filterIssues, sortIssues, matchesProfile, statusFor, isOpen,
  olderOpenPriorities, activeExploitation, exploitState, kevState, sourceLabel, formatDate, parseIssueHash, issueLink,
  buildBriefing, mailtoFor, versionLines, cvssLines, relatedIssues, TYPE_LABELS, STATUS_LABELS, EXPLOIT_LABELS, KEV_LABELS } from './logic.js';

const $ = id => document.getElementById(`hub-${id}`);
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const button = (label, action, className = 'hub-button') => {
  const node = el('button', className, label); node.type = 'button'; node.addEventListener('click', action); return node;
};
const list = lines => { const node = el('ul', 'hub-evidence-list'); lines.forEach(line => node.append(el('li', '', line))); return node; };
const store = createStore({ onWarning: text => { $('storage-warning').textContent = text; $('storage-warning').hidden = false; } });
const state = { catalog: null, feed: null, items: [], profile: [], draft: new Set(), statuses: {}, previousVisit: null, count: 25, pinned: null };
const base = CONFIG.linkBase || new URL('../', import.meta.url).href;
let toastTimer, downloadURL, shareOpener, profileOpener;
function announce(text) {
  clearTimeout(toastTimer); $('status').textContent = text;
  toastTimer = setTimeout(() => { $('status').textContent = ''; }, 6000);
}
function filters() {
  const form = new FormData($('filters'));
  return { q: form.get('q'), scope: form.get('scope'), status: form.get('status'), days: form.get('days'), sort: form.get('sort'), exploited: form.has('exploited'), known: form.has('known') };
}
function profileItems() { return state.items.filter(i => !state.profile.length || matchesProfile(i, state.profile)); }
function resetFilters() { $('filters').reset(); state.count = 25; render(); }

function setupChrome() {
  $('year').textContent = new Date().getFullYear();
  const setTheme = theme => {
    document.documentElement.dataset.theme = theme;
    $('theme').setAttribute('aria-pressed', String(theme === 'dark'));
    $('theme').setAttribute('aria-label', `Dunkle Darstellung ${theme === 'dark' ? 'aktiv' : 'inaktiv'}; Darstellung umschalten`);
  };
  setTheme(document.documentElement.dataset.theme);
  $('theme').addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(theme); store.set('theme', theme, value => ['dark', 'light'].includes(value));
  });
  const closeMenu = () => { $('nav').dataset.open = 'false'; $('menu').setAttribute('aria-expanded', 'false'); };
  $('menu').addEventListener('click', () => {
    const open = $('menu').getAttribute('aria-expanded') !== 'true';
    $('nav').dataset.open = String(open); $('menu').setAttribute('aria-expanded', String(open));
  });
  $('nav').addEventListener('click', closeMenu);
  $('header');
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('menu').getAttribute('aria-expanded') === 'true') { closeMenu(); $('menu').focus(); }
  });
  matchMedia('(min-width: 601px)').addEventListener('change', closeMenu);
}

function setupProfile() {
  $('open-profile').addEventListener('click', () => {
    profileOpener = document.activeElement;
    $('profile-dialog').append($('profile'));
    $('profile-dialog').showModal(); $('product-search').focus();
  });
  $('close-profile').addEventListener('click', () => $('profile-dialog').close());
  $('profile-dialog').addEventListener('cancel', event => { event.preventDefault(); $('profile-dialog').close(); });
  $('profile-dialog').addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); $('profile-dialog').close(); } });
  $('profile-dialog').addEventListener('close', () => {
    $('profile-mount').append($('profile'));
    if (matchMedia('(max-width: 820px)').matches) profileOpener?.focus();
  });
  matchMedia('(min-width: 821px)').addEventListener('change', event => {
    if (event.matches && $('profile-dialog').open) { $('profile-dialog').close(); $('product-search').focus(); }
  });
  $('product-search').addEventListener('input', renderProducts);
  $('clear-profile').addEventListener('click', () => { state.draft.clear(); renderProducts(); announce('Auswahl entfernt. Mit «Profil anwenden» übernehmen.'); });
  $('suggest').addEventListener('click', () => {
    state.draft = new Set(['microsoft.windows-11', 'microsoft.windows-server', 'microsoft.microsoft-365', 'microsoft.edge', 'fortinet.fortios', 'ubiquiti.unifi-network', 'ubiquiti.unifi-os', 'vmware.vmware-esxi', 'vmware.vmware-vcenter', 'veeam.veeam-backup-and-replication']);
    renderProducts(); announce('KMU-Vorschlag ausgewählt. Passe ihn an und wende das Profil an.');
  });
  $('apply-profile').addEventListener('click', () => {
    state.profile = [...state.draft]; store.set('profile', state.profile, validProfile);
    state.count = 25;
    if ($('profile-dialog').open) $('profile-dialog').close();
    render(); announce(`Profil angewendet: ${state.profile.length} Produkte. ${state.profile.length ? 'Die Watchlist ist keine Erkennung deiner Installation.' : 'Alle Meldungen sichtbar.'}`);
  });
}
function renderProducts() {
  if (!state.catalog) return;
  const openGroups = new Set([...$('product-tree').querySelectorAll('details[open]')].map(n => n.dataset.vendor));
  const q = $('product-search').value.trim().toLocaleLowerCase('de-CH');
  const fragment = document.createDocumentFragment();
  for (const vendor of state.catalog.vendors) {
    const products = state.catalog.products.filter(p => p.vendor_id === vendor.vendor_id
      && (!q || `${vendor.label} ${p.label} ${p.aliases.join(' ')}`.toLocaleLowerCase('de-CH').includes(q)));
    if (!products.length) continue;
    const group = el('details', 'hub-vendor'); group.dataset.vendor = vendor.vendor_id;
    group.open = !!q || openGroups.has(vendor.vendor_id) || (!openGroups.size && vendor.vendor_id === 'microsoft' && !$('product-tree').querySelector('details'));
    const summary = el('summary', '', vendor.label), groupCount = el('span'); summary.append(groupCount); group.append(summary);
    const groupLabel = el('label', 'hub-check hub-group-check'), groupInput = el('input'); groupInput.type = 'checkbox';
    groupInput.setAttribute('aria-label', `${vendor.label}: ${q ? 'alle angezeigten' : 'alle'} Produkte auswählen`);
    groupLabel.append(groupInput, el('span', '', q ? 'Alle angezeigten Produkte' : 'Alle Produkte')); group.append(groupLabel);
    const boxes = [];
    const sync = () => {
      const count = products.filter(p => state.draft.has(p.product_id)).length;
      groupInput.checked = count === products.length; groupInput.indeterminate = count > 0 && count < products.length;
      groupCount.textContent = `${count}/${products.length}`;
      $('selected-count').textContent = `${state.draft.size} ausgewählt${sameProfile() ? '' : ' · Entwurf'}`;
    };
    for (const product of products) {
      const label = el('label', 'hub-check hub-product-option'), input = el('input'); input.type = 'checkbox'; input.value = product.product_id;
      input.checked = state.draft.has(product.product_id); boxes.push(input);
      input.addEventListener('change', () => { input.checked ? state.draft.add(product.product_id) : state.draft.delete(product.product_id); sync(); });
      label.append(input, el('span', '', product.label)); group.append(label);
    }
    groupInput.addEventListener('change', () => {
      products.forEach(p => groupInput.checked ? state.draft.add(p.product_id) : state.draft.delete(p.product_id));
      boxes.forEach(input => { input.checked = state.draft.has(input.value); }); sync();
    });
    sync(); fragment.append(group);
  }
  if (!fragment.childNodes.length) fragment.append(el('p', 'hub-note', 'Kein Produkt gefunden. Suche nach einem Hersteller oder einem kürzeren Produktnamen.'));
  $('product-tree').replaceChildren(fragment);
  $('selected-count').textContent = `${state.draft.size} ausgewählt${sameProfile() ? '' : ' · Entwurf'}`;
}
function sameProfile() { return state.profile.length === state.draft.size && state.profile.every(id => state.draft.has(id)); }

function renderOverview() {
  const relevant = profileItems(), open = relevant.filter(i => isOpen(i, state.statuses));
  const recent = state.previousVisit ? relevant.filter(i => Date.parse(i.updated_at) > Date.parse(state.previousVisit)).length : '—';
  const metrics = [[relevant.length, state.profile.length ? 'Themen zum Produktprofil' : 'Themen im Datensatz'],
    [open.filter(i => priority(i, state.profile).tier <= 2).length, 'Offen mit Priorität P1/P2'],
    [relevant.filter(activeExploitation).length, 'Ausnutzung bestätigt / KEV'], [recent, state.previousVisit ? 'Updates seit letztem Besuch' : 'Erster Besuch · kein Vergleich']];
  $('metrics').replaceChildren(...metrics.map(([count, label]) => { const m = el('div', 'hub-metric'); m.append(el('strong', '', String(count)), el('span', '', label)); return m; }));
  $('profile-hint').textContent = state.profile.length ? `${state.profile.length} Produkte in deinem Profil. Ergebnisse passen zur Watchlist; eine tatsächliche Betroffenheit muss separat geprüft werden.`
    : 'Ohne Produktprofil siehst du alle Meldungen. Wähle links oder über «Produktprofil wählen» deine Produkte.';
  const top = sortIssues(open, { profile: state.profile }).slice(0, 5);
  $('top-list').replaceChildren(...top.map(item => {
    const row = el('li'), link = el('a', '', item.title); link.href = issueLink(item.id, base);
    const p = priority(item, state.profile); row.append(link, el('small', '', `P${p.tier}`)); return row;
  }));
  if (!top.length) $('top-list').append(el('p', 'hub-note', 'Keine offenen Themen für dieses Profil im geladenen Datensatz. Das ist kein Nachweis eines sicheren Systems.'));
}
function detailField(grid, label, content, wide = false) {
  const row = el('div', wide ? 'hub-wide' : ''); row.append(el('dt', '', label));
  const value = el('dd'); typeof content === 'string' ? value.textContent = content : value.append(content);
  row.append(value); grid.append(row);
}
function renderDetails(item, details) {
  if (details.dataset.rendered) return; details.dataset.rendered = 'true';
  if (state.feed.data_mode === 'demo') details.append(el('p', 'hub-notice', 'DEMO · Sämtliche Angaben dieses Falls, einschliesslich Quellen, Bewertungen und Versionen, sind fiktiv. Keine reale Herstellerwarnung.'));
  const grid = el('dl', 'hub-detail-grid'), p = priority(item, state.profile);
  detailField(grid, `Arbeitspriorität P${p.tier} · ${p.label} · Regel ${p.rule_version}`, list(p.reasons), true);
  detailField(grid, 'CVE / Advisory', `${item.cve_ids.join(', ') || 'Keine CVE angegeben'} · ${item.advisory?.id || 'Kein verifiziertes Advisory angegeben'}`);
  detailField(grid, 'Schwere (separat von Arbeitspriorität)', severity(item).label);
  detailField(grid, 'CVSS · Version, Vektor und Quelle', list(cvssLines(item)), true);
  const scope = e => e.cve_id ? `${e.cve_id}: ` : '';
  detailField(grid, 'Ausnutzung', list(item.exploit_evidence.length ? item.exploit_evidence.map(e => `${scope(e)}${EXPLOIT_LABELS[e.status]} · ${sourceLabel(item, e.source_id)}`) : ['Unbekannt / nicht belegt']));
  detailField(grid, 'CISA KEV', list(item.kev_evidence.length ? item.kev_evidence.map(e => `${scope(e)}${KEV_LABELS[e.status]} · ${sourceLabel(item, e.source_id)}`) : ['Unbekannt. Kein Eintrag ist kein Beleg für fehlende Ausnutzung.']));
  detailField(grid, 'Veröffentlicht', formatDate(item.published_at));
  detailField(grid, 'Fachliches Update / Revision', `${formatDate(item.updated_at)} · ${item.revision}`);
  detailField(grid, 'Betroffene / behobene Versionen je Produkt', list(versionLines(item, state.catalog)), true);
  if (item.unresolved_products.length) detailField(grid, 'Unsichere Produktzuordnung', item.unresolved_products.join(', '), true);
  details.append(grid);
  for (const conflict of conflicts(item)) details.append(el('p', 'hub-notice', conflict));
  const action = el('div', 'hub-action-box');
  action.append(el('strong', '', 'Empfohlene Prüfung'), el('p', '', item.recommended_action || 'Originalquellen und Produktzuordnung prüfen. Betroffenheit ist unbekannt.'));
  if (item.action_source_id) action.append(el('small', 'hub-note', `Beleg: ${sourceLabel(item, item.action_source_id)}`));
  details.append(action);
  if (item.records.length > 1) {
    const alternatives = el('details', 'hub-method'); alternatives.append(el('summary', '', 'Alle gelieferten Quellendarstellungen'));
    for (const record of item.records) alternatives.append(el('p', '', `${sourceLabel(item, record.summary_source_id)}: ${record.summary || 'Kein Überblick angegeben'} · Handlung: ${record.recommended_action || 'unbekannt'}`));
    details.append(alternatives);
  }
  const relations = relatedIssues(item, state.items);
  if (relations.length) {
    const related = el('p', 'hub-note', 'Verwandte Themen (getrennte Fakten): ');
    for (const other of relations) { const link = el('a', '', `${other.id} `); link.href = issueLink(other.id, base); related.append(link); } details.append(related);
  }
  details.append(el('h4', '', 'Sämtliche Quellen'));
  const sources = el('ul', 'hub-source-list');
  for (const source of item.sources) {
    const row = el('li'), link = el('a', '', source.label); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    row.append(link, el('small', '', `${source.type} · Beleg für: ${source.evidence.join(', ')} · ${source.url}`)); sources.append(row);
  }
  details.append(sources);
}
function changeStatus(item, status) {
  state.statuses[item.id] = { status, revision: item.revision_key, updated_at: new Date().toISOString() };
  store.set('statuses', state.statuses, validStatuses, 1_000_000);
  const focusedAction = document.activeElement?.dataset.action;
  render();
  const next = document.getElementById(`hub-issue-${item.id}`);
  (next?.querySelector(`[data-action="${focusedAction || 'reviewed'}"]`) || $('feed-title')).focus();
  announce(`${STATUS_LABELS[status]} gespeichert. Dies ist nur eine browserlokale Notiz.`);
}
function renderCard(item) {
  const card = el('article', 'hub-card'); card.id = `hub-issue-${item.id}`; card.tabIndex = -1; card.dataset.issue = item.id;
  const p = priority(item, state.profile); card.dataset.priority = p.tier;
  const top = el('div', 'hub-card-top'), heading = el('div'), tags = el('div', 'hub-card-tags');
  const badge = text => el('span', 'hub-badge', text);
  if (state.feed.data_mode === 'demo') tags.append(el('span', 'hub-badge hub-demo-tag', item.id));
  tags.append(badge(TYPE_LABELS[item.type]));
  for (const id of item.product_ids) tags.append(badge(state.catalog.products.find(p => p.product_id === id)?.label || id));
  const title = el('h3', '', item.title); title.id = `${card.id}-title`; card.setAttribute('aria-labelledby', title.id);
  heading.append(tags, title); const rating = el('div', 'hub-priority'); rating.append(el('strong', '', `P${p.tier}`), el('span', '', 'Priorität')); top.append(heading, rating);
  const meta = el('div', 'hub-card-meta');
  meta.append(el('span', '', `${STATUS_LABELS[statusFor(item, state.statuses)]} · Update ${formatDate(item.updated_at)}`), el('span', '', `Schwere: ${severity(item).label}`));
  if (activeExploitation(item) || exploitState(item) === 'reported') meta.append(el('span', '', `Ausnutzung: ${EXPLOIT_LABELS[exploitState(item)]}${kevState(item) === 'listed' ? ' · KEV gelistet' : ''}`));
  card.append(top, el('p', 'hub-card-summary', item.summary || 'Keine belegte Zusammenfassung vorhanden.'), meta);
  const details = el('details', 'hub-details'); details.append(el('summary', '', 'Details, Begründung & Quellen'));
  details.addEventListener('toggle', () => { if (details.open) renderDetails(item, details); }); card.append(details);
  const actions = el('div', 'hub-card-actions');
  for (const status of ['reviewed', 'not_affected', 'open']) {
    const control = button(status === 'open' ? 'Wieder öffnen' : STATUS_LABELS[status], () => changeStatus(item, status));
    control.dataset.action = status; control.setAttribute('aria-pressed', String(statusFor(item, state.statuses) === status)); actions.append(control);
  }
  actions.append(button('Per Mail teilen', () => shareItem(item, 'mail')), button('Briefing kopieren', () => shareItem(item, 'copy')));
  const link = el('a', 'hub-button', 'Direktlink'); link.href = issueLink(item.id, base); actions.append(link);
  card.append(actions); return card;
}
function render() {
  if (!state.feed || !state.catalog) return;
  renderOverview();
  const f = filters(), matches = filterIssues(state.items, f, state.profile, state.statuses, state.catalog);
  const visible = matches.slice(0, state.count);
  const pin = state.items.find(i => i.id === state.pinned);
  const outside = pin && !visible.some(i => i.id === pin.id);
  if (outside) visible.unshift(pin);
  $('cards').replaceChildren(...visible.map(renderCard));
  $('result-count').textContent = `${matches.length} Treffer · ${Math.min(state.count, matches.length)} angezeigt${outside ? ' + Direktlink' : ''}`;
  $('empty').hidden = visible.length > 0;
  if (!state.items.length) {
    $('empty').querySelector('h3').textContent = 'Der Datensatz enthält bewusst keine Meldungen.';
    $('empty').querySelector('p').textContent = 'Der Feed ist gültig und leer. Daraus folgt keine Aussage zur Sicherheit deiner Systeme.';
  }
  $('load-more').hidden = matches.length <= state.count;
  $('load-more').textContent = `Mehr laden (${Math.min(25, Math.max(0, matches.length - state.count))} weitere)`;
  const older = olderOpenPriorities(state.items, f, state.profile, state.statuses);
  $('older').replaceChildren(); $('older').hidden = !older.length;
  if (older.length) {
    $('older').append(el('span', '', `${older.length} ältere offene P1/P2-Themen liegen ausserhalb dieses Zeitfensters. `));
    older.slice(0, 5).forEach(item => { const link = el('a', '', `${item.id} `); link.href = issueLink(item.id, base); $('older').append(link); });
    $('older').append(button('Alle Zeiträume anzeigen', () => { $('filters').elements.days.value = 'all'; render(); }, 'hub-text-button'));
  }
  if (pin) {
    const fullMatch = matches.some(i => i.id === pin.id);
    $('deep-notice').textContent = fullMatch ? `Direktlink zu ${pin.id}. Dein Produktprofil bleibt erhalten.` : `Direktlink zu ${pin.id}: Dieses Thema wird zusätzlich trotz der aktuellen Filter angezeigt. Dein Produktprofil bleibt erhalten.`;
    $('deep-notice').hidden = false;
  }
}
function openDeepLink() {
  if (!state.feed) return;
  const parsed = parseIssueHash(location.hash);
  state.pinned = null; $('deep-notice').hidden = true;
  const item = parsed.id ? state.items.find(i => i.id === parsed.id || i.alias_ids.includes(parsed.id)) : null;
  if (parsed.error || (parsed.id && !item)) {
    $('deep-notice').textContent = parsed.error || `Die Meldung «${parsed.id}» ist im geladenen Datensatz nicht enthalten.`;
    $('deep-notice').hidden = false; announce($('deep-notice').textContent);
  }
  if (item) state.pinned = item.id;
  render();
  if (item) {
    const card = document.getElementById(`hub-issue-${item.id}`), details = card.querySelector('details');
    renderDetails(item, details); details.open = true;
    card.focus({ preventScroll: true }); card.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}

function showShare(text, help) {
  if (!$('share-dialog').open) shareOpener = document.activeElement;
  $('share-text').value = text; $('share-help').textContent = help; $('copy-status').textContent = '';
  if (downloadURL) URL.revokeObjectURL(downloadURL);
  downloadURL = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  $('share-download').href = downloadURL;
  if (!$('share-dialog').open) $('share-dialog').showModal();
  $('share-text').focus(); $('share-text').select();
}
async function copyText(text) {
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
  await navigator.clipboard.writeText(text);
}
async function shareItem(item, mode) {
  const text = buildBriefing(item, state.feed, state.catalog, base);
  if (mode === 'mail') {
    const mailto = mailtoFor(item.title, text);
    if (mailto) { const link = el('a'); link.href = mailto; link.click(); announce('Mailprogramm angefordert. Es wurde keine Nachricht gesendet.'); }
    else showShare(text, 'Das vollständige Briefing ist für einen verlässlichen Mailto-Link zu lang. Kopiere den Text in eine neue E-Mail oder lade die TXT-Datei herunter. Es wird nichts gekürzt oder automatisch gesendet.');
    return;
  }
  try { await copyText(text); announce('Vollständiges Briefing kopiert, ohne dein Profil oder deinen Bearbeitungsstand.'); }
  catch { showShare(text, 'Die Zwischenablage ist nicht verfügbar oder nicht erlaubt. Der Volltext ist ausgewählt: mit Strg+C / ⌘C kopieren oder als TXT herunterladen.'); }
}
function setupSharing() {
  $('share-close').addEventListener('click', () => $('share-dialog').close());
  $('share-dialog').addEventListener('close', () => {
    if (downloadURL) { URL.revokeObjectURL(downloadURL); downloadURL = null; }
    $('share-download').removeAttribute('href'); shareOpener?.focus();
  });
  $('share-copy').addEventListener('click', async () => {
    try { await copyText($('share-text').value); $('copy-status').textContent = 'Vollständiger Text kopiert.'; }
    catch { $('share-text').focus(); $('share-text').select(); $('copy-status').textContent = 'Automatisches Kopieren ist gesperrt. Der vollständige Text ist ausgewählt; bitte Strg+C / ⌘C verwenden.'; }
  });
}
async function start() {
  setupChrome(); setupProfile(); setupSharing();
  const [catalog, loaded] = await Promise.all([loadCatalog(), loadFeed({ store })]);
  state.catalog = catalog;
  state.profile = store.get('profile', [], validProfile).filter(id => catalog.products.some(p => p.product_id === id));
  state.draft = new Set(state.profile);
  state.statuses = store.get('statuses', {}, validStatuses, 1_000_000);
  state.previousVisit = store.get('visit', null, validVisit);
  renderProducts();
  $('apply-profile').disabled = false; $('open-profile').disabled = false;
  if (!loaded.feed) throw new Error(loaded.warnings.join(' '));
  state.feed = loaded.feed; state.items = groupIssues(loaded.feed.items, catalog);
  $('mode').textContent = state.feed.data_mode === 'demo' ? 'DEMO · fiktive Beispieldaten' : 'LIVE-DATENSATZ';
  $('data-date').textContent = `Datenstand: ${formatDate(state.feed.generated_at)}`;
  $('transport').textContent = `Transport: ${loaded.transport}${loaded.stale ? ' · veraltet' : ''}`;
  $('source-note').textContent = `${state.feed.data_mode === 'demo' ? '14 fiktive lokale Übungsfälle. Beispiel-URLs sind keine echten Herstellerquellen.' : 'Quellen sind pro Thema mit Evidenzbezug aufgeführt.'} Letzter Erfolg: ${formatDate(state.feed.last_success_at)}. Keine Collector in dieser Website aktiv.`;
  if (loaded.warnings.length) { $('warning').textContent = loaded.warnings.join(' '); $('warning').hidden = false; }
  $('filters').addEventListener('submit', event => event.preventDefault());
  $('filters').addEventListener('input', () => { state.count = 25; render(); });
  $('filters').addEventListener('reset', () => { setTimeout(() => { state.count = 25; render(); }, 0); });
  $('empty-reset').addEventListener('click', resetFilters);
  $('show-all').addEventListener('click', () => resetFilters());
  $('load-more').addEventListener('click', () => {
    const before = Math.min(state.count, filterIssues(state.items, filters(), state.profile, state.statuses, catalog).length);
    state.count += 25; render();
    const firstNew = $('cards').children[before]; firstNew?.focus(); announce('Weitere Meldungen geladen.');
  });
  window.addEventListener('hashchange', openDeepLink);
  openDeepLink();
  store.set('visit', new Date().toISOString(), validVisit);
  $('startup').hidden = true;
}
start().catch(error => {
  $('startup').replaceChildren(el('strong', '', 'Der Hub konnte nicht vollständig geladen werden. '), el('span', '', error.message),
    button('Erneut laden', () => location.reload()));
  $('startup').hidden = false; $('startup').setAttribute('role', 'alert');
});

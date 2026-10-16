import { scenarios, categories } from './phishing-quiz-data.js';
import { createInspector } from './phishing-quiz-inspector.js';

const root = document.getElementById('quiz-stage');
const intro = document.getElementById('quiz-intro');
const start = document.getElementById('quiz-start');
const state = { phase: 'intro', index: 0, answers: [] };
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const current = () => scenarios[state.index];
const list = items => `<ul>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
const microsoft = '<span class="pq-ms-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';

const icons = {
  reply: '<path d="m9 5-6 5 6 5M3 10h10a5 5 0 0 1 5 5"/>',
  forward: '<path d="m11 5 6 5-6 5M17 10H7a5 5 0 0 0-5 5"/>',
  more: '<circle cx="4" cy="10" r="1"/><circle cx="10" cy="10" r="1"/><circle cx="16" cy="10" r="1"/>',
  attachment: '<path d="m7 11 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l8-8M5 12l7-7"/>',
  search: '<circle cx="8" cy="8" r="5"/><path d="m12 12 5 5"/>',
  back: '<path d="m9 4-6 6 6 6M3 10h14"/>',
  person: '<circle cx="10" cy="6" r="3"/><path d="M3 18v-2a7 7 0 0 1 14 0v2"/>',
  print: '<path d="M5 7V2h10v5M5 15H2V7h16v8h-3M5 12h10v6H5zM14 10h1"/>',
  building: '<path d="M3 18V4l7-2 7 2v14M1 18h18M7 6h1m4 0h1M7 10h1m4 0h1M8 18v-4h4v4"/>',
  parcel: '<path d="m2 5 8-3 8 3v10l-8 3-8-3zM2 5l8 3 8-3M10 8v10M6 3.5l8 3v4"/>',
  bike: '<circle cx="5" cy="14" r="4"/><circle cx="15" cy="14" r="4"/><path d="m5 14 4-8 6 8M9 6h5M7 3h4M14 3h2l2 3"/>',
  signal: '<path d="M3 17v-3M7 17v-6M11 17V7M15 17V3"/>',
  wifi: '<path d="M2 7a12 12 0 0 1 16 0M5 10a7 7 0 0 1 10 0M8 13a3 3 0 0 1 4 0"/><circle cx="10" cy="16" r=".5"/>',
  battery: '<rect x="1" y="5" width="15" height="10" rx="2"/><path d="M19 8v4M4 8h9v4H4z"/>'
};
const icon = name => `<svg class="pq-ui-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const brandMark = s => s.content.brand.startsWith('Microsoft') ? microsoft : icon(s.content.avatar || 'building');

function inspectionPoint(id) {
  const s = current();
  if (id === 'reply') return { title: 'Antwortadresse', value: s.inspections.find(p => p.id === 'sender').replyTo || s.inspections.find(p => p.id === 'sender').value };
  const point = (s.content.results || s.inspections).find(item => item.id === id);
  if (!point) return null;
  if (s.type === 'search') return { title: 'Domain', value: new URL(point.url).hostname };
  const title = { sender: s.type === 'sms' ? 'Absender' : 'Tatsächlicher Absender', link: 'Zieladresse', qr: 'QR-Ziel', address: 'Adresse', login: 'Zieladresse', attachment: 'Anhang' }[id] || 'Details';
  return { title, value: point.value };
}
const inspector = createInspector(root, inspectionPoint);

function inspection(scenario, id, className = '', visual = '') {
  const point = scenario.inspections.find(item => item.id === id);
  if (!point) return '';
  return `<span class="pq-inspect-wrap ${className}"><button type="button" class="pq-inspect" data-inspect="${esc(id)}" aria-expanded="false" aria-controls="quiz-inspector" aria-label="${esc(point.label)} – Details prüfen">${visual || esc(point.label)}</button></span>`;
}

function messageText(s, id) {
  const point = s.inspections.find(item => item.id === id);
  return point ? `<p class="pq-pressure" data-clue="${id}">${esc(point.label)}</p>` : '';
}

function searchScenario(s) {
  return `<div class="pq-search">
    <div class="pq-search-top"><span class="pq-search-brand">Suche<span>.</span></span><div class="pq-search-query">${esc(s.content.query)}${icon('search')}</div></div>
    <div class="pq-search-tabs"><span>Alle</span><span>Bilder</span><span>Shopping</span><span>News</span></div>
    <p class="pq-small pq-search-note">Ergebnisse für deine Suche</p>
    ${s.content.results.map(result => `<article class="pq-search-result" data-target="${esc(result.id)}">
      ${result.sponsored ? '<span class="pq-sponsored">Gesponsert</span>' : ''}
      <div class="pq-search-source"><span class="pq-favicon" aria-hidden="true">${esc(result.brand.charAt(0))}</span><div><strong>${esc(result.brand)}</strong><button type="button" class="pq-domain" data-inspect="${esc(result.id)}" aria-expanded="false" aria-controls="quiz-inspector">${esc(new URL(result.url).hostname)}</button></div></div>
      <button type="button" class="pq-result-title" data-answer="${esc(result.id)}" data-preview="${esc(result.id)}">${esc(result.title)}</button>
      <p>${esc(result.description)}</p>
      <div class="pq-touch-confirm" hidden><button type="button" class="pq-open-result" data-answer="${esc(result.id)}">Dieses Resultat öffnen</button></div>
    </article>`).join('')}</div>`;
}

function emailScenario(s) {
  const c = s.content;
  const business = s.type === 'business';
  const sender = s.inspections.find(point => point.id === 'sender');
  return `<div class="pq-mail">
    <div class="pq-mail-toolbar"><span aria-hidden="true">${icon('back')}</span><span>Posteingang</span><details class="pq-mail-details"><summary aria-label="Nachrichtendetails">${icon('more')}</summary><dl><dt>Von</dt><dd>${esc(sender.value)}</dd><dt>An</dt><dd>${esc(c.to.replace(/^An:? /, ''))}</dd><dt>Datum</dt><dd>${esc(c.time)}</dd><dt>Antwort an</dt><dd>${esc(sender.replyTo || sender.value)}</dd></dl></details></div>
    <div class="pq-mail-envelope"><h3>${esc(c.subject)}</h3><div class="pq-sender-row"><span class="pq-avatar" aria-hidden="true">${business ? icon('person') : brandMark(s)}</span><div>${inspection(s, 'sender')}<span class="pq-small">${esc(c.to)}</span></div><time class="pq-mail-time">${esc(c.time)}</time><button class="pq-mail-reply" type="button" data-inspect="reply" aria-label="Antwortadresse prüfen" aria-expanded="false" aria-controls="quiz-inspector">${icon('reply')}</button></div></div>
    <div class="pq-mail-body ${business ? 'pq-business-body' : ''}">
      <div class="pq-mail-brand">${brandMark(s)}<span>${esc(c.brand)}</span></div>
      <h3>${esc(c.heading)}</h3>${c.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}
      ${messageText(s, business ? 'pressure' : 'deadline')}
      ${business ? '' : inspection(s, 'link', 'pq-mail-cta')}
      ${inspection(s, 'attachment', 'pq-attachment', s.inspections.find(p => p.id === 'attachment') ? icon('attachment') + esc(s.inspections.find(p => p.id === 'attachment').label) : '')}
      <p class="pq-mail-signature">${esc(c.footer)}</p>
    </div><div class="pq-mail-actions"><button type="button" data-inspect="reply" aria-expanded="false" aria-controls="quiz-inspector">${icon('reply')} Antworten</button><details class="pq-forward"><summary>${icon('forward')} Weiterleiten</summary><div><p><strong>An:</strong> Empfänger auswählen</p><p class="pq-small">${esc(c.subject)}</p><span class="pq-small">Entwurf · nicht gesendet</span></div></details></div></div>`;
}

// Decorative, deliberately incomplete QR pattern: contains no encoded data or payment.
function qrPattern() {
  let cells = '';
  for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
    const inFinder = (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16);
    if (!inFinder && (x * 13 + y * 7 + x * y) % 11 < 5) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="-3 -3 31 31" aria-hidden="true"><g fill="currentColor">${cells}</g><g fill="none" stroke="currentColor" stroke-width="2"><path d="M1 7V1h6M18 1h6v6M1 18v6h6"/></g><rect x="8" y="9" width="10" height="7" fill="white"/></svg>`;
}

function qrScenario(s) {
  const c = s.content;
  return `<div class="pq-letter"><div class="pq-letter-head"><strong><span aria-hidden="true">P</span> ${esc(c.brand)}</strong><span>RECHNUNG</span></div><p class="pq-small">${esc(c.reference)}</p><h3>${esc(c.heading)}</h3>${c.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}<div class="pq-invoice-amount"><span>Offener Betrag</span><strong>${esc(c.amount)}</strong></div><div class="pq-qr-row">${inspection(s, 'qr', 'pq-qr-code', qrPattern())}<div><strong>Bequem online bezahlen</strong><p>QR-Code scannen und Zahlung abschliessen.</p></div></div>${messageText(s, 'deadline')}</div>`;
}

function loginScenario(s) {
  const c = s.content;
  return `<div class="pq-browser"><div class="pq-browser-tab"><span aria-hidden="true">▧</span> ${esc(c.brand)} · Dokumente <span aria-hidden="true">×</span></div><div class="pq-browser-bar"><span class="pq-browser-dots" aria-hidden="true">← → ⟳</span>${inspection(s, 'address', 'pq-address')}</div><div class="pq-login-background"><div class="pq-login-card"><div class="pq-mail-brand">${brandMark(s)}<span>${esc(c.brand)}</span></div><div class="pq-document" aria-hidden="true">PDF<span>≡</span></div><p class="pq-small">${esc(c.document)}</p><h3>${esc(c.heading)}</h3>${c.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}${inspection(s, 'login', 'pq-mail-cta')}</div></div></div>`;
}

function smsScenario(s) {
  const c = s.content;
  return `<div class="pq-phone-surround"><div class="pq-phone"><div class="pq-phone-status"><strong>${esc(c.time)}</strong><span aria-hidden="true">${icon('signal')}${icon('wifi')}${icon('battery')}</span></div><div class="pq-phone-contact"><span class="pq-avatar" aria-hidden="true">${icon(c.avatar || 'person')}</span>${inspection(s, 'sender')}</div><p class="pq-phone-time">${esc(c.received)}</p><div class="pq-message"><p>${esc(c.message)}</p>${inspection(s, 'link', 'pq-sms-link')}</div><div class="pq-phone-input" aria-hidden="true"><span>+</span><span>Nachricht</span><span>↑</span></div><div class="pq-phone-bottom" aria-hidden="true"></div></div></div>`;
}

const renderers = { search: searchScenario, email: emailScenario, qr: qrScenario, login: loginScenario, sms: smsScenario, business: emailScenario };

function moveFocus(element, scrollTarget = element) {
  element.focus({ preventScroll: true });
  // Keep long pages from gliding past the new question; CSS handles the short reveal.
  scrollTarget.scrollIntoView({ behavior: 'instant', block: 'start' });
}

function progress() {
  const completed = state.answers.length;
  return `<div class="pq-progress-head"><a href="/learn/">← Swissploit Learn</a><span>Szenario <strong>${state.index + 1}</strong> / ${scenarios.length}</span><span class="pq-progress-label">${completed} abgeschlossen</span></div><progress class="pq-progress" max="${scenarios.length}" value="${completed}" aria-label="Abgeschlossene Szenarien">${completed} / ${scenarios.length}</progress>`;
}

function renderScenario() {
  const s = current();
  state.phase = 'active';
  inspector.close();
  root.dataset.phase = state.phase;
  root.innerHTML = `${progress()}<div class="pq-question-row"><div class="pq-scenario-heading"><p class="pq-eyebrow">${esc(s.label)}</p><h2 id="quiz-title" tabindex="-1">${esc(s.question)}</h2><p>${esc(s.intro)}</p></div>
    ${s.type === 'search' ? '' : `<div class="pq-decision" role="group" aria-labelledby="quiz-title">${s.choices.map(choice => `<button type="button" class="pq-choice" data-answer="${esc(choice.id)}">${esc(choice.label)}</button>`).join('')}</div>`}</div>
    ${state.index === 0 ? '<p class="pq-first-tip">Tipp: Du kannst Absender und Links genauer untersuchen.</p>' : ''}
    <section id="quiz-feedback" class="pq-feedback" aria-labelledby="quiz-feedback-title" hidden></section>
    <div class="pq-evidence"><div class="pq-simulation-label"><span aria-hidden="true">◉</span> Sichere Simulation <span>Keine externen Ziele werden geöffnet</span></div><div class="pq-surface">${renderers[s.type](s)}</div></div>
    <div class="pq-next-row" hidden><button type="button" class="btn primary pq-next" data-action="next">${state.index === scenarios.length - 1 ? 'Mein Ergebnis ansehen' : 'Weiter · nächstes Szenario'} <span aria-hidden="true">→</span></button></div>
    <p id="quiz-announcement" class="pq-sr-only" role="status" aria-live="polite" aria-atomic="true"></p>`;
  moveFocus(document.getElementById('quiz-title'), root);
}

function resourceLinks(s) {
  return [['learnArticleUrl', 'learnArticleTitle', 'Mehr dazu auf Swissploit Learn'], ['videoUrl', 'videoTitle', 'Passendes Swissploit-Video ansehen']].map(([urlKey, titleKey, label]) => {
    if (!s[urlKey]) return '';
    let url;
    try { url = new URL(s[urlKey], location.origin); } catch { return ''; }
    if (url.protocol !== 'https:' && !(url.origin === location.origin && s[urlKey].startsWith('/'))) return '';
    return `<a class="pq-text-link" href="${esc(s[urlKey])}" target="_blank" rel="noopener noreferrer">${label} ↗${s[titleKey] ? `<span>${esc(s[titleKey])}</span>` : ''}<span class="pq-sr-only"> (neuer Tab)</span></a>`;
  }).join('');
}

function answer(id, button) {
  if (state.phase !== 'active') return;
  const s = current();
  const choice = s.choices.find(item => item.id === id);
  if (!choice) return;
  const correct = id === s.correctAnswer;
  state.answers.push({ id: s.id, choice: id, correct });
  state.phase = 'answered';
  root.dataset.phase = state.phase;
  inspector.close();
  root.querySelectorAll('.pq-touch-confirm').forEach(el => { el.hidden = true; });
  root.querySelectorAll('[data-answer]').forEach(el => {
    el.disabled = true;
    if (el.dataset.answer === id) el.classList.add('is-selected');
  });
  const result = s.content.results?.find(item => item.id === id);
  const title = correct ? '✓ Richtig geprüft' : s.kind === 'legitimate' ? '✕ Nicht richtig – diese Situation war legitim.' : s.type === 'search' && id === 'ad' ? '✕ Nicht die offizielle Verkaufsstelle' : '✕ Das wäre die Falle gewesen.';
  const target = s.type === 'search' ? button.closest('.pq-search-result') : button;
  target.classList.add(correct ? 'is-success' : 'is-risk');
  if (s.type === 'search') {
    const official = root.querySelector(`[data-target="${s.correctAnswer}"]`);
    official.classList.add('is-success');
    if (!correct) official.insertAdjacentHTML('beforeend', '<span class="pq-official">✓ Offizielles Angebot</span>');
  }
  root.querySelector('.pq-progress').value = state.answers.length;
  root.querySelector('.pq-progress-label').textContent = `${state.answers.length} abgeschlossen`;
  const seen = new Set();
  s.redFlags.forEach(flag => {
    if (!flag.target || seen.has(flag.target)) return;
    seen.add(flag.target);
    root.querySelectorAll(`[data-inspect="${flag.target}"], [data-clue="${flag.target}"]`).forEach(el => {
      el.classList.add(s.kind === 'legitimate' ? 'is-confirmed' : 'is-flagged');
      el.style.setProperty('--cue-delay', `${400 + seen.size * 80}ms`);
    });
  });
  const feedback = document.getElementById('quiz-feedback');
  feedback.hidden = false;
  feedback.innerHTML = `<div class="pq-feedback-inner"><div class="pq-feedback-content"><div class="pq-local-feedback" data-correct="${correct}" tabindex="-1"><h3 id="quiz-feedback-title">${title}</h3><p>${esc(result?.feedback || s.summary)}</p></div><div class="pq-short-reasons">${list(s.redFlags.slice(0, 2).map(flag => flag.title))}</div><p class="pq-protection">${esc(s.protectionTips[0])}</p>
    <details class="pq-more"><summary>Mehr über ${s.kind === 'legitimate' ? 'diese Situation' : 'diesen Angriff'} erfahren</summary><p>${esc(s.explanation)}</p>${list(s.redFlags.map(flag => flag.text))}${s.learningNote ? `<p>${esc(s.learningNote)}</p>` : ''}</details>
    <div class="pq-resources">${resourceLinks(s)}</div></div></div>`;
  root.querySelector('.pq-next-row').hidden = false;
  feedback.querySelector('.pq-local-feedback').focus({ preventScroll: true });
  revealFeedback(feedback);
  document.getElementById('quiz-announcement').textContent = `${title} ${result?.feedback || s.summary}`;
}

function revealFeedback(feedback) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const settle = () => {
    if (!feedback.isConnected) return;
    const header = document.querySelector('.site-header').getBoundingClientRect();
    const top = Math.max(16, header.bottom + 16);
    const verdict = feedback.querySelector('.pq-local-feedback').getBoundingClientRect();
    const bottom = Math.min(feedback.getBoundingClientRect().bottom, verdict.bottom + 72);
    // Reveal only the verdict and first cues. Preserve context when already visible.
    const questionTop = document.getElementById('quiz-title').getBoundingClientRect().top;
    const delta = verdict.top < top
      ? Math.max(questionTop - top, bottom - (innerHeight - 24))
      : Math.max(0, bottom - (innerHeight - 24));
    if (Math.abs(delta) > 1) scrollBy({ top: delta, behavior: reduced ? 'instant' : 'smooth' });
  };
  if (reduced) settle();
  else feedback.addEventListener('animationend', event => {
    if (event.target === feedback) settle();
  }, { once: true });
}

function renderResult() {
  state.phase = 'result';
  root.dataset.phase = state.phase;
  const score = state.answers.filter(answer => answer.correct).length;
  root.innerHTML = `<div class="pq-result-heading"><p class="pq-eyebrow">DEINE AUSWERTUNG</p><h2 id="quiz-result-title" tabindex="-1">Dein Phishing-Radar</h2><p class="pq-score"><strong>${score} von ${scenarios.length}</strong> Situationen richtig erkannt</p></div>
    <div class="pq-category-grid">${Object.entries(categories).map(([id, label]) => {
      const relevant = scenarios.filter(s => s.categories.includes(id));
      const hits = relevant.filter(s => state.answers.some(answer => answer.id === s.id && answer.correct)).length;
      const rating = hits === relevant.length ? 'Sehr gut' : hits >= relevant.length / 2 ? 'Gut' : 'Hier lohnt sich genaueres Hinschauen';
      return `<div><span>${esc(label)}</span><strong>${rating}</strong><meter min="0" max="${relevant.length}" value="${hits}" aria-label="${esc(label)}: ${hits} von ${relevant.length}"></meter></div>`;
    }).join('')}</div>
    <section class="pq-takeaways" aria-labelledby="quiz-takeaways-title"><h3 id="quiz-takeaways-title">Die drei wichtigsten Dinge aus dem Quiz</h3><ol><li>Prüfe die tatsächliche Domain.</li><li>Verifiziere ungewöhnliche Anfragen über einen zweiten Kanal.</li><li>Lass dich durch Zeitdruck nicht zu schnellen Entscheidungen drängen.</li></ol></section>
    <div class="pq-result-actions"><a class="btn primary" href="/learn/">Mehr auf Swissploit Learn →</a><button type="button" class="pq-text-button" data-action="restart">Nochmals versuchen ↻</button></div><p class="pq-result-note">Eine Lernübung, kein Sicherheitsnachweis. Deine Antworten werden nicht gespeichert oder übermittelt.</p>`;
  moveFocus(document.getElementById('quiz-result-title'), root);
}

function begin() {
  state.index = 0;
  state.answers = [];
  intro.hidden = true;
  root.hidden = false;
  renderScenario();
}

// Touch toggles inspection; an explicit action confirms the selected result.
// Desktop and keyboard activation of a result title decide immediately.
let pointerType = '';
root.addEventListener('pointerdown', event => { pointerType = event.pointerType; });
root.addEventListener('keydown', () => { pointerType = ''; });
root.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.answer) {
    if (button.dataset.preview && pointerType === 'touch') {
      const open = inspector.toggle(button, true);
      root.querySelectorAll('.pq-touch-confirm').forEach(el => { el.hidden = true; });
      button.closest('.pq-search-result').querySelector('.pq-touch-confirm').hidden = !open;
    } else answer(button.dataset.answer, button);
  } else if (button.dataset.inspect) {
    inspector.toggle(button, pointerType === 'touch');
  }
  if (button.dataset.action === 'next' && state.phase === 'answered') {
    state.index++;
    state.index < scenarios.length ? renderScenario() : renderResult();
  } else if (button.dataset.action === 'restart') begin();
});

start.addEventListener('click', begin);
start.disabled = false;
document.getElementById('quiz-load-note').hidden = true;

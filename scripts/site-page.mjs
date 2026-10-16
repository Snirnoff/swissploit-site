import { renderSiteHeaderHtml } from './site-header.mjs';
import { renderSiteFooterHtml } from './site-footer.mjs';
export const escape = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function pageHead({ title, description, route, styles = [], scripts = [] }) {
  return `<!doctype html>
<html lang="de" data-theme="dark"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} | Swissploit</title><meta name="description" content="${escape(description)}">
<link rel="canonical" href="https://swissploit.ch${route}">
<meta property="og:title" content="${escape(title)} | Swissploit"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="website"><meta property="og:url" content="https://swissploit.ch${route}"><meta property="og:image" content="https://swissploit.ch/assets/swissploit-og.png">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)} | Swissploit"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="https://swissploit.ch/assets/swissploit-og.png">
<link rel="icon" type="image/png" href="/assets/swissploit-signet-48.png"><link rel="apple-touch-icon" href="/assets/swissploit-signet-180.png"><meta name="theme-color" content="#05070b">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>try{if(localStorage.getItem('swissploit-theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}</script>
<link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/navigation.css"><link rel="stylesheet" href="/assets/homepage/homepage.css"><link rel="stylesheet" href="/assets/business/business.css"><link rel="stylesheet" href="/assets/product-pages.css">
${styles.map(src=>`<link rel="stylesheet" href="${src}">`).join('\n')}
<script defer src="/assets/app.js"></script>${scripts.map(src=>`<script type="module" src="${src}"></script>`).join('\n')}
</head>`;
}
export const footer = renderSiteFooterHtml();
export function productPage(meta, content, schema = '') {
  return pageHead(meta)+`<body class="core-test-page business-page product-page"><a class="core-test-skip" href="#main">Zum Inhalt</a>${renderSiteHeaderHtml('de')}
<main id="main" class="business-main">${content}${footer}</main>${schema}</body></html>`;
}
export const icons = {
  'security-check':'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><path class="service-accent" d="M6 12h12"/><path d="m8 13 3 3 6-7"/>',
  'datenschutz-care':'<path d="M13 4H4v17h9M7 8h4m-4 4h3"/><path class="service-accent" d="m17 8 5 2v4c0 3-3 5-5 6-2-1-5-3-5-6v-4Zm-3 5 2 2 3-3"/>',
  'incident-readiness':'<circle cx="5" cy="12" r="3"/><circle cx="19" cy="12" r="3"/><path d="M8 12h8M5 6V3h14v3"/><circle class="service-accent" cx="12" cy="12" r="1.5"/>',
  quiz:'<path d="M14 3H4v18h9M7 7h4m-4 4h3"/><circle cx="16" cy="14" r="4"/><path d="m19 17 3 3"/>',
  game:'<path d="M2 12c4-6 10-6 14 0-4 6-10 6-14 0Zm14 0 6-4v8Z"/><circle cx="7" cy="11" r=".6"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>'
};
export const icon = (name, className = '') => `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
export function moduleCard(module) {
  if(module.business) return `<details class="interactive-card is-business"><summary><span class="module-label">Business</span>${icon('lock','interactive-icon')}<h3>${escape(module.title)}</h3><p>${escape(module.description)}</p><span class="module-action">Modulvorschau ansehen</span><span class="lock-hint">Nur mit Swissploit Learn for Business verfügbar.</span></summary><div class="locked-detail"><p>Zusätzliche Quiz und Lernmodule für Unternehmen. Dieses Modul ist eine Produktvorschau und noch nicht spielbar.</p><a class="core-test-secondary" href="/unternehmen/#dashboard">Learn for Business entdecken</a></div></details>`;
  return `<a class="interactive-card" href="${module.href}">
  <span class="module-label">Kostenlos · Jetzt spielen</span>${icon(module.kind,'interactive-icon')}
  <h3>${escape(module.title)}</h3><p>${escape(module.description)}</p>
  <span class="module-action">${module.action} →</span></a>`;
}

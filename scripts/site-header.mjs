// One static header for the homepage, services and both Learn languages.
export function renderSiteHeaderHtml(lang = 'de', { home = false, learn = false, services = false } = {}) {
  const en = lang === 'en';
  const base = home ? '' : '/';
  const label = en ? 'Main navigation' : 'Hauptnavigation';
  return `<header class="site-header shared-header" role="banner">
    <div class="site-header-inner">
      <a class="site-brand" href="${base}#intro" aria-label="Swissploit ${en ? 'Home' : 'Startseite'}">
        <span class="site-signet" aria-hidden="true"><img src="/assets/Swissploit_S_blue2.png" alt="" width="1254" height="1254" decoding="async"></span>
        <span>Swissploit</span>
      </a>
      <nav id="primaryNav" class="site-nav" aria-label="${label}">
        <a href="${base}#services"${services ? ' class="is-active" aria-current="location"' : ''}>Services</a>
        <a href="${base}#ueber">${en ? 'About Swissploit' : 'Über Swissploit'}</a>
        <a href="${base}#kontakt">${en ? 'Contact' : 'Kontakt'}</a>
        <a class="site-learn${learn ? ' is-active' : ''}" href="${en ? '/en/learn/' : '/learn/'}"${learn ? ' aria-current="page"' : ''}><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 5v12M2 3.5c3-1 5-.5 8 1.5 3-2 5-2.5 8-1.5v12c-3-1-5-.5-8 1.5-3-2-5-2.5-8-1.5z"/></svg>Learn<span aria-hidden="true">↗</span></a>
        <a class="site-check" href="mailto:hello@swissploit.ch?subject=Security%20Check%20anfragen">Security Check</a>
      </nav>
      <button id="themeToggle" class="site-theme" type="button" aria-pressed="true" aria-label="${en ? 'Toggle dark theme' : 'Dunkle Darstellung umschalten'}" title="${en ? 'Light / dark' : 'Hell / Dunkel'}"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none"/><path d="M10 3a7 7 0 0 0 0 14z" stroke="none"/></svg></button>
    </div>
  </header>
  <button id="menuToggle" class="site-menu-control" type="button" aria-expanded="false" aria-controls="navigationDialog" aria-label="${en ? 'Open menu' : 'Menü öffnen'}"><span></span><span></span></button>
  <dialog id="navigationDialog" class="site-menu-dialog" aria-label="${label}">
    <button class="site-menu-control menu-close" type="button" aria-label="${en ? 'Close menu' : 'Menü schliessen'}" autofocus><span></span><span></span></button>
    <span class="site-menu-label">Swissploit</span>
    <div class="menu-content"></div>
  </dialog>`;
}

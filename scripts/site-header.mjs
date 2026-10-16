// One static header for the homepage, services and both Learn languages.
export function renderSiteHeaderHtml(lang = 'de', { home = false, learn = false, services = false } = {}) {
  const en = lang === 'en';
  const label = en ? 'Main navigation' : 'Hauptnavigation';
  return `<header class="site-header shared-header" role="banner">
    <div class="site-header-inner">
      <a class="site-brand" href="/" aria-label="Swissploit ${en ? 'Home' : 'Startseite'}">
        <span class="site-signet" aria-hidden="true"><img src="/assets/Swissploit_S_blue2.png" alt="" width="1254" height="1254" decoding="async"></span>
        <span>Swissploit</span>
      </a>
      <nav id="primaryNav" class="site-nav" aria-label="${label}">
        <a href="${en ? '/en/learn/' : '/learn/'}" data-core="learn">Learn</a>
        <a href="${en ? '/en/learn/' : '/learn/'}?format=video" data-core="shorts">Videos</a>
        <a href="/quiz-games/" data-core="quiz-games">Quiz &amp; Games</a>
        <a href="/unternehmen/" data-core="business">${en ? 'For business' : 'Für Unternehmen'}</a>
        <a href="/ueber-swissploit/" data-core="neutral">${en ? 'About Swissploit' : 'Über Swissploit'}</a>
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

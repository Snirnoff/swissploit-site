// A single static footer, available before JavaScript and shared by every page.
export function renderSiteFooterHtml(lang = 'de') {
  const en = lang === 'en';
  const learn = en ? '/en/learn/' : '/learn/';
  return `<footer class="site-footer" role="contentinfo"><div class="site-footer-inner">
    <span>© <span data-site-year>${new Date().getFullYear()}</span> Swissploit</span>
    <nav aria-label="${en ? 'Footer navigation' : 'Footernavigation'}"><a href="${learn}">Learn</a><a href="${learn}?format=video">Videos</a><a href="/quiz-games/">Quiz &amp; Games</a><a href="/unternehmen/">${en ? 'For business' : 'Für Unternehmen'}</a><a href="/ueber-swissploit/">${en ? 'About Swissploit' : 'Über Swissploit'}</a><a href="/ueber-swissploit/#kontakt">${en ? 'Contact' : 'Kontakt'}</a></nav>
  </div></footer>`;
}

// assets/transition.js
(function pageTransitions(){
  if(window.__SWISSPLOIT_PAGE_TRANSITIONS_BOUND) return;
  window.__SWISSPLOIT_PAGE_TRANSITIONS_BOUND = true;

  const body = document.body;

  // Entfernt "leaving" Zustände zuverlässig
  function resetTransitionState(){
    body.classList.remove('is-leaving');
  }

  // Beim normalen Laden
  resetTransitionState();

  // Wichtig: Beim Zurück/Weiter (bfcache) wird oft KEIN Reload gemacht.
  window.addEventListener('pageshow', (e) => {
    // e.persisted === true -> aus bfcache
    resetTransitionState();
  });
  window.addEventListener('pagehide', resetTransitionState);
  document.addEventListener('visibilitychange', () => {
    if(!document.hidden) resetTransitionState();
  });

  document.addEventListener('click', (e) => {
    if(e.defaultPrevented) return;

    const a = e.target.closest('a[data-transition]');
    if(!a) return;

    const href = a.getAttribute('href');
    if(!href) return;
    if(href.startsWith('#')) return;

    if(a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const url = new URL(href, window.location.href);
    if(url.origin !== window.location.origin) return;

    e.preventDefault();

    // falls wir aus bfcache kommen und noch was hängt:
    resetTransitionState();

    body.classList.add('is-leaving');

    window.setTimeout(() => {
      window.location.href = url.href;
    }, 320);
  });
})();

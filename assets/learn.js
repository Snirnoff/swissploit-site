// Static article and video cards share search and filter controls.
(function () {
  const searchInput = document.getElementById('blogSearch');
  const articles = document.getElementById('blogGrid');
  const videos = document.getElementById('videoGrid');
  if (!searchInput || !articles || !videos) return;
  const lang = document.documentElement.lang || 'de';
  const isEnglish = lang === 'en';
  const buttons = [...document.querySelectorAll('[data-learn-filter]')];
  const empty = document.getElementById('noResults');
  const status = document.getElementById('learnResultStatus');
  const articleFilters = {
    phishing: ['phishing', 'smishing', 'quishing', 'qr-phishing', 'phishing-mail'],
    fraud: ['betrug', 'ceo-fraud', 'vishing', 'telefonbetrug', 'bankbetrug', 'support-scam', 'social-engineering', 'zahlungsbetrug'],
    'links-qr': ['links', 'link', 'phishing-link', 'url', 'domain', 'fake-login', 'qr-phishing', 'quishing', 'qr-code'],
    passwords: ['passwort', 'passwoerter', 'passwortmanager', 'credential-stuffing'],
    mfa: ['mfa', 'microsoft-authenticator', 'two-factor-authentication', 'conditional-access'],
    accounts: ['account-sicherheit', 'konto', 'login', 'anmeldedaten', 'fake-login', 'credential-stuffing', 'microsoft-authenticator', 'microsoft-365', 'entra-id', 'azure-ad'],
    workplace: ['security-buero', 'ceo-fraud', 'arbeitsplatz', 'mitarbeitende', 'unternehmen', 'kmu']
  };
  let activeFilter = 'all';
  function saveLanguage(value) {
    try { localStorage.setItem('swissploit-blog-lang', value); } catch {}
  }
  saveLanguage(lang);
  document.querySelectorAll('[data-lang-switch]').forEach(link => {
    link.addEventListener('click', () => saveLanguage(link.dataset.langSwitch));
  });
  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  function matchesArticleFilter(card) {
    if (activeFilter === 'all') return true;
    const values = new Set([
      card.dataset.topic,
      ...(card.dataset.tags || '').split('|'),
      card.querySelector('.blog-card-link')?.pathname.split('/').filter(Boolean).pop()
    ].map(normalize).filter(Boolean));
    return (articleFilters[activeFilter] || []).some(value => values.has(value));
  }
  function applyFilters() {
    const videoMode = activeFilter === 'video';
    const query = normalize(searchInput.value);
    articles.hidden = videoMode;
    videos.hidden = !videoMode;
    let count = 0;
    [...articles.children, ...videos.children].forEach(card => {
      const isVideo = card.classList.contains('learn-video-card');
      const searchable = normalize(card.dataset.search);
      const matches = isVideo === videoMode &&
        (videoMode || matchesArticleFilter(card)) &&
        (!query || searchable.includes(query));
      card.hidden = !matches;
      if (matches) count++;
    });
    empty.hidden = count !== 0;
    document.getElementById('noResultsText').textContent = videoMode
      ? (isEnglish ? 'No matching videos found.' : 'Keine passenden Videos gefunden.')
      : (isEnglish ? 'No matching content found.' : 'Keine passenden Inhalte gefunden.');
    status.textContent = isEnglish ? `${count} ${videoMode ? 'videos' : 'articles'} shown.`
      : `${count} ${videoMode ? 'Videos' : 'Artikel'} angezeigt.`;
  }
  searchInput.addEventListener('input', applyFilters);
  searchInput.addEventListener('search', applyFilters);
  buttons.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.learnFilter;
    buttons.forEach(item => {
      item.classList.toggle('is-active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    applyFilters();
  }));
  applyFilters();
})();

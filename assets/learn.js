// Search, filters and reading state enhance the existing static cards.
(function () {
  const searchInput = document.getElementById('blogSearch');
  const content = document.getElementById('blogGrid');
  if (!searchInput || !content) return;

  const lang = window.SWISSPLOIT_INDEX_LANG || document.documentElement.lang || 'de';
  const isEnglish = lang === 'en';
  const cards = Array.from(content.querySelectorAll('.blog-card'));
  const filterButtons = Array.from(document.querySelectorAll('[data-learn-filter]'));
  const featured = document.querySelector('.learn-featured');
  const emptyState = document.getElementById('noResults');
  const resultStatus = document.getElementById('learnResultStatus');
  const progressText = document.getElementById('learnProgressText');
  const progressBar = document.getElementById('learnProgressBar');
  const resume = document.getElementById('learnContinue');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeFilter = 'all';
  let filterRun = 0;
  let hideTimer = 0;

  cards.forEach(card => {
    card.classList.add('reveal');
    card.dataset.learnPath = new URL(card.querySelector('.blog-card-link').href).pathname;
  });

  function updateReadingState() {
    let readCount = 0;
    let candidate = null;
    cards.forEach(card => {
      const state = readingState.get(card.dataset.learnPath);
      const status = card.querySelector('.learn-card-status');
      card.classList.toggle('is-read', state.read);
      status?.setAttribute('aria-hidden', String(!state.read));
      const link = card.querySelector('.blog-card-link');
      if (state.read) {
        readCount += 1;
        link.setAttribute('aria-describedby', status.id);
      } else {
        link.removeAttribute('aria-describedby');
        if (state.progress > 0 && (!candidate || state.updated > candidate.state.updated ||
          (state.updated === candidate.state.updated && state.progress > candidate.state.progress))) {
          candidate = { card, state };
        }
      }
    });
    if (progressText) progressText.textContent = isEnglish
      ? `${readCount} ${readCount === 1 ? 'article' : 'articles'} read · ${cards.length - readCount} open`
      : `${readCount} Artikel gelesen · ${cards.length - readCount} offen`;
    if (progressBar) progressBar.style.transform = `scaleX(${cards.length ? readCount / cards.length : 0})`;

    if (!resume) return;
    resume.hidden = !candidate;
    if (!candidate) return;
    const { card, state } = candidate;
    const percent = Math.round(state.progress * 100);
    document.getElementById('learnContinueTitle').textContent = card.querySelector('.blog-card-title').textContent;
    document.getElementById('learnContinueText').textContent = isEnglish ? `${percent}% read` : `${percent} % gelesen`;
    document.getElementById('learnContinueBar').style.transform = `scaleX(${state.progress})`;
    document.getElementById('learnContinueLink').href = card.querySelector('.blog-card-link').getAttribute('href');
  }

  function saveLanguage(value) {
    try { localStorage.setItem('swissploit-blog-lang', value); } catch (error) {}
  }
  saveLanguage(lang);
  document.querySelectorAll('[data-lang-switch]').forEach(link => {
    link.addEventListener('click', () => saveLanguage(link.dataset.langSwitch));
  });

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function updateFeaturedVisibility() {
    if (!featured) return;
    const collapsed = document.activeElement === searchInput || Boolean(searchInput.value.trim());
    featured.classList.toggle('is-collapsed', collapsed);
    featured.setAttribute('aria-hidden', String(collapsed));
    featured.toggleAttribute('inert', collapsed);
  }

  function applyFilters() {
    const run = ++filterRun;
    clearTimeout(hideTimer);
    const query = normalize(searchInput.value);
    let count = 0;
    const entering = [];
    const leaving = [];

    cards.forEach(card => {
      const searchable = normalize(card.dataset.search);
      const topic = normalize(card.dataset.topic);
      const matches = (activeFilter === 'all' || topic.includes(activeFilter) || searchable.includes(activeFilter)) &&
        (!query || searchable.includes(query));
      card.toggleAttribute('inert', !matches);
      if (matches) {
        card.style.setProperty('--learn-filter-delay', `${(count++ % 3) * 50}ms`);
        if (card.hidden || card.classList.contains('is-filtered-out')) {
          // Restore layout first; start the fade on the next painted frame.
          card.hidden = false;
          entering.push(card);
        }
      } else {
        card.classList.add('is-filtered-out');
        leaving.push(card);
        if (reduced.matches) card.hidden = true;
      }
    });
    const showMatches = () => {
      if (run !== filterRun) return;
      entering.forEach(card => card.classList.remove('is-filtered-out'));
    };
    if (reduced.matches) showMatches();
    else requestAnimationFrame(() => requestAnimationFrame(showMatches));
    if (!reduced.matches) hideTimer = window.setTimeout(() => {
      if (run === filterRun) leaving.forEach(card => { card.hidden = true; });
    }, 220);
    if (emptyState) emptyState.hidden = count !== 0;
    if (resultStatus) resultStatus.textContent = isEnglish
      ? `${count} ${count === 1 ? 'article' : 'articles'} shown.`
      : `${count} ${count === 1 ? 'Artikel wird' : 'Artikel werden'} angezeigt.`;
    updateFeaturedVisibility();
  }

  searchInput.addEventListener('focus', updateFeaturedVisibility);
  searchInput.addEventListener('blur', updateFeaturedVisibility);
  searchInput.addEventListener('input', applyFilters);
  searchInput.addEventListener('search', applyFilters);
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.learnFilter || 'all';
      filterButtons.forEach(item => {
        const selected = item === button;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      applyFilters();
    });
  });
  reduced.addEventListener('change', applyFilters);
  window.addEventListener('pageshow', updateReadingState);
  window.addEventListener('storage', event => {
    if (!event.key || event.key.startsWith('swissploit-read-')) updateReadingState();
  });
  updateReadingState();
  applyFilters();
})();

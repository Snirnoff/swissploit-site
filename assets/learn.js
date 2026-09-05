// Learn stays static, while search, filters and reading state remain client-side.
(function () {
  const searchInput = document.getElementById("blogSearch");
  const content = document.getElementById("blogGrid");
  const featured = document.querySelector(".learn-featured");
  const emptyState = document.getElementById("noResults");
  const resultStatus = document.getElementById("learnResultStatus");
  const lang = window.SWISSPLOIT_INDEX_LANG || document.documentElement.lang || "de";

  if (!searchInput || !content) return;

  const cards = Array.from(content.querySelectorAll(".blog-card"));
  const filterButtons = Array.from(document.querySelectorAll("[data-learn-filter]"));
  const progressText = document.getElementById("learnProgressText");
  const progressBar = document.getElementById("learnProgressBar");
  const readKey = "swissploit-read-articles";
  let activeFilter = "all";
  let filterRun = 0;
  let readArticles = new Set();

  try { readArticles = new Set(JSON.parse(localStorage.getItem(readKey) || "[]")); } catch (error) {}

  function cardPath(card) {
    return new URL(card.querySelector(".blog-card-link")?.getAttribute("href") || "", window.location.href).pathname;
  }

  function markCard(card) {
    card.classList.add("reveal");
    const path = cardPath(card);
    const read = readArticles.has(path);
    card.dataset.learnPath = path;
    card.classList.toggle("is-read", read);
    const body = card.querySelector(".blog-card-body");
    if (!body || body.querySelector(".learn-card-status")) return;
    const status = document.createElement("span");
    status.className = "learn-card-status";
    status.textContent = document.documentElement.lang === "en" ? "✓ Read" : "✓ Gelesen";
    status.setAttribute("aria-label", "Artikel gelesen");
    body.appendChild(status);

    let progress = 0;
    try { progress = Number(localStorage.getItem(`swissploit-read-${path}-progress`) || 0); } catch (error) {}
    if (!read && progress > .04 && progress < .96) {
      const link = card.querySelector(".blog-card-link");
      const continueLabel = document.createElement("span");
      continueLabel.className = "learn-card-continue";
      continueLabel.textContent = "Weiterlesen";
      link?.appendChild(continueLabel);
    }
  }

  cards.forEach(markCard);

  function updateProgress() {
    const total = cards.length;
    const readCount = cards.filter(card => readArticles.has(card.dataset.learnPath)).length;
    const openCount = Math.max(0, total - readCount);
    const isEnglish = document.documentElement.lang === "en";
    if (progressText) progressText.textContent = isEnglish
      ? `${readCount} ${readCount === 1 ? "article" : "articles"} read · ${openCount} open`
      : `${readCount} ${readCount === 1 ? "Artikel" : "Artikel"} gelesen · ${openCount} offen`;
    if (progressBar) progressBar.style.transform = `scaleX(${total ? readCount / total : 0})`;
  }

  try {
    localStorage.setItem("swissploit-blog-lang", lang);
  } catch (error) {}

  document.querySelectorAll("[data-lang-switch]").forEach((link) => {
    link.addEventListener("click", () => {
      const nextLang = link.getAttribute("data-lang-switch");
      if (!nextLang) return;
      try {
        localStorage.setItem("swissploit-blog-lang", nextLang);
      } catch (error) {}
    });
  });

  function normalize(value) {
    const text = String(value || "");
    try {
      return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    } catch (error) {
      return text.toLowerCase().trim();
    }
  }

  function updateFeaturedVisibility() {
    if (!featured) return;
    const shouldCollapse = document.activeElement === searchInput || Boolean(searchInput.value.trim());
    featured.classList.toggle("is-collapsed", shouldCollapse);
    featured.setAttribute("aria-hidden", String(shouldCollapse));
    featured.toggleAttribute("inert", shouldCollapse);
  }

  function applyFilters() {
    const currentRun = ++filterRun;
    const query = normalize(searchInput.value);
    let visibleCount = 0;

    cards.forEach((card, index) => {
      const searchable = normalize(card.dataset.search || card.textContent);
      const topic = normalize(card.dataset.topic || "");
      const filterMatch = activeFilter === "all" || topic.includes(activeFilter) || searchable.includes(activeFilter);
      const isVisible = filterMatch && (!query || searchable.includes(query));
      card.classList.toggle("is-filtered-out", !isVisible);
      card.style.setProperty("--learn-filter-delay", `${Math.min(index * 25, 180)}ms`);
      window.setTimeout(() => {
        if (currentRun === filterRun) card.hidden = !isVisible;
      }, isVisible ? 360 : 220);
      if (isVisible) visibleCount += 1;
    });

    if (emptyState) emptyState.hidden = visibleCount !== 0;
    if (resultStatus) {
      resultStatus.textContent = lang === "en"
        ? `${visibleCount} ${visibleCount === 1 ? "article" : "articles"} shown.`
        : `${visibleCount} ${visibleCount === 1 ? "Artikel wird" : "Artikel werden"} angezeigt.`;
    }

    updateFeaturedVisibility();
  }

  searchInput.addEventListener("focus", updateFeaturedVisibility);
  searchInput.addEventListener("blur", updateFeaturedVisibility);
  searchInput.addEventListener("input", applyFilters);
  searchInput.addEventListener("search", applyFilters);

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.learnFilter || "all";
      filterButtons.forEach(item => {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      applyFilters();
    });
  });

  updateProgress();
  applyFilters();
})();

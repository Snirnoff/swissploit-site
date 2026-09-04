// Live search and featured-video visibility for the static Learn index.
(function () {
  const searchInput = document.getElementById("blogSearch");
  const content = document.getElementById("blogGrid");
  const featured = document.querySelector(".learn-featured");
  const emptyState = document.getElementById("noResults");
  const resultStatus = document.getElementById("learnResultStatus");
  const lang = window.SWISSPLOIT_INDEX_LANG || document.documentElement.lang || "de";

  if (!searchInput || !content) return;

  const cards = Array.from(content.querySelectorAll(".blog-card"));

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

  function applySearch() {
    const query = normalize(searchInput.value);
    let visibleCount = 0;

    cards.forEach((card) => {
      const searchable = normalize(card.dataset.search || card.textContent);
      const isVisible = !query || searchable.includes(query);
      card.hidden = !isVisible;
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
  searchInput.addEventListener("input", applySearch);
  searchInput.addEventListener("search", applySearch);

  applySearch();
})();

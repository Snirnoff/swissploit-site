// assets/blog-index-static.js
(function () {
  const searchInput = document.querySelector("#blog-search");
  const blogGrid = document.querySelector("#blogGrid");
  const emptyState = document.querySelector("#blog-empty-state");
  const lang = window.SWISSPLOIT_INDEX_LANG || document.documentElement.lang || "de";

  if (lang) {
    localStorage.setItem("swissploit-blog-lang", lang);
  }

  document.querySelectorAll("[data-lang-switch]").forEach((link) => {
    link.addEventListener("click", () => {
      const nextLang = link.getAttribute("data-lang-switch");
      if (nextLang) {
        localStorage.setItem("swissploit-blog-lang", nextLang);
      }
    });
  });

  function normalize(value) {
    const text = String(value || "");
    try {
      return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    } catch (err) {
      return text.toLowerCase();
    }
  }

  function initBlogSearch() {
    if (!searchInput || !blogGrid) return;

    const blogCards = Array.from(blogGrid.querySelectorAll(".blog-card"));

    function filterCards() {
      const query = normalize(searchInput.value).trim();
      let visibleCount = 0;

      blogCards.forEach((card) => {
        const text = normalize(card.textContent);
        const matches = !query || text.includes(query);
        card.style.display = matches ? "" : "none";
        if (matches) visibleCount += 1;
      });

      if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
      }
    }

    searchInput.addEventListener("input", filterCards);
    searchInput.addEventListener("search", filterCards);
    searchInput.addEventListener("change", filterCards);
    searchInput.addEventListener("keyup", filterCards);
    filterCards();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBlogSearch);
  } else {
    initBlogSearch();
  }
})();
// assets/blog-index-static.js
(function () {
  const input = document.getElementById("blogSearch");
  const grid = document.getElementById("blogGrid");
  const noResults = document.getElementById("noResults");
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

  if (!grid || !input) return;

  const cards = Array.from(grid.querySelectorAll(".blog-card"));

  function applyFilter() {
    const q = String(input.value || "").trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const haystack = String(card.getAttribute("data-search") || "");
      const show = !q || haystack.includes(q);
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (noResults) {
      noResults.hidden = visible !== 0;
    }
  }

  input.addEventListener("input", applyFilter);
  applyFilter();
})();
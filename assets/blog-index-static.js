// assets/blog-index-static.js
(function () {
  const searchInput = document.querySelector("#blog-search, #blogSearch");
  const blogGrid = document.querySelector("#blogGrid");
  const emptyState = document.querySelector("#blog-empty-state, #noResults");
  const lang = window.SWISSPLOIT_INDEX_LANG || document.documentElement.lang || "de";
  const mobileBlogQuery = window.matchMedia && window.matchMedia("(max-width: 768px)");
  const desktopBlogQuery = window.matchMedia && window.matchMedia("(min-width: 769px)");
  const motionSafeQuery = window.matchMedia && window.matchMedia("(prefers-reduced-motion: no-preference)");
  let blogCardObserver = null;

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

      refreshBlogCardReveal();
    }

    searchInput.addEventListener("input", filterCards);
    searchInput.addEventListener("search", filterCards);
    searchInput.addEventListener("change", filterCards);
    searchInput.addEventListener("keyup", filterCards);
    filterCards();
  }

  function disconnectBlogCardObserver() {
    if (blogCardObserver) {
      blogCardObserver.disconnect();
      blogCardObserver = null;
    }
  }

  function getBlogRevealMode() {
    if (motionSafeQuery && !motionSafeQuery.matches) return "static";
    if (desktopBlogQuery && desktopBlogQuery.matches) return "desktop";
    if (mobileBlogQuery && mobileBlogQuery.matches) return "mobile";
    return "static";
  }

  function getBlogCards() {
    return blogGrid ? Array.from(blogGrid.querySelectorAll(".blog-card")) : [];
  }

  function syncBlogCardDelays(cards, mode) {
    let visibleIndex = 0;

    cards.forEach((card) => {
      const isFilteredOut = card.style.display === "none";

      if (mode === "desktop" && !isFilteredOut) {
        card.style.setProperty("--blog-card-delay", `${visibleIndex * 80}ms`);
        visibleIndex += 1;
      } else {
        card.style.removeProperty("--blog-card-delay");
      }
    });
  }

  function createBlogCardObserver() {
    return new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    }, { threshold: 0.2 });
  }

  function applyBlogCardReveal() {
    const cards = getBlogCards();
    const mode = getBlogRevealMode();

    disconnectBlogCardObserver();
    syncBlogCardDelays(cards, mode);

    if (mode === "static") {
      cards.forEach((card) => card.classList.add("is-visible"));
      return;
    }

    if (!("IntersectionObserver" in window)) {
      cards.forEach((card) => card.classList.add("is-visible"));
      return;
    }

    if (mode === "mobile" && cards[0]) {
      cards[0].classList.add("is-visible");
    }

    blogCardObserver = createBlogCardObserver();

    cards.forEach((card) => {
      if (card.style.display === "none") {
        card.classList.remove("is-visible");
        return;
      }

      blogCardObserver.observe(card);
    });
  }

  function refreshBlogCardReveal() {
    if (!blogCardObserver) return;

    const cards = getBlogCards();
    syncBlogCardDelays(cards, getBlogRevealMode());

    cards.forEach((card) => {
      if (card.style.display === "none") {
        blogCardObserver.unobserve(card);
        card.classList.remove("is-visible");
      } else {
        blogCardObserver.observe(card);
      }
    });
  }

  function initBlogCardReveal() {
    applyBlogCardReveal();

    [mobileBlogQuery, desktopBlogQuery, motionSafeQuery].forEach((query) => {
      if (!query) return;
      if ("addEventListener" in query) {
        query.addEventListener("change", applyBlogCardReveal);
      } else if ("addListener" in query) {
        query.addListener(applyBlogCardReveal);
      }
    });
  }

  function initBlogIndex() {
    initBlogSearch();
    initBlogCardReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBlogIndex);
  } else {
    initBlogIndex();
  }
})();

// Search and filtering for the static Learn knowledge base.
(function () {
  const searchInput = document.getElementById("blogSearch");
  const tagFilter = document.getElementById("learnTagFilter");
  const content = document.getElementById("blogGrid");
  const emptyState = document.getElementById("noResults");
  const emptyTitle = document.getElementById("noResultsText");
  const resultStatus = document.getElementById("learnResultStatus");
  const resetButtons = [
    document.getElementById("clearLearnFilters"),
    document.getElementById("clearLearnFiltersEmpty")
  ].filter(Boolean);
  const topicLinks = Array.from(document.querySelectorAll("[data-topic-link]"));
  const lang = window.SWISSPLOIT_INDEX_LANG || document.documentElement.lang || "de";

  if (!searchInput || !tagFilter || !content) return;

  const cards = Array.from(content.querySelectorAll(".blog-card"));
  const groups = Array.from(content.querySelectorAll("[data-topic-section]"));
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeTopic = "";

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

  function updateTopicLinks() {
    topicLinks.forEach((link) => {
      if (link.dataset.topicLink === activeTopic) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function applyFilters() {
    const query = normalize(searchInput.value);
    const selectedTag = normalize(tagFilter.value);
    let visibleCount = 0;

    cards.forEach((card) => {
      const searchable = normalize(card.dataset.search || card.textContent);
      const cardTags = String(card.dataset.tags || "").split("|");
      const matchesSearch = !query || searchable.includes(query);
      const matchesTag = !selectedTag || cardTags.includes(selectedTag);
      const matchesTopic = !activeTopic || card.dataset.topic === activeTopic;
      const isVisible = matchesSearch && matchesTag && matchesTopic;

      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    groups.forEach((group) => {
      const hasVisibleCard = Array.from(group.querySelectorAll(".blog-card")).some((card) => !card.hidden);
      group.hidden = !hasVisibleCard;
    });

    const hasFilters = Boolean(query || selectedTag || activeTopic);
    const topReset = document.getElementById("clearLearnFilters");
    if (topReset) topReset.hidden = !hasFilters;
    if (emptyState) emptyState.hidden = visibleCount !== 0;

    if (emptyTitle) {
      emptyTitle.textContent = activeTopic && !query && !selectedTag
        ? (lang === "en" ? "There are no articles in this topic yet." : "Zu diesem Thema gibt es aktuell noch keine Artikel.")
        : (lang === "en" ? "No matching content found." : "Keine passenden Inhalte gefunden.");
    }

    if (resultStatus) {
      resultStatus.textContent = lang === "en"
        ? `${visibleCount} ${visibleCount === 1 ? "article" : "articles"} shown.`
        : `${visibleCount} ${visibleCount === 1 ? "Artikel wird" : "Artikel werden"} angezeigt.`;
    }

    updateTopicLinks();
  }

  function clearFilters() {
    activeTopic = "";
    searchInput.value = "";
    tagFilter.value = "";
    applyFilters();
  }

  topicLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const topic = link.dataset.topicLink;
      if (!topic) return;

      event.preventDefault();
      activeTopic = topic;
      searchInput.value = "";
      tagFilter.value = "";
      applyFilters();

      const topicSection = document.getElementById(`topic-${topic}`);
      const target = topicSection && !topicSection.hidden
        ? topicSection
        : document.getElementById("learn-content");

      if (target) {
        target.scrollIntoView({
          behavior: reducedMotion?.matches ? "auto" : "smooth",
          block: "start"
        });
      }
    });
  });

  searchInput.addEventListener("input", () => {
    activeTopic = "";
    applyFilters();
  });

  searchInput.addEventListener("search", () => {
    activeTopic = "";
    applyFilters();
  });

  tagFilter.addEventListener("change", () => {
    activeTopic = "";
    applyFilters();
  });

  resetButtons.forEach((button) => button.addEventListener("click", clearFilters));

  applyFilters();
})();

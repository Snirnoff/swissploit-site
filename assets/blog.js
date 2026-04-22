// assets/blog.js
(function () {
  const posts = (window.SWISSPLOIT_BLOG_POSTS || []).slice();

  const grid = document.getElementById("blogGrid");
  const input = document.getElementById("blogSearch");
  const noResults = document.getElementById("noResults");
  const langBtns = document.querySelectorAll(".lang-btn");

  const I18N_UI = {
    de: {
      searchHint: "Suche durchsucht Titel, Kurztext und Tags.",
      noResults: "Keine Treffer. Versuch es mit einem anderen Begriff.",
      searchPlaceholder: "Suche nach Phishing, Windows, M365, OneDrive…"
    },
    en: {
      searchHint: "Search scans title, excerpt and tags.",
      noResults: "No results. Try another keyword.",
      searchPlaceholder: "Search phishing, Windows, M365, OneDrive…"
    }
  };

  const params = new URLSearchParams(window.location.search);
  let currentLang = params.get("lang") || localStorage.getItem("swissploit-blog-lang") || "de";

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  function trimText(s, n = 110) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  function getText(post) {
    const t = post?.i18n?.[currentLang] || post?.i18n?.de || post?.i18n?.en || {};
    return {
      title: t.title || "",
      excerpt: t.excerpt || ""
    };
  }

  function getPostHref(post) {
    if (currentLang === "en" && post?.urls?.en) return post.urls.en.replace("https://swissploit.ch", "");
    if (post?.urls?.de) return post.urls.de.replace("https://swissploit.ch", "");
    if (post?.urls?.en) return post.urls.en.replace("https://swissploit.ch", "");
    return `blog-post.html?id=${encodeURIComponent(post.id)}`;
  }

  function formatDate(dateStr) {
    const s = String(dateStr || "").trim();
    if (!s) return "";
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return s;
    const yyyy = m[1], mm = m[2], dd = m[3];
    return `${dd}.${mm}.${yyyy}`;
  }

  function resolveVideoUrl(post) {
    const direct = post?.i18n?.[currentLang]?.videoUrl;
    if (direct && String(direct).trim()) return String(direct).trim();

    const global = post?.videoUrl;
    if (global && String(global).trim()) return String(global).trim();

    const otherLang = currentLang === "de" ? "en" : "de";
    const fallback = post?.i18n?.[otherLang]?.videoUrl;
    if (fallback && String(fallback).trim()) return String(fallback).trim();

    return "";
  }

  function applyUiLanguage() {
    const ui = I18N_UI[currentLang] || I18N_UI.de;

    document.documentElement.lang = currentLang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (ui[key]) el.textContent = ui[key];
    });

    if (input) input.placeholder = ui.searchPlaceholder || input.placeholder;
    if (noResults) noResults.textContent = ui.noResults || noResults.textContent;

    langBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.lang === currentLang));
  }

  function render(list) {
    grid.innerHTML = list.map((p, index) => {
      const t = getText(p);
      const tags = (p.tags || []).slice(0, 4).map((x) => `#${escapeHtml(x)}`).join(" ");
      const excerpt = trimText(t.excerpt, 105);
      const postHref = getPostHref(p);
      const titleId = `blog-card-title-${index}`;

      const videoUrl = resolveVideoUrl(p);
      const videoBtn = videoUrl
        ? `<a class="blog-mini-btn" href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener">▶ Video</a>`
        : "";

      return `
        <article class="blog-card" aria-labelledby="${titleId}">
          <a class="blog-card-link" href="${escapeHtml(postHref)}" aria-label="${escapeHtml(t.title)}">
            <div class="blog-thumb">
              ${p.thumb ? `
                <img
                  class="blog-thumb-img"
                  src="${escapeHtml(p.thumb)}"
                  alt="${escapeHtml(t.title)}"
                  loading="lazy"
                  decoding="async">
              ` : `
                <div class="blog-thumb-inner">
                  <span class="blog-thumb-label">POST</span>
                </div>
              `}
            </div>

            <div class="blog-card-body">
              <div class="blog-meta">
                ${p.date ? `<time class="blog-date" datetime="${escapeHtml(p.date)}">${escapeHtml(formatDate(p.date || ""))}</time>` : ""}
                <span class="blog-tags" title="${escapeHtml((p.tags || []).join(" "))}">${tags}</span>
              </div>

              <h2 class="blog-card-title" id="${titleId}">${escapeHtml(t.title)}</h2>
              <p class="blog-card-excerpt">${escapeHtml(excerpt)}</p>
            </div>
          </a>

          <div class="blog-card-actions">
            <a class="blog-mini-btn" href="${escapeHtml(postHref)}">${currentLang === "de" ? "Artikel" : "Read"}</a>
            ${videoBtn}
          </div>
        </article>
      `;
    }).join("");

    noResults.hidden = list.length !== 0;
  }

  function filter(q) {
    const s = q.trim().toLowerCase();
    if (!s) return posts;

    return posts.filter((p) => {
      const hay = [
        p.i18n?.de?.title, p.i18n?.de?.excerpt,
        p.i18n?.en?.title, p.i18n?.en?.excerpt,
        (p.tags || []).join(" ")
      ].join(" ").toLowerCase();

      return hay.includes(s);
    });
  }

  langBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang || "de";
      localStorage.setItem("swissploit-blog-lang", currentLang);

      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("lang", currentLang);
      window.history.replaceState({}, "", nextUrl);

      applyUiLanguage();
      render(filter(input?.value || ""));
    });
  });

  input?.addEventListener("input", () => {
    render(filter(input.value || ""));
  });

  applyUiLanguage();
  render(posts);
})();
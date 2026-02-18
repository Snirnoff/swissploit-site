// assets/blog.js
(function () {
  const posts = (window.SWISSPLOIT_BLOG_POSTS || []).slice();

  const grid = document.getElementById("blogGrid");
  const input = document.getElementById("blogSearch");
  const noResults = document.getElementById("noResults");
  const langBtns = document.querySelectorAll(".lang-btn");

  const I18N_UI = {
    de: {
      blogTitle: "Swissploit Blog",
      blogSubtitle: "Retro-Style. Klare IT-Tipps. Security ohne Bullshit.",
      searchHint: "Suche durchsucht Titel, Kurztext und Tags.",
      noResults: "Keine Treffer. Versuch es mit einem anderen Begriff.",
      searchPlaceholder: "Suche nach Phishing, Windows, M365, OneDrive…"
    },
    en: {
      blogTitle: "Swissploit Blog",
      blogSubtitle: "Retro style. Practical tech & security. No fluff.",
      searchHint: "Search scans title, excerpt and tags.",
      noResults: "No results. Try another keyword.",
      searchPlaceholder: "Search phishing, Windows, M365, OneDrive…"
    }
  };

  let currentLang = localStorage.getItem("swissploit-blog-lang") || "de";

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  function trimText(s, n = 110) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  function getText(post){
    const t = post?.i18n?.[currentLang] || post?.i18n?.de || {};
    return {
      title: t.title || "",
      excerpt: t.excerpt || ""
    };
  }

  function applyUiLanguage(){
    const ui = I18N_UI[currentLang] || I18N_UI.de;

    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const key = el.getAttribute("data-i18n");
      if(ui[key]) el.textContent = ui[key];
    });

    if(input) input.placeholder = ui.searchPlaceholder || input.placeholder;
    if(noResults) noResults.textContent = ui.noResults || noResults.textContent;

    langBtns.forEach(b => b.classList.toggle("is-active", b.dataset.lang === currentLang));
  }

  function render(list) {
    grid.innerHTML = list.map(p => {
      const t = getText(p);
      const tags = (p.tags || []).slice(0, 4).map(x => `#${escapeHtml(x)}`).join(" ");
      const excerpt = trimText(t.excerpt, 105);

      const videoBtn = p.videoUrl
        ? `<a class="blog-mini-btn" href="${escapeHtml(p.videoUrl)}" target="_blank" rel="noopener">▶ Video</a>`
        : "";

      return `
        <article class="blog-card">
          <a class="blog-card-link" href="blog-post.html?id=${encodeURIComponent(p.id)}">
<div class="blog-thumb">
  ${p.thumb ? `
    <img class="blog-thumb-img" src="${escapeHtml(p.thumb)}" alt="${escapeHtml(t.title)}">
  ` : `
    <div class="blog-thumb-inner">
      <span class="blog-thumb-label">POST</span>
    </div>
  `}
</div>


            <div class="blog-card-body">
              <div class="blog-meta">
                <span class="blog-date">${escapeHtml(p.date || "")}</span>
                <span class="blog-tags" title="${escapeHtml((p.tags||[]).join(" "))}">${tags}</span>
              </div>

              <h2 class="blog-card-title">${escapeHtml(t.title)}</h2>
              <p class="blog-card-excerpt">${escapeHtml(excerpt)}</p>
            </div>
          </a>

          <div class="blog-card-actions">
            <a class="blog-mini-btn" href="blog-post.html?id=${encodeURIComponent(p.id)}">${currentLang === "de" ? "Artikel" : "Read"}</a>
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

    return posts.filter(p => {
      const hay = [
        p.i18n?.de?.title, p.i18n?.de?.excerpt,
        p.i18n?.en?.title, p.i18n?.en?.excerpt,
        (p.tags || []).join(" ")
      ].join(" ").toLowerCase();

      return hay.includes(s);
    });
  }

  // events
  langBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      currentLang = btn.dataset.lang || "de";
      localStorage.setItem("swissploit-blog-lang", currentLang);
      applyUiLanguage();
      render(filter(input.value));
    });
  });

  let t;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => render(filter(input.value)), 70);
  });

  // init
  posts.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  applyUiLanguage();
  render(posts);
})();

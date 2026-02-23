// assets/blog-post.js
(function () {
  const posts = window.SWISSPLOIT_BLOG_POSTS || [];
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const titleEl = document.getElementById("postTitle");
  const subtitleEl = document.getElementById("postSubtitle");
  const metaEl = document.getElementById("postMeta");
  const contentEl = document.getElementById("postContent");
  const backEl = document.querySelector(".post-back");
  const langBtns = document.querySelectorAll(".lang-btn");

  const UI = {
    de: {
      back: "← Zurück",
      notFoundTitle: "Artikel nicht gefunden",
      notFoundBody: "Der Link ist ungültig oder der Beitrag existiert nicht.",
      watch: "▶ Video ansehen",
      overview: "Zur Übersicht"
    },
    en: {
      back: "← Back",
      notFoundTitle: "Post not found",
      notFoundBody: "The link is invalid or the post doesn’t exist.",
      watch: "▶ Watch video",
      overview: "Back to overview"
    }
  };

  let currentLang = localStorage.getItem("swissploit-blog-lang") || "de";
  const post = posts.find(p => p.id === id);

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  function youtubeEmbed(url) {
    try {
      const u = new URL(url);

      const v = u.searchParams.get("v");
      if (u.hostname.includes("youtube.com") && v) return `https://www.youtube.com/embed/${v}`;

      if (u.hostname.includes("youtu.be")) {
        const vid = u.pathname.replace("/", "").trim();
        if (vid) return `https://www.youtube.com/embed/${vid}`;
      }

      if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/shorts/")) {
        const vid = u.pathname.split("/shorts/")[1]?.split(/[?&#/]/)[0];
        if (vid) return `https://www.youtube.com/embed/${vid}`;
      }
    } catch (e) {}
    return null;
  }

  function getTxt() {
    return (post?.i18n?.[currentLang]) || (post?.i18n?.de) || {};
  }

  // Video logic:
  // 1) language-specific videoUrl (post.i18n[lang].videoUrl)
  // 2) global videoUrl (post.videoUrl)
  // 3) fallback to any other language videoUrl (so one video shows for both languages)
  function resolveVideoUrl(){
    const direct = post?.i18n?.[currentLang]?.videoUrl;
    if (direct && String(direct).trim()) return String(direct).trim();

    const global = post?.videoUrl;
    if (global && String(global).trim()) return String(global).trim();

    const otherLang = currentLang === "de" ? "en" : "de";
    const fallback = post?.i18n?.[otherLang]?.videoUrl;
    if (fallback && String(fallback).trim()) return String(fallback).trim();

    return "";
  }

  function setLangUI() {
    document.documentElement.lang = currentLang;
    langBtns.forEach(b => b.classList.toggle("is-active", b.dataset.lang === currentLang));

    const ui = UI[currentLang] || UI.de;
    if (backEl) backEl.textContent = ui.back;
  }

  function renderNotFound() {
    const ui = UI[currentLang] || UI.de;
    document.title = `Swissploit – Blog`;

    if (titleEl) titleEl.textContent = ui.notFoundTitle;
    if (subtitleEl) subtitleEl.textContent = "";
    if (metaEl) metaEl.innerHTML = "";
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="post-callout">
          <p>${esc(ui.notFoundBody)}</p>
          <p><a class="post-back" href="blog.html" data-transition>${esc(ui.overview)}</a></p>
        </div>
      `;
    }
  }

  function render() {
    setLangUI();

    if (!post) return renderNotFound();
    const txt = getTxt();
    const ui = UI[currentLang] || UI.de;

    const tTitle = txt.title || "";
    const tExcerpt = txt.excerpt || "";

    document.title = `${tTitle || "Blog"} – Swissploit`;

    if (titleEl) titleEl.textContent = tTitle;
    if (subtitleEl) subtitleEl.textContent = tExcerpt;

    const tags = (post.tags || []).map(t => `#${esc(t)}`).join(" ");
    if (metaEl) {
      metaEl.innerHTML = `
        ${post.date ? `<span class="blog-date">${esc(post.date)}</span>` : ""}
        ${tags ? `<span class="blog-tags">${tags}</span>` : ""}
      `;
    }

    const videoUrl = resolveVideoUrl();
    const hasVideo = !!(videoUrl && String(videoUrl).trim());
    const embed = hasVideo ? youtubeEmbed(videoUrl) : null;

    const videoHtml = hasVideo
      ? (embed
          ? `
            <div class="post-video">
              <div class="video-embed">
                <iframe
                  src="${esc(embed)}"
                  title="${esc(tTitle || "Video")}"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen></iframe>
              </div>
            </div>
          `
          : `<p><a class="post-back" href="${esc(videoUrl)}" target="_blank" rel="noopener">${esc(ui.watch)}</a></p>`
        )
      : "";

    const body = txt.content || "";
    const bodyHtml = body.includes("<") ? body : `<p>${esc(body)}</p>`;

    if (contentEl) {
      contentEl.innerHTML = `
        ${videoHtml}
        <div class="post-article">
          ${bodyHtml}
        </div>
      `;
    }
  }

  langBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang || "de";
      localStorage.setItem("swissploit-blog-lang", currentLang);
      render();
    });
  });

  setLangUI();
  render();
})();

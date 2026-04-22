(function () {
  const post = window.SWISSPLOIT_CURRENT_POST;
  if (!post) return;

  const titleEl = document.getElementById("postTitle");
  const subtitleEl = document.getElementById("postSubtitle");
  const metaEl = document.getElementById("postMeta");
  const contentEl = document.getElementById("postContent");
  const backEl = document.querySelector(".post-back");
  const langBtns = document.querySelectorAll(".lang-btn");

  const UI = {
    de: {
      back: "← Zurück",
      watch: "▶ Video ansehen"
    },
    en: {
      back: "← Back",
      watch: "▶ Watch video"
    }
  };

  let currentLang = localStorage.getItem("swissploit-blog-lang") || post.defaultLang || "de";

  function esc(str) {
    return String(str || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  function formatDate(dateStr) {
    const s = String(dateStr || "").trim();
    if (!s) return "";
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return s;
    return `${m[3]}.${m[2]}.${m[1]}`;
  }

  function youtubeEmbedInfo(url) {
    try {
      const u = new URL(url);

      const v = u.searchParams.get("v");
      if (u.hostname.includes("youtube.com") && v) {
        return { embed: `https://www.youtube.com/embed/${v}`, isShort: false };
      }

      if (u.hostname.includes("youtu.be")) {
        const vid = u.pathname.replace("/", "").trim();
        if (vid) return { embed: `https://www.youtube.com/embed/${vid}`, isShort: false };
      }

      if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/shorts/")) {
        const vid = u.pathname.split("/shorts/")[1]?.split(/[?&#/]/)[0];
        if (vid) return { embed: `https://www.youtube.com/embed/${vid}`, isShort: true };
      }
    } catch {}

    return null;
  }

  function getText(lang) {
    return post?.i18n?.[lang]
      || post?.i18n?.[post.defaultLang]
      || post?.i18n?.de
      || post?.i18n?.en
      || {};
  }

  function resolveVideoUrl(lang) {
    const direct = post?.i18n?.[lang]?.videoUrl;
    if (direct && String(direct).trim()) return String(direct).trim();

    const global = post?.videoUrl;
    if (global && String(global).trim()) return String(global).trim();

    const otherLang = lang === "de" ? "en" : "de";
    const fallback = post?.i18n?.[otherLang]?.videoUrl;
    if (fallback && String(fallback).trim()) return String(fallback).trim();

    return "";
  }

  function upsertMeta(selector, attr, value) {
    let el = document.head.querySelector(selector);

    if (!el) {
      el = document.createElement("meta");

      if (selector.startsWith('meta[property="')) {
        el.setAttribute("property", selector.match(/meta\[property="([^"]+)"\]/)[1]);
      } else if (selector.startsWith('meta[name="')) {
        el.setAttribute("name", selector.match(/meta\[name="([^"]+)"\]/)[1]);
      }

      document.head.appendChild(el);
    }

    el.setAttribute(attr, value);
  }

  function upsertLink(rel, href) {
    let el = document.head.querySelector(`link[rel="${rel}"]`);

    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }

    el.setAttribute("href", href);
  }

  function updateSeo(txt) {
    const title = txt.title || "Swissploit – Blog";
    const description = (txt.excerpt || post?.seo?.description || "").slice(0, 160);
    const image = post?.seo?.image || "https://swissploit.ch/assets/JustPlus.png";
    const url = post?.seo?.url || window.location.href;

    document.title = `${title} – Swissploit`;
    document.documentElement.lang = currentLang;

    upsertMeta('meta[name="description"]', "content", description);
    upsertMeta('meta[name="robots"]', "content", "index,follow,max-image-preview:large");

    upsertMeta('meta[property="og:title"]', "content", title);
    upsertMeta('meta[property="og:description"]', "content", description);
    upsertMeta('meta[property="og:url"]', "content", url);
    upsertMeta('meta[property="og:image"]', "content", image);
    upsertMeta('meta[property="og:type"]', "content", "article");

    upsertMeta('meta[name="twitter:title"]', "content", title);
    upsertMeta('meta[name="twitter:description"]', "content", description);
    upsertMeta('meta[name="twitter:image"]', "content", image);
    upsertMeta('meta[name="twitter:card"]', "content", "summary_large_image");

    upsertLink("canonical", url);
  }

  function renderMeta() {
    const tags = (post.tags || []).map((tag) => `#${esc(tag)}`).join(" ");

    return `
      ${post.date ? `<span class="blog-date">${esc(formatDate(post.date))}</span>` : ""}
      ${tags ? `<span class="blog-tags">${tags}</span>` : ""}
    `;
  }

  function renderVideo(txt, ui) {
    const videoUrl = resolveVideoUrl(currentLang);
    if (!videoUrl) return "";

    const info = youtubeEmbedInfo(videoUrl);
    if (!info?.embed) {
      return `<p><a class="post-back" href="${esc(videoUrl)}" target="_blank" rel="noopener">${esc(ui.watch)}</a></p>`;
    }

    return `
      <div class="post-video">
        <div class="video-embed ${info.isShort ? "video-embed--shorts" : ""}">
          <iframe
            src="${esc(info.embed)}"
            title="${esc(txt.title || "Video")}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>
        </div>
      </div>
    `;
  }

  function render() {
    if (!post?.i18n?.[currentLang]) {
      currentLang = post.defaultLang || "de";
    }

    const txt = getText(currentLang);
    const ui = UI[currentLang] || UI.de;

    langBtns.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.lang === currentLang);
    });

    if (backEl) backEl.textContent = ui.back;
    if (titleEl) titleEl.textContent = txt.title || "";
    if (subtitleEl) subtitleEl.textContent = txt.excerpt || "";
    if (metaEl) metaEl.innerHTML = renderMeta();

    if (contentEl) {
      contentEl.innerHTML = `
        ${renderVideo(txt, ui)}
        <div class="post-article">
          ${txt.content || ""}
        </div>
      `;
    }

    updateSeo(txt);
  }

  langBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang || post.defaultLang || "de";
      localStorage.setItem("swissploit-blog-lang", currentLang);
      render();
    });
  });

  render();
})();
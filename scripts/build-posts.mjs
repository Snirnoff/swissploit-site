import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { marked } from "marked";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "posts");
const OUT_FILE = path.join(ROOT, "assets", "blog-posts.js");
const BLOG_DIR = path.join(ROOT, "blog");
const EN_BLOG_DIR = path.join(ROOT, "en", "blog");
const BASE_URL = "https://swissploit.ch";
const SITEMAP_FILE = path.join(ROOT, "sitemap.xml");

function asArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return String(v)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function cleanStr(v) {
  return String(v ?? "").trim();
}

function pickFirst(...vals) {
  for (const v of vals) {
    const s = cleanStr(v);
    if (s) return s;
  }
  return "";
}

function normalizeDate(v) {
  if (!v) return "";

  if (v instanceof Date) {
    return v.toISOString().slice(0, 10);
  }

  const s = String(v).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return s;
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[m]));
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(urlPath) {
  const clean = String(urlPath || "").replace(/^\/+/, "");
  return `${BASE_URL}/${clean}`;
}

function getPostPath(slug, lang = "de") {
  return lang === "en" ? `/en/blog/${slug}/` : `/blog/${slug}/`;
}

function getPostUrl(slug, lang = "de") {
  return `${BASE_URL}${getPostPath(slug, lang)}`;
}

function toScriptJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/-->/g, "--\\>")
    .replace(/<\/script/gi, "<\\/script");
}

function rewriteContentUrls(html) {
  let out = String(html || "");

  // Make asset references root-relative so they still work inside nested blog paths.
  out = out.replace(/\b(src|href)=["']assets\//gi, (_, attr) => `${attr}="/assets/`);

  // Add lazy loading to images rendered from markdown.
  out = out.replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async"');

  return out;
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

function resolveVideoUrl(post, lang) {
  const direct = post?.i18n?.[lang]?.videoUrl;
  if (cleanStr(direct)) return cleanStr(direct);

  const global = post?.videoUrl;
  if (cleanStr(global)) return cleanStr(global);

  const otherLang = lang === "de" ? "en" : "de";
  const fallback = post?.i18n?.[otherLang]?.videoUrl;
  if (cleanStr(fallback)) return cleanStr(fallback);

  return "";
}

function renderVideoHtml(post, lang, title, watchLabel) {
  const videoUrl = resolveVideoUrl(post, lang);
  if (!videoUrl) return "";

  const info = youtubeEmbedInfo(videoUrl);
  if (!info?.embed) {
    return `<p><a class="post-back" href="${escapeAttr(videoUrl)}" target="_blank" rel="noopener">${escapeHtml(watchLabel)}</a></p>`;
  }

  return `
    <div class="post-video">
      <div class="video-embed ${info.isShort ? "video-embed--shorts" : ""}">
        <iframe
          src="${escapeAttr(info.embed)}"
          title="${escapeAttr(title || "Video")}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
    </div>
  `;
}

function renderMetaHtml(post, lang) {
  const tags = (post.tags || []).map((tag) => `#${escapeHtml(tag)}`).join(" ");
  const updatedLabel = lang === "de" ? "Aktualisiert" : "Updated";

  return `
    ${post.date ? `<time class="blog-date" datetime="${escapeAttr(post.date)}">${escapeHtml(formatDate(post.date))}</time>` : ""}
    ${post.updated && post.updated !== post.date ? `<time class="blog-date blog-date-updated" datetime="${escapeAttr(post.updated)}">${escapeHtml(updatedLabel)} ${escapeHtml(formatDate(post.updated))}</time>` : ""}
    ${tags ? `<span class="blog-tags">${tags}</span>` : ""}
  `.trim();
}

function renderPostCard(post, lang, idx) {
  const txt = post.i18n?.[lang] || post.i18n?.[post.defaultLang] || post.i18n?.de || post.i18n?.en || {};
  const href =
    (lang === "en" && post?.urls?.en) ||
    post?.urls?.de ||
    post?.urls?.en ||
    "/blog/";
  const tags = (post.tags || []).slice(0, 4).map((x) => `#${escapeHtml(x)}`).join(" ");
  const excerpt = String(txt.excerpt || "").trim();
  const searchText = [
    txt.title || "",
    txt.excerpt || "",
    (post.tags || []).join(" ")
  ].join(" ").toLowerCase();

  return `
    <article
      class="blog-card"
      aria-labelledby="blog-card-title-${idx}"
      data-search="${escapeAttr(searchText)}">
      <a class="blog-card-link" href="${escapeAttr(href.replace(BASE_URL, ""))}" aria-label="${escapeAttr(txt.title || "")}" data-transition>
        <div class="blog-thumb">
          ${post.thumb ? `
            <img
              class="blog-thumb-img"
              src="/${escapeAttr(String(post.thumb).replace(/^\/+/, ""))}"
              alt="${escapeAttr(txt.title || "")}"
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
            ${post.date ? `<time class="blog-date" datetime="${escapeAttr(post.date)}">${escapeHtml(formatDate(post.date))}</time>` : ""}
            <span class="blog-tags" title="${escapeAttr((post.tags || []).join(" "))}">${tags}</span>
          </div>

          <h2 class="blog-card-title" id="blog-card-title-${idx}">${escapeHtml(txt.title || "")}</h2>
          <p class="blog-card-excerpt">${escapeHtml(excerpt)}</p>
        </div>
      </a>
    </article>
  `;
}

function renderIndexAlternateLinks(lang) {
  const canonical = lang === "en" ? `${BASE_URL}/en/blog/` : `${BASE_URL}/blog/`;
  const de = `${BASE_URL}/blog/`;
  const en = `${BASE_URL}/en/blog/`;

  return `
  <link rel="canonical" href="${escapeAttr(canonical)}" />
  <link rel="alternate" hreflang="de" href="${escapeAttr(de)}" />
  <link rel="alternate" hreflang="en" href="${escapeAttr(en)}" />
  <link rel="alternate" hreflang="x-default" href="${escapeAttr(de)}" />`.trim();
}

function renderIndexJsonLd(posts, lang) {
  const pageUrl = lang === "en" ? `${BASE_URL}/en/blog/` : `${BASE_URL}/blog/`;

  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: lang === "en" ? "Swissploit Blog – English" : "Swissploit Blog",
    url: pageUrl,
    inLanguage: lang,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts
        .filter((post) => Boolean(post.i18n?.[lang] || post.i18n?.[post.defaultLang]))
        .map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url:
            (lang === "en" && post?.urls?.en) ||
            post?.urls?.de ||
            post?.urls?.en ||
            undefined,
          name:
            post?.i18n?.[lang]?.title ||
            post?.i18n?.[post.defaultLang]?.title ||
            post?.i18n?.de?.title ||
            post?.i18n?.en?.title ||
            undefined
        }))
    }
  };

  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function getRelatedPosts(allPosts, currentPost, lang, limit = 3) {
  return allPosts
    .filter((candidate) => candidate.id !== currentPost.id)
    .filter((candidate) => Boolean(candidate.i18n?.[lang] || candidate.i18n?.[candidate.defaultLang]))
    .map((candidate) => {
      const overlap = (candidate.tags || []).filter((tag) =>
        (currentPost.tags || []).includes(tag)
      ).length;

      return {
        candidate,
        score: overlap * 10 + (candidate.updated || candidate.date ? 1 : 0)
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const bDate = String(b.candidate.updated || b.candidate.date || "");
      const aDate = String(a.candidate.updated || a.candidate.date || "");
      return bDate.localeCompare(aDate);
    })
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

function renderRelatedPostsHtml(post, allPosts, lang) {
  const related = getRelatedPosts(allPosts, post, lang, 3);
  if (!related.length) return "";

  const heading = lang === "de" ? "Weitere Artikel" : "Related posts";

  return `
    <aside class="post-related" aria-labelledby="relatedPostsHeading">
      <h2 id="relatedPostsHeading">${escapeHtml(heading)}</h2>
      <div class="post-related-grid">
        ${related.map((item) => {
          const txt = item.i18n?.[lang] || item.i18n?.[item.defaultLang] || item.i18n?.de || item.i18n?.en || {};
          const href =
            (lang === "en" && item?.urls?.en) ||
            item?.urls?.de ||
            item?.urls?.en ||
            "/blog/";

          return `
            <article class="post-related-card blog-card">
              <a class="post-related-card-link blog-card-link" href="${escapeAttr(href.replace(BASE_URL, ""))}" aria-label="${escapeAttr(txt.title || "")}" data-transition>
                ${item.thumb ? `<div class="post-related-thumb blog-thumb"><img class="blog-thumb-img" src="/${escapeAttr(String(item.thumb).replace(/^\/+/, ""))}" alt="${escapeAttr(txt.title || "")}" loading="lazy" decoding="async"></div>` : ""}
                <div class="post-related-body blog-card-body">
                  ${item.date ? `<time class="post-related-date blog-date" datetime="${escapeAttr(item.date)}">${escapeHtml(formatDate(item.date))}</time>` : ""}
                  <h3 class="post-related-title blog-card-title">${escapeHtml(txt.title || "")}</h3>
                  ${txt.excerpt ? `<p class="post-related-excerpt blog-card-excerpt">${escapeHtml(txt.excerpt)}</p>` : ""}
                </div>
              </a>
            </article>
          `;
        }).join("")}
      </div>
    </aside>
  `;
}

function renderPostAlternateLinks(post, currentLang) {
  const canonical =
    (currentLang === "en" && post?.urls?.en) ||
    post?.urls?.de ||
    post?.urls?.en ||
    `${BASE_URL}/blog/`;

  const links = [
    `<link rel="canonical" href="${escapeAttr(canonical)}" />`
  ];

  if (post?.urls?.de) {
    links.push(`<link rel="alternate" hreflang="de" href="${escapeAttr(post.urls.de)}" />`);
  }

  if (post?.urls?.en) {
    links.push(`<link rel="alternate" hreflang="en" href="${escapeAttr(post.urls.en)}" />`);
  }

  links.push(`<link rel="alternate" hreflang="x-default" href="${escapeAttr(post.urls?.de || post.urls?.en || canonical)}" />`);

  return links.join("\n  ");
}

function renderBreadcrumbJsonLd(post, lang, title) {
  const blogUrl = lang === "en" ? `${BASE_URL}/en/blog/` : `${BASE_URL}/blog/`;
  const postUrl =
    (lang === "en" && post?.urls?.en) ||
    post?.urls?.de ||
    post?.urls?.en ||
    blogUrl;

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${BASE_URL}/index.html`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: blogUrl
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: postUrl
      }
    ]
  }).replace(/</g, "\\u003c");
}

function renderPostJsonLd(post, lang, txt) {
  const pageUrl =
    (lang === "en" && post?.urls?.en) ||
    post?.urls?.de ||
    post?.urls?.en ||
    `${BASE_URL}/blog/`;

  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: txt.title || undefined,
    description: (txt.excerpt || post?.seo?.description?.[lang] || "").slice(0, 160) || undefined,
    datePublished: post.date || undefined,
    dateModified: post.updated || post.date || undefined,
    image: post?.seo?.image || undefined,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    inLanguage: lang,
    author: {
      "@type": "Person",
      name: "Swissploit"
    },
    publisher: {
      "@type": "Organization",
      name: "Swissploit",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/assets/swissploit-og.png`
      }
    },
    keywords: (post.tags || []).join(", ") || undefined
  };

  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function renderPostLangToggle(post, currentLang) {
  const links = [];

  if (post?.i18n?.de && post?.urls?.de) {
    links.push(`<a class="lang-link ${currentLang === "de" ? "is-active" : ""}" href="${escapeAttr(post.urls.de.replace(BASE_URL, ""))}" hreflang="de" lang="de" data-lang-switch="de">DE</a>`);
  }

  if (post?.i18n?.en && post?.urls?.en) {
    links.push(`<a class="lang-link ${currentLang === "en" ? "is-active" : ""}" href="${escapeAttr(post.urls.en.replace(BASE_URL, ""))}" hreflang="en" lang="en" data-lang-switch="en">EN</a>`);
  }

  if (!links.length) return "";

  const label = currentLang === "de" ? "Sprache wählen" : "Choose language";

  return `
    <nav class="lang-toggle" aria-label="${escapeAttr(label)}">
      ${links.join("")}
    </nav>
  `;
}

function renderBlogIndexPage(posts, lang) {
  const isEn = lang === "en";
  const pageTitle = isEn ? "Swissploit Blog – English" : "Swissploit Blog";
  const metaDescription = isEn
    ? "Swissploit blog with practical posts about cybersecurity, Microsoft 365, Windows, phishing and modern IT."
    : "Blog von Swissploit mit Beiträgen zu Cybersecurity, Phishing, Microsoft 365, Windows und praxisnahen IT-Tipps.";
  const ogDescription = isEn
    ? "Practical posts about cybersecurity, Microsoft 365, Windows, phishing and modern IT."
    : "Beiträge zu Cybersecurity, Microsoft 365, Windows, Phishing und moderner IT – verständlich und praxisnah.";
  const pageUrl = isEn ? `${BASE_URL}/en/blog/` : `${BASE_URL}/blog/`;
  const blogHref = isEn ? "/en/blog/" : "/blog/";
  const navBlogHref = blogHref;
  const cardsHtml = posts
    .filter((post) => Boolean(post.i18n?.[lang] || post.i18n?.[post.defaultLang]))
    .map((post, idx) => renderPostCard(post, lang, idx))
    .join("");

  return `<!doctype html>
<html lang="${lang}" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(pageTitle)}</title>

  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/favicon-192x192.png">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="icon" type="image/png" href="/assets/JustPlus.png">
  <meta name="theme-color" content="#05070b">

  <meta name="description" content="${escapeAttr(metaDescription)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />

  <meta property="og:title" content="${escapeAttr(pageTitle)}">
  <meta property="og:description" content="${escapeAttr(ogDescription)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeAttr(pageUrl)}">
  <meta property="og:image" content="${BASE_URL}/assets/swissploit-og.png">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(pageTitle)}">
  <meta name="twitter:description" content="${escapeAttr(ogDescription)}">
  <meta name="twitter:image" content="${BASE_URL}/assets/swissploit-og.png">

  ${renderIndexAlternateLinks(lang)}

  <script type="application/ld+json">${renderIndexJsonLd(posts, lang)}</script>

  <script>
    (function () {
      document.documentElement.setAttribute("data-theme", "dark");
      try { localStorage.setItem("swissploit-theme", "dark"); } catch (e) {}
    })();
  </script>

  <link rel="stylesheet" href="/assets/styles.css" />
  <link rel="stylesheet" href="/assets/blog.css" />

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
</head>

<body>
  <header class="site-header" role="banner">
    <div class="wrap headerbar">
      <a class="brand" href="/index.html" aria-label="Swissploit Home" data-transition>
        <img class="brand-logo-image header-logo-image" src="/assets/swissploit-brand-logo.png" alt="Swissploit Logo" width="120" height="49" decoding="async">
      </a>

      <nav class="nav" aria-label="${isEn ? "Main navigation" : "Hauptnavigation"}">
        <a href="/index.html#services" data-transition>Leistungen</a>
        <a href="/index.html#soc-light" data-transition>SOC Light</a>
        <a class="is-active" href="${navBlogHref}" data-transition>Wissen</a>
        <a href="/index.html#ueber" data-transition>Über Swissploit</a>
        <a href="/index.html#kontakt" data-transition>Kontakt</a>
      </nav>

      <button id="themeToggle"
        class="switch"
        aria-pressed="false"
        aria-label="Darstellung umschalten"
        title="Dark/Light umschalten">
        <span class="switch-track"></span>
        <span class="switch-thumb">
          <span class="switch-icon sun" aria-hidden="true">☀️</span>
          <span class="switch-icon moon" aria-hidden="true">🌙</span>
        </span>
      </button>
    </div>
  </header>

  <main id="main">
    <nav class="wrap blog-breadcrumbs" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li><a href="/index.html">Home</a></li>
        <li aria-current="page">Wissen</li>
      </ol>
    </nav>

    <section class="section blog-hero">
      <div class="wrap">
        <h1 class="blog-title">
          <span class="hero-brand blog-brand" aria-label="Swissploit">
            <span>S</span><span>w</span><span>i</span><span>s</span><span>s</span><span>p</span><span>l</span><span>o</span><span>i</span><span>t</span>
            <span class="blog-kicker">${isEn ? "BLOG." : "BLOG."}</span>
          </span>
        </h1>

        <div class="blog-search">
          <label class="sr-only" for="blogSearch">${isEn ? "Search blog" : "Blog durchsuchen"}</label>
          <input id="blogSearch" type="search" placeholder="${escapeAttr(isEn ? "Search phishing, Windows, M365, OneDrive…" : "Suche nach Phishing, Windows, M365, OneDrive…")}" autocomplete="off">
          <span class="blog-search-hint">${isEn ? "Search scans title, excerpt and tags." : "Suche durchsucht Titel, Kurztext und Tags."}</span>
        </div>

        <nav class="lang-toggle" aria-label="${escapeAttr(isEn ? "Choose language" : "Sprache wählen")}">
          <a class="lang-link ${isEn ? "" : "is-active"}" href="/blog/" hreflang="de" lang="de" data-lang-switch="de">DE</a>
          <a class="lang-link ${isEn ? "is-active" : ""}" href="/en/blog/" hreflang="en" lang="en" data-lang-switch="en">EN</a>
        </nav>
      </div>
    </section>

    <section class="section blog-grid-section">
      <div class="wrap">
        <section aria-labelledby="blogListHeading">
          <h2 id="blogListHeading" class="sr-only">${isEn ? "Blog posts" : "Blogartikel"}</h2>
          <div id="blogGrid" class="blog-grid" aria-live="polite">
            ${cardsHtml}
          </div>
          <p id="noResults" class="blog-no-results" hidden>${isEn ? "No results. Try another keyword." : "Keine Treffer. Versuch es mit einem anderen Begriff."}</p>
        </section>
      </div>
    </section>
  </main>

  <footer class="site-footer" role="contentinfo">
    <div class="wrap">
      <p>© <span id="year"></span> Swissploit.</p>
      <nav class="foot-nav" aria-label="Footer Navigation">
        <a href="/index.html#services" data-transition>Leistungen</a>
        <a href="/index.html#soc-light" data-transition>SOC Light</a>
        <a href="${navBlogHref}" data-transition>Wissen</a>
        <a href="/index.html#ueber" data-transition>Über Swissploit</a>
        <a href="/index.html#kontakt" data-transition>Kontakt</a>
      </nav>
    </div>
  </footer>

  <script>
    document.getElementById("year").textContent = new Date().getFullYear();
    window.SWISSPLOIT_INDEX_LANG = ${JSON.stringify(lang)};
  </script>
  <script src="/assets/transition.js"></script>
  <script src="/assets/blog-index-static.js"></script>
  <script defer src="/assets/app.js"></script>
</body>
</html>`;
}

function renderStaticPostPage(post, lang, allPosts) {
  const txt = post.i18n?.[lang] || post.i18n?.[post.defaultLang] || post.i18n?.de || post.i18n?.en || {};
  const title = txt.title || "Swissploit – Blog";
  const description = (txt.excerpt || post?.seo?.description?.[lang] || post?.seo?.description?.de || post?.seo?.description?.en || "").slice(0, 160);
  const image = post?.seo?.image || `${BASE_URL}/assets/swissploit-og.png`;
  const canonical =
    (lang === "en" && post?.urls?.en) ||
    post?.urls?.de ||
    post?.urls?.en ||
    `${BASE_URL}/blog/`;
  const blogHref = lang === "en" ? "/en/blog/" : "/blog/";
  const navBlogHref = blogHref;
  const ui = lang === "de"
    ? {
        about: "Über Swissploit",
        latest: "Wissen",
        shorts: "Leistungen",
        blog: "Blog",
        back: "← Zurück",
        watch: "▶ Video ansehen"
      }
    : {
        about: "Über Swissploit",
        latest: "Wissen",
        shorts: "Leistungen",
        blog: "Blog",
        back: "← Back",
        watch: "▶ Watch video"
      };

  const videoHtml = renderVideoHtml(post, lang, title, ui.watch);
  const relatedHtml = renderRelatedPostsHtml(post, allPosts, lang);
  const bodyHtml = txt.content || "";

  return `<!doctype html>
<html lang="${lang}" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} – Swissploit</title>

  <meta name="description" content="${escapeAttr(description)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />

  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeAttr(canonical)}">
  <meta property="og:image" content="${escapeAttr(image)}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="${escapeAttr(image)}">

  ${renderPostAlternateLinks(post, lang)}

  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/favicon-192x192.png">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="icon" type="image/png" href="/assets/JustPlus.png">
  <meta name="theme-color" content="#05070b">

  <script type="application/ld+json">${renderPostJsonLd(post, lang, txt)}</script>
  <script type="application/ld+json">${renderBreadcrumbJsonLd(post, lang, title)}</script>

  <script>
    (function () {
      document.documentElement.setAttribute("data-theme", "dark");
      try { localStorage.setItem("swissploit-theme", "dark"); } catch (e) {}
    })();
  </script>

  <link rel="stylesheet" href="/assets/styles.css" />
  <link rel="stylesheet" href="/assets/blog-post.css" />

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
</head>

<body>
  <header class="site-header" role="banner">
    <div class="wrap headerbar">
      <a class="brand" href="/index.html" aria-label="Swissploit Home" data-transition>
        <img class="brand-logo-image header-logo-image" src="/assets/swissploit-brand-logo.png" alt="Swissploit Logo" width="120" height="49" decoding="async">
      </a>

      <nav class="nav" aria-label="${lang === "de" ? "Hauptnavigation" : "Main navigation"}">
        <a href="/index.html#services" data-transition>Leistungen</a>
        <a href="/index.html#soc-light" data-transition>SOC Light</a>
        <a class="is-active" href="${navBlogHref}" data-transition>Wissen</a>
        <a href="/index.html#ueber" data-transition>Über Swissploit</a>
        <a href="/index.html#kontakt" data-transition>Kontakt</a>
      </nav>

      <button id="themeToggle"
        class="switch"
        aria-pressed="false"
        aria-label="Darstellung umschalten"
        title="Dark/Light umschalten">
        <span class="switch-track"></span>
        <span class="switch-thumb">
          <span class="switch-icon sun" aria-hidden="true">☀️</span>
          <span class="switch-icon moon" aria-hidden="true">🌙</span>
        </span>
      </button>
    </div>
  </header>

  <main id="main">
    <nav class="wrap blog-breadcrumbs" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li><a href="/index.html" data-transition>Home</a></li>
        <li><a href="${blogHref}" data-transition>Wissen</a></li>
        <li aria-current="page">${escapeHtml(title)}</li>
      </ol>
    </nav>

    <section class="section post-hero">
      <div class="wrap">
        <div class="post-topbar">
          <a class="post-back" href="${blogHref}" data-transition>${ui.back}</a>
          ${renderPostLangToggle(post, lang)}
        </div>

        <h1 class="post-title" id="postTitle">${escapeHtml(title)}</h1>
        <p class="post-subline" id="postSubtitle">${escapeHtml(txt.excerpt || "")}</p>
        <div class="post-meta" id="postMeta">${renderMetaHtml(post, lang)}</div>
      </div>
    </section>

    <section class="section post-wrap">
      <div class="wrap">
        <article class="post-content" id="postContent" aria-labelledby="postTitle">
          ${videoHtml}
          <div class="post-article">
            ${bodyHtml}
          </div>
        </article>

        ${relatedHtml}
      </div>
    </section>
  </main>

  <footer class="site-footer" role="contentinfo">
    <div class="wrap">
      <p>© <span id="year"></span> Swissploit.</p>
      <nav class="foot-nav" aria-label="Footer Navigation">
        <a href="/index.html#services" data-transition>Leistungen</a>
        <a href="/index.html#soc-light" data-transition>SOC Light</a>
        <a href="${navBlogHref}" data-transition>Wissen</a>
        <a href="/index.html#ueber" data-transition>Über Swissploit</a>
        <a href="/index.html#kontakt" data-transition>Kontakt</a>
      </nav>
    </div>
  </footer>

  <script>
    document.getElementById("year").textContent = new Date().getFullYear();
    window.SWISSPLOIT_CURRENT_LANG = ${JSON.stringify(lang)};
  </script>

  <script src="/assets/transition.js"></script>
  <script src="/assets/app.js"></script>
  <script src="/assets/blog-index-static.js"></script>
</body>
</html>`;
}

async function readMd(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const html = marked.parse(parsed.content || "", { mangle: false, headerIds: false });

  return {
    data: parsed.data || {},
    html: rewriteContentUrls(String(html || "").trim()),
  };
}

async function main() {
  const mdFiles = await fg(["posts/*/*.md"], { cwd: ROOT, absolute: true });
  const byPost = new Map();

  for (const file of mdFiles) {
    const rel = path.relative(POSTS_DIR, file).replace(/\\/g, "/");
    const [postSlug, filename] = rel.split("/");
    const lang = filename.replace(/\.md$/i, "").toLowerCase();

    if (!postSlug || !lang) continue;
    if (lang !== "de" && lang !== "en") continue;

    const entry = byPost.get(postSlug) || { slug: postSlug, de: null, en: null };
    entry[lang] = { file };
    byPost.set(postSlug, entry);
  }

  const posts = [];

  for (const [, entry] of byPost.entries()) {
    const de = entry.de ? await readMd(entry.de.file) : null;
    const en = entry.en ? await readMd(entry.en.file) : null;

    const meta = {
      id: pickFirst(de?.data?.id, en?.data?.id, entry.slug),
      slug: entry.slug,
      date: normalizeDate(pickFirst(de?.data?.date, en?.data?.date, "")),
      updated: normalizeDate(pickFirst(de?.data?.updated, en?.data?.updated, "")),
      tags: asArray(pickFirst(de?.data?.tags, en?.data?.tags, "")),
      thumb: pickFirst(de?.data?.thumb, en?.data?.thumb, ""),
      videoUrl: pickFirst(de?.data?.videoUrlGlobal, en?.data?.videoUrlGlobal, ""),
    };

    const i18n = {
      de: de ? {
        title: pickFirst(de.data.title, ""),
        excerpt: pickFirst(de.data.excerpt, ""),
        videoUrl: pickFirst(de.data.videoUrl, ""),
        content: de.html,
      } : undefined,
      en: en ? {
        title: pickFirst(en.data.title, ""),
        excerpt: pickFirst(en.data.excerpt, ""),
        videoUrl: pickFirst(en.data.videoUrl, ""),
        content: en.html,
      } : undefined,
    };

    const deVid = cleanStr(i18n.de?.videoUrl);
    const enVid = cleanStr(i18n.en?.videoUrl);

    if (!meta.videoUrl && deVid && enVid && deVid === enVid) {
      meta.videoUrl = deVid;
      if (i18n.de) delete i18n.de.videoUrl;
      if (i18n.en) delete i18n.en.videoUrl;
    }

    const defaultLang = i18n.de ? "de" : "en";

    const urls = {
      de: i18n.de ? getPostUrl(entry.slug, "de") : undefined,
      en: i18n.en ? getPostUrl(entry.slug, "en") : undefined,
    };

    const seo = {
      image: meta.thumb ? absoluteUrl(meta.thumb) : `${BASE_URL}/assets/swissploit-og.png`,
      description: {
        de: pickFirst(
          i18n.de?.excerpt,
          i18n.en?.excerpt,
          stripHtml(i18n.de?.content),
          stripHtml(i18n.en?.content)
        ).slice(0, 160),
        en: pickFirst(
          i18n.en?.excerpt,
          i18n.de?.excerpt,
          stripHtml(i18n.en?.content),
          stripHtml(i18n.de?.content)
        ).slice(0, 160),
      }
    };

    posts.push({
      ...meta,
      defaultLang,
      urls,
      i18n,
      seo,
    });
  }

  posts.sort((a, b) => String(b.updated || b.date || "").localeCompare(String(a.updated || a.date || "")));

  await fs.rm(BLOG_DIR, { recursive: true, force: true });
  await fs.rm(EN_BLOG_DIR, { recursive: true, force: true });

  await fs.mkdir(BLOG_DIR, { recursive: true });
  await fs.mkdir(EN_BLOG_DIR, { recursive: true });

  await fs.writeFile(path.join(BLOG_DIR, "index.html"), renderBlogIndexPage(posts, "de"), "utf8");
  await fs.writeFile(path.join(EN_BLOG_DIR, "index.html"), renderBlogIndexPage(posts, "en"), "utf8");

  for (const post of posts) {
    if (post.i18n?.de) {
      const outDir = path.join(BLOG_DIR, post.slug);
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, "index.html"), renderStaticPostPage(post, "de", posts), "utf8");
    }

    if (post.i18n?.en) {
      const outDir = path.join(EN_BLOG_DIR, post.slug);
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, "index.html"), renderStaticPostPage(post, "en", posts), "utf8");
    }
  }

  const out = `// assets/blog-posts.js
// AUTO-GENERATED FILE. Do not edit directly.
// Edit Markdown files in /posts and run: npm run build:posts

window.SWISSPLOIT_BLOG_POSTS = ${JSON.stringify(posts, null, 2)};
`;
  await fs.writeFile(OUT_FILE, out, "utf8");

  const sitemapEntries = [
    { loc: `${BASE_URL}/` },
    { loc: `${BASE_URL}/blog/` },
    { loc: `${BASE_URL}/en/blog/` },
    ...posts.flatMap((post) => {
      const entries = [];
      if (post.urls?.de) {
        entries.push({
          loc: post.urls.de,
          lastmod: post.updated || post.date || undefined,
          image: post.seo.image || undefined,
        });
      }
      if (post.urls?.en) {
        entries.push({
          loc: post.urls.en,
          lastmod: post.updated || post.date || undefined,
          image: post.seo.image || undefined,
        });
      }
      return entries;
    }),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    sitemapEntries.map((entry) => {
      const lastmodNode = entry.lastmod ? `\n    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : "";
      const imageNode = entry.image
        ? `\n    <image:image><image:loc>${xmlEscape(entry.image)}</image:loc></image:image>`
        : "";
      return `  <url>\n    <loc>${xmlEscape(entry.loc)}</loc>${lastmodNode}${imageNode}\n  </url>`;
    }).join("\n") +
    `\n</urlset>\n`;

  await fs.writeFile(SITEMAP_FILE, sitemap, "utf8");

  console.log(`✅ Generated static blog indexes and posts`);
  console.log(`✅ Generated ${OUT_FILE} (${posts.length} posts)`);
  console.log(`✅ Generated ${SITEMAP_FILE}`);
}

main().catch((err) => {
  console.error("❌ build-posts failed:\n", err);
  process.exit(1);
});

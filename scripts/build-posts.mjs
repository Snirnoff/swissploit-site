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
const LEARN_DIR = path.join(ROOT, "learn");
const EN_LEARN_DIR = path.join(ROOT, "en", "learn");
const BASE_URL = "https://swissploit.ch";
const SITEMAP_FILE = path.join(ROOT, "sitemap.xml");
const DEFAULT_POST_IMAGE = "/assets/swissploit-og.png";

const LEARN_TOPICS = [
  {
    id: "phishing-betrug",
    image: "/assets/blog/h355-014.png",
    title: {
      de: "Phishing & Betrug",
      en: "Phishing & scams"
    },
    description: {
      de: "Gefälschte Nachrichten, Webseiten und Betrugsmaschen erkennen.",
      en: "Recognise fake messages, websites and common scam patterns."
    }
  },
  {
    id: "accounts-passwoerter",
    image: "/assets/blog/021_tn.webp",
    title: {
      de: "Accounts & Passwörter",
      en: "Accounts & passwords"
    },
    description: {
      de: "Konten besser schützen und Übernahmen verhindern.",
      en: "Protect accounts more effectively and prevent takeovers."
    }
  },
  {
    id: "social-engineering",
    visual: "conversation",
    title: {
      de: "Social Engineering",
      en: "Social engineering"
    },
    description: {
      de: "Verstehen, wie Angreifer Vertrauen und menschliches Verhalten ausnutzen.",
      en: "Understand how attackers exploit trust and human behaviour."
    }
  },
  {
    id: "security-alltag",
    visual: "mobile",
    title: {
      de: "Security im Alltag",
      en: "Everyday security"
    },
    description: {
      de: "Smartphone, WLAN, QR-Codes und digitale Alltagsrisiken.",
      en: "Smartphones, Wi-Fi, QR codes and everyday digital risks."
    }
  },
  {
    id: "privacy-datenschutz",
    visual: "privacy",
    title: {
      de: "Privatsphäre & Datenschutz",
      en: "Privacy & data protection"
    },
    description: {
      de: "Persönliche Daten verstehen und besser kontrollieren.",
      en: "Understand personal data and take greater control of it."
    }
  },
  {
    id: "security-buero",
    visual: "office",
    title: {
      de: "Security im Büro",
      en: "Security at work"
    },
    description: {
      de: "Digitale Risiken am Arbeitsplatz erkennen und richtig reagieren.",
      en: "Recognise digital risks at work and respond appropriately."
    }
  }
];

const LEARN_TOPIC_BY_ID = new Map(LEARN_TOPICS.map((topic) => [topic.id, topic]));
const VALID_LEARN_TOPIC_IDS = new Set(LEARN_TOPICS.map((topic) => topic.id));
const LEARN_TOPIC_ALIASES = new Map([
  ["privatsphaere-datenschutz", "privacy-datenschutz"]
]);

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
  const raw = cleanStr(urlPath);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const clean = raw.replace(/^\/+/, "");
  return `${BASE_URL}/${clean}`;
}

function publicAssetUrl(urlPath) {
  const raw = cleanStr(urlPath);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `/${raw.replace(/^\/+/, "")}`;
}

function getLocalizedText(post, lang) {
  return post.i18n?.[lang] || post.i18n?.[post.defaultLang] || post.i18n?.de || post.i18n?.en || {};
}

function getShortDescription(post, lang) {
  const txt = getLocalizedText(post, lang);
  return pickFirst(txt.shortDescription, txt.excerpt, post?.seo?.description?.[lang], "");
}

function getPostImage(post) {
  return pickFirst(post?.image, post?.thumb, "");
}

function getPostImageAlt(post, lang, fallbackTitle = "") {
  const txt = getLocalizedText(post, lang);
  return pickFirst(txt.imageAlt, fallbackTitle, txt.title, "Swissploit");
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

  // Keep explicitly numbered subheadings easy to scan without changing their semantics.
  out = out.replace(
    /<h3>(\d+)\.\s+([^<]+)<\/h3>/gi,
    '<h3 class="article-numbered-heading"><span class="article-numbered-heading__number">$1</span><span>$2</span></h3>'
  );

  // Authors opt in to checklist styling; ordinary article lists stay unchanged.
  out = out.replace(
    /<!--\s*article-checklist\s*-->\s*<ul>/gi,
    '<ul class="article-checklist">'
  );

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
      return { embed: `https://www.youtube-nocookie.com/embed/${v}`, isShort: false };
    }

    if (u.hostname.includes("youtu.be")) {
      const vid = u.pathname.replace("/", "").trim();
      if (vid) return { embed: `https://www.youtube-nocookie.com/embed/${vid}`, isShort: false };
    }

    if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/shorts/")) {
      const vid = u.pathname.split("/shorts/")[1]?.split(/[?&#/]/)[0];
      if (vid) return { embed: `https://www.youtube-nocookie.com/embed/${vid}`, isShort: true };
    }
  } catch {}

  return null;
}

function resolveVideo(post, lang) {
  const direct = post?.i18n?.[lang];
  if (cleanStr(direct?.videoUrl)) {
    return {
      url: cleanStr(direct.videoUrl),
      type: cleanStr(direct.videoType)
    };
  }

  if (cleanStr(post?.videoUrl)) {
    return {
      url: cleanStr(post.videoUrl),
      type: cleanStr(post.videoType)
    };
  }

  return null;
}

function renderHeroMediaHtml(post, lang, title, heroImage, heroImageAlt, watchLabel) {
  const video = resolveVideo(post, lang);
  if (video?.url) {
    const info = youtubeEmbedInfo(video.url);
    const videoTitle = lang === "en" ? `${title} – video` : `${title} – Video`;

    if (!info?.embed) {
      return `
        <div class="post-hero-media post-hero-video post-hero-video--fallback">
          <a class="post-back" href="${escapeAttr(video.url)}" target="_blank" rel="noopener">${escapeHtml(watchLabel)}</a>
        </div>`;
    }

    return `
        <div class="post-hero-media post-hero-video">
          <iframe
            src="${escapeAttr(info.embed)}"
            title="${escapeAttr(videoTitle)}"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen></iframe>
        </div>`;
  }

  if (!heroImage) return "";

  return `
        <figure class="post-hero-media post-hero-image">
          <img src="${escapeAttr(publicAssetUrl(heroImage))}" alt="${escapeAttr(heroImageAlt)}" loading="eager" decoding="async">
        </figure>`;
}

function renderKeyTakeawayHtml(post, lang) {
  const txt = getLocalizedText(post, lang);
  const keyTakeaway = cleanStr(txt.keyTakeaway);
  if (!keyTakeaway) return "";

  const label = lang === "en" ? "Key takeaway" : "Das Wichtigste";
  return `
    <aside class="article-callout article-callout--key">
      <div class="article-callout__heading">
        <span class="article-callout__icon" aria-hidden="true">✓</span>
        <strong>${escapeHtml(label)}</strong>
      </div>
      <div class="article-callout__content"><p>${escapeHtml(keyTakeaway)}</p></div>
    </aside>`;
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

function normalizeFilterValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeCategory(value) {
  const raw = cleanStr(value).toLowerCase();
  if (!raw) return "";
  return LEARN_TOPIC_ALIASES.get(raw) || (VALID_LEARN_TOPIC_IDS.has(raw) ? raw : "");
}

function validateCategory(postSlug, category) {
  if (category) return category;

  const valid = [...VALID_LEARN_TOPIC_IDS].join(", ");
  throw new Error(`Missing or invalid Learn category for "${postSlug}". Use one of: ${valid}`);
}

function getLearnTopic(post) {
  return normalizeCategory(post?.category);
}

function getLearnTopicLabel(topicId, lang) {
  const topic = LEARN_TOPIC_BY_ID.get(normalizeCategory(topicId));
  return topic?.title?.[lang] || topic?.title?.de || (lang === "en" ? "More security content" : "Weitere Security-Inhalte");
}

function renderPostCard(post, lang, topicId) {
  const txt = getLocalizedText(post, lang);
  const href =
    (lang === "en" && post?.urls?.en) ||
    post?.urls?.de ||
    post?.urls?.en ||
    (lang === "en" ? "/en/learn/" : "/learn/");
  const shortDescription = getShortDescription(post, lang);
  const image = getPostImage(post);
  const imageAlt = getPostImageAlt(post, lang, txt.title || "");
  const searchText = [
    txt.title || "",
    shortDescription,
    (post.tags || []).join(" "),
    getLearnTopicLabel(topicId, lang)
  ].join(" ").toLowerCase();

  const titleId = `learn-card-title-${String(post.slug || post.id || "post").replace(/[^a-z0-9-]/gi, "-")}`;
  const filterTags = (post.tags || []).map(normalizeFilterValue).join("|");

  return `
    <article
      class="blog-card"
      aria-labelledby="${escapeAttr(titleId)}"
      data-topic="${escapeAttr(topicId)}"
      data-tags="${escapeAttr(filterTags)}"
      data-search="${escapeAttr(searchText)}">
      <a class="blog-card-link" href="${escapeAttr(href.replace(BASE_URL, ""))}" aria-label="${escapeAttr(txt.title || "")}" data-transition>
        <div class="blog-thumb">
          ${image ? `<img
            class="blog-thumb-img"
            src="${escapeAttr(publicAssetUrl(image))}"
            alt="${escapeAttr(imageAlt)}"
            loading="lazy"
            decoding="async">` : `<div class="blog-thumb-inner">
            <span class="blog-thumb-label">POST</span>
          </div>`}
        </div>

        <div class="blog-card-body">
          <span class="learn-card-category">${escapeHtml(getLearnTopicLabel(topicId, lang))}</span>

          <h3 class="blog-card-title" id="${escapeAttr(titleId)}">${escapeHtml(txt.title || "")}</h3>
          <p class="blog-card-excerpt">${escapeHtml(shortDescription)}</p>
        </div>
      </a>
    </article>
`;
}

function renderIndexAlternateLinks(lang) {
  const canonical = lang === "en" ? `${BASE_URL}/en/learn/` : `${BASE_URL}/learn/`;
  const de = `${BASE_URL}/learn/`;
  const en = `${BASE_URL}/en/learn/`;

  return `
  <link rel="canonical" href="${escapeAttr(canonical)}" />
  <link rel="alternate" hreflang="de" href="${escapeAttr(de)}" />
  <link rel="alternate" hreflang="en" href="${escapeAttr(en)}" />
  <link rel="alternate" hreflang="x-default" href="${escapeAttr(de)}" />`.trim();
}

function renderIndexJsonLd(posts, lang) {
  const pageUrl = lang === "en" ? `${BASE_URL}/en/learn/` : `${BASE_URL}/learn/`;

  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: lang === "en" ? "Swissploit Learn – English" : "Swissploit Learn",
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

function renderPrimaryNavHtml(lang) {
  const items = lang === "en"
    ? [
        { href: "/index.html#services", label: "Services" },
        { href: "/en/learn/", label: "Learn", current: true },
        { href: "/index.html#ueber", label: "About Swissploit" },
        { href: "/index.html#kontakt", label: "Contact" }
      ]
    : [
        { href: "/index.html#services", label: "Services" },
        { href: "/learn/", label: "Learn", current: true },
        { href: "/index.html#ueber", label: "Über Swissploit" },
        { href: "/index.html#kontakt", label: "Kontakt" }
      ];

  return `<nav id="primaryNav" class="nav" aria-label="${lang === "en" ? "Main navigation" : "Hauptnavigation"}">
        ${items.map((item) => `<a${item.current ? ' class="is-active" aria-current="page"' : ""} href="${item.href}" data-transition>${item.label}</a>`).join("\n        ")}
      </nav>`;
}

function renderHeaderActionsHtml() {
  return `<div class="header-actions">
        <button id="themeToggle"
          class="switch"
          aria-pressed="false"
          aria-label="Darstellung umschalten"
          title="Dark/Light umschalten">
          <span class="switch-track"></span>
          <span class="switch-thumb">
            <span class="switch-icon sun" aria-hidden="true">&#9728;</span>
            <span class="switch-icon moon" aria-hidden="true">&#9790;</span>
          </span>
        </button>
        <button id="menuToggle" class="menu-toggle" type="button" aria-expanded="false" aria-controls="primaryNav" aria-label="Menu oeffnen">
          <span></span><span></span>
        </button>
      </div>`;
}

function renderSiteHeaderHtml(lang) {
  return `<header class="site-header" role="banner">
    <div class="wrap headerbar">
      <a class="brand" href="/index.html#intro" aria-label="Swissploit Home" data-transition>
        <img class="brand-logo-image header-logo-image" src="/assets/swissploit-brand-logo2.png" alt="Swissploit Logo" width="120" height="49" decoding="async">
        <span class="brand-text">Swissploit</span>
      </a>

      ${renderPrimaryNavHtml(lang)}

      ${renderHeaderActionsHtml()}
    </div>
  </header>`;
}

function renderFooterNavHtml(lang) {
  const items = lang === "en"
    ? [
        { href: "/index.html#services", label: "Services" },
        { href: "/en/learn/", label: "Learn" },
        { href: "/index.html#ueber", label: "About Swissploit" },
        { href: "/index.html#kontakt", label: "Contact" }
      ]
    : [
        { href: "/index.html#services", label: "Services" },
        { href: "/learn/", label: "Learn" },
        { href: "/index.html#ueber", label: "Über Swissploit" },
        { href: "/index.html#kontakt", label: "Kontakt" }
      ];

  return `<nav class="foot-nav" aria-label="${lang === "en" ? "Footer navigation" : "Footer Navigation"}">
        ${items.map((item) => `<a href="${item.href}" data-transition>${item.label}</a>`).join("\n        ")}
      </nav>`;
}

function getRelatedPosts(allPosts, currentPost, lang, limit = 3) {
  const canShow = (candidate) =>
    candidate.slug !== currentPost.slug &&
    candidate.id !== currentPost.id &&
    Boolean(candidate.i18n?.[lang] || candidate.i18n?.[candidate.defaultLang]);

  const byKey = new Map();
  allPosts.forEach((candidate) => {
    byKey.set(candidate.slug, candidate);
    byKey.set(candidate.id, candidate);
  });

  if ((currentPost.relatedArticles || []).length) {
    const explicit = [];
    currentPost.relatedArticles.forEach((key) => {
      const candidate = byKey.get(cleanStr(key));
      if (candidate && canShow(candidate) && !explicit.some((item) => item.id === candidate.id)) {
        explicit.push(candidate);
      }
    });
    return explicit.slice(0, limit);
  }

  return allPosts
    .filter(canShow)
    .filter((candidate) => candidate.category === currentPost.category)
    .sort((a, b) => {
      const bDate = String(b.updated || b.date || "");
      const aDate = String(a.updated || a.date || "");
      if (bDate !== aDate) return bDate.localeCompare(aDate);

      const aTitle = getLocalizedText(a, lang).title || "";
      const bTitle = getLocalizedText(b, lang).title || "";
      return aTitle.localeCompare(bTitle, lang);
    })
    .slice(0, limit);
}

function renderRelatedPostsHtml(post, allPosts, lang) {
  const related = getRelatedPosts(allPosts, post, lang, 3);
  if (!related.length) return "";

  const heading = lang === "de" ? "Weiterlernen" : "Keep learning";

  return `
    <aside class="post-related" aria-labelledby="relatedPostsHeading">
      <h2 id="relatedPostsHeading">${escapeHtml(heading)}</h2>
      <div class="post-related-grid">
        ${related.map((item) => {
          const txt = getLocalizedText(item, lang);
          const href =
            (lang === "en" && item?.urls?.en) ||
            item?.urls?.de ||
            item?.urls?.en ||
            (lang === "en" ? "/en/learn/" : "/learn/");
          const image = getPostImage(item);
          const imageAlt = getPostImageAlt(item, lang, txt.title || "");
          const shortDescription = getShortDescription(item, lang);

          return `
            <article class="post-related-card blog-card">
              <a class="post-related-card-link blog-card-link" href="${escapeAttr(href.replace(BASE_URL, ""))}" aria-label="${escapeAttr(txt.title || "")}" data-transition>
                <div class="post-related-thumb blog-thumb">
                  ${image ? `<img class="blog-thumb-img" src="${escapeAttr(publicAssetUrl(image))}" alt="${escapeAttr(imageAlt)}" loading="lazy" decoding="async">` : `<div class="blog-thumb-inner"><span class="blog-thumb-label">POST</span></div>`}
                </div>
                <div class="post-related-body blog-card-body">
                  <span class="learn-card-category">${escapeHtml(getLearnTopicLabel(item.category, lang))}</span>
                  ${item.date ? `<time class="post-related-date blog-date" datetime="${escapeAttr(item.date)}">${escapeHtml(formatDate(item.date))}</time>` : ""}
                  <h3 class="post-related-title blog-card-title">${escapeHtml(txt.title || "")}</h3>
                  ${shortDescription ? `<p class="post-related-excerpt blog-card-excerpt">${escapeHtml(shortDescription)}</p>` : ""}
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
    `${BASE_URL}${currentLang === "en" ? "/en/learn/" : "/learn/"}`;

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
  const learnUrl = lang === "en" ? `${BASE_URL}/en/learn/` : `${BASE_URL}/learn/`;
  const postUrl =
    (lang === "en" && post?.urls?.en) ||
    post?.urls?.de ||
    post?.urls?.en ||
    learnUrl;

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
        name: "Learn",
        item: learnUrl
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
    `${BASE_URL}${lang === "en" ? "/en/learn/" : "/learn/"}`;
  const description = pickFirst(txt.seoDescription, getShortDescription(post, lang), post?.seo?.description?.[lang], "");
  const image = absoluteUrl(getPostImage(post) || DEFAULT_POST_IMAGE);

  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: txt.title || undefined,
    description: description.slice(0, 160) || undefined,
    datePublished: post.date || undefined,
    dateModified: post.updated || post.date || undefined,
    image: image || undefined,
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
  const pageTitle = isEn
    ? "Learn | Cyber Security explained simply | Swissploit"
    : "Learn | Cyber Security einfach erklärt | Swissploit";
  const metaDescription = isEn
    ? "Cyber Security explained simply: phishing, scams, accounts, passwords, privacy and digital security made easy to understand."
    : "Cyber Security einfach erklärt: Phishing, Scams, Accounts, Passwörter, Datenschutz und digitale Sicherheit verständlich erklärt.";
  const ogDescription = isEn
    ? "Understand digital threats, spot scams and learn how to protect yourself in everyday life and at work."
    : "Verstehe digitale Gefahren, erkenne Betrugsversuche und lerne, wie du dich im Alltag und am Arbeitsplatz besser schützt.";
  const pageUrl = isEn ? `${BASE_URL}/en/learn/` : `${BASE_URL}/learn/`;
  const availablePosts = posts
    .filter((post) => Boolean(post.i18n?.[lang] || post.i18n?.[post.defaultLang]))
    .sort((a, b) => String(b.updated || b.date || "").localeCompare(String(a.updated || a.date || "")));
  const learnCardsHtml = availablePosts
    .map((post) => renderPostCard(post, lang, getLearnTopic(post)))
    .join("");

  return `<!doctype html>
<html lang="${lang}" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(pageTitle)}</title>

  <link rel="icon" type="image/png" sizes="32x32" href="/assets/swissploit-brand-logo2.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/swissploit-brand-logo2.png">
  <link rel="apple-touch-icon" href="/assets/swissploit-brand-logo2.png">
  <link rel="icon" type="image/png" href="/assets/swissploit-brand-logo2.png">
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
  <link rel="stylesheet" href="/assets/learn.css" />

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
</head>

<body class="learn-page">
  ${renderSiteHeaderHtml(lang)}

  <main id="main">
    <nav class="wrap blog-breadcrumbs" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li><a href="/index.html">Home</a></li>
        <li aria-current="page">Learn</li>
      </ol>
    </nav>

    <section class="section blog-hero learn-hero" aria-labelledby="learn-title">
      <div class="wrap learn-hero-inner">
        <p class="learn-eyebrow">Swissploit Learn</p>
        <h1 class="blog-title" id="learn-title">${isEn ? "Cyber Security explained simply." : "Cyber Security einfach erklärt."}</h1>
        <p class="blog-lead">${isEn
          ? "Understand digital threats, spot scams and learn how to protect yourself in everyday life and at work."
          : "Verstehe digitale Gefahren, erkenne Betrugsversuche und lerne, wie du dich im Alltag und am Arbeitsplatz besser schützt."}</p>

        <div class="learn-controls">
          <div class="blog-search learn-search">
            <label class="sr-only" for="blogSearch">${isEn ? "Search Learn" : "Learn durchsuchen"}</label>
            <span class="learn-search-icon" aria-hidden="true"></span>
            <input id="blogSearch" type="search" placeholder="${escapeAttr(isEn ? "Search for a security topic ..." : "Nach einem Security-Thema suchen ...")}" autocomplete="off" enterkeyhint="search">
            <span class="blog-search-hint">${isEn ? "Search by title, summary, tag or category." : "Suche nach Titel, Kurztext, Tag oder Kategorie."}</span>
          </div>

          <nav class="lang-toggle" aria-label="${escapeAttr(isEn ? "Choose language" : "Sprache wählen")}">
            <a class="lang-link ${isEn ? "" : "is-active"}" href="/learn/" hreflang="de" lang="de" data-lang-switch="de">DE</a>
            <a class="lang-link ${isEn ? "is-active" : ""}" href="/en/learn/" hreflang="en" lang="en" data-lang-switch="en">EN</a>
          </nav>
        </div>
        <div class="learn-progress" aria-live="polite">
          <span class="learn-progress-label">${isEn ? "Learning progress" : "Lernfortschritt"}</span>
          <strong id="learnProgressText">${isEn ? "0 articles read · ${posts.length} open" : `0 Artikel gelesen · ${posts.length} offen`}</strong>
          <span class="learn-progress-bar" aria-hidden="true"><span id="learnProgressBar"></span></span>
        </div>
      </div>
    </section>

    <section class="section learn-featured" aria-labelledby="featured-title">
      <div class="wrap">
        <div class="learn-featured-panel">
          <div class="learn-featured-copy">
            <span class="learn-label">${isEn ? "Recommended starting point" : "Empfohlen zum Start"}</span>
            <h2 id="featured-title">${isEn ? "Social engineering & phishing explained simply" : "Social Engineering & Phishing einfach erklärt"}</h2>
            <p>${isEn
              ? "How social engineering works, how to spot phishing and why the sender, links and professional design alone do not guarantee safety."
              : "Wie Social Engineering funktioniert, woran du Phishing erkennst und warum Absender, Links und professionelles Design allein keine Sicherheit bieten."}</p>
          </div>
          <div class="learn-video-frame">
            <iframe
              src="https://www.youtube-nocookie.com/embed/n_2DYwpVsS4"
              title="${escapeAttr(isEn ? "Social engineering and phishing explained simply" : "Social Engineering und Phishing einfach erklärt")}"
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen></iframe>
          </div>
        </div>
      </div>
    </section>

    <section id="learn-content" class="section learn-content-section" aria-labelledby="learn-content-title">
      <div class="wrap">
        <div class="learn-content-header">
          <div class="learn-section-heading">
            <p class="learn-eyebrow">${isEn ? "Knowledge base" : "Wissensbereich"}</p>
            <h2 id="learn-content-title">${isEn ? "All Learn content" : "Alle Learn-Inhalte"}</h2>
            <p>${isEn ? "The latest content appears first." : "Die neuesten Inhalte erscheinen zuerst."}</p>
          </div>
          <nav class="learn-topic-filter" aria-label="${isEn ? "Learn topic filter" : "Learn Themenfilter"}" role="tablist">
            ${[
              ["all", "ALL"],
              ["phishing-betrug", "PHISHING"],
              ["m365", "M365"],
              ["windows", "WINDOWS"],
              ["privacy-datenschutz", "PRIVACY"],
              ["security", "SECURITY"]
            ].map(([value, label], index) => `<button class="filter-chip${index === 0 ? " is-active" : ""}" type="button" role="tab" aria-selected="${index === 0 ? "true" : "false"}" data-learn-filter="${value}">${label}</button>`).join("")}
          </nav>
        </div>

        <div id="blogGrid" class="blog-grid learn-article-list" aria-live="polite">
          ${learnCardsHtml}
        </div>
        <div id="noResults" class="blog-no-results learn-empty-state" role="status" hidden>
          <strong id="noResultsText">${isEn ? "No matching content found." : "Keine passenden Inhalte gefunden."}</strong>
        </div>
        <p id="learnResultStatus" class="sr-only" aria-live="polite"></p>
      </div>
    </section>
  </main>

  <footer class="site-footer" role="contentinfo">
    <div class="wrap">
      <p>© <span id="year"></span> Swissploit.</p>
      ${renderFooterNavHtml(lang)}
    </div>
  </footer>

  <script>
    document.getElementById("year").textContent = new Date().getFullYear();
    window.SWISSPLOIT_INDEX_LANG = ${JSON.stringify(lang)};
  </script>
  <script src="/assets/transition.js"></script>
  <script src="/assets/learn.js"></script>
  <script defer src="/assets/app.js"></script>
</body>
</html>`;
}

function renderLegacyIndexRedirect(lang) {
  const isEn = lang === "en";
  const target = isEn ? "/en/learn/" : "/learn/";
  const canonical = `${BASE_URL}${target}`;

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${isEn ? "Redirecting to Learn" : "Weiterleitung zu Learn"} | Swissploit</title>
  <meta name="robots" content="noindex,follow" />
  <meta http-equiv="refresh" content="0; url=${target}" />
  <link rel="canonical" href="${canonical}" />
  <script>window.location.replace(${JSON.stringify(target)});</script>
</head>
<body>
  <main>
    <p>${isEn ? "The knowledge section is now available under" : "Der Wissensbereich ist neu unter"} <a href="${target}">Learn</a>.</p>
  </main>
</body>
</html>`;
}

function renderStaticPostPage(post, lang, allPosts) {
  const txt = getLocalizedText(post, lang);
  const title = txt.title || "Swissploit – Learn";
  const pageTitle = pickFirst(txt.seoTitle, title);
  const description = pickFirst(
    txt.seoDescription,
    getShortDescription(post, lang),
    post?.seo?.description?.[lang],
    post?.seo?.description?.de,
    post?.seo?.description?.en,
    ""
  ).slice(0, 160);
  const image = absoluteUrl(getPostImage(post) || DEFAULT_POST_IMAGE);
  const heroImage = getPostImage(post);
  const heroImageAlt = getPostImageAlt(post, lang, title);
  const categoryLabel = getLearnTopicLabel(post.category, lang);
  const canonical =
    (lang === "en" && post?.urls?.en) ||
    post?.urls?.de ||
    post?.urls?.en ||
    `${BASE_URL}${lang === "en" ? "/en/learn/" : "/learn/"}`;
  const learnHref = lang === "en" ? "/en/learn/" : "/learn/";
  const ui = lang === "de"
    ? {
        about: "Über Swissploit",
        latest: "Wissen",
        shorts: "Leistungen",
        blog: "Learn",
        back: "← Zurück",
        watch: "▶ Video ansehen"
      }
    : {
        about: "Über Swissploit",
        latest: "Wissen",
        shorts: "Leistungen",
        blog: "Learn",
        back: "← Back",
        watch: "▶ Watch video"
      };

  const relatedHtml = renderRelatedPostsHtml(post, allPosts, lang);
  const bodyHtml = txt.content || "";
  const shortDescription = getShortDescription(post, lang);
  const heroMediaHtml = renderHeroMediaHtml(post, lang, title, heroImage, heroImageAlt, ui.watch);
  const keyTakeawayHtml = renderKeyTakeawayHtml(post, lang);

  return `<!doctype html>
<html lang="${lang}" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(pageTitle)} – Swissploit</title>

  <meta name="description" content="${escapeAttr(description)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />

  <meta property="og:title" content="${escapeAttr(pageTitle)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeAttr(canonical)}">
  <meta property="og:image" content="${escapeAttr(image)}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(pageTitle)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="${escapeAttr(image)}">

  ${renderPostAlternateLinks(post, lang)}

  <link rel="icon" type="image/png" sizes="32x32" href="/assets/swissploit-brand-logo2.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/swissploit-brand-logo2.png">
  <link rel="apple-touch-icon" href="/assets/swissploit-brand-logo2.png">
  <link rel="icon" type="image/png" href="/assets/swissploit-brand-logo2.png">
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
  ${renderSiteHeaderHtml(lang)}

  <main id="main">
    <nav class="wrap blog-breadcrumbs" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li><a href="/index.html" data-transition>Home</a></li>
        <li><a href="${learnHref}" data-transition>Learn</a></li>
        <li aria-current="page">${escapeHtml(title)}</li>
      </ol>
    </nav>

    <section class="section post-hero">
      <div class="wrap">
        <div class="post-topbar">
          <a class="post-back" href="${learnHref}" data-transition>${ui.back}</a>
          ${renderPostLangToggle(post, lang)}
        </div>

        <p class="post-kicker">${escapeHtml(categoryLabel)}</p>
        <h1 class="post-title" id="postTitle">${escapeHtml(title)}</h1>
        <p class="post-subline" id="postSubtitle">${escapeHtml(shortDescription)}</p>
        <div class="post-meta" id="postMeta">${renderMetaHtml(post, lang)}</div>
        ${heroMediaHtml}
      </div>
    </section>

    <section class="section post-wrap">
      <div class="wrap">
        <article class="post-content" id="postContent" aria-labelledby="postTitle">
          <div class="post-article">
            ${keyTakeawayHtml}
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
      ${renderFooterNavHtml(lang)}
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
    const category = validateCategory(entry.slug, normalizeCategory(pickFirst(de?.data?.category, en?.data?.category, "")));
    const image = pickFirst(de?.data?.image, en?.data?.image, de?.data?.thumb, en?.data?.thumb, "");
    const thumb = pickFirst(de?.data?.thumb, en?.data?.thumb, de?.data?.image, en?.data?.image, "");

    const meta = {
      id: pickFirst(de?.data?.id, en?.data?.id, entry.slug),
      slug: entry.slug,
      date: normalizeDate(pickFirst(de?.data?.publishedDate, de?.data?.date, en?.data?.publishedDate, en?.data?.date, "")),
      updated: normalizeDate(pickFirst(de?.data?.updatedDate, de?.data?.updated, en?.data?.updatedDate, en?.data?.updated, "")),
      category,
      tags: asArray(pickFirst(de?.data?.tags, en?.data?.tags, "")),
      image,
      thumb,
      relatedArticles: asArray(pickFirst(de?.data?.relatedArticles, en?.data?.relatedArticles, "")),
      videoUrl: pickFirst(de?.data?.videoUrlGlobal, en?.data?.videoUrlGlobal, ""),
      videoType: pickFirst(de?.data?.videoTypeGlobal, en?.data?.videoTypeGlobal, ""),
    };

    const i18n = {
      de: de ? {
        title: pickFirst(de.data.title, ""),
        shortDescription: pickFirst(de.data.shortDescription, de.data.excerpt, ""),
        excerpt: pickFirst(de.data.excerpt, ""),
        imageAlt: pickFirst(de.data.imageAlt, ""),
        seoTitle: pickFirst(de.data.seoTitle, ""),
        seoDescription: pickFirst(de.data.seoDescription, ""),
        keyTakeaway: pickFirst(de.data.keyTakeaway, ""),
        videoUrl: pickFirst(de.data.videoUrl, ""),
        videoType: pickFirst(de.data.videoType, ""),
        content: de.html,
      } : undefined,
      en: en ? {
        title: pickFirst(en.data.title, ""),
        shortDescription: pickFirst(en.data.shortDescription, en.data.excerpt, ""),
        excerpt: pickFirst(en.data.excerpt, ""),
        imageAlt: pickFirst(en.data.imageAlt, ""),
        seoTitle: pickFirst(en.data.seoTitle, ""),
        seoDescription: pickFirst(en.data.seoDescription, ""),
        keyTakeaway: pickFirst(en.data.keyTakeaway, ""),
        videoUrl: pickFirst(en.data.videoUrl, ""),
        videoType: pickFirst(en.data.videoType, ""),
        content: en.html,
      } : undefined,
    };

    const deVid = cleanStr(i18n.de?.videoUrl);
    const enVid = cleanStr(i18n.en?.videoUrl);

    if (!meta.videoUrl && deVid && enVid && deVid === enVid) {
      meta.videoUrl = deVid;
      meta.videoType = pickFirst(i18n.de?.videoType, i18n.en?.videoType, meta.videoType);
      if (i18n.de) delete i18n.de.videoUrl;
      if (i18n.en) delete i18n.en.videoUrl;
    }

    const defaultLang = i18n.de ? "de" : "en";

    const urls = {
      de: i18n.de ? getPostUrl(entry.slug, "de") : undefined,
      en: i18n.en ? getPostUrl(entry.slug, "en") : undefined,
    };

    const seo = {
      image: absoluteUrl(meta.image || DEFAULT_POST_IMAGE),
      title: {
        de: pickFirst(i18n.de?.seoTitle, i18n.de?.title, i18n.en?.seoTitle, i18n.en?.title),
        en: pickFirst(i18n.en?.seoTitle, i18n.en?.title, i18n.de?.seoTitle, i18n.de?.title),
      },
      description: {
        de: pickFirst(
          i18n.de?.seoDescription,
          i18n.de?.shortDescription,
          i18n.de?.excerpt,
          i18n.en?.seoDescription,
          i18n.en?.shortDescription,
          i18n.en?.excerpt,
          stripHtml(i18n.de?.content),
          stripHtml(i18n.en?.content)
        ).slice(0, 160),
        en: pickFirst(
          i18n.en?.seoDescription,
          i18n.en?.shortDescription,
          i18n.en?.excerpt,
          i18n.de?.seoDescription,
          i18n.de?.shortDescription,
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
  await fs.rm(LEARN_DIR, { recursive: true, force: true });
  await fs.rm(EN_LEARN_DIR, { recursive: true, force: true });

  await fs.mkdir(BLOG_DIR, { recursive: true });
  await fs.mkdir(EN_BLOG_DIR, { recursive: true });
  await fs.mkdir(LEARN_DIR, { recursive: true });
  await fs.mkdir(EN_LEARN_DIR, { recursive: true });

  await fs.writeFile(path.join(LEARN_DIR, "index.html"), renderBlogIndexPage(posts, "de"), "utf8");
  await fs.writeFile(path.join(EN_LEARN_DIR, "index.html"), renderBlogIndexPage(posts, "en"), "utf8");
  await fs.writeFile(path.join(BLOG_DIR, "index.html"), renderLegacyIndexRedirect("de"), "utf8");
  await fs.writeFile(path.join(EN_BLOG_DIR, "index.html"), renderLegacyIndexRedirect("en"), "utf8");

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
    { loc: `${BASE_URL}/learn/` },
    { loc: `${BASE_URL}/en/learn/` },
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

  console.log(`✅ Generated static Learn indexes and blog article URLs`);
  console.log(`✅ Generated ${OUT_FILE} (${posts.length} posts)`);
  console.log(`✅ Generated ${SITEMAP_FILE}`);
}

main().catch((err) => {
  console.error("❌ build-posts failed:\n", err);
  process.exit(1);
});

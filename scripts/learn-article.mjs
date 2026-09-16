// Article-only HTML processing. No browser runtime or shortcode parser required.
import matter from "gray-matter";
import { marked } from "marked";

export function parseArticle(raw, source) {
  try {
    const parsed = matter(raw);
    return { data: parsed.data || {}, html: marked.parse(parsed.content || "") };
  } catch (error) {
    throw new Error(`${source}: ${error.message}`, { cause: error });
  }
}

const text = (html) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const attr = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function prepareArticle(html) {
  // Preserve the legacy opt-in before removing editorial/image comments.
  html = html.replace(/<!--\s*article-checklist\s*-->\s*<ul>/gi, '<ul class="article-checklist">');
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  const used = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]));
  const headings = [];
  html = html.replace(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (_, level, attributes, content) => {
    const label = text(content);
    let id = attributes.match(/\bid=["']([^"']+)["']/)?.[1];
    if (!id) {
      const base = label.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        .replace(/&[^;]+;/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
      id = base;
      let suffix = 2;
      while (used.has(id)) id = `${base}-${suffix++}`;
      used.add(id);
      attributes += ` id="${id}"`;
    }
    if (level === "2" && !/^(quellen|sources|references|related articles|weiterlernen|weiterfuhrende links|weiterführende links)\b/i.test(label)) {
      headings.push({ id, label: content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() });
    }
    const numbered = content.match(/^(\d+)\.\s+([\s\S]+)$/);
    if (numbered && !attributes.includes("article-numbered-heading")) {
      attributes = /\bclass=["']/.test(attributes)
        ? attributes.replace(/\bclass=(["'])/, 'class=$1article-numbered-heading ')
        : `${attributes} class="article-numbered-heading"`;
      content = `<span class="article-numbered-heading__number">${numbered[1]}.</span><span>${numbered[2]}</span>`;
    }
    return `<h${level}${attributes}>${content}</h${level}>`;
  });
  return { html, headings, words: text(html).split(/\s+/).filter(Boolean).length };
}

export function renderArticleToc(article, lang) {
  if (article.headings.length < 5 || article.words < 600) return "";
  const label = lang === "en" ? "On this page" : "In diesem Artikel";
  return `<details class="article-toc"><summary>${label}</summary><nav aria-label="${label}"><ul>${article.headings.map(({ id, label }) => `<li><a href="#${attr(id)}">${label}</a></li>`).join("")}</ul></nav></details>`;
}

import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { marked } from "marked";

const SITEMAP_FILE = path.join(ROOT, "sitemap.xml");
const BASE_URL = "https://swissploit.ch";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "posts");
const OUT_FILE = path.join(ROOT, "assets", "blog-posts.js");

function asArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return String(v)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function cleanStr(v) {
  const s = String(v ?? "").trim();
  return s;
}

function pickFirst(...vals) {
  for (const v of vals) {
    const s = cleanStr(v);
    if (s) return s;
  }
  return "";
}

// ✅ Always normalize to "YYYY-MM-DD"
function normalizeDate(v) {
  if (!v) return "";

  // YAML can deliver a real Date object
  if (v instanceof Date) {
    return v.toISOString().slice(0, 10);
  }

  const s = String(v).trim();
  if (!s) return "";

  // Already normalized
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Try parsing strings like "Tue Jan 27 2026 ..."
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return s;
}

async function readMd(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const html = marked.parse(parsed.content || "", { mangle: false, headerIds: false });
  return {
    data: parsed.data || {},
    html: String(html || "").trim(),
  };
}

async function main() {
  // Expect structure: posts/<postId>/de.md and/or en.md
  const mdFiles = await fg(["posts/*/*.md"], { cwd: ROOT, absolute: true });
  const byPost = new Map();

  for (const file of mdFiles) {
    const rel = path.relative(POSTS_DIR, file).replace(/\\/g, "/");
    const [postId, filename] = rel.split("/");
    const lang = filename.replace(/\.md$/i, "").toLowerCase();
    if (!postId || !lang) continue;
    if (lang !== "de" && lang !== "en") continue;

    const entry = byPost.get(postId) || { id: postId, de: null, en: null };
    entry[lang] = { file };
    byPost.set(postId, entry);
  }

  const posts = [];

  for (const [postId, entry] of byPost.entries()) {
    const de = entry.de ? await readMd(entry.de.file) : null;
    const en = entry.en ? await readMd(entry.en.file) : null;

    const meta = {
      id: pickFirst(de?.data?.id, en?.data?.id, postId),
      date: normalizeDate(pickFirst(de?.data?.date, en?.data?.date, "")),
      tags: asArray(pickFirst(de?.data?.tags, en?.data?.tags, "")),
      thumb: pickFirst(de?.data?.thumb, en?.data?.thumb, ""),
      // Optional: a global video if you want one URL for both languages
      videoUrl: pickFirst(de?.data?.videoUrlGlobal, en?.data?.videoUrlGlobal, ""),
    };

    const i18n = {
      de: de
        ? {
            title: pickFirst(de.data.title, ""),
            excerpt: pickFirst(de.data.excerpt, ""),
            videoUrl: pickFirst(de.data.videoUrl, ""),
            content: de.html,
          }
        : undefined,
      en: en
        ? {
            title: pickFirst(en.data.title, ""),
            excerpt: pickFirst(en.data.excerpt, ""),
            videoUrl: pickFirst(en.data.videoUrl, ""),
            content: en.html,
          }
        : undefined,
    };

    // If both languages have the same videoUrl, move it to global videoUrl (cleaner data)
    const deVid = cleanStr(i18n.de?.videoUrl);
    const enVid = cleanStr(i18n.en?.videoUrl);
    if (!meta.videoUrl && deVid && enVid && deVid === enVid) {
      meta.videoUrl = deVid;
      if (i18n.de) delete i18n.de.videoUrl;
      if (i18n.en) delete i18n.en.videoUrl;
    }

    posts.push({ ...meta, i18n });
  }

  // Sort newest first (string compare works with YYYY-MM-DD)
  posts.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const out = `// assets/blog-posts.js\n// AUTO-GENERATED FILE. Do not edit directly.\n// Edit Markdown files in /posts and run: npm run build:posts\n\nwindow.SWISSPLOIT_BLOG_POSTS = ${JSON.stringify(posts, null, 2)};\n`;
  await fs.writeFile(OUT_FILE, out, "utf8");

    const urls = [
    `${BASE_URL}/`,
    `${BASE_URL}/blog.html`,
    ...posts.map(p => `${BASE_URL}/blog-post.html?id=${encodeURIComponent(p.id)}`)
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${u}</loc></url>`).join("\n") +
    `\n</urlset>\n`;

  await fs.writeFile(SITEMAP_FILE, sitemap, "utf8");
  console.log(`✅ Generated ${SITEMAP_FILE}`);

  console.log(`✅ Generated ${OUT_FILE} (${posts.length} posts)`);
}

main().catch((err) => {
  console.error("❌ build-posts failed:\n", err);
  process.exit(1);
});



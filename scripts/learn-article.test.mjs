import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import fg from 'fast-glob';
import { parseArticle, prepareArticle, renderArticleToc } from './learn-article.mjs';
import { readMd, renderStaticPostPage } from './build-posts.mjs';

function post(content, extras = {}) {
  return {slug:'test-only', id:'test-only', date:'2026-09-15', category:'phishing-betrug', defaultLang:'de', urls:{de:'https://swissploit.ch/blog/test-only/'}, tags:[], i18n:{de:{title:'Prüfen: Ä, Ö & ü', excerpt:'Ein kurzer Text.', content, ...extras}}, ...extras};
}

test('real authoring template parses outside posts with all base fields and no required media', async () => {
  const file='docs/templates/learn-article.de.md';
  const {data,html}=await readMd(file);
  for(const key of ['date','category','title','excerpt','shortDescription','tags','image','imageAlt','videoUrl','videoType','relatedArticles','seoTitle','seoDescription']) assert.ok(Object.hasOwn(data,key),key);
  assert.deepEqual(data.relatedArticles,['phishing-mails-erkennen','gefaehrliche-links-erkennen']);
  assert.equal(data.image,''); assert.equal(data.videoUrl,'');
  const page=renderStaticPostPage(post(html,data),'de',[]);
  assert.equal((page.match(/<h1\b/g)||[]).length,1);
  assert.equal((page.match(/article-callout--key/g)||[]).length,1);
  assert.doesNotMatch(page,/<iframe|class="post-hero-media|BILDPLATZHALTER|REDAKTION|QUELLEN:/);
  assert.match(page,/https:\/\/swissploit.ch\/assets\/swissploit-og.png/);
  assert.match(page,/Prüfen|Verdächtige/);
  await fs.access('assets/swissploit-og.png');
});

test('YAML syntax failures include the precise source file', async () => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'learn-parser-'));
  const file=path.join(dir,'broken.de.md');
  await fs.writeFile(file,'---\ntitle: [not closed\ncategory: phishing-betrug\n---\nText');
  await assert.rejects(readMd(file), error => error.message.includes('broken.de.md') && /flow|collection|stream/i.test(error.message));
  // Only the exact fixture created above is removed, no recursive delete.
  await fs.unlink(file); await fs.rmdir(dir);
});

test('empty optional media and legacy keyTakeaway are compatible in both languages', () => {
  for(const lang of ['de','en']) {
    const p=post('<p>Inhalt</p>',{keyTakeaway:'Eine Aussage.'});
    p.i18n[lang]=p.i18n.de;
    let page=renderStaticPostPage(p,lang,[]);
    assert.equal((page.match(/article-callout--key/g)||[]).length,1);
    assert.match(page,lang==='en'?/Key takeaway/:/Das Wichtigste/);
    p.i18n[lang].content='<aside class="article-callout article-callout--key"><div class="article-callout__heading"><span class="article-callout__icon" aria-hidden="true">i</span><strong>Key</strong></div><div class="article-callout__content"><p>Explizit.</p></div></aside>';
    page=renderStaticPostPage(p,lang,[]);
    assert.equal((page.match(/article-callout--key/g)||[]).length,1);
    assert.doesNotMatch(page,/<iframe|<img[^>]+src=""|post-subline/);
  }
});

test('comments disappear, legacy checklist survives, code and UTF-8 remain intact', () => {
  const raw='---\ncategory: phishing-betrug\ntitle: "Äpfel: prüfen & schützen"\n---\n<!--\nEDITORIAL <img src="missing.webp">\n-->\n\n<!-- article-checklist -->\n- Prüfe Ä, Ö und ü.\n\n`https://example.com/'+ 'a'.repeat(250)+'?x=1&y=2`';
  const parsed=parseArticle(raw,'fixture.md');
  const result=prepareArticle(parsed.html);
  assert.match(result.html,/<ul class="article-checklist">/);
  assert.doesNotMatch(result.html,/EDITORIAL|missing.webp|<!--/);
  assert.match(result.html,/Prüfe Ä, Ö und ü/);
  assert.match(result.html,/<code>https:\/\/example.com\//);
});

test('headings have stable unique anchors, preserve explicit IDs and numbering', () => {
  const raw='<h2 id="prufen">Bestehend</h2><h2>Prüfen</h2><h2>Prüfen</h2><h2>1. Kontext &amp; Anlass</h2><h3 class="custom" id="old-id">2. <em>Absender</em></h3><h3 class="article-numbered-heading"><span class="article-numbered-heading__number">3</span><span>Alt</span></h3>';
  const first=prepareArticle(raw);
  assert.match(first.html,/id="prufen-2"/); assert.match(first.html,/id="prufen-3"/);
  assert.match(first.html,/id="old-id"/);
  assert.match(first.html,/class="article-numbered-heading custom"/);
  assert.match(first.html,/>1\.<\/span><span>Kontext/);
  assert.equal(prepareArticle(first.html).html,first.html);
  assert.equal(prepareArticle(first.html).headings[3].label,'1. Kontext &amp; Anlass');
});

test('TOC threshold and exclusions, DE and EN, no second navigation', () => {
  const headings=Array.from({length:5},(_,i)=>`<h2>Schritt ${i+1}</h2>`).join('');
  const long=prepareArticle(headings+'<p>'+ 'Wort '.repeat(600)+'</p><h2>Quellen</h2><h2>Related Articles</h2>');
  assert.equal(long.headings.length,5);
  const toc=renderArticleToc(long,'de');
  assert.match(toc,/In diesem Artikel/); assert.doesNotMatch(toc,/Quellen|Related Articles/);
  assert.equal((toc.match(/<nav/g)||[]).length,1);
  assert.match(renderArticleToc(long,'en'),/On this page/);
  assert.equal(renderArticleToc(prepareArticle(headings),'de'),'');
  assert.equal(renderArticleToc({...long,headings:long.headings.slice(0,4)},'de'),'');
});

test('video URL, no autoplay, vertical class, image alt and SEO preserved', () => {
  const p=post('<p>Video</p>', {videoUrl:'https://www.youtube.com/shorts/rTf4mqmvhUc',videoType:'short',image:'assets/blog/phishing-mails-erkennen.webp',imageAlt:'E-Mail mit markiertem Absender',seoTitle:'SEO: Ä & Ö'});
  const page=renderStaticPostPage(p,'de',[]);
  assert.match(page,/youtube-nocookie.com\/embed\/rTf4mqmvhUc/);
  assert.match(page,/post-hero-video--short/);
  assert.doesNotMatch(page,/autoplay/);
  assert.match(page,/SEO: Ä &amp; Ö/);
  p.i18n.de.videoUrl=''; p.videoUrl='';
  assert.match(renderStaticPostPage(p,'de',[]),/alt="E-Mail mit markiertem Absender"/);
});

test('all documented components go through the production parser', async () => {
  const guide=await fs.readFile('docs/LEARN-AUTHORING.md','utf8');
  const examples=[...guide.matchAll(/```html\n([\s\S]*?)\n```/g)].map(m=>m[1]).join('\n\n');
  const html=prepareArticle(parseArticle(examples,'docs/LEARN-AUTHORING.md').html).html;
  for(const variant of ['key','info','tip','warning','danger','example','action','mistake','kmu','summary']) assert.match(html,new RegExp('article-callout--'+variant));
  for(const name of ['article-checklist','article-steps','article-rule','post-figure','article-faq']) assert.ok(html.includes(name));
  assert.doesNotMatch(html,/role="alert"|BILDPLATZHALTER/);
});

test('generated inventory equals source languages, canonical URLs, no published template', async () => {
  const source=await fg('posts/*/{de,en}.md');
  const pages=await fg(['blog/*/index.html','en/blog/*/index.html']);
  assert.equal(pages.length,source.length);
  const window={};vm.runInNewContext(await fs.readFile('assets/blog-posts.js','utf8'),{window});
  const posts=window.SWISSPLOIT_BLOG_POSTS;
  assert.equal(posts.length,new Set(source.map(file=>file.split('/')[1])).size);
  for(const p of posts)for(const [lang,txt] of Object.entries(p.i18n)) {
    assert.doesNotMatch(txt.content,/<!--|BILDPLATZHALTER|HIER SPÄTER/);
    const url=lang==='en'?`en/blog/${p.slug}/index.html`:`blog/${p.slug}/index.html`;
    const html=await fs.readFile(url,'utf8');
    assert.equal((html.match(/<h1\b/g)||[]).length,1,url);
    assert.ok((html.match(/class="article-toc"/g)||[]).length<=1,url);
    assert.ok((html.match(/article-callout--key/g)||[]).length<=1,url);
    assert.ok(html.includes(`href="${p.urls[lang]}"`),url);
    for(const match of html.matchAll(/<img[^>]+src="(\/assets\/[^"?#]+)"/g)) await fs.access('.'+match[1]);
    assert.doesNotMatch(html,/href="[^"]*phishing-simulation/);
  }
  const sitemap=await fs.readFile('sitemap.xml','utf8');
  assert.doesNotMatch(sitemap,/test-only|learn-article\.de|phishing-simulation/);
});

test('six categories and the legacy alias remain validated with a source path', async () => {
  const {normalizeCategory,validateCategory}=await import('./build-posts.mjs');
  for(const category of ['phishing-betrug','accounts-passwoerter','social-engineering','security-alltag','privacy-datenschutz','security-buero']) assert.equal(validateCategory('posts/example/de.md',normalizeCategory(category)),category);
  assert.equal(normalizeCategory('privatsphaere-datenschutz'),'privacy-datenschutz');
  assert.throws(()=>validateCategory('posts/example/de.md',normalizeCategory('wrong')),/posts\/example\/de.md/);
});

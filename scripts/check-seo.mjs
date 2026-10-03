// Static output audit: no browser, network or additional dependencies required.
import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
const origin = 'https://swissploit.ch';
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const decode = s => String(s || '').replace(/&(?:amp|quot|apos|lt|gt|#039);/g, e => ({'&amp;':'&','&quot;':'"','&apos;':"'",'&#039;':"'",'&lt;':'<','&gt;':'>'}[e]));
function tags(html) {
  return [...html.replace(/<!--[^]*?-->/g, '').matchAll(/<([a-z][\w-]*)\b([^>]*?)>/gi)].map(m => ({
    tag: m[1].toLowerCase(),
    ...Object.fromEntries([...m[2].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(a => [a[1].toLowerCase(), decode(a[2] ?? a[3])]))
  }));
}
const files = await fg(['**/*.html'], {ignore:['node_modules/**','.git/**']});
const pages = new Map();
for (const file of files) {
  const html = await fs.readFile(file, 'utf8');
  const nodes = tags(html);
  const meta = Object.fromEntries(nodes.filter(t => t.tag === 'meta').map(t => [t.name || t.property, t.content]));
  const url = origin + '/' + file.replace(/index\.html$/, '');
  pages.set(file, {html,nodes,meta,url,indexable:!meta.robots?.includes('noindex')});
}
function localFile(raw, base) {
  const url = new URL(raw, base);
  if (url.origin !== origin) return null;
  let file = decodeURIComponent(url.pathname.slice(1));
  if (!file || file.endsWith('/')) file += 'index.html';
  return {url,file};
}
const exists = new Map();
async function targetExists(file) {
  if (!exists.has(file)) exists.set(file, fs.stat(file).then(s => s.isFile()).catch(() => false));
  return exists.get(file);
}
const titles = new Map(), descriptions = new Map(), canonicalUrls = new Set(), graph = new Map();
let references = 0, images = 0;
for (const [file,p] of pages) {
  const canonical = p.nodes.filter(t => t.tag === 'link' && t.rel === 'canonical');
  const title = decode(p.html.match(/<title>([^]*?)<\/title>/i)?.[1]);
  const ids = p.nodes.map(t => t.id).filter(Boolean);
  check(ids.length === new Set(ids).size, `${file}: duplicate IDs`);
  graph.set(file, []);
  if (p.indexable) {
    check(canonical.length === 1 && canonical[0].href === p.url, `${file}: canonical must match ${p.url}`);
    canonicalUrls.add(p.url);
    check(p.nodes.filter(t => t.tag === 'h1').length === 1, `${file}: expected one H1`);
    check(Boolean(title) && /Swissploit/.test(title), `${file}: missing title/brand`);
    check((title.match(/Swissploit/g)||[]).length === 1, `${file}: repeated title brand`);
    for (const [map,value,label] of [[titles,title,'title'],[descriptions,p.meta.description,'description']]) {
      check(!map.has(value), `${file}: duplicate ${label} with ${map.get(value)}`);map.set(value,file);
    }
    for (const key of ['description','og:title','og:description','og:url','og:type','og:image','twitter:card','twitter:title','twitter:description','twitter:image']) check(Boolean(p.meta[key]),`${file}: missing ${key}`);
    check(p.meta['og:url'] === p.url, `${file}: og:url differs from canonical`);
    for (const key of ['og:image','twitter:image']) {
      const target=localFile(p.meta[key],p.url);
      check(!target || await targetExists(target.file),`${file}: missing ${key} asset`);
    }
    for (const icon of ['icon','apple-touch-icon']) check(p.nodes.some(t=>t.tag==='link'&&t.rel===icon),`${file}: missing ${icon}`);
  }
  for (const match of p.html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([^]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1]);
      check(data['@context'] === 'https://schema.org',`${file}: unexpected schema context`);
      if (data['@type'] === 'BlogPosting') {
        check(data.mainEntityOfPage === p.url && data.url === p.url,`${file}: article schema URL mismatch`);
        check(data.author?.['@type'] === 'Organization' && data.publisher?.name === 'Swissploit',`${file}: article organization identity`);
        for (const key of ['datePublished','dateModified']) if(data[key]) check(/^\d{4}-\d{2}-\d{2}$/.test(data[key])&&!Number.isNaN(Date.parse(data[key])),`${file}: invalid ${key}`);
      }
    } catch(e) { check(false,`${file}: invalid JSON-LD: ${e.message}`); }
  }
  for (const t of p.nodes) {
    const ref = ['a','link'].includes(t.tag) ? t.href : ['img','script','iframe','source'].includes(t.tag) ? t.src : null;
    if (t.tag === 'img' && p.indexable) {
      images++;
      check(Object.hasOwn(t,'alt'),`${file}: image without alt: ${t.src}`);
      check(Number(t.width)>0 && Number(t.height)>0,`${file}: image without dimensions: ${t.src}`);
    }
    if (!ref) continue;
    const target = localFile(ref,p.url);
    if (!target) continue;
    references++;
    check(await targetExists(target.file),`${file}: missing target ${ref}`);
    if (t.tag === 'a') {
      graph.get(file).push(target.file);
      if (target.url.hash && pages.has(target.file)) check(pages.get(target.file).nodes.some(n=>n.id===decodeURIComponent(target.url.hash.slice(1))||(n.tag==='a'&&n.name===target.url.hash.slice(1))),`${file}: missing anchor ${ref}`);
    }
    if(t.tag==='link' && t.hreflang){
      const other=pages.get(target.file);
      check(other?.indexable,`${file}: hreflang target not indexable: ${ref}`);
      check(other?.nodes.some(n=>n.rel==='canonical'&&n.href===ref),`${file}: noncanonical hreflang target`);
      check(other?.nodes.some(n=>n.rel==='alternate'&&n.href===p.url),`${file}: nonreciprocal hreflang`);
      if(t.hreflang!=='x-default')check(other?.nodes.some(n=>n.tag==='html'&&n.lang===t.hreflang.split('-')[0]),`${file}: wrong hreflang language`);
    }
  }
}
const visited=new Set(), queue=['index.html'];
while(queue.length){const file=queue.shift();if(visited.has(file))continue;visited.add(file);queue.push(...(graph.get(file)||[]));}
for(const [file,p] of pages)if(p.indexable)check(visited.has(file),`${file}: not reachable from homepage links`);
const sitemap=await fs.readFile('sitemap.xml','utf8');
const locs=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1]));
check(locs.length===new Set(locs).size,'sitemap: duplicate URLs');
for(const url of locs)check(canonicalUrls.has(url),`sitemap: noncanonical or nonindexable URL ${url}`);
for(const url of canonicalUrls)check(locs.includes(url),`sitemap: missing ${url}`);
for(const match of sitemap.matchAll(/<url>([^]*?)<\/url>/g)){
 const date=match[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
 if(!date)continue;
 const url=decode(match[1].match(/<loc>(.*?)<\/loc>/)[1]);
 const page=pages.get(localFile(url,origin).file);
 const article=[...page.html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([^]*?)<\/script>/gi)].map(m=>JSON.parse(m[1])).find(d=>d['@type']==='BlogPosting');
 check(date===(article?.dateModified||article?.datePublished),`sitemap: lastmod has no matching editorial date: ${url}`);
}
const robots=await fs.readFile('robots.txt','utf8');
check(robots.includes(`Sitemap: ${origin}/sitemap.xml`),'robots: missing sitemap');
check(!/^Disallow:\s*\/(?:\s|$)/im.test(robots),'robots: blocks the whole site');
for(const file of await fg('assets/*.css')){
 const css=await fs.readFile(file,'utf8');
 for(const m of css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)){
  const target=localFile(m[1],origin+'/'+file);
  if(target)check(await targetExists(target.file),`${file}: missing CSS asset ${m[1]}`);
 }
}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
else console.log(`SEO OK: ${pages.size} HTML pages, ${canonicalUrls.size} indexable URLs, ${references} local references, ${images} sized images; unique metadata, JSON-LD, reciprocal hreflang, sitemap, crawl reachability and CSS assets verified.`);

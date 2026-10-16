import fs from 'node:fs/promises';
import fg from 'fast-glob';
import { renderSiteHeaderHtml } from './site-header.mjs';
import { renderSiteFooterHtml } from './site-footer.mjs';

const check = process.argv.includes('--check');
let count = 0;
for (const file of await fg('**/*.html', { ignore: ['node_modules/**', '.git/**'] })) {
  // Legacy preview routes only redirect; they contain no duplicated UI.
  if (file.startsWith('hero-test/')) continue;
  const source = await fs.readFile(file, 'utf8');
  if (!/<header class="site-header\b/.test(source)) continue;
  const lang = /<html[^>]*lang="en"/.test(source) ? 'en' : 'de';
  const header = renderSiteHeaderHtml(lang, {
    home: file === 'index.html', learn: /^(en\/)?(learn|blog)\//.test(file), services: file.startsWith('leistungen/')
  });
  // Replace the old header and its optional standalone modal as a single unit.
  let updated = source.replace(/<header class="site-header\b[^>]*>[\s\S]*?<\/header>(?:\s*<button id="menuToggle"[\s\S]*?<\/dialog>)?/, header);
  if (!updated.includes('href="/assets/navigation.css"')) {
    updated = updated.replace('</head>', '  <link rel="stylesheet" href="/assets/navigation.css" />\n</head>');
  }
  updated = updated.replace(/<footer\b[\s\S]*?<\/footer>/, renderSiteFooterHtml(lang));
  // Older generated pages populated an id which the shared footer no longer uses.
  updated = updated.replace(/document\.getElementById\("year"\)\.textContent = new Date\(\)\.getFullYear\(\);/g, '');
  if (source !== updated) {
    if (check) throw Error(`Header out of sync: ${file}. Run npm run build:headers.`);
    await fs.writeFile(file, updated);
  }
  count++;
}
console.log(`${count} static headers ${check ? 'verified' : 'synchronized'} from scripts/site-header.mjs`);

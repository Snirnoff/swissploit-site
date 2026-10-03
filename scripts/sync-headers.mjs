import fs from 'node:fs/promises';
import fg from 'fast-glob';
import { renderSiteHeaderHtml } from './site-header.mjs';

const check = process.argv.includes('--check');
let count = 0;
for (const file of await fg('**/*.html', { ignore: ['node_modules/**', '.git/**'] })) {
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
  if (source !== updated) {
    if (check) throw Error(`Header out of sync: ${file}. Run npm run build:headers.`);
    await fs.writeFile(file, updated);
  }
  count++;
}
console.log(`${count} static headers ${check ? 'verified' : 'synchronized'} from scripts/site-header.mjs`);

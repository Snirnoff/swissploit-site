import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import fg from 'fast-glob';

test('the public service catalogue contains only the three current offers', async () => {
  const html = await fs.readFile('index.html', 'utf8');
  const services = [];
  function collect(value) {
    if (!value || typeof value !== 'object') return;
    if (value['@type'] === 'Service') services.push(value.name);
    Object.values(value).forEach(collect);
  }
  for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) collect(JSON.parse(match[1]));
  assert.deepEqual(services.sort(), ['Datenschutz Care', 'Incident Readiness', 'Security Check']);
  for (const slug of ['security-check','datenschutz-care','incident-readiness']) assert.ok(html.includes('/leistungen/'+slug+'/'));
});

test('retired pages are removed and remaining legacy entries lead directly to current services', async () => {
  for (const slug of ['mitarbeiterschulung-datenschutz-cybersecurity', 'mitarbeiterschulung-security-datenschutz', 'microsoft-365-security-care']) {
    await assert.rejects(fs.access(`leistungen/${slug}/index.html`), { code: 'ENOENT' });
  }
  for (const file of await fg(['leistungen/*/index.html', 'soc-light/index.html'])) {
    const html = await fs.readFile(file, 'utf8');
    if (/leistungen\/(security-check|datenschutz-care|incident-readiness)\/index.html/.test(file)) {
      assert.match(html, /"@type":"Service"/);
      assert.doesNotMatch(html, /noindex/);
      continue;
    }
    assert.match(html, /name="robots" content="noindex,follow"/);
    assert.match(html, /http-equiv="refresh" content="0; url=\/leistungen\/(?:security-check|datenschutz-care|incident-readiness)\/"/);
    assert.doesNotMatch(html, /"@type"\s*:\s*"Service"/);
  }
  const sitemap=await fs.readFile('sitemap.xml','utf8');
  assert.doesNotMatch(sitemap,/\/soc-light\/|\/leistungen\/(?!security-check\/|datenschutz-care\/|incident-readiness\/)/);
});

test('public pages and quiz contain no retired offers or links', async () => {
  const retired = /Security[\s-]+Awareness|Awareness[\s-]+Training|Mitarbeiterschulung|Microsoft[\s-]+365[\s-]+Security[\s-]+Care/i;
  for (const file of await fg(['**/*.html', 'assets/phishing-quiz*.js'], { ignore: ['node_modules/**', '.git/**', '.visual-check/**'] })) {
    let html = await fs.readFile(file, 'utf8');
    if (file === 'unternehmen/index.html') {
      // Explicitly authorised product concept; never a revived live service offer.
      assert.match(html, /Interaktive Produktdemo · Beispieldaten/);
      assert.match(html, /Business-Plattform befindet sich in Entwicklung/);
      assert.match(html, /fiktiven Daten/);
      html = html.replace(/Security Awareness/g, 'Lernplattform');
    }
    assert.doesNotMatch(html, retired, file);
  }
  const quiz = await fs.readFile('phishing-quiz/index.html', 'utf8');
  assert.doesNotMatch(quiz, /pq-team|AUCH FÜR TEAMS RELEVANT/);
  assert.match(quiz, /<footer class="site-footer" role="contentinfo">/);
});

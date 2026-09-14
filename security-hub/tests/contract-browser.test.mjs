import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { launchBrowser } from '../dev/browser.mjs';
import { listenPreview } from '../dev/server.mjs';

const envelope = value => JSON.stringify({ schema_version: 1, value });
const seedProfile = ids => 'localStorage.setItem("swissploit.hub.profile", ' + JSON.stringify(envelope(ids)) + ');';
const root = new URL('../../../swissploit-security-data/docs/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const product = id => manifest.available_products.find(entry => entry.product_id === id);

test('Live-Hub: Brief-Start, Lazy-Modi, Dedupe, Deep Link, Health und Mobile', { timeout: 180000 }, async t => {
  const server = await listenPreview({ port: 0, logger: { error() {} } });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const browser = await launchBrowser(); t.after(() => browser.close());
  const base = 'http://127.0.0.1:' + server.address().port;

  await t.test('Windows 11 + Server initial nur Briefs und kanonisch dedupliziert', async () => {
    const page = await browser.page({ beforeScript: seedProfile(['microsoft.windows-11', 'microsoft.windows-server']) });
    try {
      await page.go(base + '/security-hub/');
      const requests = page.requests.filter(url => url.startsWith(base + '/security-data/'));
      assert.ok(requests.some(url => url.endsWith('/manifest.json')));
      assert.ok(requests.some(url => url.endsWith('/microsoft.windows-11/brief.json')));
      assert.ok(requests.some(url => url.endsWith('/microsoft.windows-server/brief.json')));
      assert.equal(requests.some(url => url.endsWith('/current.json') || url.endsWith('/known-exploited.json')), false);
      assert.equal(await page.evaluate('document.querySelectorAll("[data-issue=\\"cve:CVE-2026-81963\\"]").length'), 1);
      const cardText = await page.evaluate('document.querySelector("[data-issue=\\"cve:CVE-2026-81963\\"]").textContent');
      assert.match(cardText, /Windows 11/); assert.match(cardText, /Windows Server/);
      assert.match(cardText, /Aktiv ausgenutzt/); assert.match(cardText, /P1/);
      assert.match(await page.evaluate('document.getElementById("hub-data-date").textContent'), /14\.09\.2026/);
      assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
      assert.deepEqual(page.errors, []);
    } finally { await page.close(); }
  });

  await t.test('Current und Known Exploited sind lazy; Current bleibt gecached', async () => {
    const page = await browser.page({ beforeScript: seedProfile(['microsoft.windows-11']) });
    try {
      await page.go(base + '/security-hub/');
      assert.equal(page.requests.some(url => url.endsWith('/current.json')), false);
      assert.equal(page.requests.some(url => url.endsWith('/known-exploited.json')), false);
      await page.evaluate('document.getElementById("hub-load-current").click()');
      await page.waitFor('document.getElementById("hub-mode").textContent.includes("ALLE AKTUELLEN")', 30000);
      const currentCount = page.requests.filter(url => url.endsWith('/microsoft.windows-11/current.json')).length;
      assert.equal(currentCount, 1);
      await page.evaluate('document.querySelector("[name=exploited]").click()');
      await page.waitFor('document.getElementById("hub-mode").textContent.includes("AKTIV AUSGENUTZT")');
      assert.equal(page.requests.filter(url => url.endsWith('/microsoft.windows-11/known-exploited.json')).length, 1);
      await page.evaluate('document.querySelector("[name=exploited]").click()');
      await page.waitFor('document.getElementById("hub-mode").textContent.includes("ALLE AKTUELLEN")');
      assert.equal(page.requests.filter(url => url.endsWith('/microsoft.windows-11/current.json')).length, currentCount);
      assert.deepEqual(page.errors, []);
    } finally { await page.close(); }
  });

  await t.test('Degraded-Details werden lazy geladen', async () => {
    const page = await browser.page({ beforeScript: seedProfile(['fortinet.fortios']) });
    try {
      await page.go(base + '/security-hub/');
      assert.equal(page.requests.some(url => url.endsWith('/source-health.json')), false);
      await page.evaluate('document.getElementById("hub-health").click()');
      await page.waitFor('document.getElementById("hub-health-content").textContent.includes("nvd")');
      assert.equal(page.requests.filter(url => url.endsWith('/source-health.json')).length, 1);
      assert.ok((await page.evaluate('document.getElementById("hub-health-content").textContent')).includes('Nicht verfügbar'));
    } finally { await page.close(); }
  });

  await t.test('Deep Link ausserhalb Brief sucht nur im ausgewählten Current-Feed', async () => {
    const current = JSON.parse(await readFile(new URL(product('microsoft.edge').paths.current, root), 'utf8'));
    const brief = JSON.parse(await readFile(new URL(product('microsoft.edge').paths.brief, root), 'utf8'));
    const briefIds = new Set(brief.items.map(item => item.id));
    const target = current.items.find(item => !briefIds.has(item.id)).id;
    const page = await browser.page({ beforeScript: seedProfile(['microsoft.edge']) });
    try {
      await page.go(base + '/security-hub/#issue=' + encodeURIComponent(target));
      await page.waitFor('document.querySelector("[data-issue=\\"' + target + '\\"]")?.querySelector("details")?.open === true', 30000);
      assert.equal(page.requests.filter(url => url.endsWith('/microsoft.edge/current.json')).length, 1);
      assert.equal(page.requests.some(url => url.includes('/microsoft.windows-11/')), false);
    } finally { await page.close(); }
  });

  await t.test('Fehlender ausgewählter Brief fällt klar markiert auf Demo zurück', async () => {
    const page = await browser.page({ beforeScript: seedProfile(['microsoft.edge']), routes: {
      '/security-data/products/microsoft.edge/brief.json': { fail: true },
    } });
    try {
      await page.go(base + '/security-hub/');
      assert.ok((await page.evaluate('document.getElementById("hub-mode").textContent')).includes('DEMO'));
      assert.ok((await page.evaluate('document.getElementById("hub-dataset-note").textContent')).includes('fiktive Ersatzdaten'));
      assert.ok(await page.evaluate('document.querySelectorAll(".hub-card").length > 0'));
    } finally { await page.close(); }
  });
  await t.test('360px bleibt ohne horizontalen Overflow', async () => {
    const page = await browser.page({ width: 360, beforeScript: seedProfile(['microsoft.edge', 'fortinet.fortios']) });
    try {
      await page.go(base + '/security-hub/');
      assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
      assert.ok(await page.evaluate('document.querySelectorAll(".hub-card").length > 0'));
      assert.deepEqual(page.errors, []);
    } finally { await page.close(); }
  });
});

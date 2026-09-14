import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { launchBrowser, pause } from '../dev/browser.mjs';
import { listenPreview } from '../dev/server.mjs';
import { demo, clone } from './fixtures.mjs';

const select = (name, value) => `document.querySelector('[name="${name}"]').value=${JSON.stringify(value)}; document.querySelector('[name="${name}"]').dispatchEvent(new Event('input',{bubbles:true}))`;
const click = selector => `document.querySelector(${JSON.stringify(selector)}).click()`;
const count = 'document.querySelectorAll(".hub-card").length';
const envelope = value => JSON.stringify({ schema_version: 1, value });

test('Vorhandener Chromium-Browser: vollständiger lokaler UI-Durchlauf', { timeout: 180000 }, async t => {
  const server = await listenPreview({ port: 0, logger: { error() {} } });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const browser = await launchBrowser(); t.after(() => browser.close());
  t.diagnostic(`Browser: ${browser.executable}`);
  const base = `http://127.0.0.1:${server.address().port}`;
  const runPage = async (options, fn) => { const { live = false, routes = {}, ...rest } = options;
    const page = await browser.page({ ...rest, routes: live ? routes : { '/security-data/manifest.json': { fail: true }, ...routes } });
    try { await fn(page); assert.deepEqual(page.routeErrors, []); } finally { await page.close(); } };

  await t.test('360/768/1440 px, Dark/Light, kein horizontaler Scroll, keine externen Requests', async () => {
    for (const width of [360, 768, 1440]) {
      await runPage({ width }, async page => {
        await page.go(base + '/security-hub/');
        assert.equal(await page.evaluate(count), 14);
        assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
        assert.equal(await page.evaluate('document.querySelectorAll("#hub-top-list li").length'), 5);
        assert.equal(await page.evaluate('document.querySelectorAll("#hub-product-tree input:checked").length'), 0);
        assert.ok((await page.evaluate('document.getElementById("hub-metrics").textContent')).includes('Erster Besuch'));
        if (process.env.HUB_SCREENSHOTS === '1') {
          await mkdir(new URL('../dev/previews/', import.meta.url), { recursive: true });
          const shot = await page.send('Page.captureScreenshot', { format: 'png' });
          await writeFile(new URL(`../dev/previews/dark-${width}.png`, import.meta.url), Buffer.from(shot.data, 'base64'));
        }
        await page.evaluate(click('#hub-theme'));
        assert.equal(await page.evaluate('document.documentElement.dataset.theme'), 'light');
        assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
        if (width === 1440 && process.env.HUB_SCREENSHOTS === '1') {
          const shot = await page.send('Page.captureScreenshot', { format: 'png' });
          await writeFile(new URL('../dev/previews/light-1440.png', import.meta.url), Buffer.from(shot.data, 'base64'));
        }
        assert.deepEqual(page.errors, []);
        assert.equal(page.requests.some(url => /^https?:/.test(url) && !url.startsWith(base)), false);
      });
    }
  });
  await t.test('Theme-Präferenz lesen, nur Hub-Schlüssel schreiben', async () => {
    await runPage({ beforeScript: `if (!localStorage.getItem('seeded')) { localStorage.setItem('swissploit-theme','light'); localStorage.setItem('seeded','1'); }` }, async page => {
      await page.go(base + '/security-hub/'); assert.equal(await page.evaluate('document.documentElement.dataset.theme'), 'light');
      await page.evaluate(click('#hub-theme')); assert.equal(await page.evaluate('localStorage.getItem("swissploit-theme")'), 'light');
      await page.reload(); assert.equal(await page.evaluate('document.documentElement.dataset.theme'), 'dark');
    });
  });
  await t.test('Profil anwenden, indeterminate Checkbox, Status und Reload', async () => {
    await runPage({}, async page => {
      await page.go(base + '/security-hub/');
      await page.evaluate(click('input[value="microsoft.edge"]'));
      assert.equal(await page.evaluate('document.querySelector(".hub-group-check input").indeterminate'), true);
      assert.equal(await page.evaluate(count), 14);
      await page.evaluate(click('#hub-apply-profile')); assert.equal(await page.evaluate(count), 1);
      await page.evaluate(click('[data-issue="DEMO-006"] [data-action="reviewed"]')); assert.equal(await page.evaluate(count), 0);
      await page.reload(); assert.equal(await page.evaluate(count), 0);
      await page.evaluate(select('status', 'reviewed')); assert.equal(await page.evaluate(count), 1);
      assert.ok((await page.evaluate('document.getElementById("hub-selected-count").textContent')).includes('1 ausgewählt'));
      await page.evaluate(click('[data-action="not_affected"]')); assert.equal(await page.evaluate(count), 0);
      await page.evaluate(select('status', 'not_affected')); assert.equal(await page.evaluate(count), 1);
      await page.evaluate(click('[data-action="open"]')); await page.evaluate(select('status', 'open')); assert.equal(await page.evaluate(count), 1);
    });
  });
  await t.test('Mobiler Dialog: Tastatur, Escape, Fokusfalle und Rückgabe', async () => {
    await runPage({ width: 360 }, async page => {
      await page.go(base + '/security-hub/');
      await page.evaluate('document.getElementById("hub-open-profile").focus()'); await page.key('Enter');
      assert.equal(await page.evaluate('document.getElementById("hub-profile-dialog").open'), true);
      assert.equal(await page.evaluate('document.activeElement.id'), 'hub-product-search');
      await page.key('Tab', 1); await page.key('Tab', 1);
      assert.equal(await page.evaluate('document.getElementById("hub-profile-dialog").contains(document.activeElement)'), true);
      assert.equal(await page.evaluate('document.getElementById("hub-profile-dialog").scrollWidth <= document.getElementById("hub-profile-dialog").clientWidth'), true);
      await page.key('Escape'); await page.waitFor('document.activeElement.id === "hub-open-profile"');
      assert.equal(await page.evaluate('document.getElementById("hub-profile-dialog").open'), false);
      await page.evaluate(click('#hub-menu')); assert.equal(await page.evaluate('document.getElementById("hub-menu").getAttribute("aria-expanded")'), 'true');
      await page.key('Escape'); assert.equal(await page.evaluate('document.activeElement.id'), 'hub-menu');
    });
  });
  await t.test('Suche, Nulltreffer, Filterkombination und alte offene Prioritäten', async () => {
    await runPage({}, async page => {
      await page.go(base + '/security-hub/');
      await page.evaluate(select('q', 'KeinErgebnis')); assert.equal(await page.evaluate(count), 0);
      assert.equal(await page.evaluate('document.getElementById("hub-empty").hidden'), false);
      await page.evaluate(click('#hub-empty-reset')); await page.waitFor(`${count} === 14`);
      await page.evaluate(select('days', '1')); assert.equal(await page.evaluate('document.getElementById("hub-older").hidden'), false);
      assert.ok((await page.evaluate('document.getElementById("hub-older").textContent')).includes('DEMO-002'));
      await page.evaluate(select('days', 'all')); await page.evaluate(click('input[name="known"]')); assert.equal(await page.evaluate(count), 2);
      await page.evaluate(click('input[name="exploited"]')); assert.equal(await page.evaluate(count), 0);
    });
  });
  await t.test('Direktlink trotz Profil/Suche, Hashwechsel, Zurück/Vorwärts und defekte IDs', async () => {
    await runPage({}, async page => {
      await page.go(base + '/security-hub/');
      await page.evaluate(click('input[value="microsoft.edge"]')); await page.evaluate(click('#hub-apply-profile'));
      const stored = await page.evaluate('localStorage.getItem("swissploit.hub.profile")');
      await page.evaluate(select('q', 'KeinErgebnis')); await page.evaluate('location.hash = "issue=DEMO-009"');
      await page.waitFor('document.activeElement.id === "hub-issue-DEMO-009"');
      assert.equal(await page.evaluate('document.querySelector("#hub-issue-DEMO-009 details").open'), true);
      assert.equal(await page.evaluate(count), 1); assert.equal(await page.evaluate('localStorage.getItem("swissploit.hub.profile")'), stored);
      await page.evaluate('location.hash = "issue=DEMO-005"'); await page.waitFor('document.activeElement.id === "hub-issue-DEMO-005"');
      await page.evaluate('history.back()'); await page.waitFor('document.activeElement.id === "hub-issue-DEMO-009"');
      await page.evaluate('history.forward()'); await page.waitFor('document.activeElement.id === "hub-issue-DEMO-005"');
      await page.evaluate('location.hash = "issue=%ZZ"'); await page.waitFor('document.getElementById("hub-deep-notice").textContent.includes("ungültig")');
      await page.evaluate('location.hash = "issue=DEMO-MISSING"'); await page.waitFor('document.getElementById("hub-deep-notice").textContent.includes("nicht enthalten")');
      await page.go(base + '/security-hub/#issue=DEMO-009'); await page.waitFor('document.activeElement.id === "hub-issue-DEMO-009"');
    });
  });
  await t.test('Copy- und Mail-Längenfallback: Volltext, Auswahl, TXT und Fokus', async () => {
    await runPage({ beforeScript: `Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Denied for test'); } } });` }, async page => {
      await page.go(base + '/security-hub/');
      await page.evaluate('document.querySelectorAll("[data-issue=DEMO-009] .hub-card-actions button")[4].focus(); document.activeElement.click()');
      await page.waitFor('document.getElementById("hub-share-dialog").open');
      const text = await page.evaluate('document.getElementById("hub-share-text").value');
      for (const source of demo.items[8].sources) assert.ok(text.includes(source.url)); assert.ok(text.includes('DEMO'));
      assert.equal(await page.evaluate('document.getElementById("hub-share-text").selectionEnd'), text.length);
      assert.equal(await page.evaluate('fetch(document.getElementById("hub-share-download").href).then(r => r.text())'), text);
      await page.evaluate(click('#hub-share-copy')); await page.waitFor('document.getElementById("hub-copy-status").textContent.includes("gesperrt")');
      await page.key('Escape'); await page.waitFor('!document.getElementById("hub-share-dialog").open');
      assert.equal(await page.evaluate('document.activeElement.textContent'), 'Briefing kopieren');
      await page.evaluate('document.querySelectorAll("[data-issue=DEMO-009] .hub-card-actions button")[3].click()');
      await page.waitFor('document.getElementById("hub-share-dialog").open');
      assert.ok((await page.evaluate('document.getElementById("hub-share-help").textContent')).includes('zu lang'));
      assert.equal(await page.evaluate('document.getElementById("hub-share-text").value'), text);
    });
  });
  await t.test('Neue Revision wird erneut prüfen; beschädigter und gesperrter Speicher', async () => {
    const seed = `localStorage.setItem('swissploit.hub.statuses', ${JSON.stringify(envelope({ 'DEMO-001': { status: 'reviewed', revision: 'old', updated_at: '2026-09-12T12:00:00Z' } }))}); localStorage.setItem('swissploit.hub.profile','{broken');`;
    await runPage({ beforeScript: seed }, async page => {
      await page.go(base + '/security-hub/'); assert.ok((await page.evaluate('document.getElementById("hub-issue-DEMO-001").textContent')).includes('Erneut prüfen'));
      assert.equal(await page.evaluate('document.getElementById("hub-storage-warning").hidden'), false);
    });
    await runPage({ beforeScript: `Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });` }, async page => {
      await page.go(base + '/security-hub/'); assert.equal(await page.evaluate(count), 14);
      assert.equal(await page.evaluate('document.getElementById("hub-storage-warning").hidden'), false);
      await page.evaluate(click('[data-action="reviewed"]')); assert.equal(await page.evaluate(count), 13);
      assert.deepEqual(page.errors, []);
    });
  });
  await t.test('Grosse Liste mit 1000 Fällen: 25 Karten, Mehr laden, lange Titel und XSS-Text', async () => {
    const large = clone(demo);
    large.items = Array.from({ length: 1000 }, (_, n) => {
      const item = clone(demo.items[n % 14]); item.id = `DEMO-LARGE-${n}`; item.advisory.id = item.id;
      item.title = `DEMO <img src=x onerror=alert(1)> ${'LangerTitel'.repeat(30)} ${n}`; return item;
    });
    await runPage({ width: 360, routes: { '/security-hub/data/fallback-feed.json': { body: large } } }, async page => {
      await page.go(base + '/security-hub/'); assert.equal(await page.evaluate(count), 25);
      assert.equal(await page.evaluate('document.querySelectorAll(".hub-card img").length'), 0);
      assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
      await page.evaluate(click('#hub-load-more')); assert.equal(await page.evaluate(count), 50);
      assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
      assert.deepEqual(page.errors, []);
    });
  });
  await t.test('Langsame/fehlende Daten, kaputtes JSON, leeres JSON und fehlendes Haupt-JS', async () => {
    await runPage({ routes: { '/security-hub/data/fallback-feed.json': { body: demo, delay: 900 } } }, async page => {
      await page.go(base + '/security-hub/', false);
      await page.waitFor('!!document.getElementById("hub-title")');
      assert.equal(await page.evaluate('document.getElementById("hub-startup").hidden'), false);
      await page.waitFor('document.getElementById("hub-startup").hidden'); assert.equal(await page.evaluate(count), 14);
    });
    for (const route of [{ fail: true }, { body: '{broken' }]) {
      await runPage({ routes: { '/security-hub/data/fallback-feed.json': route } }, async page => {
        await page.go(base + '/security-hub/', false); await page.waitFor('document.getElementById("hub-startup")?.getAttribute("role") === "alert"');
        assert.equal(await page.evaluate('document.getElementById("hub-startup").hidden'), false); assert.equal(await page.evaluate(count), 0);
      });
    }
    const empty = clone(demo); empty.items = [];
    await runPage({ routes: { '/security-hub/data/fallback-feed.json': { body: empty } } }, async page => {
      await page.go(base + '/security-hub/'); assert.ok((await page.evaluate('document.getElementById("hub-empty").textContent')).includes('bewusst keine'));
    });
    await runPage({ routes: { '/security-hub/assets/hub.js': { fail: true } } }, async page => {
      await page.go(base + '/security-hub/', false); await page.waitFor('document.readyState === "complete"');
      assert.equal(await page.evaluate('document.getElementById("hub-startup").hidden'), false);
      assert.ok(await page.evaluate('document.getElementById("hub-title").getBoundingClientRect().height > 0'));
    });
  });
  await t.test('JavaScript aus und Reduced Motion: Titel und Diagnose bleiben sichtbar', async () => {
    await runPage({ scripts: false }, async page => {
      await page.go(base + '/security-hub/', false); await page.waitFor('document.readyState === "complete"');
      assert.equal(await page.evaluate('document.getElementById("hub-startup").hidden'), false);
      assert.ok(await page.evaluate('document.getElementById("hub-title").getBoundingClientRect().height > 0'));
    });
    await runPage({}, async page => {
      await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await page.go(base + '/security-hub/'); assert.equal(await page.evaluate('getComputedStyle(document.querySelector(".hub-card")).transitionDuration'), '0s');
    });
  });
  await t.test('Homepage, Learn, Blog und isolierte Kampagnenseite laden keine Hub-Dateien', async () => {
    for (const path of ['/', '/learn/', '/blog/auf-phishing-geklickt/', '/phishing-simulation/']) {
      await runPage({}, async page => {
        await page.go(base + path, false); await page.waitFor('document.readyState === "complete"');
        assert.equal(page.requests.some(url => url.startsWith(base + '/security-hub/')), false);
        assert.ok(await page.evaluate('document.querySelector("h1")?.textContent.length > 0'));
        // Existing errors are reported, not silently reclassified as Hub regressions.
        if (page.errors.length) t.diagnostic(`Bestehende Seite ${path}: ${page.errors.join(' | ')}`);
      });
    }
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { listenPreview } from '../dev/server.mjs';

test('127.0.0.1-Preview: MIME, HEAD, Fehler, sichere Pfade und unveränderte Rücklinks', async t => {
  const logs = [], server = await listenPreview({ port: 0, logger: { error: s => logs.push(s) } });
  t.after(() => new Promise(resolve => server.close(resolve)));
  assert.equal(server.address().address, '127.0.0.1');
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const [url, mime] of [['/security-hub/', 'text/html'], ['/security-hub/assets/hub.js', 'text/javascript'], ['/security-hub/assets/hub.css', 'text/css'], ['/security-hub/data/fallback-feed.json', 'application/json'], ['/assets/swissploit-brand-logo2.png', 'image/png']]) {
    const response = await fetch(base + url); assert.equal(response.status, 200); assert.ok(response.headers.get('content-type').startsWith(mime)); await response.arrayBuffer();
  }
  assert.equal((await fetch(base + '/security-hub/', { method: 'HEAD' })).status, 200);
  assert.equal((await fetch(base + '/missing.html')).status, 404); assert.ok(logs.some(s => s.includes('missing.html')));
  assert.equal((await fetch(base + '/security-hub/', { method: 'POST' })).status, 405);
  const raw = path => new Promise((resolve, reject) => { const req = http.get(base, { path }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); }); req.on('error', reject); });
  for (const p of ['/%2e%2e/agents.md', '/.git/config', '/%5c..%5csecret', '/%00', '/node_modules/package.json', '/security-hub/dev/server.mjs']) assert.equal(await raw(p), 403);
  assert.equal(await raw('/%ZZ'), 400);
  for (const path of ['index.html', 'learn/index.html', 'blog/auf-phishing-geklickt/index.html', 'phishing-simulation/index.html']) {
    const original = await readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
    const served = await (await fetch(base + '/' + path)).text();
    assert.equal(served, original); assert.equal(/(?:src|href)=["'][^"']*security-hub\//i.test(served), false);
  }
});
test('Portfehler werden nicht versteckt', async t => {
  const server = await listenPreview({ port: 0 }); t.after(() => new Promise(resolve => server.close(resolve)));
  await assert.rejects(listenPreview({ port: server.address().port }), { code: 'EADDRINUSE' });
  await assert.rejects(listenPreview({ port: 99999 }), /Port/);
});

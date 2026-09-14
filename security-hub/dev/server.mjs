import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpath, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const DATA_ROOT = fileURLToPath(new URL('../../../swissploit-security-data/docs/', import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const inside = (root, target) => target === root || target.startsWith(root.endsWith(path.sep) ? root : root + path.sep);
export async function createPreviewServer({ root = ROOT, dataRoot = DATA_ROOT, logger = console } = {}) {
  const realRoot = await realpath(root), realDataRoot = await realpath(dataRoot);
  return http.createServer(async (req, res) => {
    const fail = (code, message) => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }); res.end(message); };
    if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); fail(405, 'Nur GET und HEAD erlaubt.'); return; }
    let pathname;
    try { pathname = decodeURIComponent(req.url.split('?')[0]); }
    catch { fail(400, 'Ungültige URL-Kodierung.'); return; }
    if (!pathname.startsWith('/') || /[\\\u0000-\u001f]/.test(pathname)
      || pathname.split('/').some(part => part.startsWith('.') || ['node_modules', 'posts', 'scripts'].includes(part))) { fail(403, 'Dieser Pfad ist nicht öffentlich.'); return; }
    // Developer code and test fixtures do not belong in the public preview.
    if (/^\/security-hub\/(dev|tests)(\/|$)/.test(pathname)) { fail(403, 'Entwicklerdateien werden nicht ausgeliefert.'); return; }
    const servesData = pathname.startsWith('/security-data/');
    const requestRoot = servesData ? realDataRoot : realRoot;
    const relativePath = servesData ? pathname.slice('/security-data'.length) : pathname;
    let filename = path.resolve(requestRoot, '.' + relativePath);
    if (!inside(requestRoot, filename)) { fail(403, 'Pfad ausserhalb der Vorschau.'); return; }
    try {
      let info = await stat(filename);
      if (info.isDirectory()) {
        if (!pathname.endsWith('/')) { res.writeHead(308, { Location: encodeURI(pathname + '/') }); res.end(); return; }
        filename = path.join(filename, 'index.html'); info = await stat(filename);
      }
      const realFile = await realpath(filename);
      if (!inside(requestRoot, realFile) || !info.isFile()) { fail(403, 'Datei ausserhalb der Vorschau.'); return; }
      const type = MIME[path.extname(realFile).toLowerCase()];
      if (!type) { fail(403, 'Dateityp nicht freigegeben.'); return; }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': info.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(pathname.startsWith('/security-hub/') ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}) });
      if (req.method === 'HEAD') res.end();
      else await pipeline(createReadStream(realFile), res);
    } catch (error) {
      logger.error(`Preview ${req.method} ${pathname}: ${error.code || error.message}`);
      if (!res.headersSent) fail(error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Datei nicht gefunden.' : 'Datei konnte nicht gelesen werden.');
      else res.destroy();
    }
  });
}
export async function listenPreview({ port = 4173, ...options } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port muss eine ganze Zahl zwischen 0 und 65535 sein.');
  const server = await createPreviewServer(options);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== '--port' || !/^\d+$/.test(args[1]))) throw new Error('Aufruf: node security-hub/dev/server.mjs [--port 4173]');
    const server = await listenPreview({ port: args.length ? Number(args[1]) : 4173 });
    console.log(`Swissploit Preview: http://127.0.0.1:${server.address().port}/security-hub/\nRepository: ${ROOT}\nBeenden mit Strg+C. Keine Automation aktiv.`);
  } catch (error) { console.error(`Preview konnte nicht starten: ${error.code || ''} ${error.message}`); process.exitCode = 1; }
}

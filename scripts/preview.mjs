import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
export function previewServer(root = process.cwd(), port = 4173) {
  const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
  return http.createServer(async (req,res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const relative = urlPath.replace(/^\/+/, '');
      const target = path.resolve(root, relative);
      const within = path.relative(root,target);
      if (within.startsWith('..') || path.isAbsolute(within) || within.split(/[\\/]/).some(p => p.startsWith('.') || p === 'node_modules')) throw Error('Outside preview');
      const file = (await fs.stat(target)).isDirectory() ? path.join(target,'index.html') : target;
      res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');
      res.end(await fs.readFile(file));
    } catch {res.writeHead(404);res.end('Not found');}
  }).listen(port,'127.0.0.1');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  previewServer(); console.log('Preview: http://127.0.0.1:4173');
}

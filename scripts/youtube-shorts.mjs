import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export function validateShorts(videos) {
  if (!Array.isArray(videos) || !videos.length) throw Error('YouTube Shorts: Katalog muss eine nicht leere Liste sein.');
  const ids = new Set();
  const urls = new Set();
  videos.forEach((video, index) => {
    const fail = message => { throw Error(`YouTube Short ${index + 1}: ${message}`); };
    if (!video || typeof video.id !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(video.id)) fail('Ungültige oder leere ID.');
    if (video.url !== `https://www.youtube.com/shorts/${video.id}`) fail('URL muss mit https://www.youtube.com/shorts/ beginnen und exakt zur ID passen.');
    if (ids.has(video.id) || urls.has(video.url)) fail('Doppelte ID oder URL.');
    ids.add(video.id); urls.add(video.url);
    for (const field of ['title', 'description', 'publishedAt']) {
      if (video[field] !== undefined && typeof video[field] !== 'string') fail(`${field} muss ein Text sein.`);
    }
    if (video.tags !== undefined && (!Array.isArray(video.tags) || video.tags.some(tag => typeof tag !== 'string'))) fail('tags muss eine Liste von Texten sein.');
  });
  return videos;
}

export async function readShorts() {
  return validateShorts(JSON.parse(await fs.readFile(new URL('../data/youtube-shorts.json', import.meta.url), 'utf8')));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(`YouTube Shorts: ${(await readShorts()).length} eindeutige, gültige Einträge.`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

import { readFile } from 'node:fs/promises';
export const catalog = JSON.parse(await readFile(new URL('../data/product-catalog.json', import.meta.url), 'utf8'));
export const demo = JSON.parse(await readFile(new URL('../data/fallback-feed.json', import.meta.url), 'utf8'));
export const clone = value => structuredClone(value);
// CVE-9999-* is deliberately synthetic matching input, never public demo intelligence.
export function synthetic(number, cves = ['CVE-9999-0001']) {
  const item = clone(demo.items[1]);
  item.id = `TEST-SYNTHETIC-${number}`; item.cve_ids = cves;
  item.advisory.id = `TEST-ADVISORY-${number}`;
  item.cvss = item.cvss.map(v => ({ ...v, cve_id: cves[0] || null }));
  return item;
}
export const response = value => new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
export function memoryStorage() {
  const entries = new Map();
  return { entries, getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
}

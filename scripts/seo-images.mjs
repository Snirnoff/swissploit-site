import fs from 'node:fs';
import path from 'node:path';

// Read dimensions from the local formats used by this static site. No runtime JS.
const sizes = new Map();
export function imageDimensions(src) {
  if (!src || /^(?:https?:|data:|\/\/)/i.test(src)) return null;
  const file = path.resolve(src.replace(/^\//, ''));
  if (sizes.has(file)) return sizes.get(file);
  let size = null;
  try {
    const b = fs.readFileSync(file);
    if (b.toString('hex', 0, 8) === '89504e470d0a1a0a') size = [b.readUInt32BE(16), b.readUInt32BE(20)];
    else if (b.toString('ascii', 8, 12) === 'WEBP') {
      const type = b.toString('ascii', 12, 16);
      if (type === 'VP8X') size = [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
      else if (type === 'VP8 ') size = [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
      else if (type === 'VP8L') {
        const bits = b.readUInt32LE(21);
        size = [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
      }
    }
  } catch { /* The SEO check reports missing assets separately. */ }
  sizes.set(file, size);
  return size;
}

export function addImageDimensions(html) {
  return html.replace(/<img\b[^>]*>/gi, tag => {
    if (/\bwidth\s*=/.test(tag) || /\bheight\s*=/.test(tag)) return tag;
    const src = tag.match(/\bsrc=["']([^"']+)["']/)?.[1];
    const size = imageDimensions(src);
    return size ? tag.replace(/<img\b/i, `<img width="${size[0]}" height="${size[1]}"`) : tag;
  });
}

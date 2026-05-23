/**
 * Generates PWA icons using Node.js zlib (built-in).
 * Run: node generate-icons.mjs
 */
import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

function uint32BE(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = (crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8)) >>> 0;
  return ((crc ^ 0xffffffff) >>> 0);
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = uint32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crc = uint32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crc]);
}

function makePNG(size) {
  const BG1 = [26, 11, 46];
  const BG2 = [45, 20, 82];
  const PURPLE = [147, 51, 234];
  const LIGHT = [196, 181, 253];

  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const cornerR = size * 0.12;

  function inRoundedRect(x, y) {
    if (x < 0 || x >= size || y < 0 || y >= size) return false;
    const dx = Math.max(cornerR - x, 0, x - (size - cornerR));
    const dy = Math.max(cornerR - y, 0, y - (size - cornerR));
    return dx * dx + dy * dy <= cornerR * cornerR;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      if (!inRoundedRect(x, y)) {
        pixels[idx + 3] = 0;
        continue;
      }

      // Gradient bg
      const t = (x + y) / (size * 2);
      const bg = [
        Math.round(BG1[0] + (BG2[0] - BG1[0]) * t),
        Math.round(BG1[1] + (BG2[1] - BG1[1]) * t),
        Math.round(BG1[2] + (BG2[2] - BG1[2]) * t),
      ];

      // K letter geometry (relative to center)
      const lx = x - cx;
      const ly = y - (cy - size * 0.03);
      const ls = size * 0.52;
      const sw = ls * 0.14;
      const sh = ls * 0.9;

      const inStem =
        lx >= -ls * 0.28 && lx <= -ls * 0.28 + sw &&
        ly >= -sh / 2 && ly <= sh / 2;

      const armBase = -ls * 0.28 + sw;
      const inUpperArm =
        ly < 0 &&
        lx >= armBase && lx <= ls * 0.28 &&
        Math.abs(ly + (lx - armBase) * 0.85) < sw * 0.9;

      const inLowerArm =
        ly > 0 &&
        lx >= armBase && lx <= ls * 0.28 &&
        Math.abs(ly - (lx - armBase) * 0.85) < sw * 0.9;

      // "NHS" subtitle band
      const inNHS =
        y > size * 0.70 && y < size * 0.82 &&
        x > size * 0.25 && x < size * 0.75;

      if (inStem || inUpperArm || inLowerArm) {
        pixels[idx] = PURPLE[0];
        pixels[idx + 1] = PURPLE[1];
        pixels[idx + 2] = PURPLE[2];
        pixels[idx + 3] = 255;
      } else if (inNHS) {
        pixels[idx] = LIGHT[0];
        pixels[idx + 1] = LIGHT[1];
        pixels[idx + 2] = LIGHT[2];
        pixels[idx + 3] = 60;
      } else {
        pixels[idx] = bg[0];
        pixels[idx + 1] = bg[1];
        pixels[idx + 2] = bg[2];
        pixels[idx + 3] = 255;
      }
    }
  }

  // Build PNG scanlines (filter byte 0 per row)
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0;
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = y * (1 + size * 4) + 1 + x * 4;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  const compressed = deflateSync(raw, { level: 6 });

  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync('./public/icons/icon-192.png', makePNG(192));
console.log('✓ icon-192.png created');
writeFileSync('./public/icons/icon-512.png', makePNG(512));
console.log('✓ icon-512.png created');

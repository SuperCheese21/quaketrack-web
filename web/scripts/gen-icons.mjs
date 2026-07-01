// Generates icon-192.png and icon-512.png (blue background + white seismograph
// waveform) using only Node's built-in zlib — no image dependencies.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');

// --- minimal PNG encoder (color type 2, RGB) ---
const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
};

const encodePng = (width, height, rgb) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  // rows with filter byte 0
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

// --- draw the icon ---
const drawIcon = (size) => {
  const rgb = Buffer.alloc(size * size * 3);
  const bg = [29, 78, 216]; // #1d4ed8
  const fg = [255, 255, 255];

  // Seismograph waveform: piecewise line through control points (0..1 space).
  const pts = [
    [0.06, 0.5], [0.26, 0.5], [0.34, 0.28], [0.42, 0.74],
    [0.5, 0.36], [0.58, 0.62], [0.68, 0.5], [0.94, 0.5],
  ];
  const thickness = size * 0.055;

  const distToSegments = (px, py) => {
    let best = Infinity;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const ax = pts[i][0] * size;
      const ay = pts[i][1] * size;
      const bx = pts[i + 1][0] * size;
      const by = pts[i + 1][1] * size;
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy || 1;
      let t = ((px - ax) * dx + (py - ay) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const cx = ax + t * dx;
      const cy = ay + t * dy;
      best = Math.min(best, Math.hypot(px - cx, py - cy));
    }
    return best;
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const onWave = distToSegments(x + 0.5, y + 0.5) <= thickness;
      const [r, g, b] = onWave ? fg : bg;
      const idx = (y * size + x) * 3;
      rgb[idx] = r;
      rgb[idx + 1] = g;
      rgb[idx + 2] = b;
    }
  }
  return encodePng(size, size, rgb);
};

for (const size of [192, 512]) {
  const png = drawIcon(size);
  writeFileSync(join(publicDir, `icon-${size}.png`), png);
  console.log(`wrote public/icon-${size}.png (${png.length} bytes)`);
}

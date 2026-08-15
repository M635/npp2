// Generates build/icon.png (1024x1024) programmatically: gradient rounded
// square + white "N" monogram + cursor accent. No external dependencies.
import zlib from "node:zlib";
import fs from "node:fs";

const SIZE = 1024;

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

// distance from point to segment
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx - px, qy = ay + t * dy - py;
  return Math.sqrt(qx * qx + qy * qy);
}

function roundedRectAlpha(x, y, size, radius) {
  const cx = Math.min(Math.max(x, radius), size - radius);
  const cy = Math.min(Math.max(y, radius), size - radius);
  const dx = x - cx, dy = y - cy;
  const d = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0, Math.min(1, radius - d + 0.5));
}

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
const N = { left: 196, right: 828, top: 228, bottom: 796, thickness: 66 };

for (let y = 0; y < SIZE; y++) {
  const rowStart = y * (SIZE * 4 + 1);
  raw[rowStart] = 0; // filter none
  for (let x = 0; x < SIZE; x++) {
    // rounded rect coverage
    const rr = roundedRectAlpha(x + 0.5, y + 0.5, SIZE, 190);
    // vertical gradient (blue -> indigo) with subtle diagonal sheen
    const t = y / SIZE;
    const sheen = Math.max(0, 1 - Math.abs((x + y) / (2 * SIZE) - 0.72) * 2.4);
    let r = 10 + (94 - 10) * t + sheen * 26;
    let g = 132 + (92 - 132) * t + sheen * 22;
    let b = 255 + (230 - 255) * t + sheen * 10;
    // white "N" monogram
    const inLeft = Math.abs(x + 0.5 - N.left) < N.thickness && y + 0.5 > N.top && y + 0.5 < N.bottom;
    const inRight = Math.abs(x + 0.5 - N.right) < N.thickness && y + 0.5 > N.top && y + 0.5 < N.bottom;
    const dDiag = segDist(x + 0.5, y + 0.5, N.left + N.thickness, N.top, N.right - N.thickness, N.bottom);
    const inDiag = dDiag < N.thickness && y + 0.5 > N.top && y + 0.5 < N.bottom;
    if (inLeft || inRight || inDiag) { r = 255; g = 255; b = 255; }
    // cursor accent dot (top-right)
    if (Math.hypot(x + 0.5 - 790, y + 0.5 - 300) < 58) { r = 255; g = 214; b = 10; }
    const a = rr * 255;
    const off = rowStart + 1 + x * 4;
    raw[off] = Math.round(r);
    raw[off + 1] = Math.round(g);
    raw[off + 2] = Math.round(b);
    raw[off + 3] = Math.round(a);
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
fs.mkdirSync(new URL("../build", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("../build/icon.png", import.meta.url), png);
console.log("icon.png written:", png.length, "bytes");

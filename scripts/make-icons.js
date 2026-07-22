// Sinh icon PNG cho PWA (không cần thư viện ngoài).
// Chạy: node scripts/make-icons.js
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ---- PNG encoder tối giản ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Vẽ icon: nền teal, tấm "ghi chú" trắng với các dòng chữ ----
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Khoảng cách (đơn vị px) từ điểm tới hình chữ nhật bo góc; <=0 nghĩa là bên trong
function roundRectDist(x, y, rx, ry, rw, rh, rad) {
  const cx = clamp(x, rx + rad, rx + rw - rad);
  const cy = clamp(y, ry + rad, ry + rh - rad);
  return Math.hypot(x - cx, y - cy) - rad;
}

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  const BG = [124, 83, 20];       // #7c5314 brand-deep
  const BG2 = [154, 106, 31];     // #9a6a1f brand (gradient nhẹ)
  const CARD = [255, 255, 255];
  const LINE = [236, 208, 160];   // honey nhạt
  const TITLE = [154, 106, 31];   // #9a6a1f

  const u = size / 100; // đơn vị tỉ lệ
  const card = { x: 24 * u, y: 20 * u, w: 52 * u, h: 60 * u, r: 6 * u };
  const lines = [
    { x: 32 * u, y: 30 * u, w: 24 * u, h: 7 * u, color: TITLE },   // "tiêu đề"
    { x: 32 * u, y: 44 * u, w: 36 * u, h: 4 * u, color: LINE },
    { x: 32 * u, y: 54 * u, w: 36 * u, h: 4 * u, color: LINE },
    { x: 32 * u, y: 64 * u, w: 24 * u, h: 4 * u, color: LINE },
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // nền gradient chéo nhẹ
      const t = (x + y) / (2 * size);
      let c = [
        BG[0] + (BG2[0] - BG[0]) * t,
        BG[1] + (BG2[1] - BG[1]) * t,
        BG[2] + (BG2[2] - BG[2]) * t,
      ];

      const dCard = roundRectDist(x + 0.5, y + 0.5, card.x, card.y, card.w, card.h, card.r);
      if (dCard <= 0.5) {
        const aa = clamp(0.5 - dCard, 0, 1); // khử răng cưa mép thẻ
        let cardColor = CARD;
        for (const ln of lines) {
          const d = roundRectDist(x + 0.5, y + 0.5, ln.x, ln.y, ln.w, ln.h, ln.h / 2);
          if (d <= 0.5) {
            const laa = clamp(0.5 - d, 0, 1);
            cardColor = [
              CARD[0] + (ln.color[0] - CARD[0]) * laa,
              CARD[1] + (ln.color[1] - CARD[1]) * laa,
              CARD[2] + (ln.color[2] - CARD[2]) * laa,
            ];
            break;
          }
        }
        c = [
          c[0] + (cardColor[0] - c[0]) * aa,
          c[1] + (cardColor[1] - c[1]) * aa,
          c[2] + (cardColor[2] - c[2]) * aa,
        ];
      }

      const i = (y * size + x) * 4;
      px[i] = Math.round(c[0]);
      px[i + 1] = Math.round(c[1]);
      px[i + 2] = Math.round(c[2]);
      px[i + 3] = 255;
    }
  }
  return encodePng(size, px);
}

const outDir = path.join(__dirname, "..", "icons");
fs.mkdirSync(outDir, { recursive: true });
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  fs.writeFileSync(path.join(outDir, name), drawIcon(size));
  console.log("✓", name);
}

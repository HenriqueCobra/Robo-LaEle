#!/usr/bin/env node
/*
 * Gera icons/icon16.png, icon32.png, icon48.png e icon128.png em Node puro.
 * Rasteriza o mesmo desenho de icons/icon.svg (quadrado arredondado com gradiente
 * e dois olhos olhando de lado) com antialiasing por supersampling e grava o PNG
 * RGBA na mão (zlib + CRC32).
 *
 * Uso: node scripts/make-icons.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZES = [16, 32, 48, 128];
const VIEW = 128; // sistema de coordenadas do SVG

// ---------- desenho (coordenadas 0..128, iguais às do icon.svg) ----------

const CORNER = 30;
const C1 = [0xff, 0x2e, 0x88];
const C2 = [0xa8, 0x55, 0xf7];
const WHITE = [255, 255, 255];
const PUPIL = [0x2a, 0x12, 0x45];

const EYES = [
  { cx: 42, cy: 64, rx: 20, ry: 28 },
  { cx: 86, cy: 64, rx: 20, ry: 28 }
];
const PUPILS = [
  { cx: 49, cy: 66, r: 11 },
  { cx: 93, cy: 66, r: 11 }
];

function insideRoundRect(x, y) {
  const r = CORNER;
  const dx = Math.max(r - x, 0, x - (VIEW - r));
  const dy = Math.max(r - y, 0, y - (VIEW - r));
  return x >= 0 && y >= 0 && x <= VIEW && y <= VIEW && dx * dx + dy * dy <= r * r;
}

function insideEllipse(e, x, y) {
  const nx = (x - e.cx) / e.rx;
  const ny = (y - e.cy) / e.ry;
  return nx * nx + ny * ny <= 1;
}

function insideCircle(c, x, y) {
  const dx = x - c.cx;
  const dy = y - c.cy;
  return dx * dx + dy * dy <= c.r * c.r;
}

// Cor de um ponto do desenho, ou null se transparente.
function sample(x, y) {
  if (!insideRoundRect(x, y)) return null;
  for (const p of PUPILS) if (insideCircle(p, x, y) && EYES.some((e) => insideEllipse(e, x, y))) return PUPIL;
  for (const e of EYES) if (insideEllipse(e, x, y)) return WHITE;
  const t = (x + y) / (2 * VIEW);
  return [0, 1, 2].map((i) => C1[i] + (C2[i] - C1[i]) * t);
}

// ---------- rasterização ----------

function render(size) {
  const ss = size <= 48 ? 8 : 4; // subamostras por eixo
  const scale = VIEW / size;
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const x = (px + (sx + 0.5) / ss) * scale;
          const y = (py + (sy + 0.5) / ss) * scale;
          const c = sample(x, y);
          if (c) { r += c[0]; g += c[1]; b += c[2]; a += 1; }
        }
      }
      const n = ss * ss;
      const o = (py * size + px) * 4;
      if (a > 0) {
        buf[o] = Math.round(r / a);
        buf[o + 1] = Math.round(g / a);
        buf[o + 2] = Math.round(b / a);
        buf[o + 3] = Math.round((a / n) * 255);
      }
    }
  }
  return buf;
}

// ---------- PNG ----------

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
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // profundidade
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filtro "nenhum"
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// ---------- main ----------

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });
for (const size of SIZES) {
  const file = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(file, encodePng(size, render(size)));
  console.log('gerado', path.relative(process.cwd(), file));
}

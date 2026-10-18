#!/usr/bin/env node
/*
 * Gera icons/icon16.png, icon32.png, icon48.png e icon128.png em Node puro.
 * Rasteriza o mesmo desenho de icons/icon.svg (quadrado amarelo com dois olhos de contorno
 * tinta olhando de lado e sobrancelha tinta, direção "caneta" do docs/DESIGN.md) com antialiasing
 * por supersampling e grava o PNG RGBA na mão (zlib + CRC32). Em 16 px a sobrancelha sai, o contorno
 * fica mais fino e as pupilas crescem um pouco para não borrar.
 *
 * Uso: node scripts/make-icons.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZES = [16, 32, 48, 128];

// ---------- desenho ----------

const BG = [0xff, 0xe4, 0x5c];
const WHITE = [255, 255, 255];
const INK = [0x17, 0x14, 0x1f];
const BROW = INK;

// Coordenadas 0..128, iguais às do icon.svg.
const GRANDE = {
  view: 128,
  corner: 30,
  stroke: 7,
  eyes: [
    { cx: 41, cy: 70, rx: 20, ry: 25 },
    { cx: 89, cy: 70, rx: 20, ry: 25 }
  ],
  pupils: [
    { cx: 49, cy: 72, r: 10 },
    { cx: 97, cy: 72, r: 10 }
  ],
  brow: { p0: [72, 35], c: [89, 25], p1: [107, 31], width: 7 }
};

// Coordenadas 0..16 (versão de 16 px: sem sobrancelha, contorno 1,2, pupilas um pouco maiores).
const PEQUENO = {
  view: 16,
  corner: 4,
  stroke: 1.2,
  eyes: [
    { cx: 5.1, cy: 8.9, rx: 2.6, ry: 3.2 },
    { cx: 10.9, cy: 8.9, rx: 2.6, ry: 3.2 }
  ],
  pupils: [
    { cx: 6.3, cy: 9.4, r: 1.45 },
    { cx: 12.1, cy: 9.4, r: 1.45 }
  ],
  brow: null
};

function insideRoundRect(g, x, y) {
  const r = g.corner;
  const dx = Math.max(r - x, 0, x - (g.view - r));
  const dy = Math.max(r - y, 0, y - (g.view - r));
  return x >= 0 && y >= 0 && x <= g.view && y <= g.view && dx * dx + dy * dy <= r * r;
}

// Distância assinada aproximada até a borda da elipse (negativa dentro).
function ellipseDist(e, x, y) {
  const nx = (x - e.cx) / e.rx;
  const ny = (y - e.cy) / e.ry;
  const gv = Math.sqrt(nx * nx + ny * ny);
  if (gv === 0) return -Math.min(e.rx, e.ry);
  const gx = nx / e.rx / gv;
  const gy = ny / e.ry / gv;
  return (gv - 1) / Math.sqrt(gx * gx + gy * gy);
}

function insideCircle(c, x, y) {
  const dx = x - c.cx;
  const dy = y - c.cy;
  return dx * dx + dy * dy <= c.r * c.r;
}

// Quadrática da sobrancelha vira polilinha; o traço com ponta redonda é a união de cápsulas.
function browPolyline(brow) {
  if (!brow) return null;
  const pts = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = 1 - t;
    pts.push([
      u * u * brow.p0[0] + 2 * u * t * brow.c[0] + t * t * brow.p1[0],
      u * u * brow.p0[1] + 2 * u * t * brow.c[1] + t * t * brow.p1[1]
    ]);
  }
  return pts;
}

function distToSegment(px, py, a, b) {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const len2 = vx * vx + vy * vy;
  let t = len2 ? ((px - a[0]) * vx + (py - a[1]) * vy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const dx = px - (a[0] + t * vx);
  const dy = py - (a[1] + t * vy);
  return Math.sqrt(dx * dx + dy * dy);
}

function insideBrow(g, poly, x, y) {
  if (!poly) return false;
  const half = g.brow.width / 2;
  for (let i = 0; i < poly.length - 1; i++) {
    if (distToSegment(x, y, poly[i], poly[i + 1]) <= half) return true;
  }
  return false;
}

// Cor de um ponto do desenho, ou null se transparente (mesma ordem de camadas do SVG).
function sample(g, poly, x, y) {
  if (!insideRoundRect(g, x, y)) return null;
  let color = BG;
  const half = g.stroke / 2;
  for (const e of g.eyes) {
    const d = ellipseDist(e, x, y);
    if (d <= 0) color = WHITE;
    if (Math.abs(d) <= half) color = INK;
  }
  for (const p of g.pupils) if (insideCircle(p, x, y)) color = INK;
  if (insideBrow(g, poly, x, y)) color = BROW;
  return color;
}

// ---------- rasterização ----------

function render(size) {
  const g = size <= 16 ? PEQUENO : GRANDE;
  const poly = browPolyline(g.brow);
  const ss = size <= 48 ? 8 : 4; // subamostras por eixo
  const scale = g.view / size;
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, gg = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const x = (px + (sx + 0.5) / ss) * scale;
          const y = (py + (sy + 0.5) / ss) * scale;
          const c = sample(g, poly, x, y);
          if (c) { r += c[0]; gg += c[1]; b += c[2]; a += 1; }
        }
      }
      const n = ss * ss;
      const o = (py * size + px) * 4;
      if (a > 0) {
        buf[o] = Math.round(r / a);
        buf[o + 1] = Math.round(gg / a);
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

// 生成 PWA / apple-touch 图标（纯 Node，无第三方依赖）。
// 与 icons/icon.svg 同构：夜色渐变底 + 极光新月 + 几点星。
// 用法：node scripts/gen-icons.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'icons');

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [Math.round(lerp(c1[0], c2[0], t)), Math.round(lerp(c1[1], c2[1], t)), Math.round(lerp(c1[2], c2[2], t))];

// 在 0..512 坐标系里取一个像素颜色
function sample(x, y) {
  const topc = [10, 20, 24], botc = [14, 28, 30], aur = [127, 224, 200], star = [223, 232, 255], star2 = [157, 140, 255];
  let col = mix(topc, botc, y / 512);
  const d = Math.hypot(x - 256, y - 225);                       // 中央极光辉
  if (d < 290) { const t = 1 - d / 290; col = mix(col, aur, 0.16 * t * t); }
  const d1 = Math.hypot(x - 256, y - 238), d2 = Math.hypot(x - 300, y - 210);
  if (d1 <= 118 && d2 > 100) col = aur;                          // 新月
  [[150, 150, 4, 0.85, star], [378, 300, 3, 0.7, star], [122, 332, 2.6, 0.7, star2]].forEach(([sx, sy, sr, sa, sc]) => {
    const dd = Math.hypot(x - sx, y - sy); if (dd < sr) col = mix(col, sc, sa * (1 - dd / sr));
  });
  return col;
}

function render(size) {
  const data = Buffer.alloc(size * size * 4), S = size / 512, ss = 2, n = ss * ss;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0;
    for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
      const c = sample((x + (sx + 0.5) / ss) / S, (y + (sy + 0.5) / ss) / S); r += c[0]; g += c[1]; b += c[2];
    }
    const i = (y * size + x) * 4;
    data[i] = r / n; data[i + 1] = g / n; data[i + 2] = b / n; data[i + 3] = 255;
  }
  return data;
}

const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

function png(size, file) {
  const raw = render(size), stride = size * 4;
  const filtered = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) { filtered[y * (stride + 1)] = 0; raw.copy(filtered, y * (stride + 1) + 1, y * stride, y * stride + stride); }
  const idat = zlib.deflateSync(filtered, { level: 9 });
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii'), body = Buffer.concat([t, data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const out = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(path.join(OUT, file), out);
  console.log('wrote icons/' + file, '(' + out.length + ' bytes)');
}

fs.mkdirSync(OUT, { recursive: true });
png(192, 'icon-192.png');
png(512, 'icon-512.png');
png(180, 'apple-touch-icon.png');

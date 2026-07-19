// 生成社交分享大图 public/og.png（1200×630，summary_large_image）。
// 夜·玻璃底 + 复用 icon 的极光新月 + Lull 字样 + 双语副标 + URL。离线跑：node scripts/gen-og.mjs
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 1200, H = 630;

// 注册系统字体（macOS）；缺失则回退默认。
const tryFont = (p, family) => { try { if (fs.existsSync(p)) GlobalFonts.registerFromPath(p, family); } catch (e) {} };
tryFont('/System/Library/Fonts/Supplemental/Georgia.ttf', 'OGSerif');
tryFont('/Library/Fonts/Georgia.ttf', 'OGSerif');
tryFont('/System/Library/Fonts/Supplemental/Menlo.ttc', 'OGMono');
tryFont('/System/Library/Fonts/Menlo.ttc', 'OGMono');
tryFont('/System/Library/Fonts/Supplemental/Courier New.ttf', 'OGMono');
tryFont('/System/Library/Fonts/PingFang.ttc', 'OGCJK');
tryFont('/System/Library/Fonts/STHeiti Light.ttc', 'OGCJK');
tryFont('/System/Library/Fonts/Hiragino Sans GB.ttc', 'OGCJK');
const has = fam => GlobalFonts.families.some(f => f.family === fam);
const SERIF = has('OGSerif') ? 'OGSerif' : 'serif';
const MONO = has('OGMono') ? 'OGMono' : 'monospace';
const CJK = has('OGCJK') ? 'OGCJK' : SERIF;

const cv = createCanvas(W, H);
const g = cv.getContext('2d');

// 夜色底渐变
let bg = g.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, '#0a1014'); bg.addColorStop(1, '#0e1c1e');
g.fillStyle = bg; g.fillRect(0, 0, W, H);
// 极光辉（右上暖冷双弧，很淡）
const glow = (x, y, r, col, a) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col.replace('A', a)); rg.addColorStop(1, col.replace('A', '0')); g.fillStyle = rg; g.fillRect(0, 0, W, H); };
glow(880, 150, 620, 'rgba(127,224,200,A)', '0.16');
glow(300, 90, 560, 'rgba(157,140,255,A)', '0.10');

// 几点星
g.fillStyle = 'rgba(223,232,255,0.85)';
[[150, 120, 2.4], [470, 470, 1.8], [980, 470, 2.0], [1080, 120, 1.6], [640, 90, 1.5]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); });

// 极光新月：离屏画整圆再 destination-out 抠出弯月（无方块边），主画布叠柔光
const MS = 320, mc = createCanvas(MS, MS), mg = mc.getContext('2d');
const R = MS * 0.42, mcx = MS / 2, mcy = MS / 2;
mg.fillStyle = '#7fe0c8'; mg.beginPath(); mg.arc(mcx, mcy, R, 0, 6.283); mg.fill();
mg.globalCompositeOperation = 'destination-out';
mg.beginPath(); mg.arc(mcx + R * 0.52, mcy - R * 0.30, R * 0.94, 0, 6.283); mg.fill();
mg.globalCompositeOperation = 'source-over';
const MX = W - MS - 150, MY = (H - MS) / 2 - 6;
const mgl = g.createRadialGradient(MX + mcx, MY + mcy, 0, MX + mcx, MY + mcy, R * 1.8);
mgl.addColorStop(0, 'rgba(127,224,200,0.22)'); mgl.addColorStop(1, 'rgba(127,224,200,0)');
g.fillStyle = mgl; g.fillRect(0, 0, W, H);
g.drawImage(mc, MX, MY);

// 文案（左）
const X = 96;
g.textBaseline = 'alphabetic';
// 字标
g.fillStyle = '#eef3ee'; g.font = `500 152px ${SERIF}`;
g.fillText('Lull', X - 4, 300);
// tagline（mono · 疏排 · 大写）
g.fillStyle = '#8ea3a0'; g.font = `600 22px ${MONO}`;
try { g.letterSpacing = '7px'; } catch (e) {}
g.fillText('SOUND RADIO · NIGHT FM', X, 348);
try { g.letterSpacing = '0px'; } catch (e) {}
// 副标：英文为主 + 中文为次
g.fillStyle = '#cbd8d4'; g.font = `italic 33px ${SERIF}`;
g.fillText('An ambient radio for sleep & focus', X, 428);
g.fillStyle = '#8ea3a0'; g.font = `400 25px ${CJK}`;
g.fillText('夜间频道 × 生成式气象混音器', X, 470);
// URL + 开源
g.fillStyle = '#7fe0c8'; g.font = `600 25px ${MONO}`;
g.fillText('lull.whyiyhw.com', X, 560);
g.fillStyle = '#6b807f'; g.font = `400 22px ${MONO}`;
g.fillText('·  open-source  ·  github.com/whyiyhw/lull', X + 250, 560);

// 暗角
const vg = g.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.25, W / 2, H * 0.5, Math.max(W, H) * 0.72);
vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.34)');
g.fillStyle = vg; g.fillRect(0, 0, W, H);

const out = path.join(ROOT, 'public', 'og.png');
fs.writeFileSync(out, cv.toBuffer('image/png'));
console.log('wrote public/og.png', (fs.statSync(out).size / 1024).toFixed(0) + 'KB', '· serif=' + SERIF, 'mono=' + MONO);

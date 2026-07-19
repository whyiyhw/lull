// 视觉自验：Playwright 驱动系统 Chrome（channel:'chrome'，裸 CLI --screenshot 在本机会卡死），
// 点亮声音/切质地/切主题后截多视口图，产出到 output/（已 gitignore）。
//   pnpm shots                      # 截线上，默认场景
//   node scripts/shots.mjs <outDir> <url>
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const OUT = process.argv[2] || 'output/self';
const URL = process.argv[3] || 'https://lull.whyiyhw.com/';
fs.mkdirSync(OUT, { recursive: true });

// 场景：w/h 视口，light 先切浅色，tab 切分类，chips 点亮声音，surface 切雨质地。
const SCENES = [
  { name: 'm-forest',      w: 390, h: 844, tab: 'forest', chips: ['forest'] },
  { name: 'm-320-forest',  w: 320, h: 780, tab: 'forest', chips: ['forest'] },
  { name: 'm-light-forest',w: 390, h: 844, light: true, tab: 'forest', chips: ['forest'] },
  { name: 'd-rainmix',     w: 1280, h: 900, tab: 'rain', chips: ['hrain', 'storm'] },
  { name: 'd-rain-water',  w: 1280, h: 900, tab: 'rain', chips: ['hrain'], surface: 'water' },
];

const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function shot({ name, w, h, light = false, tab, chips = [], surface, wait = 2200 }) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load', timeout: 20000 });
  await p.waitForTimeout(700);
  if (light) { await p.click('#theme').catch(() => {}); await p.waitForTimeout(300); }
  if (tab) await p.click(`.tab[data-cat="${tab}"]`, { timeout: 5000 });
  for (const c of chips) { await p.click(`.cell[data-id="${c}"]`, { timeout: 5000 }); await p.waitForTimeout(250); }
  if (surface) await p.click(`.bird-chip[data-pk="lull.rainsurf"][data-m="${surface}"]`, { timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(wait);
  await p.screenshot({ path: `${OUT}/lull-${name}.png` });
  console.log('✓', name);
  await ctx.close();
}
try { for (const s of SCENES) await shot(s); } finally { await b.close(); }
console.log('done →', OUT);

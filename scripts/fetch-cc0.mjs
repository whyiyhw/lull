// 开发期助手（不随产品发布）：从 Wikimedia Commons 检索**经许可证核验**的可商用（CC0 / 公有领域 /
// 纯 CC-BY，拒一切 ShareAlike）环境录音候选，落到 audio/raw/ 供 scripts/prep-audio.mjs 处理。
// 绝不猜许可证——只接受 Commons extmetadata 明示的许可证（版权洁癖）。
//
// ⚠️ 许可证是机器核验的、可信；但**音频内容按关键字匹配元数据，不保证真的是那个声音**
// （实测「heavy rain」会命中一段蟋蟀录音、「rain」会命中一首同名音乐）。因此本脚本只用于
// **候选调研**：`--apply` 前必须人工试听逐个确认，别把跑出来的东西直接发布。
//
// 用法：
//   node scripts/fetch-cc0.mjs            # 干跑：每个目标列出候选（标题 / 许可证 / 时长），不落地
//   node scripts/fetch-cc0.mjs --apply    # 下载每个目标的首个合格候选到 audio/raw/<id>.<ext>
//
// 依赖：网络 + ffprobe（判时长）。无第三方 npm 依赖。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'audio', 'raw');
const API = 'https://commons.wikimedia.org/w/api.php';
const APPLY = process.argv.includes('--apply');
const MIN_DUR = 40;          // 秒；PRD 目标 ≥60s，放宽以增加命中率（流水线会再减去交叉淡化长度）
// 版权洁癖：拒绝一切 ShareAlike/copyleft（CC BY-SA = D5 的病根），接受 CC0 / 公有领域 / 纯 CC-BY（可商用，仅需署名）。
function isFree(lic) {
  const l = (lic || '').toLowerCase();
  if (!l) return false;
  if (/share.?alike|by-?sa|[-\s]sa\b|gfdl|gpl/.test(l)) return false;   // copyleft → 拒
  return /cc0|public domain|public-domain|no restrictions|pdm|cc[-\s]?by/.test(l);
}

// 每个目标：id + 搜索词（多个，按优先级）。只做环境/自然录音。
const TARGETS = [
  { id: 'lrain',  terms: ['light rain ambience', 'rain sound', 'rain ambient'] },
  { id: 'hrain',  terms: ['heavy rain', 'rain storm ambient', 'rain downpour'] },
  { id: 'storm',  terms: ['thunderstorm', 'thunder rain', 'thunder ambient'] },
  { id: 'fall',   terms: ['waterfall ambience', 'waterfall sound', 'waterfall'] },
  { id: 'ocean',  terms: ['ocean waves', 'sea waves', 'surf ambient'] },
  { id: 'stream', terms: ['stream water', 'creek water', 'brook flowing'] },
  { id: 'birds',  terms: ['dawn chorus birds', 'birdsong ambience', 'forest birds'] },
  { id: 'wind',   terms: ['wind ambient', 'wind storm', 'strong wind'] },
  { id: 'breeze', terms: ['gentle wind', 'light breeze', 'soft wind'] },
  { id: 'fire',   terms: ['campfire crackling', 'fire crackling', 'bonfire'] },
];

const getJSON = async (url) => JSON.parse(await (await fetch(url, { headers: { 'User-Agent': 'Lull-audio-prep/1.0 (dev)' } })).text());

async function search(term) {
  const u = `${API}?action=query&format=json&list=search&srnamespace=6&srlimit=40&srsearch=${encodeURIComponent(term + ' filetype:audio')}`;
  const j = await getJSON(u);
  return (j.query?.search || []).map(s => s.title);
}
async function info(titles) {
  if (!titles.length) return [];
  const u = `${API}?action=query&format=json&prop=imageinfo&iiprop=extmetadata|url|size|mime&titles=${encodeURIComponent(titles.join('|'))}`;
  const j = await getJSON(u);
  return Object.values(j.query?.pages || {}).map(p => {
    const ii = p.imageinfo?.[0]; if (!ii) return null;
    const e = ii.extmetadata || {};
    return { title: p.title, url: ii.url, mime: ii.mime, size: ii.size,
      license: (e.LicenseShortName?.value || e.License?.value || '').replace(/<[^>]+>/g, '').trim(),
      artist: (e.Artist?.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 60) };
  }).filter(Boolean);
}
function probeDur(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', file], { encoding: 'utf8' });
  return parseFloat((r.stdout || '').trim()) || 0;
}
async function download(url, dest) {
  const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': 'Lull-audio-prep/1.0 (dev)' } })).arrayBuffer());
  fs.writeFileSync(dest, buf); return buf.length;
}

fs.mkdirSync(RAW, { recursive: true });
const tmp = path.join(RAW, '.probe.tmp');
const picks = [];
for (const t of TARGETS) {
  let chosen = null;
  outer: for (const term of t.terms) {
    let hits = [];
    try { hits = await search(term); } catch (e) { continue; }
    for (let i = 0; i < hits.length; i += 10) {
      let metas = [];
      try { metas = await info(hits.slice(i, i + 10)); } catch (e) { continue; }
      for (const m of metas) {
        if (!m.mime || !m.mime.startsWith('audio')) continue;
        if (!isFree(m.license)) continue;
        // 探时长
        let dur = 0;
        try { await download(m.url, tmp); dur = probeDur(tmp); } catch (e) { continue; }
        if (dur < MIN_DUR) continue;
        chosen = { ...m, dur, term };
        break outer;
      }
    }
  }
  if (chosen) {
    console.log(`✓ ${t.id.padEnd(7)} ${chosen.dur.toFixed(0)}s  [${chosen.license}]  ${chosen.title}  «${chosen.term}»`);
    picks.push({ id: t.id, ...chosen });
    if (APPLY) {
      const ext = '.' + (chosen.url.split('.').pop().split('?')[0].toLowerCase());
      const dest = path.join(RAW, t.id + ext);
      await download(chosen.url, dest);
      console.log(`    ↓ audio/raw/${t.id}${ext}`);
    }
  } else {
    console.log(`✗ ${t.id.padEnd(7)} 无合格 CC0/PD 候选（${t.terms.join(' / ')}）`);
  }
}
try { fs.unlinkSync(tmp); } catch {}

// 输出一张可直接抄进 AUDIO_CREDITS.md 的表
if (picks.length) {
  console.log('\n--- AUDIO_CREDITS 行（核验自 Commons extmetadata）---');
  for (const p of picks) console.log(`| \`${p.id}.mp3\` | ${p.id} | ${p.license} | ✅ | ${p.title.replace(/^File:/, '')} |`);
}
console.log(`\n${APPLY ? '已下载' : '干跑'} ${picks.length}/${TARGETS.length}。${APPLY ? '接着运行 `node scripts/prep-audio.mjs` 处理。' : '加 --apply 落地。'}`);

// 素材流水线（F-3 / 清偿 D3 素材侧）——仿照 gen-icons.mjs，纯 Node + 系统 ffmpeg。
// 把「探路占位素材」的主观校对工序固化为可重复脚本：
//   ① 转单声道  ② 首尾交叉淡化消循环接缝  ③ loudnorm 响度归一  ④ 转码 mp3
// 所有替换 / 新增素材都必须过这条流水线，产出直接落到 public/audio/ 供 index.html 加载。
//
// 用法：
//   node scripts/prep-audio.mjs                     # 处理 audio/raw/ 下所有音频 → public/audio/<同名>.mp3
//   node scripts/prep-audio.mjs in.wav lrain        # 单文件 → public/audio/lrain.mp3
//   node scripts/prep-audio.mjs in.wav lrain --xfade 3 --lufs -18
//
// 依赖：系统需安装 ffmpeg / ffprobe（macOS: `brew install ffmpeg`）。无第三方 npm 依赖。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio');   // Vite 迁移后运行时音频在 public/audio/（构建时原样拷到 dist 根）
const RAW_DIR = path.join(ROOT, 'audio', 'raw');   // 原始输入放顶层 audio/raw/（在 public/ 之外，不进构建产物）
const AUDIO_EXT = new Set(['.wav', '.ogg', '.flac', '.mp3', '.m4a', '.aif', '.aiff', '.opus']);

// ---------- 参数 ----------
const argv = process.argv.slice(2);
const opts = { xfade: 3.0, lufs: -18, tp: -1.5, lra: 11, bitrate: '128k', rate: 44100 };
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--xfade') opts.xfade = parseFloat(argv[++i]);
  else if (a === '--lufs') opts.lufs = parseFloat(argv[++i]);
  else if (a === '--tp') opts.tp = parseFloat(argv[++i]);
  else if (a === '--bitrate') opts.bitrate = argv[++i];
  else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
  else positional.push(a);
}

function usage() {
  console.log(`Lull 素材流水线 · prep-audio
  node scripts/prep-audio.mjs                  处理 audio/raw/ 全部 → public/audio/<同名>.mp3
  node scripts/prep-audio.mjs <in> [name]      单文件（name 省略则用输入名）
  可选: --xfade <秒=${opts.xfade}> --lufs <=${opts.lufs}> --tp <=${opts.tp}> --bitrate <=${opts.bitrate}>`);
}

// ---------- ffmpeg 探测 ----------
function has(bin) { return spawnSync(bin, ['-version'], { stdio: 'ignore' }).status === 0; }
if (!has('ffmpeg') || !has('ffprobe')) {
  console.error('✗ 需要 ffmpeg / ffprobe。macOS: `brew install ffmpeg`；其他平台见 https://ffmpeg.org/download.html');
  process.exit(1);
}

function duration(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', file], { encoding: 'utf8' });
  const d = parseFloat((r.stdout || '').trim());
  if (!isFinite(d) || d <= 0) throw new Error('无法读取时长: ' + file);
  return d;
}

// 单个素材：交叉淡化成无缝循环 → 单声道 → loudnorm → mp3
function process1(input, name) {
  const out = path.join(OUT_DIR, name + '.mp3');
  const D = duration(input);
  // 交叉淡化长度：默认 3s，但不超过素材的 40%，且至少 0.5s
  const X = Math.max(0.5, Math.min(opts.xfade, D * 0.4));
  if (D <= X + 0.5) { console.warn(`⚠ ${name}: 素材过短（${D.toFixed(1)}s），跳过交叉淡化，仅归一化`); }

  // 无缝循环原理：把素材拆成 [begin]=前 X 秒、[end]=X 秒之后的主体，
  // 让 [end] 的尾部与 [begin] 交叉淡化——原本 D→0 的硬切被重叠抹平，输出时长 = D - X。
  const seamless = D > X + 0.5;
  const filter = seamless
    ? `[0:a]asplit=2[a][b];` +
      `[a]atrim=0:${X.toFixed(3)},asetpts=N/SR/TB[begin];` +
      `[b]atrim=${X.toFixed(3)},asetpts=N/SR/TB[end];` +
      `[end][begin]acrossfade=d=${X.toFixed(3)}:c1=tri:c2=tri,` +
      `aformat=channel_layouts=mono,loudnorm=I=${opts.lufs}:TP=${opts.tp}:LRA=${opts.lra}[out]`
    : `[0:a]aformat=channel_layouts=mono,loudnorm=I=${opts.lufs}:TP=${opts.tp}:LRA=${opts.lra}[out]`;

  const args = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', input,
    '-filter_complex', filter, '-map', '[out]',
    '-ac', '1', '-ar', String(opts.rate),
    '-c:a', 'libmp3lame', '-b:a', opts.bitrate,
    out,
  ];
  const r = spawnSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] });
  if (r.status !== 0) { console.error(`✗ ${name}: ffmpeg 失败`); return false; }
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`✓ public/audio/${name}.mp3  (${(D - (seamless ? X : 0)).toFixed(1)}s · ${kb}KB · mono · ${opts.lufs}LUFS${seamless ? ` · xfade ${X.toFixed(1)}s` : ''})`);
  return true;
}

// ---------- 主流程 ----------
fs.mkdirSync(OUT_DIR, { recursive: true });

let jobs = [];
if (positional.length >= 1) {
  const input = positional[0];
  if (!fs.existsSync(input)) { console.error('✗ 找不到输入文件: ' + input); process.exit(1); }
  const name = positional[1] || path.basename(input, path.extname(input));
  jobs.push([input, name]);
} else {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`✗ 未提供输入，且 ${path.relative(ROOT, RAW_DIR)}/ 不存在。\n  把原始录音放进 audio/raw/ 再运行，或指定单文件：node scripts/prep-audio.mjs in.wav lrain`);
    process.exit(1);
  }
  jobs = fs.readdirSync(RAW_DIR)
    .filter(f => AUDIO_EXT.has(path.extname(f).toLowerCase()))
    .map(f => [path.join(RAW_DIR, f), path.basename(f, path.extname(f))]);
  if (!jobs.length) { console.error('✗ audio/raw/ 下没有可处理的音频文件'); process.exit(1); }
}

console.log(`prep-audio · ${jobs.length} 个素材 → public/audio/  (xfade ${opts.xfade}s / ${opts.lufs}LUFS / ${opts.bitrate})`);
let ok = 0;
for (const [input, name] of jobs) { try { if (process1(input, name)) ok++; } catch (e) { console.error(`✗ ${name}: ${e.message}`); } }
console.log(`完成 ${ok}/${jobs.length}。请把逐文件许可证登记到 AUDIO_CREDITS.md（要求 CC0 / 可商用）。`);
process.exit(ok === jobs.length ? 0 : 1);

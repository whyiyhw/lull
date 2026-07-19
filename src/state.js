// 共享可变态：音频图核心引用 + 播放态 + 音量。
// 用「live binding + setter」模式——各模块 import 后读到的永远是最新值；仅重新赋值须走 setter。
export let ctx = null, master = null, reverb = null, reverbBus = null;
export function setCtx(v){ ctx = v; }
export function setMaster(v){ master = v; }
export function setReverb(v){ reverb = v; }
export function setReverbBus(v){ reverbBus = v; }

export const buffers = {};          // 噪声缓冲（white/pink/brown），原地填充
export const layers = new Map();    // id -> layer，原地增删
export const AUDIO_BASE = 'audio/';

export let masterPlaying = false;
export function setMasterPlaying(v){ masterPlaying = v; }

export let masterVol = parseInt(localStorage.getItem('lull.mvol') || '70', 10);
export function setMasterVolState(v){ masterVol = v; }

// 语言（zh/en）：live binding + setter，供 i18n.js 与 data.js 在读取时解析当前语言。
export let locale = (() => {
  try { const s = localStorage.getItem('lull.lang'); if (s === 'zh' || s === 'en') return s; } catch (e) {}
  return (typeof navigator !== 'undefined' && (navigator.language || '').toLowerCase().startsWith('zh')) ? 'zh' : 'en';
})();
export function setLocaleState(v){ locale = v; }

export const soundVol = JSON.parse(localStorage.getItem('lull.svol') || '{}');   // id -> 0..1，原地写入

export const volOf = id => (id in soundVol ? soundVol[id] : 0.6);
export const perc = v => v * v;
export const masterTarget = () => perc(masterVol / 100) * 0.9;
export const layerTarget = id => perc(volOf(id));

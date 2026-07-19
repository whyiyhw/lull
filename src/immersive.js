// 沉浸挂机模式（F-9）：Screen Wake Lock · 8s 空闲隐藏 UI · 全屏 · 键盘快捷键。
import { $ } from './util.js';
import { masterPlaying } from './state.js';
import { BUILTIN_PRESETS } from './data.js';
import { t } from './i18n.js';
import { toggleMaster } from './engine.js';
import { tuneTo } from './tuner.js';
import { toast } from './ui.js';

// 屏幕常亮：仅「播放且页面可见」时持有；不支持则一次性降级提示
let wakeLock=null, wakeNoticed=false;
export async function requestWakeLock(){
  if (!('wakeLock' in navigator)){ if (!wakeNoticed){ wakeNoticed=true; toast(t('noWakeLock')); } return; }
  if (wakeLock || document.hidden || !masterPlaying) return;
  try{ wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', ()=>{ wakeLock=null; }); }catch(e){ wakeLock=null; }
}
export function releaseWakeLock(){ if (wakeLock){ try{ wakeLock.release(); }catch(e){} wakeLock=null; } }

// 沉浸态：播放中 8s 无交互 → 隐藏控制台与光标、时钟放大；任意输入立即恢复
let idleT=0;
export function scheduleImmersive(){ clearTimeout(idleT); if (masterPlaying && !document.hidden) idleT=setTimeout(enterImmersive, 8000); }
function enterImmersive(){ if (!masterPlaying) return; document.body.classList.remove('waking'); document.body.classList.add('immersive'); }
export function exitImmersive(){ if (document.body.classList.contains('immersive')){ document.body.classList.add('waking'); document.body.classList.remove('immersive'); } }
export function wake(){ exitImmersive(); scheduleImmersive(); }
export function reflectImmersive(){
  if (masterPlaying){ requestWakeLock(); scheduleImmersive(); }
  else { releaseWakeLock(); exitImmersive(); clearTimeout(idleT); }
}
export function clearIdle(){ clearTimeout(idleT); }

// 全屏
export function toggleFullscreen(){
  const el=document.documentElement;
  if (!document.fullscreenElement && !document.webkitFullscreenElement){
    const r=el.requestFullscreen||el.webkitRequestFullscreen;
    if (r){ const p=r.call(el); if (p&&p.catch) p.catch(()=>{}); } else toast(t('noFullscreen'));
  } else { (document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document); }
}
export function reflectFs(){
  const on=!!(document.fullscreenElement||document.webkitFullscreenElement);
  $('fs-ico').innerHTML = on
    ? '<path d="M9 4v3a2 2 0 0 1-2 2H4M20 9h-3a2 2 0 0 1-2-2V4M4 15h3a2 2 0 0 1 2 2v3M15 20v-3a2 2 0 0 1 2-2h3"/>'
    : '<path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/>';
  $('fullscreen').setAttribute('aria-label', on?t('fsExit'):t('fsEnter'));
}

// 挂机相关的全局监听 + 快捷键，集中在初始化时挂上
export function initImmersive(){
  ['pointermove','pointerdown','wheel','touchstart'].forEach(ev => addEventListener(ev, wake, {passive:true}));
  document.addEventListener('fullscreenchange', reflectFs);
  document.addEventListener('webkitfullscreenchange', reflectFs);
  // 桌面/键盘快捷键：Space 播放暂停 · F 全屏 · Esc 退出沉浸 · 1–6 切内置频道
  addEventListener('keydown', e => {
    if (e.metaKey||e.ctrlKey||e.altKey) return;
    const t=e.target, tag=t&&t.tagName, role=t&&t.getAttribute&&t.getAttribute('role');
    // 焦点在输入控件 / 拨盘 / 任意按钮上时，快捷键不误触发（D11①：F 与 1–6 此前缺 BUTTON 守卫，只有 Space 有）
    const guarded = tag==='INPUT'||tag==='TEXTAREA'||(t&&t.isContentEditable)||role==='slider'||tag==='BUTTON';
    wake();
    if (e.key===' '){ if (guarded) return; e.preventDefault(); toggleMaster(); }
    else if (e.key==='f'||e.key==='F'){ if (guarded) return; e.preventDefault(); toggleFullscreen(); }
    else if (e.key==='Escape'){ exitImmersive(); }
    else if (e.key>='1'&&e.key<='6'){ if (guarded) return; const p=BUILTIN_PRESETS[+e.key-1]; if (p){ tuneTo(p, true); toast(t('tunedTo', p.name, p.fm.toFixed(1))); } }
  });
}

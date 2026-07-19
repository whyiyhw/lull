// 入口：主题初始化、装配各模块的监听、按原顺序跑初始化、注册 Service Worker。
import { $, root, curTheme } from './util.js';
import { masterVol, ctx, masterPlaying } from './state.js';
import { scene } from './scene.js';                 // 导入即创建场景单例并起 rAF
import { toggleMaster, clearAll, shareMix, setMasterVol, resumeLast, initRestore, reflectResume } from './engine.js';
import { initTuner, saveCurrentAsPreset, relocalizeTuner } from './tuner.js';
import { buildTabs, renderTabs, renderChips, renderMixer, reflectPlay, reflectState } from './ui.js';
import { startClock, stopClock, toggleSeconds, initTimers } from './timer.js';
import { initImmersive, reflectFs, toggleFullscreen, requestWakeLock, releaseWakeLock, scheduleImmersive, clearIdle } from './immersive.js';
import { keepAlive, attemptRecover, updateMediaSession } from './lockscreen.js';
import { applyStaticStrings, onLocaleChange, toggleLocale, t } from './i18n.js';

// ---------- 主题 ----------
const sun = 'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z';
const moon = 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z';
const paintTheme = () => $('theme-ico').innerHTML = '<path d="'+(curTheme()==='dark'?sun:moon)+'"/>';
// 默认深色（Night FM 的「正脸」，深色设计更佳、白天也不发虚）；用户显式切到浅色才记住并沿用。
const savedTheme = localStorage.getItem('lull.theme'); root.dataset.theme = savedTheme || 'dark';
paintTheme();
// 明暗切换 · 渐进式：UI 走 body.theming 色彩过渡；背景 canvas 用当前帧快照叠层淡出做交叉淡化（否则场景明暗硬跳）。
function crossfadeTheme(n){
  try {
    const cv = $('scene'), snap = document.createElement('canvas');
    snap.width = cv.width; snap.height = cv.height; snap.className = 'theme-snap';
    snap.getContext('2d').drawImage(cv, 0, 0);
    document.body.appendChild(snap);
    requestAnimationFrame(() => requestAnimationFrame(() => { snap.style.opacity = '0'; }));
    setTimeout(() => snap.remove(), 640);
  } catch (e) {}
  document.body.classList.add('theming');
  setTimeout(() => document.body.classList.remove('theming'), 640);
  root.dataset.theme = n; localStorage.setItem('lull.theme', n); paintTheme();
}
$('theme').addEventListener('click', () => crossfadeTheme(curTheme()==='dark' ? 'light' : 'dark'));

// ---------- 语言（i18n · 中英）----------
applyStaticStrings();                                  // 按当前语言刷新静态标签（tagline/aria/按钮…）
$('lang').addEventListener('click', toggleLocale);
onLocaleChange(() => {                                  // 切换语言：重渲染一切带文案的动态部分
  buildTabs(); renderChips(); renderMixer(); relocalizeTuner();
  reflectPlay(); reflectState(); reflectFs(); reflectResume(); updateMediaSession();
  const off = document.querySelector('#timers .tchip[data-id="off"]'); if (off) off.textContent = t('timerOff');
});

// ---------- 事件 & 初始化 ----------
buildTabs();       // 分类页签（一次性）
initTimers();      // 睡眠定时档位 chips（一次性）
startClock();
initImmersive();   // 挂机监听 + 键盘快捷键

$('play').addEventListener('click', toggleMaster);
$('fullscreen').addEventListener('click', toggleFullscreen);
$('clock').addEventListener('click', toggleSeconds);
$('clock').addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); toggleSeconds(); } });
$('clear').addEventListener('click', clearAll);
$('share').addEventListener('click', shareMix);
$('save-preset').addEventListener('click', saveCurrentAsPreset);
$('resume').addEventListener('click', resumeLast);
const volEl = $('vol'); volEl.value = masterVol; volEl.addEventListener('input', e => setMasterVol(parseInt(e.target.value,10)));

// 可见性：后台省电（停画/停钟 + 释放 Wake Lock），回前台恢复音频/画面/常亮（F-2 / F-5 / F-9）
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ scene.pause(); stopClock(); releaseWakeLock(); clearIdle(); }
  else {
    if (ctx && masterPlaying && ctx.state!=='running') attemptRecover();  // 覆盖 suspended / interrupted
    if (masterPlaying){ keepAlive(true); requestWakeLock(); scheduleImmersive(); }
    scene.resume(); startClock();
  }
});
window.addEventListener('pageshow', () => { if (ctx && masterPlaying && ctx.state!=='running') attemptRecover(); });

setMasterVol(masterVol); renderTabs(); renderChips(); renderMixer(); initTuner(); reflectPlay(); reflectState(); reflectFs();
initRestore();

// PWA：仅 http(s) 下注册 Service Worker（file:// 直开无需，见 README）
if ('serviceWorker' in navigator && location.protocol.startsWith('http')){
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}

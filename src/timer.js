// 睡眠定时（F-5）+ 床头时钟（防烧屏漂移 F-9）+ 入睡调光遮罩（F-9）。
import { $ } from './util.js';
import { layers, ctx, masterPlaying } from './state.js';
import { TIMERS } from './data.js';
import { t } from './i18n.js';
import { ensureCtx, setPlaying, rampMaster } from './engine.js';
import { startDrift, stopDrift } from './audio/drift.js';
import { nudge, reflectState } from './ui.js';

// ---------- 睡眠定时 ----------
let timerEnd=0, timerTick=null, timerFading=false;
export function cancelTimer(){ if (timerTick){ clearInterval(timerTick); timerTick=null; } timerEnd=0; timerFading=false; $('countdown').textContent=''; stopDim(); stopDrift(); }   // 一切取消路径都收束漂移（手动暂停/清空/到点/tap off）
export function setTimerChips(id){ document.querySelectorAll('#timers .tchip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.id===id))); }
function setTimer(mins, id){
  setTimerChips(id); cancelTimer(); if (!mins) return;
  if (layers.size===0){ nudge(); setTimerChips('off'); return; }
  if (!masterPlaying){ ensureCtx(); if (ctx.state==='suspended') ctx.resume(); setPlaying(true); reflectState(); }
  startDim(mins);                                    // 入睡调光：声音渐隐的视觉对应物（F-9）
  startDrift();                                       // 整夜生成式漂移：设定时即让混音开始缓慢潮汐（方向 A / A1）
  timerEnd = Date.now() + mins*60000;
  timerTick = setInterval(() => { const left = timerEnd - Date.now();
    if (left<=0){ cancelTimer(); setTimerChips('off'); setPlaying(false); reflectState(); return; }
    if (left<=20000 && masterPlaying && !timerFading){ timerFading=true; if (ctx) rampMaster(0, left/1000); }
    const s=Math.ceil(left/1000), m=Math.floor(s/60), ss=String(s%60).padStart(2,'0'); $('countdown').textContent = m+':'+ss;
  }, 250);
}
export function initTimers(){
  $('timers').innerHTML='';   // 可重复调用（语言切换时重建 off 档位文案）
  TIMERS.forEach(([id,label]) => { const b=document.createElement('button'); b.className='tchip'; b.dataset.id=id; b.setAttribute('aria-pressed', String(id==='off')); b.textContent = id==='off' ? t('timerOff') : label; b.addEventListener('click', () => setTimer(id==='off'?0:parseInt(id,10), id)); $('timers').appendChild(b); });
}

// ---------- 床头时钟（页面隐藏时停跳 F-5；秒针可切换 + 防烧屏漂移 F-9）----------
let clockTimer=0;
let showSec = localStorage.getItem('lull.showSec'); showSec = showSec===null ? true : showSec==='1';
function tickClock(){
  const d = new Date(), hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0'), ss = String(d.getSeconds()).padStart(2,'0');
  $('clock').innerHTML = hh+':'+mm + (showSec ? '<span class="sec">'+ss+'</span>' : '');
  const wd = t('weekday', d.getDay());
  $('datemeta').textContent = t('dateMeta', d.getMonth()+1, d.getDate(), wd);
  // 防烧屏：每分钟缓慢改变时钟位移，OLED 挂机 8h 无固定高对比常驻像素
  const mins = d.getHours()*60 + d.getMinutes();
  $('clock').style.transform = 'translate('+(Math.sin(mins*0.7)*7).toFixed(1)+'px,'+(Math.cos(mins*0.9)*5).toFixed(1)+'px)';
  clockTimer = setTimeout(tickClock, 1000 - (Date.now()%1000));
}
export function startClock(){ if (clockTimer) return; tickClock(); }
export function stopClock(){ if (clockTimer){ clearTimeout(clockTimer); clockTimer=0; } }
export function toggleSeconds(){ showSec=!showSec; localStorage.setItem('lull.showSec', showSec?'1':'0'); clearTimeout(clockTimer); clockTimer=0; tickClock(); }

// ---------- 入睡调光：定时器启动后画面/UI 亮度数分钟内渐降至约 30%（reduced-motion 直接到位）----------
function startDim(mins){
  const veil=$('dim-veil'), reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ramp=Math.min(mins*60*0.6, 240);
  veil.style.transition = reduce ? 'none' : ('opacity '+ramp+'s linear');
  void veil.offsetWidth; veil.style.opacity='0.7';
}
function stopDim(){ const veil=$('dim-veil'); veil.style.transition='opacity 1.6s ease'; void veil.offsetWidth; veil.style.opacity='0'; }

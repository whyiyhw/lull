// 锁屏存活（F-2）：Media Session 卡片 + 静音保活元素 + 中断自愈（D7）。
// 与 mediaSession 特性检测解耦——keepAlive 不因缺 mediaSession 而被跳过（D9）。
import { ctx, masterPlaying, layers } from './state.js';
import { ensureCtx, setPlaying } from './engine.js';
import { reflectState } from './ui.js';
import { cancelTimer, setTimerChips } from './timer.js';
import { matchStation } from './tuner.js';
import { POEMS, byId, stationLine } from './data.js';

let keepEl=null;
function silentWavUrl(){
  const rate=8000, len=rate, buf=new ArrayBuffer(44+len*2), v=new DataView(buf);
  const ws=(o,s)=>{ for(let i=0;i<s.length;i++) v.setUint8(o+i, s.charCodeAt(i)); };
  ws(0,'RIFF'); v.setUint32(4,36+len*2,true); ws(8,'WAVE'); ws(12,'fmt '); v.setUint32(16,16,true);
  v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,rate,true); v.setUint32(28,rate*2,true);
  v.setUint16(32,2,true); v.setUint16(34,16,true); ws(36,'data'); v.setUint32(40,len*2,true);
  return URL.createObjectURL(new Blob([buf],{type:'audio/wav'}));
}
export function setupKeepAlive(){
  if (keepEl) return;
  try{
    keepEl=new Audio(silentWavUrl()); keepEl.loop=true; keepEl.preload='auto'; keepEl.setAttribute('playsinline',''); keepEl.volume=1;
    keepEl.addEventListener('pause', () => { if (masterPlaying) attemptRecover(); });   // 中断暂停了保活元素 → 自愈（D7）
  }catch(e){ keepEl=null; }
}
export function keepAlive(on){ if (!keepEl) return; if (on){ const p=keepEl.play(); if (p&&p.catch) p.catch(()=>{}); } else { try{ keepEl.pause(); }catch(e){} } }
// ---- 系统中断自动恢复（F-2 / D7）：无需解锁亮屏，中断结束后 ≤5s 自动重拉播放 ----
let recoverT=0;
export function attemptRecover(){
  clearTimeout(recoverT);
  if (!masterPlaying || !ctx) return;
  if (ctx.state !== 'running'){ const p=ctx.resume(); if (p&&p.catch) p.catch(()=>{}); }
  keepAlive(true);
  if (ctx.state === 'running') return;                 // 已恢复
  recoverT = setTimeout(attemptRecover, 1500);         // 中断仍在 → 每 1.5s 重试（累计 ≤5s 内恢复）
}
export function setupMediaSession(){
  if (!('mediaSession' in navigator)) return;
  try{
    navigator.mediaSession.setActionHandler('play', ()=>{ if (layers.size){ ensureCtx(); if (ctx.state==='suspended') ctx.resume(); setPlaying(true); reflectState(); } });
    navigator.mediaSession.setActionHandler('pause', ()=>{ setPlaying(false); cancelTimer(); setTimerChips('off'); reflectState(); });   // 锁屏暂停同样取消定时（D11②）
    navigator.mediaSession.setActionHandler('stop', ()=>{ setPlaying(false); cancelTimer(); setTimerChips('off'); reflectState(); });
  }catch(e){}
}
export function updateMediaSession(){
  if (!('mediaSession' in navigator)) return;
  try{
    navigator.mediaSession.playbackState = masterPlaying?'playing':'paused';
    const ids=[...layers.keys()], st=matchStation();
    const title = ids.length===0 ? 'Lull · 声音电台'
                : st ? (st.name+' · '+stationLine(st))
                : ids.length===1 ? (POEMS[ids[0]]||byId(ids[0]).name)
                : ids.map(i=>byId(i).name).join(' · ');
    navigator.mediaSession.metadata = new MediaMetadata({
      title, artist:'Lull · 声音电台', album:'Atmospheres',
      artwork:[{src:'icons/icon-192.png',sizes:'192x192',type:'image/png'},{src:'icons/icon-512.png',sizes:'512x512',type:'image/png'}]
    });
  }catch(e){}
}

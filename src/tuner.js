// 调频拨盘（F-4）：FM 87.5–108 的复古拨盘、内置/自定义频道、扫台嘶声、吸附与键盘可达。
import { ctx, buffers, masterVol, layers } from './state.js';
import { $ } from './util.js';
import { BUILTIN_PRESETS } from './data.js';
import { t } from './i18n.js';
import { loadMix, ensureCtx, currentMix } from './engine.js';
import { toast } from './ui.js';

function customPresets(){ try{ return JSON.parse(localStorage.getItem('lull.presets')||'[]'); }catch(e){ return []; } }
function saveCustomPresets(a){ localStorage.setItem('lull.presets', JSON.stringify(a)); }

const FMIN=87.5, FMAX=108.0, SNAP=0.6;
let curFm=88.1, dragging=false;
function defaultCustomFm(cs, i){ const lo=102.0, hi=107.5; return cs.length<=1 ? 104.6 : +(lo+(hi-lo)*i/(cs.length-1)).toFixed(1); }
export function stations(){
  const cs=customPresets();
  const cfm=cs.map((p,i)=>({ ...p, custom:true, fm: (typeof p.fm==='number') ? p.fm : defaultCustomFm(cs,i) }));
  return BUILTIN_PRESETS.map(p=>({ ...p, custom:false })).concat(cfm);
}
function setCustomFm(id, fm){ saveCustomPresets(customPresets().map(p=> p.id===id ? { ...p, fm:+(+fm).toFixed(1) } : p)); }
const fmToPct = fm => (fm-FMIN)/(FMAX-FMIN)*100;
const pctToFm = pct => FMIN + (pct/100)*(FMAX-FMIN);
function nearestStation(fm){ let best=null, bd=1e9; stations().forEach(s=>{ const d=Math.abs(s.fm-fm); if (d<bd){ bd=d; best=s; } }); return { s:best, d:bd }; }
function currentSig(){ return [...layers.keys()].sort().join(','); }
export function matchStation(){ const sig=currentSig(); if (!sig) return null; return stations().find(s=> Object.keys(s.mix).sort().join(',')===sig ) || null; }

// 调台白噪嘶声：独立于 master（静默也可听），随总音量缩放；靠近频道时压低
let tuneNoise=null;
function ensureTuneNoise(){
  if (tuneNoise || !ctx) return;
  const src=ctx.createBufferSource(); src.buffer=buffers.white; src.loop=true;
  const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=1400;
  const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=7200;
  const g=ctx.createGain(); g.gain.value=0.0001;
  src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(ctx.destination);
  src.start(); tuneNoise={ g };
}
function tuneNoiseLevel(v){
  if (!tuneNoise || !ctx) return;
  const now=ctx.currentTime, target=Math.max(0.0001, v*0.05*(0.35+0.65*masterVol/100));
  tuneNoise.g.gain.cancelScheduledValues(now);
  tuneNoise.g.gain.setValueAtTime(Math.max(tuneNoise.g.gain.value,0.0001), now);
  tuneNoise.g.gain.linearRampToValueAtTime(target, now+0.09);
}

function renderScale(){
  const sc=$('dial-scale'); sc.innerHTML='';
  for (let f=Math.ceil(FMIN*2)/2; f<=FMAX+0.001; f+=0.5){
    const major=Math.abs(f-Math.round(f))<0.01;
    const t=document.createElement('span'); t.className='tick'+(major?' major':''); t.style.left=fmToPct(f)+'%'; sc.appendChild(t);
    if (major && Math.round(f)%2===0){ const n=document.createElement('span'); n.className='tnum'; n.style.left=fmToPct(f)+'%'; n.textContent=Math.round(f); sc.appendChild(n); }
  }
}
function renderDial(){
  const box=$('dial-stations'); box.innerHTML='';
  // 按频率排序后相邻上下错行（.alt）：英文/长频道名在窄屏不再横向重合
  stations().slice().sort((a,b)=>a.fm-b.fm).forEach((s,i)=>{
    const b=document.createElement('button'); b.className='stn'+(s.custom?' custom':'')+(i%2?' alt':''); b.style.left=fmToPct(s.fm)+'%';
    b.textContent=s.name; b.dataset.id=s.id; b.title=s.name+' · '+s.fm.toFixed(1)+(s.custom?t('stationDragTitle'):' MHz');
    if (s.custom) wireStationDrag(b, s);
    else b.addEventListener('click', e=>{ e.stopPropagation(); tuneTo(s, true); toast(t('tunedTo', s.name, s.fm.toFixed(1))); });
    box.appendChild(b);
  });
  reflectTuner();
}
function wireStationDrag(b, s){
  let sd=null, lpT=0;
  const clearLp=()=>{ if (lpT){ clearTimeout(lpT); lpT=0; } };
  b.addEventListener('pointerdown', e=>{ e.stopPropagation(); e.preventDefault(); try{ b.setPointerCapture(e.pointerId); }catch(_){} sd={ startX:e.clientX, moved:false, fm:s.fm }; b.classList.add('dragging');
    clearLp(); lpT=setTimeout(()=>{ if (sd && !sd.moved){ sd=null; clearLp(); b.classList.remove('dragging'); deleteStation(s); } }, 560);   // 长按删除
  });
  b.addEventListener('pointermove', e=>{
    if (!sd) return;
    if (Math.abs(e.clientX-sd.startX)>4){ sd.moved=true; clearLp(); }
    if (!sd.moved) return;
    const r=$('dial-inner').getBoundingClientRect(), x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
    const fm=Math.max(FMIN+0.4, Math.min(FMAX-0.4, pctToFm(x*100)));
    sd.fm=fm; b.style.left=fmToPct(fm)+'%'; b.title=s.name+' · '+fm.toFixed(1)+t('stationDragTitle');
    if (b.classList.contains('lit')) setNeedle(fm, false);
  });
  const end=()=>{ clearLp(); if (!sd) return; const { moved, fm }=sd; sd=null; b.classList.remove('dragging');
    if (moved){ setCustomFm(s.id, fm); renderDial(); toast(t('movedTo', s.name, fm.toFixed(1))); }
    else { tuneTo(s, true); toast(t('tunedLongPress', s.name)); } };
  b.addEventListener('pointerup', end);
  b.addEventListener('pointercancel', ()=>{ clearLp(); if (sd){ sd=null; b.classList.remove('dragging'); renderDial(); } });
}
function deleteStation(s){ if (!s) return; saveCustomPresets(customPresets().filter(q=>q.id!==s.id)); renderDial(); toast(t('stationDeleted', s.name)); }
function setNeedle(fm, animate){
  curFm=fm; const dial=$('dial'); dial.classList.toggle('anim', !!animate);
  $('needle').style.left=fmToPct(fm)+'%';
  $('freq').textContent=fm.toFixed(1);
  dial.setAttribute('aria-valuenow', fm.toFixed(1));
}
export function tuneTo(s, animate){
  if (!s) return;
  setNeedle(s.fm, animate);
  $('station-now').textContent=s.name; $('dial').setAttribute('aria-valuetext', s.name);
  document.body.classList.remove('tuning');
  document.querySelectorAll('#dial-stations .stn').forEach(b=> b.classList.remove('near'));
  loadMix(s.mix, true);            // loadMix 末尾会调用 reflectTuner()
}
export function reflectTuner(){
  const dial=$('dial'), m=matchStation();
  document.querySelectorAll('#dial-stations .stn').forEach(b=> b.classList.toggle('lit', !!m && b.dataset.id===m.id));
  $('station-now').classList.toggle('cur', !!m);   // 色彩角色：暖=当前频道（station-now 转暖）
  const qs=$('quickstart'); if (qs) qs.hidden = layers.size>0;   // 一键起始仅空状态显示
  $('del-station').hidden = !(m && m.custom);
  if (m){ setNeedle(m.fm, true); $('station-now').textContent=m.name; dial.setAttribute('aria-valuetext', m.name); dial.classList.remove('manual'); }
  else if (layers.size===0){ setNeedle(FMIN, true); $('freq').textContent='— —'; $('station-now').textContent=t('silentUntuned'); dial.setAttribute('aria-valuetext',t('untuned')); dial.classList.remove('manual'); }
  else { $('station-now').textContent=t('manualTune'); dial.setAttribute('aria-valuetext',t('manualTune')); dial.classList.add('manual'); }
}
function delActiveStation(){ const m=matchStation(); if (m && m.custom) deleteStation(m); }
export function relocalizeTuner(){ renderDial(); renderQuickstart(); }   // 语言切换：重建频道按钮文案 + reflectTuner

// 一键起始：空状态推荐 4 个频道（雨·林·暖·眠四种意图），点一下即载入并播放；拨盘退为「探索」。
const QUICKSTART = ['rainynight', 'morningforest', 'fireside', 'sleeprain'];
export function renderQuickstart(){
  const row=$('qs-row'); if (!row) return; row.innerHTML='';
  QUICKSTART.forEach(id=>{ const st=BUILTIN_PRESETS.find(p=>p.id===id); if (!st) return;
    const b=document.createElement('button'); b.className='qs-btn'; b.textContent=st.name;
    b.addEventListener('click', ()=>{ ensureCtx(); if (ctx.state==='suspended') ctx.resume(); tuneTo(st, true); });
    row.appendChild(b);
  });
}

function dialPointerFm(e){ const r=$('dial-inner').getBoundingClientRect(); const x=(e.clientX-r.left)/r.width; return pctToFm(Math.max(0,Math.min(1,x))*100); }
function dialDrag(e){
  const fm=dialPointerFm(e); setNeedle(fm, false);
  const { s, d }=nearestStation(fm), near = s && d<SNAP;
  $('station-now').textContent = near ? ('» '+s.name) : t('tuningAt', fm.toFixed(1));
  document.querySelectorAll('#dial-stations .stn').forEach(b=> b.classList.toggle('near', near && b.dataset.id===s.id));
  tuneNoiseLevel(Math.max(0.1, Math.min(1, d/SNAP)));   // 越靠近频道 → 嘶声越低
}
function dialStepStation(dir){
  const list=stations(); if (!list.length) return;
  let idx=list.findIndex(s=> Math.abs(s.fm-curFm)<0.35);
  if (idx<0) idx = dir>0 ? -1 : list.length;
  idx=Math.max(0, Math.min(list.length-1, idx+dir));
  tuneTo(list[idx], true);
}
export function initTuner(){
  const dial=$('dial');
  dial.addEventListener('pointerdown', e=>{ if (e.target.closest('.stn')) return; dragging=true; try{ dial.setPointerCapture(e.pointerId); }catch(_){} ensureCtx(); if (ctx.state==='suspended') ctx.resume(); ensureTuneNoise(); document.body.classList.add('tuning'); dial.classList.remove('anim'); dialDrag(e); });
  dial.addEventListener('pointermove', e=>{ if (dragging) dialDrag(e); });
  const endDrag=()=>{ if (!dragging) return; dragging=false; document.body.classList.remove('tuning'); tuneNoiseLevel(0); const { s }=nearestStation(curFm); if (s) tuneTo(s, true); };
  dial.addEventListener('pointerup', endDrag);
  dial.addEventListener('pointercancel', ()=>{ dragging=false; document.body.classList.remove('tuning'); tuneNoiseLevel(0); reflectTuner(); });
  dial.addEventListener('keydown', e=>{
    if (e.key==='ArrowRight'||e.key==='ArrowUp'){ dialStepStation(1); e.preventDefault(); }
    else if (e.key==='ArrowLeft'||e.key==='ArrowDown'){ dialStepStation(-1); e.preventDefault(); }
    else if (e.key==='Home'){ const l=stations(); if (l[0]) tuneTo(l[0], true); e.preventDefault(); }
    else if (e.key==='End'){ const l=stations(); if (l.length) tuneTo(l[l.length-1], true); e.preventDefault(); }
  });
  $('del-station').addEventListener('click', delActiveStation);
  renderScale(); renderDial(); renderQuickstart();
}
export function saveCurrentAsPreset(){
  const mix=currentMix(); if (!Object.keys(mix).length){ toast(t('pickSomeFirst')); return; }
  const arr=customPresets(); if (arr.length>=8){ toast(t('stationsFull')); return; }
  const def=t('stationDefaultName', arr.length+1); let name=def;
  try{ const r=prompt(t('namePrompt'), def); if (r===null) return; name=(r||def).trim().slice(0,10)||def; }catch(e){}
  const nfm=+Math.min(107.5, 102.4 + arr.length*1.2).toFixed(1);
  arr.push({ id:'c'+Date.now(), name, mix, fm:nfm }); saveCustomPresets(arr); renderDial(); toast(t('savedAs', name, nfm.toFixed(1)));
}

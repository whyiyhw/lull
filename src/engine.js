// 音频引擎：Web Audio 图、层的构建/拆除、播放控制（含 D8 停播熄火）、混音持久化/分享。
import {
  ctx, setCtx, master, setMaster, reverb, setReverb, reverbBus, setReverbBus,
  buffers, layers, AUDIO_BASE, masterPlaying, setMasterPlaying,
  setMasterVolState, soundVol, volOf, masterTarget, layerTarget,
} from './state.js';
import { $, rand } from './util.js';
import { byId, currentRainSurface } from './data.js';
import { t } from './i18n.js';
import { scene } from './scene.js';
import { wireSynthEvents, wireSceneEmitters, buildBowl } from './synth.js';
import { setupKeepAlive, setupMediaSession, keepAlive, attemptRecover, updateMediaSession } from './lockscreen.js';
import { reflectChips, renderMixer, reflectState, reflectPlay, nudge, toast } from './ui.js';
import { reflectTuner } from './tuner.js';
import { cancelTimer, setTimerChips } from './timer.js';
import { reflectImmersive } from './immersive.js';
import { freezeDrift, wakeDrift } from './audio/drift.js';

function makeNoise(type){
  const len = Math.floor(ctx.sampleRate * 4);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
  if (type==='white'){ for (let i=0;i<len;i++) d[i]=rand()*2-1; }
  else if (type==='pink'){ let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i=0;i<len;i++){ const w=rand()*2-1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.96900*b2+w*0.1538520;
      b3=0.86650*b3+w*0.3104856; b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
      d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926; } }
  else { let last=0; for (let i=0;i<len;i++){ const w=rand()*2-1; last=(last+0.02*w)/1.02; d[i]=last*3.5; } }
  return buf;
}
function makeImpulse(dur, decay){
  const rate=ctx.sampleRate, len=Math.floor(rate*dur), buf=ctx.createBuffer(2,len,rate);
  for (let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch);
    for (let i=0;i<len;i++) d[i]=(rand()*2-1)*Math.pow(1-i/len, decay); }
  return buf;
}
export function ensureCtx(){
  if (ctx) return;
  setCtx(new (window.AudioContext || window.webkitAudioContext)());
  setMaster(ctx.createGain()); master.gain.value = 0;
  master.connect(ctx.destination);
  setReverb(ctx.createConvolver()); reverb.buffer = makeImpulse(2.4, 2.6);
  const wet = ctx.createGain(); wet.gain.value = 0.9;
  setReverbBus(ctx.createGain()); reverbBus.gain.value = 1;
  reverbBus.connect(reverb); reverb.connect(wet); wet.connect(master);
  ['white','pink','brown'].forEach(t => buffers[t] = makeNoise(t));
  setupKeepAlive();
  setupMediaSession();
  ctx.onstatechange = () => {
    // 来电/闹钟/Siri 等中断会把 ctx 置为 interrupted/suspended；仅在「应当播放」时自愈（D7），
    // 不与 D8 的主动挂起（masterPlaying=false）冲突。
    if (masterPlaying && ctx.state !== 'running' && ctx.state !== 'closed') attemptRecover();
  };
}

// ---- 文件音频缓冲（fetch + decodeAudioData，进入同一 Web Audio 图；失败回退合成）----
const fileBuffers = {};      // id -> AudioBuffer
const fileState = {};        // id -> 'ok' | 'fail'
const filePromises = {};     // id -> Promise（去重并发加载）
let fallbackNoticed = false;
function loadFileBuffer(cfg){
  if (fileBuffers[cfg.id]) return Promise.resolve(fileBuffers[cfg.id]);
  if (fileState[cfg.id]==='fail') return Promise.resolve(null);
  if (filePromises[cfg.id]) return filePromises[cfg.id];
  filePromises[cfg.id] = (async () => {
    try {
      const resp = await fetch(AUDIO_BASE + cfg.file, { cache:'force-cache' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const arr = await resp.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      fileBuffers[cfg.id] = buf; fileState[cfg.id] = 'ok';
      return buf;
    } catch (e) {
      fileState[cfg.id] = 'fail';
      return null;               // file:// 或缺文件 → 回退合成
    } finally { delete filePromises[cfg.id]; }
  })();
  return filePromises[cfg.id];
}
function notifyFallback(){
  if (fallbackNoticed) return; fallbackNoticed = true;
  toast(t('fallbackNotice'));
}

function buildLayer(cfg){
  const layer = { id:cfg.id, cfg, active:true, extra:[], filters:[] };
  const gain = ctx.createGain(); gain.gain.value = 0; layer.gain = gain;
  gain.connect(master);
  if (cfg.reverb){ const sg=ctx.createGain(); sg.gain.value=cfg.reverb; gain.connect(sg); sg.connect(reverbBus); layer.extra.push(sg); }
  if (cfg.file){
    loadFileBuffer(cfg).then(buf => {
      if (!layer.active) return;                     // 加载期间已被移除
      // 录音层的事件只驱动画面（雷/鸟视觉），合成回退层才有声音事件调度器；两者都存进 wireEvents 以便暂停后重启（D8）
      if (buf){ wireBufferSource(layer, buf); layer.wireEvents = () => wireSceneEmitters(layer, cfg); }
      else { wireSynth(layer, cfg); layer.wireEvents = () => wireSynthEvents(layer, cfg); notifyFallback(); }
      if (masterPlaying) layer.wireEvents();         // D8：仅播放态才启动调度器；暂停态待 wakeSchedulers 唤醒
      fadeInLayer(layer);
    });
  } else {
    wireSynth(layer, cfg); layer.wireEvents = () => wireSynthEvents(layer, cfg);
    if (masterPlaying) layer.wireEvents();
    fadeInLayer(layer);
  }
  return layer;
}
function fadeInLayer(layer){
  const now = ctx.currentTime;
  layer.gain.gain.cancelScheduledValues(now);
  layer.gain.gain.setValueAtTime(0.0001, now);
  layer.gain.gain.linearRampToValueAtTime(layerTarget(layer.id), now + 0.8);
}
function wireBufferSource(layer, buf){
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; layer.src = src;
  src.connect(layer.gain); src.start();       // 录音保持原声，仅走 gain + 混响总线
}
function wireSynth(layer, cfg){
  const gain = layer.gain;
  if (cfg.base){
    const src = ctx.createBufferSource(); src.buffer = buffers[cfg.base]; src.loop = true; layer.src = src;
    let node = src;
    (cfg.filters||[]).forEach(f => { const bf=ctx.createBiquadFilter(); bf.type=f.type; bf.frequency.value=f.freq; bf.Q.value=f.q; node.connect(bf); node=bf; layer.filters.push(bf); });
    if (cfg.surface){ const sf=ctx.createBiquadFilter(); const s=currentRainSurface(); sf.type=s.type; sf.frequency.value=s.freq; sf.Q.value=s.q; node.connect(sf); node=sf; layer.surfaceFilter=sf; layer.extra.push(sf); }   // 雨的质地：可实时改变的末级滤波
    if (cfg.lfo){ const lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=cfg.lfo.rate; const lg=ctx.createGain();
      if (cfg.lfo.target==='gain'){ const sw=ctx.createGain(); sw.gain.value=1-cfg.lfo.depth; lg.gain.value=cfg.lfo.depth; lfo.connect(lg); lg.connect(sw.gain); node.connect(sw); node=sw; layer.extra.push(sw); }
      else { lg.gain.value=cfg.lfo.depth; lfo.connect(lg); lg.connect(layer.filters[0].frequency); }
      lfo.start(); layer.lfo=lfo; layer.extra.push(lg); }
    node.connect(gain);
    if (cfg.tone){ const t=ctx.createOscillator(); t.type=cfg.tone.type; t.frequency.value=cfg.tone.freq; const tg=ctx.createGain(); tg.gain.value=cfg.tone.gain; t.connect(tg); tg.connect(gain); t.start(); layer.tone=t; layer.extra.push(tg); }
    src.start();
  }
  if (cfg.bowl) buildBowl(layer, cfg.bowl);
}
function stopTimers(layer){ ['thunderTimer','birdTimer','insectTimer','crackleTimer','clinkTimer','clackTimer','tickTimer','pageTimer','strikeTimer','sceneTimer'].forEach(k => { if (layer[k]) clearTimeout(layer[k]); }); }
function teardownLayer(layer){
  [layer.src, layer.lfo, layer.tone].forEach(n => { if (n){ try{ n.stop(); }catch(e){} } });
  if (layer.src) try{ layer.src.disconnect(); }catch(e){}
  layer.filters.forEach(f => { try{ f.disconnect(); }catch(e){} });
  layer.extra.forEach(n => { try{ n.disconnect(); }catch(e){} });
  if (layer.lfo) try{ layer.lfo.disconnect(); }catch(e){}
  if (layer.tone) try{ layer.tone.disconnect(); }catch(e){}
  if (layer.partials) layer.partials.forEach(o => { try{ o.stop(); }catch(e){} try{ o.disconnect(); }catch(e){} });
  if (layer.partialSum) try{ layer.partialSum.disconnect(); }catch(e){}
  try{ layer.gain.disconnect(); }catch(e){}
}

export function applyRainSurface(){ if (!ctx) return; const s=currentRainSurface(); layers.forEach((l,id)=>{ const c=byId(id); if (c && c.surface && l.surfaceFilter){ const f=l.surfaceFilter, now=ctx.currentTime; f.type=s.type; f.frequency.setTargetAtTime(s.freq, now, 0.08); f.Q.setTargetAtTime(s.q, now, 0.08); } }); }

function rampMaster_(to, dt){ const now=ctx.currentTime; master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(Math.max(master.gain.value,0.0001), now); master.gain.linearRampToValueAtTime(to, now+dt); }
export { rampMaster_ as rampMaster };
let suspendT=0;
export function setPlaying(on){
  setMasterPlaying(on);
  if (ctx){
    if (on){
      clearTimeout(suspendT);
      if (ctx.state !== 'running'){ const p=ctx.resume(); if (p&&p.catch) p.catch(()=>{}); }
      rampMaster_(masterTarget(), 0.4);
      wakeSchedulers();                            // D8：恢复播放 → 重启事件调度器
    } else {
      rampMaster_(0, 0.4);
      freezeSchedulers();                          // D8：暂停即冻结事件调度器，timer 不再自我重排空转
      clearTimeout(suspendT);
      suspendT = setTimeout(suspendEngine, 900);   // 渐隐结束后挂起音频图，引擎熄火（D8）
    }
  }
  keepAlive(on);                                   // 保活与 mediaSession 特性检测解耦（D9）
  reflectPlay();
  updateMediaSession();
  reflectImmersive();                              // 播放态变化 → Wake Lock / 沉浸态（F-9）
}
function suspendEngine(){                           // D8：停播/定时结束后不空转，CPU/电耗回落空载
  if (masterPlaying || !ctx) return;
  if (ctx.state === 'running'){ const p=ctx.suspend(); if (p&&p.catch) p.catch(()=>{}); }
}
// D8：停播时冻结所有层的事件调度器（否则各 schedule* 的 setTimeout 链整夜自我重排、空转烧电）；恢复时按原样重启。
function freezeSchedulers(){ layers.forEach(l => stopTimers(l)); freezeDrift(); }          // 漂移调度器与事件调度器一同冻结（A4）
function wakeSchedulers(){ layers.forEach(l => { if (l.active && l.wireEvents){ stopTimers(l); l.wireEvents(); } }); wakeDrift(); }   // 一同续航（A4）

function removeLayer(id, fade){
  const layer = layers.get(id); if (!layer) return;
  layer.active = false; stopTimers(layer);
  if (layer.gain && ctx){ const now = ctx.currentTime; layer.gain.gain.cancelScheduledValues(now); layer.gain.gain.setValueAtTime(Math.max(layer.gain.gain.value,0.0001), now); layer.gain.gain.linearRampToValueAtTime(0.0001, now + (fade?0.6:0.14)); }
  setTimeout(() => teardownLayer(layer), fade?700:180);
  layers.delete(id);
}
export function toggleSound(id){
  ensureCtx(); if (ctx.state==='suspended') ctx.resume();
  if (layers.has(id)) removeLayer(id, true);
  else { layers.set(id, buildLayer(byId(id))); scene.bloom(byId(id).color); if (!masterPlaying) setPlaying(true); }   // 点选微光：画面在该声音的颜色里晕开
  reflectChips(); renderMixer(); reflectState(); persistMix(); updateMediaSession(); reflectTuner();
}
export function toggleMaster(){
  if (layers.size===0){ if (pendingMix){ const m=pendingMix; pendingMix=null; loadMix(m, true); return; } nudge(); return; }
  ensureCtx();
  if (masterPlaying){ setPlaying(false); cancelTimer(); setTimerChips('off'); }   // 手动暂停 → 一并取消睡眠定时 + 入睡调光（D11②）
  else { if (ctx.state==='suspended') ctx.resume(); setPlaying(true); }
  reflectState();
}
export function clearAll(){ [...layers.keys()].forEach(id => removeLayer(id, false)); setPlaying(false); reflectChips(); renderMixer(); reflectState(); cancelTimer(); setTimerChips('off'); persistMix(); updateMediaSession(); reflectTuner(); }
export function setLayerVol(id, v){ soundVol[id]=v/100; localStorage.setItem('lull.svol', JSON.stringify(soundVol)); const l=layers.get(id); if (l && l.gain && ctx){ const now=ctx.currentTime; l.gain.gain.cancelScheduledValues(now); l.gain.gain.setValueAtTime(Math.max(l.gain.gain.value,0.0001), now); l.gain.gain.linearRampToValueAtTime(layerTarget(id), now+0.12); } persistMixSoon(); }
export function setMasterVol(v){ setMasterVolState(v); localStorage.setItem('lull.mvol', String(v)); $('vol-val').textContent=v; $('vol').style.setProperty('--fill', v+'%'); if (masterPlaying && ctx) rampMaster_(masterTarget(), 0.15); }

// ---------- 混音持久化 · 会话恢复 · URL 分享（F-5 / F-8）----------
export function currentMix(){ const m={}; layers.forEach((l,id)=>{ m[id]=Math.round(volOf(id)*100); }); return m; }
function mixToHash(mix){ return Object.keys(mix).map(id=>id+'='+mix[id]).join('&'); }
let pendingMix=null, persistT=0;
function persistMix(){
  const ids=[...layers.keys()];
  localStorage.setItem('lull.mix', JSON.stringify(ids));
  const hash = mixToHash(currentMix());
  try{ history.replaceState(null,'', hash ? '#'+hash : location.pathname+location.search); }catch(e){}
  $('save-preset').hidden = ids.length===0;
  reflectResume();
}
function persistMixSoon(){ clearTimeout(persistT); persistT=setTimeout(persistMix, 320); }
function parseMixHash(){
  const h=location.hash.replace(/^#/,''); if (!h) return null;
  const mix={}; h.split('&').forEach(p=>{ const [k,v]=p.split('='); if (byId(k)){ const n=parseInt(v,10); mix[k]=isNaN(n)?60:Math.max(0,Math.min(100,n)); } });
  return Object.keys(mix).length ? mix : null;
}
export function loadMix(mix, play){
  ensureCtx(); if (ctx.state==='suspended') ctx.resume();
  const ids=Object.keys(mix);
  [...layers.keys()].forEach(id=>{ if (!(id in mix)) removeLayer(id, true); });
  ids.forEach(id=>{ soundVol[id]=(mix[id]|0)/100; });
  localStorage.setItem('lull.svol', JSON.stringify(soundVol));
  ids.forEach(id=>{ if (layers.has(id)) setLayerVol(id, mix[id]); else layers.set(id, buildLayer(byId(id))); });
  if (play){ if (!masterPlaying) setPlaying(true); else if (ctx) rampMaster_(masterTarget(), 0.3); }
  reflectChips(); renderMixer(); reflectState(); persistMix(); updateMediaSession(); reflectTuner();
}
export function reflectResume(){
  const btn=$('resume');
  if (pendingMix && layers.size===0){
    const names=Object.keys(pendingMix).map(id=>byId(id)&&byId(id).name).filter(Boolean).slice(0,4).join(' · ');
    btn.textContent=t('resumePrefix', names); btn.hidden=false;
  } else btn.hidden=true;
}
export function initRestore(){
  pendingMix = parseMixHash();
  if (!pendingMix){
    try{ const ids=JSON.parse(localStorage.getItem('lull.mix')||'[]'); if (ids.length){ const m={}; ids.forEach(id=>{ if (byId(id)) m[id]=Math.round(volOf(id)*100); }); if (Object.keys(m).length) pendingMix=m; } }catch(e){}
  }
  reflectResume();
}
// 供「继续上次」按钮调用（pendingMix 是本模块私有态）
export function resumeLast(){ if (pendingMix){ const m=pendingMix; pendingMix=null; loadMix(m, true); } }
export function shareMix(){
  const mix=currentMix(); if (!Object.keys(mix).length){ toast(t('pickSomeToShare')); return; }
  const url=location.origin+location.pathname+'#'+mixToHash(mix);
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(()=>toast(t('linkCopied')), ()=>toast(t('copyFail')));
  else toast(t('shareHint'));
}

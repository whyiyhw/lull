// UI 渲染：toast、播放/状态反映、混音台、声音格子 + 分类页签、细分子选择器。
import { $ } from './util.js';
import { CATS, SOUNDS, byId, POEMS, VARIANT_PICKERS, variantGet, variantSet, stationLine } from './data.js';
import { L, t } from './i18n.js';
import { layers, masterPlaying, volOf } from './state.js';
import { toggleSound, setLayerVol, applyRainSurface } from './engine.js';
import { matchStation } from './tuner.js';

// ---------- toast ----------
let toastT=0;
export function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'), 2600); }

// ---------- 状态反映 ----------
let flashT=0;
function flashState(msg){ $('mixline').textContent = msg; clearTimeout(flashT); flashT = setTimeout(reflectState, 1800); }
export function nudge(){ const b=$('play'); b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge'); flashState(t('pickSoundFirst')); }

export function reflectPlay(){
  const btn = $('play'); btn.classList.toggle('playing', masterPlaying);
  document.body.classList.toggle('is-playing', masterPlaying);   // 色彩角色：暖=正在播放（now 文案微暖）
  btn.setAttribute('aria-pressed', String(masterPlaying)); btn.setAttribute('aria-label', masterPlaying?t('pause'):t('play'));
  $('play-ico').innerHTML = masterPlaying
    ? '<rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/>'
    : '<path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z"/>';
}
export function reflectState(){
  const n = layers.size, ids = [...layers.keys()];
  $('now').innerHTML = n===0 ? t('silent') : (masterPlaying?'PLAYING · ':'PAUSED · ') + t('nowLayers', n);
  if (n===0){ $('mixline').textContent = t('mixDefault'); return; }
  const st = matchStation();
  if (st){ $('mixline').textContent = stationLine(st); return; }
  if (n===1){ $('mixline').textContent = L(POEMS[ids[0]]) || byId(ids[0]).name; return; }
  $('mixline').textContent = ids.map(i=>byId(i).name).join(' · ');
}
export function reflectChips(){ document.querySelectorAll('#sounds .cell').forEach(c => { const on = layers.has(c.dataset.id); c.setAttribute('aria-pressed', String(on)); c.style.background = on ? byId(c.dataset.id).color : ''; }); }

export function renderMixer(){
  const box = $('mixer'), wrap = $('mixer-wrap'); box.innerHTML='';
  wrap.classList.toggle('empty-hide', layers.size===0);
  if (layers.size===0) return;
  layers.forEach((layer, id) => {
    const s = byId(id);
    const row = document.createElement('div'); row.className='layer';
    const sw = document.createElement('span'); sw.className='swatch'; sw.style.background = s.color;
    const nm = document.createElement('span'); nm.className='nm'; nm.textContent = s.name;
    const sl = document.createElement('input'); sl.type='range'; sl.min=0; sl.max=100;
    const v = Math.round(volOf(id)*100); sl.value=v; sl.style.setProperty('--fill', v+'%'); sl.setAttribute('aria-label', t('volSuffix', s.name));
    sl.addEventListener('input', e => { const val=parseInt(e.target.value,10); e.target.style.setProperty('--fill', val+'%'); setLayerVol(id, val); });
    const rm = document.createElement('button'); rm.className='rm'; rm.setAttribute('aria-label', t('removeSuffix', s.name));
    rm.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    rm.addEventListener('click', () => toggleSound(id));
    row.append(sw, nm, sl, rm); box.appendChild(row);
  });
}

// ---------- 分类页签 + 声音格子 ----------
let activeCat = CATS[0].id;
export function buildTabs(){
  const tabsEl = $('tabs'); tabsEl.innerHTML='';   // 可重复调用（语言切换时重建页签文案）
  CATS.forEach(c => { const t=document.createElement('button'); t.className='tab'; t.setAttribute('role','tab'); t.dataset.cat=c.id; t.textContent=c.name; t.setAttribute('aria-selected', String(c.id===activeCat)); t.addEventListener('click', () => { activeCat=c.id; renderTabs(); renderChips(); }); tabsEl.appendChild(t); });
}
export function renderTabs(){ document.querySelectorAll('#tabs .tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.cat===activeCat))); }
export function renderChips(){
  const box = $('sounds'); box.innerHTML='';
  SOUNDS.filter(s => s.cat===activeCat).forEach(s => {
    const b=document.createElement('button'); b.className='cell'; b.dataset.id=s.id;
    const on = layers.has(s.id); b.setAttribute('aria-pressed', String(on)); if (on) b.style.background = s.color;
    b.innerHTML = '<span class="dot" style="color:'+s.color+'"></span>'+s.name;
    b.addEventListener('click', () => toggleSound(s.id)); box.appendChild(b);
  });
  // 该分类下挂载的所有「子选择器」（鸟种/虫种/篝火性格/咖啡细节/雨的质地）
  VARIANT_PICKERS.filter(p => p.cat===activeCat).forEach(p => box.appendChild(buildVariantPicker(p)));
}
function buildVariantPicker(p){
  const wrap=document.createElement('div'); wrap.className='bird-picker';
  const head=document.createElement('div'); head.className='bird-picker-head';
  head.innerHTML='<span class="dot" style="color:'+p.dot+'"></span>'+p.label;
  const row=document.createElement('div'); row.className='bird-chips'; row.setAttribute('role','group'); row.setAttribute('aria-label',p.label);
  const cur=variantGet(p); const on=id=> p.mode==='single' ? cur===id : cur.includes(id);
  p.members.forEach(m=>{
    const b=document.createElement('button'); b.type='button'; b.className='bird-chip'; b.dataset.pk=p.key; b.dataset.m=m.id;
    b.setAttribute('aria-pressed', String(on(m.id))); if (m.desc) b.title=m.desc;
    b.innerHTML='<span class="bd" style="background:'+p.dot+'"></span>'+m.name;
    b.addEventListener('click', ()=>toggleVariant(p, m.id));
    row.appendChild(b);
  });
  wrap.append(head, row); return wrap;
}
function toggleVariant(p, id){
  const nm=(p.members.find(m=>m.id===id)||{}).name || id;
  const enableIfBound=()=>{ if (p.sound && byId(p.sound) && p.autoEnable!==false && !layers.has(p.sound)) toggleSound(p.sound); };
  if (p.mode==='single'){
    variantSet(p, id); if (p.sound==='__rain') applyRainSurface(); enableIfBound();   // 雨质地：实时重调活跃雨层滤波
    toast(t('variantSelected', nm)); reflectVariantChips(p); return;
  }
  const set=new Set(variantGet(p));
  if (set.has(id)){
    if (set.size <= (p.min||0)){ toast(t('variantKeepOne')); return; }
    set.delete(id); variantSet(p, [...set]); toast(t('variantCollapsed', nm));
  } else {
    set.add(id); variantSet(p, [...set]); enableIfBound(); toast(t('variantAdded', nm));
  }
  reflectVariantChips(p);
}
function reflectVariantChips(p){
  const cur=variantGet(p); const on=id=> p.mode==='single' ? cur===id : cur.includes(id);
  document.querySelectorAll('.bird-chip[data-pk="'+p.key+'"]').forEach(b=> b.setAttribute('aria-pressed', String(on(b.dataset.m))));
}

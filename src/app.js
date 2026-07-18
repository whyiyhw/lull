(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const rand = () => Math.random();

  // ---------- 主题 ----------
  const root = document.documentElement;
  const sun = 'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z';
  const moon = 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z';
  const curTheme = () => root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const paintTheme = () => $('theme-ico').innerHTML = '<path d="'+(curTheme()==='dark'?sun:moon)+'"/>';
  const st = localStorage.getItem('lull.theme'); if (st) root.dataset.theme = st;
  paintTheme();
  $('theme').addEventListener('click', () => { const n = curTheme()==='dark'?'light':'dark'; root.dataset.theme = n; localStorage.setItem('lull.theme', n); paintTheme(); });

  // ---------- 音色库 ----------
  const CATS = [
    { id:'noise', name:'噪音' }, { id:'rain', name:'雨' }, { id:'water', name:'水' },
    { id:'forest', name:'林' }, { id:'wind', name:'风' }, { id:'room', name:'室内' },
    { id:'warm', name:'暖' }, { id:'calm', name:'冥想' },
  ];
  const SOUNDS = [
    { id:'white', name:'白噪音', cat:'noise', base:'white', color:'#cfe3ff', paint:'grain' },
    { id:'pink',  name:'粉噪音', cat:'noise', base:'pink',  color:'#ffc9de', paint:'grain' },
    { id:'brown', name:'褐噪音', cat:'noise', base:'brown', color:'#e6b98a', paint:'grain' },

    { id:'lrain', name:'小雨', cat:'rain', base:'white', color:'#9cc2ff', paint:'rain', surface:true, filters:[{type:'highpass',freq:900,q:0.6},{type:'lowpass',freq:6800,q:0.6}] },
    { id:'hrain', name:'大雨', cat:'rain', base:'white', color:'#7aa4ff', paint:'rain', surface:true, filters:[{type:'lowpass',freq:4200,q:0.5}] },
    { id:'storm', name:'雷雨', cat:'rain', base:'white', color:'#6f8cf0', paint:'rain', surface:true, thunder:true, filters:[{type:'lowpass',freq:3800,q:0.5}] },

    { id:'ocean',  name:'海浪', cat:'water', base:'brown', color:'#5fd0c0', paint:'ocean', filters:[{type:'lowpass',freq:520,q:0.6}], lfo:{rate:0.09,depth:0.36,target:'gain'} },
    { id:'stream', name:'溪流', cat:'water', base:'pink',  color:'#7fd8e6', paint:'mist',  filters:[{type:'bandpass',freq:2300,q:1.1}], lfo:{rate:4.5,depth:600,target:'freq'}, reverb:0.25 },
    { id:'fall',   name:'瀑布', cat:'water', base:'white', color:'#a8e0ff', paint:'mist',  filters:[{type:'lowpass',freq:3200,q:0.4}] },

    { id:'forest', name:'森林', cat:'forest', base:'pink',  color:'#7fd08a', paint:'forest', file:'forest.mp3', filters:[{type:'bandpass',freq:2100,q:0.8}], lfo:{rate:0.15,depth:700,target:'freq'}, birds:'low',  reverb:0.4 },
    { id:'birds',  name:'鸟鸣', cat:'forest', base:null,    color:'#ffd48a', paint:'birds',  birds:'high', reverb:0.5 },
    { id:'insects',name:'虫鸣', cat:'forest', base:null,    color:'#c3e08a', paint:'bokeh',  insects:true, reverb:0.35 },

    { id:'breeze', name:'微风', cat:'wind', base:'pink', color:'#bfe6cf', paint:'wind', filters:[{type:'lowpass',freq:520,q:0.5}], lfo:{rate:0.06,depth:300,target:'freq'} },
    { id:'wind',   name:'大风', cat:'wind', base:'pink', color:'#9fd0b8', paint:'wind', filters:[{type:'lowpass',freq:840,q:0.6}], lfo:{rate:0.13,depth:520,target:'freq'} },
    { id:'snow',   name:'落雪', cat:'wind', base:'pink', color:'#dbe7ff', paint:'snow', filters:[{type:'lowpass',freq:1100,q:0.5}], lfo:{rate:0.05,depth:260,target:'freq'} },

    { id:'fan', name:'风扇', cat:'room', base:'brown', color:'#c2ccd8', paint:'haze', filters:[{type:'lowpass',freq:240,q:0.7}] },
    { id:'ac',  name:'空调', cat:'room', base:'brown', color:'#b6c4d0', paint:'haze', filters:[{type:'lowpass',freq:170,q:0.7}], tone:{freq:120,type:'sine',gain:0.05} },
    { id:'train', name:'火车', cat:'room', base:'brown', color:'#b9c4cf', paint:'rail', file:'train.mp3', filters:[{type:'lowpass',freq:160,q:0.7}], clack:true },
    { id:'subway', name:'地铁', cat:'room', base:'brown', color:'#9fb0c0', paint:'rail', filters:[{type:'lowpass',freq:260,q:0.7}], lfo:{rate:0.2,depth:400,target:'freq'}, clack:true },
    { id:'pages',  name:'翻书', cat:'room', base:null,    color:'#e8dcc0', paint:'mist', pages:true, reverb:0.2 },
    { id:'tick',   name:'滴答', cat:'room', base:null,    color:'#c9d2dc', paint:'ripple', tick:true },

    { id:'fire', name:'篝火',   cat:'warm', base:'brown', color:'#ff9a5a', paint:'fire',  filters:[{type:'lowpass',freq:380,q:0.7}], lfo:{rate:0.5,depth:120,target:'freq'}, crackle:true, reverb:0.15 },
    { id:'cafe', name:'咖啡馆', cat:'warm', base:'pink',  color:'#ffc59a', paint:'bokeh', file:'cafe.mp3', filters:[{type:'bandpass',freq:750,q:0.9}], lfo:{rate:0.4,depth:0.4,target:'gain'}, clink:true, reverb:0.3 },
    { id:'purr', name:'猫呼噜', cat:'warm', base:'brown', color:'#f0b58a', paint:'haze', filters:[{type:'lowpass',freq:220,q:0.8}], lfo:{rate:26,depth:0.55,target:'gain'} },

    { id:'bowl', name:'颂钵', cat:'calm', base:null,    color:'#e6d3a0', paint:'ripple', bowl:{freq:236}, reverb:0.6 },
    { id:'hum',  name:'低鸣', cat:'calm', base:'brown', color:'#a9bccb', paint:'haze',   filters:[{type:'lowpass',freq:110,q:0.8}] },
  ];
  const byId = id => SOUNDS.find(s => s.id === id);

  // ---------- 细分「子选择器」：某个声音再拆成可勾选的成员（合成，纯本地）----------
  // 鸟种（森林 · 鸟鸣，多选合唱）
  const BIRD_SPECIES = [
    { id:'sparrow',     name:'麻雀', desc:'清脆短啾 · 晨间活泼' },
    { id:'thrush',      name:'画眉', desc:'婉转多音 · 旋律流转' },
    { id:'dove',        name:'斑鸠', desc:'低沉咕咕 · 安神' },
    { id:'cuckoo',      name:'杜鹃', desc:'布谷两声 · 悠远' },
    { id:'nightingale', name:'夜莺', desc:'华丽颤鸣 · 夜之歌手' },
  ];
  const FOREST_BIRDS = ['sparrow', 'thrush', 'dove'];   // 「森林」底噪里随机点缀的鸟
  // 虫种（森林 · 虫鸣，多选合唱）
  const INSECT_SPECIES = [
    { id:'cricket', name:'蟋蟀',   desc:'高频颤鸣 · 秋夜' },
    { id:'cicada',  name:'蝉',     desc:'绵长鼓噪 · 盛夏' },
    { id:'frog',    name:'蛙',     desc:'低沉蛙鸣 · 塘边' },
    { id:'katydid', name:'纺织娘', desc:'沙沙织声 · 草丛' },
  ];
  // 篝火爆裂性格（暖 · 篝火，多选）
  const FIRE_CHARS = [
    { id:'snap',     name:'噼啪', desc:'清脆爆响' },
    { id:'burst',    name:'爆裂', desc:'成串迸溅' },
    { id:'collapse', name:'塌陷', desc:'木柴翻落' },
    { id:'ember',    name:'余烬', desc:'细碎嘶嘶' },
  ];
  // 咖啡馆环境细节（暖 · 咖啡馆，多选，可全关只留底噪录音）
  const CAFE_EVENTS = [
    { id:'clink',   name:'碰杯', desc:'瓷器轻碰' },
    { id:'grinder', name:'磨豆', desc:'研磨咖啡豆' },
    { id:'steam',   name:'咖啡机', desc:'蒸汽嘶响' },
    { id:'spoon',   name:'汤匙', desc:'搅拌叮当' },
  ];
  // 雨的质地：打在什么上（雨 · 单选，所有雨层通用）
  const RAIN_SURFACES = [
    { id:'eaves',  name:'屋檐',   desc:'低沉滴落 · 屋檐下', type:'lowpass',  freq:2600, q:0.8 },
    { id:'glass',  name:'窗玻璃', desc:'清脆点击 · 打在窗上', type:'highpass', freq:1800, q:0.7 },
    { id:'leaves', name:'树叶',   desc:'柔和沙沙 · 落在叶间', type:'bandpass', freq:2200, q:0.6 },
    { id:'water',  name:'水面',   desc:'饱满深沉 · 落在水上', type:'lowpass',  freq:1400, q:1.0 },
  ];
  const RAIN_SURFACE_BY_ID = Object.fromEntries(RAIN_SURFACES.map(s => [s.id, s]));

  // 声明式：每个子选择器挂在某个分类下，可绑定某个声音（选中即开）
  const VARIANT_PICKERS = [
    { cat:'rain',   sound:'__rain', autoEnable:false, key:'lull.rainsurf', mode:'single', label:'雨 · 打在什么上（所有雨通用）', dot:'#9cc2ff', members:RAIN_SURFACES, default:'leaves', onSelect:()=>applyRainSurface() },
    { cat:'forest', sound:'birds',   key:'lull.birds',   mode:'multi', min:1, label:'鸟鸣 · 选择鸟种（可多选）',   dot:'#ffd48a', members:BIRD_SPECIES,   default:['sparrow','thrush'] },
    { cat:'forest', sound:'insects', key:'lull.insects', mode:'multi', min:1, label:'虫鸣 · 选择虫种（可多选）',   dot:'#c3e08a', members:INSECT_SPECIES, default:['cricket','frog'] },
    { cat:'warm',   sound:'fire',    key:'lull.fire',    mode:'multi', min:1, label:'篝火 · 爆裂性格（可多选）',   dot:'#ff9a5a', members:FIRE_CHARS,     default:['snap','collapse'] },
    { cat:'warm',   sound:'cafe',    key:'lull.cafe',    mode:'multi', min:0, label:'咖啡馆 · 环境细节（可全关）', dot:'#ffc59a', members:CAFE_EVENTS,    default:['clink','grinder'] },
  ];
  function pickerById(id){ return VARIANT_PICKERS.find(p => p.sound === id); }
  function variantGet(p){
    try{ const a = JSON.parse(localStorage.getItem(p.key) || 'null');
      if (p.mode==='single'){ if (typeof a==='string' && p.members.some(m=>m.id===a)) return a; }
      else if (Array.isArray(a)){ const f=a.filter(id=>p.members.some(m=>m.id===id)); if (f.length >= (p.min||0)) return f; }
    }catch(e){}
    return p.mode==='single' ? p.default : p.default.slice();
  }
  function variantSet(p, val){ localStorage.setItem(p.key, JSON.stringify(val)); }
  function selForSound(id, fb){ const p=pickerById(id); return p ? variantGet(p) : (fb||[]); }
  function selectedBirds(){ return selForSound('birds', ['sparrow','thrush']); }   // 鸟鸣 high 密度用户选中的鸟
  function currentRainSurface(){ const p=VARIANT_PICKERS.find(x=>x.sound==='__rain'); return RAIN_SURFACE_BY_ID[variantGet(p)] || RAIN_SURFACES[2]; }
  function applyRainSurface(){ if (!ctx) return; const s=currentRainSurface(); layers.forEach((l,id)=>{ const c=byId(id); if (c && c.surface && l.surfaceFilter){ const f=l.surfaceFilter, now=ctx.currentTime; f.type=s.type; f.frequency.setTargetAtTime(s.freq, now, 0.08); f.Q.setTargetAtTime(s.q, now, 0.08); } }); }

  // ---------- 音频引擎 ----------
  let ctx=null, master=null, reverb=null, reverbBus=null;
  const buffers = {};
  const layers = new Map();
  const AUDIO_BASE = 'audio/';
  let masterPlaying = false;
  let masterVol = parseInt(localStorage.getItem('lull.mvol') || '70', 10);
  const soundVol = JSON.parse(localStorage.getItem('lull.svol') || '{}');
  const volOf = id => (id in soundVol ? soundVol[id] : 0.6);
  const perc = v => v*v;
  const masterTarget = () => perc(masterVol/100) * 0.9;
  const layerTarget = id => perc(volOf(id));

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
  function ensureCtx(){
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    master.connect(ctx.destination);
    reverb = ctx.createConvolver(); reverb.buffer = makeImpulse(2.4, 2.6);
    const wet = ctx.createGain(); wet.gain.value = 0.9;
    reverbBus = ctx.createGain(); reverbBus.gain.value = 1;
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
    toast('本地直开模式 · 部分声音改用合成');
  }

  // 文件层的场景视觉（录音已含雷声/鸟鸣，这里只驱动画面、不再叠加合成事件）
  function wireSceneEmitters(layer, cfg){
    if (!cfg.thunder && !cfg.birds) return;
    const emit = () => {
      if (!layer.active) return;
      if (masterPlaying){ if (cfg.thunder) scene.lightning(); else scene.spark(cfg.color); }
      const d = cfg.thunder ? (8000+rand()*17000)
              : cfg.birds==='high' ? (1500+rand()*3000)
              : (6000+rand()*10000);
      layer.sceneTimer = setTimeout(emit, d);
    };
    layer.sceneTimer = setTimeout(emit, 1500);
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
  function wireSynthEvents(layer, cfg){
    if (cfg.thunder) scheduleThunder(layer);
    if (cfg.birds) scheduleBirds(layer, cfg.birds, true);
    if (cfg.insects) scheduleInsects(layer, true);
    if (cfg.crackle) scheduleCrackle(layer);
    if (cfg.clink) scheduleCafe(layer);
    if (cfg.clack) scheduleClack(layer);
    if (cfg.tick) scheduleTock(layer);
    if (cfg.pages) scheduleRustle(layer);
    if (cfg.bowl) scheduleStrike(layer, cfg.bowl);
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

  // 雷声 + 闪电
  function scheduleThunder(layer){ layer.thunderTimer = setTimeout(() => { if(!layer.active) return; if(masterPlaying){ triggerRumble(layer); scene.lightning(); } scheduleThunder(layer); }, 9000 + rand()*22000); }
  function triggerRumble(layer){
    const dur = 1.6 + rand()*2.6;
    const b = ctx.createBufferSource(); b.buffer = buffers.brown; b.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=170+rand()*170;
    const gn = ctx.createGain(); gn.gain.value=0; b.connect(lp); lp.connect(gn); gn.connect(layer.gain);
    const now = ctx.currentTime, peak=0.5+rand()*0.45;
    gn.gain.setValueAtTime(0.0001, now); gn.gain.linearRampToValueAtTime(peak, now+0.2+rand()*0.35); gn.gain.exponentialRampToValueAtTime(0.0001, now+dur);
    b.start(now); b.stop(now+dur+0.1); b.onended = () => { try{ b.disconnect(); lp.disconnect(); gn.disconnect(); }catch(e){} };
  }

  // 鸟鸣：多鸟种合成。density='high' 时唱用户选中的鸟种；'low'（森林底噪）随机点缀。
  function scheduleBirds(layer, density, first){
    const gap = first ? (0.3+rand()*0.6) : (density==='high' ? (1.6+rand()*3.4) : (6+rand()*12));
    layer.birdTimer = setTimeout(() => {
      if (!layer.active) return;
      if (masterPlaying){
        const pool = density==='high' ? selectedBirds() : FOREST_BIRDS;
        if (pool.length) singSpecies(pool[Math.floor(rand()*pool.length)], layer);
      }
      scheduleBirds(layer, density);
    }, gap*1000);
  }
  function singSpecies(id, layer){ const fn=BIRD_PHRASES[id]; if (!fn || !ctx) return; fn(layer, ctx.currentTime+0.02); scene.spark(layer.cfg.color); }

  // 单个音节：正弦载波 + 频率轮廓（起→峰→落）+ 可选二次谐波/颤音/起音噪门
  function birdNote(layer, when, o){
    const dur=o.dur, f0=o.f0, f1=(o.f1!=null?o.f1:f0), f2=(o.f2!=null?o.f2:f1);
    const g=ctx.createGain(); g.connect(layer.gain);
    const osc=ctx.createOscillator(); osc.type=o.wave||'sine';
    osc.frequency.setValueAtTime(f0, when);
    osc.frequency.linearRampToValueAtTime(f1, when+dur*0.35);
    osc.frequency.linearRampToValueAtTime(f2, when+dur);
    osc.connect(g);
    let vibOsc=null, vibGain=null, h=null, hg=null;
    if (o.vib){ vibOsc=ctx.createOscillator(); vibOsc.frequency.value=o.vibRate||20; vibGain=ctx.createGain(); vibGain.gain.value=o.vib; vibOsc.connect(vibGain); vibGain.connect(osc.frequency); vibOsc.start(when); vibOsc.stop(when+dur+0.03); }
    if (o.harm){ h=ctx.createOscillator(); h.type='sine'; h.frequency.setValueAtTime(f0*2,when); h.frequency.linearRampToValueAtTime(f1*2,when+dur*0.35); h.frequency.linearRampToValueAtTime(f2*2,when+dur); hg=ctx.createGain(); hg.gain.value=o.harm; h.connect(hg); hg.connect(g); h.start(when); h.stop(when+dur+0.03); }
    const peak=(o.gain!=null?o.gain:0.2);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(peak, when+(o.attack!=null?o.attack:Math.min(0.014,dur*0.3)));
    g.gain.exponentialRampToValueAtTime(0.0006, when+(o.decay||dur));
    osc.start(when); osc.stop(when+dur+0.05);
    if (o.noise){ const nb=ctx.createBufferSource(); nb.buffer=buffers.white; nb.loop=true; const nf=ctx.createBiquadFilter(); nf.type='bandpass'; nf.frequency.value=f1; nf.Q.value=0.9; const ng=ctx.createGain(); ng.gain.setValueAtTime(o.noise,when); ng.gain.exponentialRampToValueAtTime(0.0004,when+0.02); nb.connect(nf); nf.connect(ng); ng.connect(layer.gain); nb.start(when); nb.stop(when+0.06); nb.onended=()=>{try{nb.disconnect();nf.disconnect();ng.disconnect();}catch(e){}}; }
    osc.onended=()=>{ try{osc.disconnect();g.disconnect();}catch(e){} if(vibOsc){try{vibOsc.disconnect();vibGain.disconnect();}catch(e){}} if(h){try{h.disconnect();hg.disconnect();}catch(e){}} };
  }

  const BIRD_PHRASES = {
    // 麻雀：一串清脆短啾，略带噪门
    sparrow(layer, t){
      const n=2+Math.floor(rand()*4), f=3400+rand()*1500;
      for (let i=0;i<n;i++){ birdNote(layer, t, {f0:f*0.97, f1:f*(1.04+rand()*0.08), f2:f*0.95, dur:0.04+rand()*0.03, gain:0.15, noise:0.05, wave:'triangle'}); t+=0.055+rand()*0.06; }
    },
    // 画眉：婉转乐句，音节上下起伏、带谐波
    thrush(layer, t){
      const n=4+Math.floor(rand()*4); let base=2000+rand()*900;
      for (let i=0;i<n;i++){ const up=rand()<0.5, a=base*(0.85+rand()*0.35), b=a*(up?1.28:0.78), c=b*(0.88+rand()*0.22);
        birdNote(layer, t, {f0:a, f1:b, f2:c, dur:0.09+rand()*0.08, gain:0.16, harm:0.06, vib:rand()<0.4?26:0, vibRate:24});
        base*=(0.95+rand()*0.12); t+=0.10+rand()*0.09; }
    },
    // 斑鸠：低沉柔和的咕咕，慢起慢落，安神
    dove(layer, t){
      const n=3+Math.floor(rand()*2), f=520+rand()*170;
      for (let i=0;i<n;i++){ const rise=i===0;
        birdNote(layer, t, {f0:rise?f*0.9:f, f1:f, f2:f*0.96, dur:0.24+rand()*0.12, gain:0.16, harm:0.12, attack:0.05, decay:0.34, wave:'sine'});
        t+=0.30+rand()*0.14; }
    },
    // 杜鹃：经典「布—谷」两声，后接长静默
    cuckoo(layer, t){
      const f=980+rand()*200;
      birdNote(layer, t,      {f0:f,     f1:f,     f2:f*0.99, dur:0.16, gain:0.18, harm:0.09, attack:0.02, wave:'sine'});
      birdNote(layer, t+0.22, {f0:f*0.8, f1:f*0.8, f2:f*0.78, dur:0.20, gain:0.17, harm:0.09, attack:0.02, wave:'sine'});
    },
    // 夜莺：颤音串与长滑哨交替，最华丽
    nightingale(layer, t){
      const motifs=1+Math.floor(rand()*2);
      for (let m=0;m<motifs;m++){
        if (rand()<0.5){ const k=6+Math.floor(rand()*8), f=2500+rand()*1300;
          for (let i=0;i<k;i++){ birdNote(layer, t, {f0:f*(i%2?1.14:0.9), f1:f*(i%2?1.22:0.86), dur:0.03+rand()*0.02, gain:0.13}); t+=0.045; }
          t+=0.08;
        } else { const a=2100+rand()*400, b=a*(1.3+rand()*0.4), dur=0.3+rand()*0.22;
          birdNote(layer, t, {f0:a, f1:b, f2:a*1.08, dur, gain:0.15, harm:0.05, vib:38, vibRate:14}); t+=dur+0.1;
        }
      }
    },
  };

  // 虫鸣：多虫种合成（事件型合唱，跟鸟鸣同构）。用户选中的虫种随机轮唱。
  function scheduleInsects(layer, first){
    const gap = first ? (0.4+rand()*0.6) : (1.2+rand()*3.2);
    layer.insectTimer = setTimeout(() => {
      if (!layer.active) return;
      if (masterPlaying){ const pool=selForSound('insects', ['cricket']); if (pool.length){ const id=pool[Math.floor(rand()*pool.length)], fn=INSECT_PHRASES[id]; if (fn && ctx){ fn(layer, ctx.currentTime+0.02); scene.spark(layer.cfg.color); } } }
      scheduleInsects(layer);
    }, gap*1000);
  }
  // 拟声噪门：一小段带通白噪脉冲（蟋蟀/纺织娘的擦翅声）
  function chirrNote(layer, when, o){
    const b=ctx.createBufferSource(); b.buffer=buffers.white; b.loop=true;
    const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=o.freq; bp.Q.value=o.q||6;
    const g=ctx.createGain(); g.gain.value=0; b.connect(bp); bp.connect(g); g.connect(layer.gain);
    const dur=o.dur, amp=(o.gain!=null?o.gain:0.1);
    g.gain.setValueAtTime(0.0001,when); g.gain.linearRampToValueAtTime(amp,when+(o.attack||0.004)); g.gain.exponentialRampToValueAtTime(0.0004,when+dur);
    b.start(when); b.stop(when+dur+0.02); b.onended=()=>{try{b.disconnect();bp.disconnect();g.disconnect();}catch(e){}};
  }
  const INSECT_PHRASES = {
    // 蟋蟀：一串高频擦翅短颤
    cricket(layer, t){ const n=6+Math.floor(rand()*10), f=4200+rand()*900; for (let i=0;i<n;i++){ chirrNote(layer, t, {freq:f, q:12, dur:0.02+rand()*0.012, gain:0.10}); t+=0.028+rand()*0.012; } },
    // 蝉：绵长的调幅鼓噪
    cicada(layer, t){
      const f=5000+rand()*1200, dur=0.8+rand()*1.4;
      const b=ctx.createBufferSource(); b.buffer=buffers.white; b.loop=true;
      const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=f; bp.Q.value=7;
      const g=ctx.createGain(); g.gain.value=0; b.connect(bp); bp.connect(g); g.connect(layer.gain);
      const lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=45+rand()*25; const lg=ctx.createGain(); lg.gain.value=0.045; lfo.connect(lg); lg.connect(g.gain);
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.085,t+0.15); g.gain.setValueAtTime(0.085,t+dur-0.2); g.gain.exponentialRampToValueAtTime(0.0004,t+dur);
      lfo.start(t); lfo.stop(t+dur+0.02); b.start(t); b.stop(t+dur+0.03);
      b.onended=()=>{try{b.disconnect();bp.disconnect();g.disconnect();lfo.disconnect();lg.disconnect();}catch(e){}};
    },
    // 蛙：低沉带颤的蛙鸣（复用 birdNote 的音节引擎，锯齿波 + 快颤音）
    frog(layer, t){ const n=1+Math.floor(rand()*3), f=190+rand()*140; for (let i=0;i<n;i++){ birdNote(layer, t, {f0:f*0.9, f1:f, f2:f*0.85, dur:0.14+rand()*0.1, gain:0.16, harm:0.18, vib:8, vibRate:32, wave:'sawtooth', attack:0.02}); t+=0.22+rand()*0.18; } },
    // 纺织娘：成组的沙沙擦声
    katydid(layer, t){ const reps=2+Math.floor(rand()*3); for (let r=0;r<reps;r++){ const f=5800+rand()*1400; for (let i=0;i<3;i++){ chirrNote(layer, t, {freq:f, q:5, dur:0.05, gain:0.09}); t+=0.06; } t+=0.14+rand()*0.1; } },
  };

  // 篝火：低吼 + 随机噼啪
  function scheduleCrackle(layer){ layer.crackleTimer = setTimeout(() => { if(!layer.active) return; if(masterPlaying){ const chars=selForSound('fire', ['snap']); if (chars.length) firePop(layer, chars[Math.floor(rand()*chars.length)]); } scheduleCrackle(layer); }, 60 + rand()*260); }
  // 篝火爆裂性格：由用户勾选的 FIRE_CHARS 轮流触发
  function firePop(layer, char){
    const now=ctx.currentTime;
    if (char==='burst'){ const n=3+Math.floor(rand()*4); for(let i=0;i<n;i++) pop(layer, now+i*(0.02+rand()*0.03), {f:1600+rand()*2800, q:2, dur:0.015+rand()*0.03, amp:0.10+rand()*0.24}); }
    else if (char==='collapse'){ thud(layer, now); const n=2+Math.floor(rand()*3); for(let i=0;i<n;i++) pop(layer, now+0.04+i*(0.03+rand()*0.05), {f:900+rand()*1400, q:1.4, dur:0.03+rand()*0.05, amp:0.10+rand()*0.20}); }
    else if (char==='ember'){ pop(layer, now+rand()*0.15, {f:5000+rand()*2500, q:3, dur:0.06+rand()*0.12, amp:0.03+rand()*0.06}); }
    else { const n=1+Math.floor(rand()*2); for(let i=0;i<n;i++) pop(layer, now+rand()*0.14, {f:1200+rand()*2600, q:1.6, dur:0.02+rand()*0.05, amp:0.10+rand()*0.32}); }   // snap
  }
  function pop(layer, when, o){
    o=o||{};
    const b=ctx.createBufferSource(); b.buffer=buffers.white; b.loop=true;
    const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=(o.f!=null?o.f:1200+rand()*2600); bp.Q.value=(o.q!=null?o.q:1.6);
    const g=ctx.createGain(); g.gain.value=0; b.connect(bp); bp.connect(g); g.connect(layer.gain);
    const dur=(o.dur!=null?o.dur:0.02+rand()*0.05), amp=(o.amp!=null?o.amp:0.10+rand()*0.32);
    g.gain.setValueAtTime(0.0001,when); g.gain.linearRampToValueAtTime(amp,when+0.003); g.gain.exponentialRampToValueAtTime(0.0006,when+dur);
    b.start(when); b.stop(when+dur+0.02); b.onended=()=>{try{b.disconnect();bp.disconnect();g.disconnect();}catch(e){}};
    if (amp>0.24) scene.ember(layer.cfg.color);
  }

  // 咖啡馆：底噪录音之上叠加用户勾选的环境细节（碰杯/磨豆/咖啡机/汤匙）
  function scheduleCafe(layer){ layer.clinkTimer = setTimeout(() => { if(!layer.active) return; if(masterPlaying){ const evs=selForSound('cafe', []); if (evs.length) cafeEvent(layer, evs[Math.floor(rand()*evs.length)]); } scheduleCafe(layer); }, 2500 + rand()*6500); }
  function cafeEvent(layer, id){
    if (id==='clink'){ clink(layer); return; }
    const now=ctx.currentTime+0.02;
    if (id==='spoon'){   // 汤匙搅拌：轻脆的高频叮
      const f=3200+rand()*1600; const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
      const g=ctx.createGain(); g.gain.value=0; o.connect(g); g.connect(layer.gain); const dur=0.12;
      g.gain.setValueAtTime(0.0001,now); g.gain.linearRampToValueAtTime(0.05,now+0.003); g.gain.exponentialRampToValueAtTime(0.0004,now+dur);
      o.start(now); o.stop(now+dur+0.03); o.onended=()=>{try{o.disconnect();g.disconnect();}catch(e){}};
    } else if (id==='grinder'){   // 磨豆：一段低沉粗砺的研磨
      const dur=0.5+rand()*0.5; const b=ctx.createBufferSource(); b.buffer=buffers.brown; b.loop=true;
      const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=380+rand()*260; bp.Q.value=1.2;
      const g=ctx.createGain(); g.gain.value=0; b.connect(bp); bp.connect(g); g.connect(layer.gain);
      const lfo=ctx.createOscillator(); lfo.type='square'; lfo.frequency.value=55+rand()*30; const lg=ctx.createGain(); lg.gain.value=0.035; lfo.connect(lg); lg.connect(g.gain);
      g.gain.setValueAtTime(0.0001,now); g.gain.linearRampToValueAtTime(0.08,now+0.05); g.gain.setValueAtTime(0.08,now+dur-0.1); g.gain.exponentialRampToValueAtTime(0.0004,now+dur);
      lfo.start(now); lfo.stop(now+dur+0.02); b.start(now); b.stop(now+dur+0.03);
      b.onended=()=>{try{b.disconnect();bp.disconnect();g.disconnect();lfo.disconnect();lg.disconnect();}catch(e){}};
    } else if (id==='steam'){   // 咖啡机蒸汽：高频嘶响
      const dur=0.6+rand()*0.6; const b=ctx.createBufferSource(); b.buffer=buffers.white; b.loop=true;
      const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=3500;
      const g=ctx.createGain(); g.gain.value=0; b.connect(hp); hp.connect(g); g.connect(layer.gain);
      g.gain.setValueAtTime(0.0001,now); g.gain.linearRampToValueAtTime(0.06,now+0.08); g.gain.setValueAtTime(0.06,now+dur-0.15); g.gain.exponentialRampToValueAtTime(0.0004,now+dur);
      b.start(now); b.stop(now+dur+0.03); b.onended=()=>{try{b.disconnect();hp.disconnect();g.disconnect();}catch(e){}};
    }
  }
  function clink(layer){
    const when=ctx.currentTime+0.02, f=1800+rand()*2400;
    const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
    const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=f*2.01;
    const g=ctx.createGain(); g.gain.value=0; o.connect(g); o2.connect(g); g.connect(layer.gain);
    const dur=0.25+rand()*0.3;
    g.gain.setValueAtTime(0.0001,when); g.gain.linearRampToValueAtTime(0.10,when+0.004); g.gain.exponentialRampToValueAtTime(0.0004,when+dur);
    o.start(when); o2.start(when); o.stop(when+dur+0.05); o2.stop(when+dur+0.05);
    o.onended=()=>{try{o.disconnect();o2.disconnect();g.disconnect();}catch(e){}};
  }

  // 火车：滚动轰鸣 + 节奏哐当
  function scheduleClack(layer){
    const beat=0.62;
    (function loop(){ if(!layer.active) return; if(masterPlaying){ const t=ctx.currentTime; thud(layer,t); thud(layer,t+0.11); } layer.clackTimer=setTimeout(loop, beat*1000); })();
  }
  function thud(layer, when){
    const b=ctx.createBufferSource(); b.buffer=buffers.brown; b.loop=true;
    const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=200;
    const g=ctx.createGain(); g.gain.value=0; b.connect(lp); lp.connect(g); g.connect(layer.gain);
    const dur=0.09;
    g.gain.setValueAtTime(0.0001,when); g.gain.linearRampToValueAtTime(0.5,when+0.005); g.gain.exponentialRampToValueAtTime(0.0006,when+dur);
    b.start(when); b.stop(when+dur+0.02); b.onended=()=>{try{b.disconnect();lp.disconnect();g.disconnect();}catch(e){}};
    const t=ctx.createBufferSource(); t.buffer=buffers.white; t.loop=true;
    const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=2400; bp.Q.value=2.2;
    const tg=ctx.createGain(); tg.gain.value=0; t.connect(bp); bp.connect(tg); tg.connect(layer.gain);
    tg.gain.setValueAtTime(0.0001,when); tg.gain.linearRampToValueAtTime(0.07,when+0.003); tg.gain.exponentialRampToValueAtTime(0.0004,when+0.05);
    t.start(when); t.stop(when+0.08); t.onended=()=>{try{t.disconnect();bp.disconnect();tg.disconnect();}catch(e){}};
  }

  // 时钟滴答：周期性双拍（滴 / 答）—— 无连续底噪，纯事件
  function scheduleTock(layer){
    let alt=false;
    (function loop(){ if(!layer.active) return; if(masterPlaying){ tickOnce(layer, alt); alt=!alt; } layer.tickTimer=setTimeout(loop, 1000); })();
  }
  function tickOnce(layer, hi){
    const when=ctx.currentTime+0.01, f= hi?2100:1500;
    const o=ctx.createOscillator(); o.type='square'; o.frequency.value=f;
    const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=f; bp.Q.value=8;
    const g=ctx.createGain(); g.gain.value=0; o.connect(bp); bp.connect(g); g.connect(layer.gain);
    const dur=0.028;
    g.gain.setValueAtTime(0.0001,when); g.gain.linearRampToValueAtTime(0.16,when+0.002); g.gain.exponentialRampToValueAtTime(0.0004,when+dur);
    o.start(when); o.stop(when+dur+0.02); o.onended=()=>{try{o.disconnect();bp.disconnect();g.disconnect();}catch(e){}};
  }

  // 翻书：偶发纸张摩挲
  function scheduleRustle(layer){ layer.pageTimer=setTimeout(()=>{ if(!layer.active) return; if(masterPlaying) rustle(layer); scheduleRustle(layer); }, 4000+rand()*9000); }
  function rustle(layer){
    const when=ctx.currentTime+0.02, dur=0.26+rand()*0.24;
    const b=ctx.createBufferSource(); b.buffer=buffers.white; b.loop=true;
    const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=2600+rand()*1800; bp.Q.value=0.8;
    const g=ctx.createGain(); g.gain.value=0; b.connect(bp); bp.connect(g); g.connect(layer.gain);
    g.gain.setValueAtTime(0.0001,when); g.gain.linearRampToValueAtTime(0.09+rand()*0.06,when+0.05); g.gain.linearRampToValueAtTime(0.0004,when+dur);
    b.start(when); b.stop(when+dur+0.03); b.onended=()=>{try{b.disconnect();bp.disconnect();g.disconnect();}catch(e){}};
    scene.spark(layer.cfg.color);
  }

  // 颂钵：非谐泛音 + 拍频 + 周期敲击
  function buildBowl(layer, cfg){
    const ratios=[1,2.02,2.72,4.95,5.42,8.9];
    const sum=ctx.createGain(); sum.gain.value=0.14; layer.partialSum=sum; layer.partials=[];
    ratios.forEach((r,idx) => {
      const og=ctx.createGain(); og.gain.value=(1/(idx+1))*0.5;
      const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=cfg.freq*r;
      const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=cfg.freq*r*1.004;
      o.connect(og); o2.connect(og); og.connect(sum);
      o.start(); o2.start(); layer.partials.push(o,o2); layer.extra.push(og);
    });
    sum.connect(layer.gain);
  }
  function scheduleStrike(layer, cfg){
    const first = layer._struck ? (14000 + rand()*16000) : 900; layer._struck = true;
    layer.strikeTimer = setTimeout(() => { if(!layer.active) return; if(masterPlaying) strike(layer); scheduleStrike(layer, cfg); }, first);
  }
  function strike(layer){
    const now=ctx.currentTime, ps=layer.partialSum.gain;
    ps.cancelScheduledValues(now); ps.setValueAtTime(Math.max(ps.value,0.0001), now);
    ps.linearRampToValueAtTime(1.0, now+0.06); ps.exponentialRampToValueAtTime(0.14, now + (10+rand()*6));
    scene.ripple(layer.cfg.color);
  }

  function rampMaster(to, dt){ const now=ctx.currentTime; master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(Math.max(master.gain.value,0.0001), now); master.gain.linearRampToValueAtTime(to, now+dt); }
  let suspendT=0;
  function setPlaying(on){
    masterPlaying = on;
    if (ctx){
      if (on){
        clearTimeout(suspendT);
        if (ctx.state !== 'running'){ const p=ctx.resume(); if (p&&p.catch) p.catch(()=>{}); }
        rampMaster(masterTarget(), 0.4);
        wakeSchedulers();                            // D8：恢复播放 → 重启事件调度器
      } else {
        rampMaster(0, 0.4);
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
  function freezeSchedulers(){ layers.forEach(l => stopTimers(l)); }
  function wakeSchedulers(){ layers.forEach(l => { if (l.active && l.wireEvents){ stopTimers(l); l.wireEvents(); } }); }

  function removeLayer(id, fade){
    const layer = layers.get(id); if (!layer) return;
    layer.active = false; stopTimers(layer);
    if (layer.gain && ctx){ const now = ctx.currentTime; layer.gain.gain.cancelScheduledValues(now); layer.gain.gain.setValueAtTime(Math.max(layer.gain.gain.value,0.0001), now); layer.gain.gain.linearRampToValueAtTime(0.0001, now + (fade?0.6:0.14)); }
    setTimeout(() => teardownLayer(layer), fade?700:180);
    layers.delete(id);
  }
  function toggleSound(id){
    ensureCtx(); if (ctx.state==='suspended') ctx.resume();
    if (layers.has(id)) removeLayer(id, true);
    else { layers.set(id, buildLayer(byId(id))); if (!masterPlaying) setPlaying(true); }
    reflectChips(); renderMixer(); reflectState(); persistMix(); updateMediaSession(); reflectTuner();
  }
  function toggleMaster(){
    if (layers.size===0){ if (pendingMix){ const m=pendingMix; pendingMix=null; loadMix(m, true); return; } nudge(); return; }
    ensureCtx();
    if (masterPlaying){ setPlaying(false); cancelTimer(); setTimerChips('off'); }   // 手动暂停 → 一并取消睡眠定时 + 入睡调光（D11②）
    else { if (ctx.state==='suspended') ctx.resume(); setPlaying(true); }
    reflectState();
  }
  function clearAll(){ [...layers.keys()].forEach(id => removeLayer(id, false)); setPlaying(false); reflectChips(); renderMixer(); reflectState(); cancelTimer(); setTimerChips('off'); persistMix(); updateMediaSession(); reflectTuner(); }
  function setLayerVol(id, v){ soundVol[id]=v/100; localStorage.setItem('lull.svol', JSON.stringify(soundVol)); const l=layers.get(id); if (l && l.gain && ctx){ const now=ctx.currentTime; l.gain.gain.cancelScheduledValues(now); l.gain.gain.setValueAtTime(Math.max(l.gain.gain.value,0.0001), now); l.gain.gain.linearRampToValueAtTime(layerTarget(id), now+0.12); } persistMixSoon(); }
  function setMasterVol(v){ masterVol=v; localStorage.setItem('lull.mvol', String(v)); $('vol-val').textContent=v; $('vol').style.setProperty('--fill', v+'%'); if (masterPlaying && ctx) rampMaster(masterTarget(), 0.15); }

  // ---------- 混音持久化 · 会话恢复 · URL 分享（F-5 / F-8）----------
  function currentMix(){ const m={}; layers.forEach((l,id)=>{ m[id]=Math.round(volOf(id)*100); }); return m; }
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
  function loadMix(mix, play){
    ensureCtx(); if (ctx.state==='suspended') ctx.resume();
    const ids=Object.keys(mix);
    [...layers.keys()].forEach(id=>{ if (!(id in mix)) removeLayer(id, true); });
    ids.forEach(id=>{ soundVol[id]=(mix[id]|0)/100; });
    localStorage.setItem('lull.svol', JSON.stringify(soundVol));
    ids.forEach(id=>{ if (layers.has(id)) setLayerVol(id, mix[id]); else layers.set(id, buildLayer(byId(id))); });
    if (play){ if (!masterPlaying) setPlaying(true); else if (ctx) rampMaster(masterTarget(), 0.3); }
    reflectChips(); renderMixer(); reflectState(); persistMix(); updateMediaSession(); reflectTuner();
  }
  function reflectResume(){
    const btn=$('resume');
    if (pendingMix && layers.size===0){
      const names=Object.keys(pendingMix).map(id=>byId(id)&&byId(id).name).filter(Boolean).slice(0,4).join(' · ');
      btn.textContent='继续上次 · '+names; btn.hidden=false;
    } else btn.hidden=true;
  }
  function initRestore(){
    pendingMix = parseMixHash();
    if (!pendingMix){
      try{ const ids=JSON.parse(localStorage.getItem('lull.mix')||'[]'); if (ids.length){ const m={}; ids.forEach(id=>{ if (byId(id)) m[id]=Math.round(volOf(id)*100); }); if (Object.keys(m).length) pendingMix=m; } }catch(e){}
    }
    reflectResume();
  }
  function shareMix(){
    const mix=currentMix(); if (!Object.keys(mix).length){ toast('先挑一些声音再分享'); return; }
    const url=location.origin+location.pathname+'#'+mixToHash(mix);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(()=>toast('混音链接已复制'), ()=>toast('复制失败 · 可手动复制地址栏'));
    else toast('可复制地址栏链接分享');
  }

  // ---------- 预设（F-4）----------
  const BUILTIN_PRESETS = [
    { id:'rainynight',    name:'雨夜', fm:88.1,  mix:{ hrain:62, storm:34, wind:22 } },
    { id:'morningforest', name:'晨林', fm:90.4,  mix:{ forest:60, birds:48, breeze:30 } },
    { id:'seaside',       name:'海边', fm:92.9,  mix:{ ocean:72, breeze:32, birds:18 } },
    { id:'fireside',      name:'炉边', fm:95.6,  mix:{ fire:70, wind:24, lrain:24 } },
    { id:'traincabin',    name:'车厢', fm:98.3,  mix:{ train:60, hrain:30, hum:22 } },
    { id:'deepspace',     name:'深空', fm:100.9, mix:{ brown:60, hum:34 } },
    { id:'sleeprain',     name:'雨眠', fm:103.1, mix:{ lrain:52, brown:42, hum:28 } },   // 助眠：无雷无鸟、纯连续音
  ];
  function customPresets(){ try{ return JSON.parse(localStorage.getItem('lull.presets')||'[]'); }catch(e){ return []; } }
  function saveCustomPresets(a){ localStorage.setItem('lull.presets', JSON.stringify(a)); }
  // ---------- 调频拨盘（电台）----------
  const FMIN=87.5, FMAX=108.0, SNAP=0.6;
  let curFm=88.1, dragging=false;
  function defaultCustomFm(cs, i){ const lo=102.0, hi=107.5; return cs.length<=1 ? 104.6 : +(lo+(hi-lo)*i/(cs.length-1)).toFixed(1); }
  function stations(){
    const cs=customPresets();
    const cfm=cs.map((p,i)=>({ ...p, custom:true, fm: (typeof p.fm==='number') ? p.fm : defaultCustomFm(cs,i) }));
    return BUILTIN_PRESETS.map(p=>({ ...p, custom:false })).concat(cfm);
  }
  function setCustomFm(id, fm){ saveCustomPresets(customPresets().map(p=> p.id===id ? { ...p, fm:+(+fm).toFixed(1) } : p)); }
  const fmToPct = fm => (fm-FMIN)/(FMAX-FMIN)*100;
  const pctToFm = pct => FMIN + (pct/100)*(FMAX-FMIN);
  function nearestStation(fm){ let best=null, bd=1e9; stations().forEach(s=>{ const d=Math.abs(s.fm-fm); if (d<bd){ bd=d; best=s; } }); return { s:best, d:bd }; }
  function currentSig(){ return [...layers.keys()].sort().join(','); }
  function matchStation(){ const sig=currentSig(); if (!sig) return null; return stations().find(s=> Object.keys(s.mix).sort().join(',')===sig ) || null; }

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
    stations().forEach(s=>{
      const b=document.createElement('button'); b.className='stn'+(s.custom?' custom':''); b.style.left=fmToPct(s.fm)+'%';
      b.textContent=s.name; b.dataset.id=s.id; b.title=s.name+' · '+s.fm.toFixed(1)+(s.custom?' MHz · 拖动改频率 · 长按删除':' MHz');
      if (s.custom) wireStationDrag(b, s);
      else b.addEventListener('click', e=>{ e.stopPropagation(); tuneTo(s, true); toast('已调到「'+s.name+'」· '+s.fm.toFixed(1)); });
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
      sd.fm=fm; b.style.left=fmToPct(fm)+'%'; b.title=s.name+' · '+fm.toFixed(1)+' MHz · 拖动改频率 · 长按删除';
      if (b.classList.contains('lit')) setNeedle(fm, false);
    });
    const end=()=>{ clearLp(); if (!sd) return; const { moved, fm }=sd; sd=null; b.classList.remove('dragging');
      if (moved){ setCustomFm(s.id, fm); renderDial(); toast('「'+s.name+'」移到 '+fm.toFixed(1)); }
      else { tuneTo(s, true); toast('已调到「'+s.name+'」· 长按此频道可删除'); } };
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', ()=>{ clearLp(); if (sd){ sd=null; b.classList.remove('dragging'); renderDial(); } });
  }
  function deleteStation(s){ if (!s) return; saveCustomPresets(customPresets().filter(q=>q.id!==s.id)); renderDial(); toast('已删除频道「'+s.name+'」'); }
  function setNeedle(fm, animate){
    curFm=fm; const dial=$('dial'); dial.classList.toggle('anim', !!animate);
    $('needle').style.left=fmToPct(fm)+'%';
    $('freq').textContent=fm.toFixed(1);
    dial.setAttribute('aria-valuenow', fm.toFixed(1));
  }
  function tuneTo(s, animate){
    if (!s) return;
    setNeedle(s.fm, animate);
    $('station-now').textContent=s.name; $('dial').setAttribute('aria-valuetext', s.name);
    document.body.classList.remove('tuning');
    document.querySelectorAll('#dial-stations .stn').forEach(b=> b.classList.remove('near'));
    loadMix(s.mix, true);            // loadMix 末尾会调用 reflectTuner()
  }
  function reflectTuner(){
    const dial=$('dial'), m=matchStation();
    document.querySelectorAll('#dial-stations .stn').forEach(b=> b.classList.toggle('lit', !!m && b.dataset.id===m.id));
    $('del-station').hidden = !(m && m.custom);
    if (m){ setNeedle(m.fm, true); $('station-now').textContent=m.name; dial.setAttribute('aria-valuetext', m.name); dial.classList.remove('manual'); }
    else if (layers.size===0){ setNeedle(FMIN, true); $('freq').textContent='— —'; $('station-now').textContent='静默 · 未调频'; dial.setAttribute('aria-valuetext','未调频'); dial.classList.remove('manual'); }
    else { $('station-now').textContent='手动调音'; dial.setAttribute('aria-valuetext','手动调音'); dial.classList.add('manual'); }
  }
  function delActiveStation(){ const m=matchStation(); if (m && m.custom) deleteStation(m); }

  function dialPointerFm(e){ const r=$('dial-inner').getBoundingClientRect(); const x=(e.clientX-r.left)/r.width; return pctToFm(Math.max(0,Math.min(1,x))*100); }
  function dialDrag(e){
    const fm=dialPointerFm(e); setNeedle(fm, false);
    const { s, d }=nearestStation(fm), near = s && d<SNAP;
    $('station-now').textContent = near ? ('» '+s.name) : ('调频中 · '+fm.toFixed(1));
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
  function initTuner(){
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
    renderScale(); renderDial();
  }
  function saveCurrentAsPreset(){
    const mix=currentMix(); if (!Object.keys(mix).length){ toast('先挑一些声音'); return; }
    const arr=customPresets(); if (arr.length>=8){ toast('自定义频道已满（上限 8）'); return; }
    const def='频道 '+(arr.length+1); let name=def;
    try{ const r=prompt('给这个频道起个名字', def); if (r===null) return; name=(r||def).trim().slice(0,10)||def; }catch(e){}
    const nfm=+Math.min(107.5, 102.4 + arr.length*1.2).toFixed(1);
    arr.push({ id:'c'+Date.now(), name, mix, fm:nfm }); saveCustomPresets(arr); renderDial(); toast('已存为频道「'+name+'」· '+nfm.toFixed(1)+' · 可拖动改位');
  }

  // ---------- 锁屏存活：Media Session + 保活（F-2）----------
  let keepEl=null;
  function silentWavUrl(){
    const rate=8000, len=rate, buf=new ArrayBuffer(44+len*2), v=new DataView(buf);
    const ws=(o,s)=>{ for(let i=0;i<s.length;i++) v.setUint8(o+i, s.charCodeAt(i)); };
    ws(0,'RIFF'); v.setUint32(4,36+len*2,true); ws(8,'WAVE'); ws(12,'fmt '); v.setUint32(16,16,true);
    v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,rate,true); v.setUint32(28,rate*2,true);
    v.setUint16(32,2,true); v.setUint16(34,16,true); ws(36,'data'); v.setUint32(40,len*2,true);
    return URL.createObjectURL(new Blob([buf],{type:'audio/wav'}));
  }
  function setupKeepAlive(){
    if (keepEl) return;
    try{
      keepEl=new Audio(silentWavUrl()); keepEl.loop=true; keepEl.preload='auto'; keepEl.setAttribute('playsinline',''); keepEl.volume=1;
      keepEl.addEventListener('pause', () => { if (masterPlaying) attemptRecover(); });   // 中断暂停了保活元素 → 自愈（D7）
    }catch(e){ keepEl=null; }
  }
  function keepAlive(on){ if (!keepEl) return; if (on){ const p=keepEl.play(); if (p&&p.catch) p.catch(()=>{}); } else { try{ keepEl.pause(); }catch(e){} } }
  // ---- 系统中断自动恢复（F-2 / D7）：无需解锁亮屏，中断结束后 ≤5s 自动重拉播放 ----
  let recoverT=0;
  function attemptRecover(){
    clearTimeout(recoverT);
    if (!masterPlaying || !ctx) return;
    if (ctx.state !== 'running'){ const p=ctx.resume(); if (p&&p.catch) p.catch(()=>{}); }
    keepAlive(true);
    if (ctx.state === 'running') return;                 // 已恢复
    recoverT = setTimeout(attemptRecover, 1500);         // 中断仍在 → 每 1.5s 重试（累计 ≤5s 内恢复）
  }
  function setupMediaSession(){
    if (!('mediaSession' in navigator)) return;
    try{
      navigator.mediaSession.setActionHandler('play', ()=>{ if (layers.size){ ensureCtx(); if (ctx.state==='suspended') ctx.resume(); setPlaying(true); reflectState(); } });
      navigator.mediaSession.setActionHandler('pause', ()=>{ setPlaying(false); cancelTimer(); setTimerChips('off'); reflectState(); });   // 锁屏暂停同样取消定时（D11②）
      navigator.mediaSession.setActionHandler('stop', ()=>{ setPlaying(false); cancelTimer(); setTimerChips('off'); reflectState(); });
    }catch(e){}
  }
  function updateMediaSession(){
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

  // ---------- toast ----------
  let toastT=0;
  function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'), 2600); }

  // ---------- UI ----------
  let flashT=0;
  function flashState(msg){ $('mixline').textContent = msg; clearTimeout(flashT); flashT = setTimeout(reflectState, 1800); }
  function nudge(){ const b=$('play'); b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge'); flashState('先从下面挑一种声音'); }

  function reflectPlay(){
    const btn = $('play'); btn.classList.toggle('playing', masterPlaying);
    btn.setAttribute('aria-pressed', String(masterPlaying)); btn.setAttribute('aria-label', masterPlaying?'暂停':'播放');
    $('play-ico').innerHTML = masterPlaying
      ? '<rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/>'
      : '<path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z"/>';
  }
  const POEMS = { 'storm':'雷雨将至','hrain':'雨落如帘','lrain':'檐下细雨','ocean':'潮汐往复','forest':'林间有风','birds':'晨鸟啁啾','insects':'虫鸣阵阵','fall':'水声轰鸣','stream':'溪流潺潺','wind':'风过旷野','breeze':'微风拂面','snow':'落雪无声','white':'一片纯净','pink':'柔和绵长','brown':'低沉温厚','fan':'室内静谧','ac':'凉夜微鸣','hum':'低鸣入眠','fire':'篝火噼啪','cafe':'咖啡馆微响','train':'夜行列车','subway':'地下轰隆','pages':'书页翻动','tick':'滴答入夜','purr':'猫眠呼噜','bowl':'钵音绵长' };
  function stationLine(st){ let best=null, bv=-1; Object.keys(st.mix).forEach(id=>{ if (st.mix[id]>bv){ bv=st.mix[id]; best=id; } }); return (best && POEMS[best]) || st.name; }
  function reflectState(){
    const n = layers.size, ids = [...layers.keys()];
    $('now').innerHTML = n===0 ? '静默' : (masterPlaying?'PLAYING · ':'PAUSED · ') + '<b>'+n+'</b> 层';
    if (n===0){ $('mixline').textContent = '挑选声音，编织今晚的氛围'; return; }
    const st = matchStation();
    if (st){ $('mixline').textContent = stationLine(st); return; }
    if (n===1){ $('mixline').textContent = POEMS[ids[0]] || byId(ids[0]).name; return; }
    $('mixline').textContent = ids.map(i=>byId(i).name).join(' · ');
  }
  function reflectChips(){ document.querySelectorAll('#sounds .cell').forEach(c => { const on = layers.has(c.dataset.id); c.setAttribute('aria-pressed', String(on)); c.style.background = on ? byId(c.dataset.id).color : ''; }); }

  function renderMixer(){
    const box = $('mixer'), wrap = $('mixer-wrap'); box.innerHTML='';
    wrap.classList.toggle('empty-hide', layers.size===0);
    if (layers.size===0) return;
    layers.forEach((layer, id) => {
      const s = byId(id);
      const row = document.createElement('div'); row.className='layer';
      const sw = document.createElement('span'); sw.className='swatch'; sw.style.background = s.color;
      const nm = document.createElement('span'); nm.className='nm'; nm.textContent = s.name;
      const sl = document.createElement('input'); sl.type='range'; sl.min=0; sl.max=100;
      const v = Math.round(volOf(id)*100); sl.value=v; sl.style.setProperty('--fill', v+'%'); sl.setAttribute('aria-label', s.name+' 音量');
      sl.addEventListener('input', e => { const val=parseInt(e.target.value,10); e.target.style.setProperty('--fill', val+'%'); setLayerVol(id, val); });
      const rm = document.createElement('button'); rm.className='rm'; rm.setAttribute('aria-label','移除 '+s.name);
      rm.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      rm.addEventListener('click', () => toggleSound(id));
      row.append(sw, nm, sl, rm); box.appendChild(row);
    });
  }

  let activeCat = CATS[0].id;
  const tabsEl = $('tabs');
  CATS.forEach(c => { const t=document.createElement('button'); t.className='tab'; t.setAttribute('role','tab'); t.dataset.cat=c.id; t.textContent=c.name; t.setAttribute('aria-selected', String(c.id===activeCat)); t.addEventListener('click', () => { activeCat=c.id; renderTabs(); renderChips(); }); tabsEl.appendChild(t); });
  function renderTabs(){ document.querySelectorAll('#tabs .tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.cat===activeCat))); }
  function renderChips(){
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
      variantSet(p, id); if (p.onSelect) p.onSelect(id); enableIfBound();
      toast('已选「'+nm+'」'); reflectVariantChips(p); return;
    }
    const set=new Set(variantGet(p));
    if (set.has(id)){
      if (set.size <= (p.min||0)){ toast('至少留一种'); return; }
      set.delete(id); variantSet(p, [...set]); toast('已收起「'+nm+'」');
    } else {
      set.add(id); variantSet(p, [...set]); enableIfBound(); toast('已加入「'+nm+'」');
    }
    reflectVariantChips(p);
  }
  function reflectVariantChips(p){
    const cur=variantGet(p); const on=id=> p.mode==='single' ? cur===id : cur.includes(id);
    document.querySelectorAll('.bird-chip[data-pk="'+p.key+'"]').forEach(b=> b.setAttribute('aria-pressed', String(on(b.dataset.m))));
  }

  // 定时
  let timerEnd=0, timerTick=null, timerFading=false;
  function cancelTimer(){ if (timerTick){ clearInterval(timerTick); timerTick=null; } timerEnd=0; timerFading=false; $('countdown').textContent=''; stopDim(); }
  function setTimerChips(id){ document.querySelectorAll('#timers .tchip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.id===id))); }
  function setTimer(mins, id){
    setTimerChips(id); cancelTimer(); if (!mins) return;
    if (layers.size===0){ nudge(); setTimerChips('off'); return; }
    if (!masterPlaying){ ensureCtx(); if (ctx.state==='suspended') ctx.resume(); setPlaying(true); reflectState(); }
    startDim(mins);                                    // 入睡调光：声音渐隐的视觉对应物（F-9）
    timerEnd = Date.now() + mins*60000;
    timerTick = setInterval(() => { const left = timerEnd - Date.now();
      if (left<=0){ cancelTimer(); setTimerChips('off'); setPlaying(false); reflectState(); return; }
      if (left<=20000 && masterPlaying && !timerFading){ timerFading=true; if (ctx) rampMaster(0, left/1000); }
      const s=Math.ceil(left/1000), m=Math.floor(s/60), ss=String(s%60).padStart(2,'0'); $('countdown').textContent = m+':'+ss;
    }, 250);
  }
  const TIMERS = [['off','关'],['15','15'],['30','30'],['45','45'],['60','60'],['90','90']];
  TIMERS.forEach(([id,label]) => { const b=document.createElement('button'); b.className='tchip'; b.dataset.id=id; b.setAttribute('aria-pressed', String(id==='off')); b.textContent=label; b.addEventListener('click', () => setTimer(id==='off'?0:parseInt(id,10), id)); $('timers').appendChild(b); });

  // 时钟（页面隐藏时停跳 F-5；秒针可切换 + 防烧屏漂移 F-9）
  let clockTimer=0;
  let showSec = localStorage.getItem('lull.showSec'); showSec = showSec===null ? true : showSec==='1';
  function tickClock(){
    const d = new Date(), hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0'), ss = String(d.getSeconds()).padStart(2,'0');
    $('clock').innerHTML = hh+':'+mm + (showSec ? '<span class="sec">'+ss+'</span>' : '');
    const wd = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
    $('datemeta').textContent = (d.getMonth()+1)+'月'+d.getDate()+'日 · '+wd;
    // 防烧屏：每分钟缓慢改变时钟位移，OLED 挂机 8h 无固定高对比常驻像素
    const mins = d.getHours()*60 + d.getMinutes();
    $('clock').style.transform = 'translate('+(Math.sin(mins*0.7)*7).toFixed(1)+'px,'+(Math.cos(mins*0.9)*5).toFixed(1)+'px)';
    clockTimer = setTimeout(tickClock, 1000 - (Date.now()%1000));
  }
  function startClock(){ if (clockTimer) return; tickClock(); }
  function stopClock(){ if (clockTimer){ clearTimeout(clockTimer); clockTimer=0; } }
  function toggleSeconds(){ showSec=!showSec; localStorage.setItem('lull.showSec', showSec?'1':'0'); clearTimeout(clockTimer); clockTimer=0; tickClock(); }
  startClock();

  // ---------- 生成式场景 ----------
  const scene = (() => {
    const cv = $('scene'), g = cv.getContext('2d');
    let W=0, H=0, dpr=1, lastT=performance.now();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stars=[], rainP=[], windP=[], motes=[], sparks=[], flashes=[], emberP=[], bokehP=[], railP=[], snowP=[], ripples=[], birdsP=[];
    let oceanPhase=0;
    // 帧率自适应 + 后台停画（F-2 / F-5）
    let running=true, frameReq=0, lastFrame=0;
    const FAST = new Set(['rain','fire','birds','grain','wind','rail','ocean','snow']);   // snow 是连续粒子系统，应保持满帧（D11③）
    function hasFast(){ if (!masterPlaying) return false; for (const id of layers.keys()){ if (FAST.has(byId(id).paint)) return true; } return false; }

    function hexToRgb(h){ h=h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
    function themeVar(name){ return getComputedStyle(root).getPropertyValue(name).trim(); }

    function resize(){
      dpr = Math.min(devicePixelRatio||1, 2); W = innerWidth; H = innerHeight;
      cv.width = W*dpr; cv.height = H*dpr; g.setTransform(dpr,0,0,dpr,0,0);
      // 粒子密度按屏幕面积缩放（F-9）：小屏保底、4K 增密，仍设上限防性能失控
      const areaK = Math.max(0.7, Math.min(3, (W*H)/(1280*760)));
      const N = (base, mult) => Math.max(1, Math.round(base * Math.min(areaK, mult||3)));
      stars.length=0; for (let i=0;i<N(80);i++) stars.push({x:rand()*W, y:rand()*H*0.75, r:rand()*1.2+0.3, ph:rand()*6.28});
      rainP.length=0; for (let i=0;i<N(200,2.6);i++) rainP.push({x:rand()*W, y:rand()*H, len:8+rand()*16, sp:6+rand()*7});
      windP.length=0; for (let i=0;i<N(70);i++) windP.push({x:rand()*W, y:rand()*H*0.9, len:20+rand()*50, sp:1.5+rand()*3, o:0.2+rand()*0.5});
      motes.length=0; for (let i=0;i<N(55);i++) motes.push({x:rand()*W, y:rand()*H, r:rand()*2+0.6, ph:rand()*6.28, dx:(rand()-0.5)*0.3, dy:-(0.1+rand()*0.35)});
      emberP.length=0; for (let i=0;i<N(60);i++) emberP.push({x:W*(0.3+rand()*0.4), y:H*(0.7+rand()*0.3), r:rand()*1.6+0.6, sp:0.3+rand()*0.9, ph:rand()*6.28, dx:(rand()-0.5)*0.3});
      bokehP.length=0; for (let i=0;i<N(24,1.8);i++) bokehP.push({x:rand()*W, y:rand()*H, r:20+rand()*60, ph:rand()*6.28, dx:(rand()-0.5)*0.15, dy:(rand()-0.5)*0.1});
      railP.length=0; for (let i=0;i<N(40);i++) railP.push({x:rand()*W, y:rand()*H*0.85, len:40+rand()*80, sp:10+rand()*10, o:0.15+rand()*0.4});
      snowP.length=0; for (let i=0;i<N(90,2.6);i++) snowP.push({x:rand()*W, y:rand()*H, r:rand()*1.8+0.7, sp:0.5+rand()*1.1, drift:(rand()-0.5)*0.6, ph:rand()*6.28, a:0.5+rand()*0.5});
      birdsP.length=0; for (let i=0;i<N(46,1.8);i++) birdsP.push({x:rand()*W, y:rand()*H*0.72, r:rand()*1.5+0.5, sp:0.12+rand()*0.5, dx:(rand()-0.5)*0.5, ph:rand()*6.28});   // 鸟鸣：金色羽尘/光点漂移（D12）
    }

    // 各气象强度（依据当前混音 + 音量）
    function intensity(paint){
      let s = 0;
      layers.forEach((l, id) => { const c=byId(id); if (c.paint===paint){ s += volOf(id) * (masterVol/100) * (masterPlaying?1:0.35); } });
      return Math.min(1, s);
    }
    function tintOf(paint, fallback){
      let best=null, bv=0; layers.forEach((l,id)=>{ const c=byId(id); if (c.paint===paint){ const v=volOf(id); if (v>=bv){ bv=v; best=c.color; } } });
      return best || fallback;
    }

    function draw(now){
      if (!running || document.hidden){ running=false; frameReq=0; return; }        // 后台：停画（音频调度继续）
      const minInt = hasFast() ? 0 : 33;                                              // 无高频动效 → 降至 ~30fps
      if (now - lastFrame < minInt){ frameReq=requestAnimationFrame(draw); return; }
      lastFrame = now;
      const dt = Math.min(0.05, (now-lastT)/1000); lastT = now;
      const dark = curTheme()==='dark';
      // 背景
      const top = themeVar('--scene-top'), bot = themeVar('--scene-bot');
      const bg = g.createLinearGradient(0,0,0,H); bg.addColorStop(0,top); bg.addColorStop(1,bot);
      g.fillStyle = bg; g.fillRect(0,0,W,H);

      // 极光辉带（环境）
      const auroraI = 0.5 + 0.5*intensity('forest') + 0.4*intensity('ocean');
      drawAurora(now, dark?0.5:0.28);

      // 星空（夜）
      if (dark){ const sa = 0.5 - 0.35*intensity('grain'); for (const st of stars){ const tw = reduce?0.6:(0.5+0.5*Math.sin(now/900+st.ph)); g.globalAlpha = sa*tw*0.8; g.fillStyle='#dfe8ff'; g.beginPath(); g.arc(st.x,st.y,st.r,0,6.283); g.fill(); } g.globalAlpha=1; }

      // 海浪
      const io = intensity('ocean'); if (io>0.01) drawOcean(io, tintOf('ocean','#5fd0c0'), dt, dark);
      // 雾（溪流/瀑布）
      const im = intensity('mist'); if (im>0.01) drawMotesLike(im, tintOf('mist','#a8e0ff'), 0.5, now, true);
      // 森林浮尘
      const ifo = intensity('forest'); if (ifo>0.01) drawMotesLike(ifo, tintOf('forest','#7fd08a'), 1, now, false);
      // 风
      const iw = intensity('wind'); if (iw>0.01) drawWind(iw, tintOf('wind','#bfe6cf'), dt, dark);
      // 雨
      const ir = intensity('rain'); if (ir>0.01) drawRain(ir, tintOf('rain','#9cc2ff'), dt, dark);
      // 落雪
      const isn = intensity('snow'); if (isn>0.01) drawSnow(isn, tintOf('snow','#dbe7ff'), now, dt);
      // 室内薄雾（呼吸）
      const ih = intensity('haze'); if (ih>0.01){ const p=0.5+0.5*Math.sin(now/2600); g.globalAlpha=ih*0.12*(0.6+0.4*p); const rg=g.createRadialGradient(W/2,H*0.55,0,W/2,H*0.55,Math.max(W,H)*0.7); const [r,gg,bb]=hexToRgb(tintOf('haze','#b6c4d0')); rg.addColorStop(0,`rgba(${r},${gg},${bb},1)`); rg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=rg; g.fillRect(0,0,W,H); g.globalAlpha=1; }

      // 火车轨迹 / 咖啡馆光斑 / 篝火 / 颂钵涟漪
      const irl = intensity('rail'); if (irl>0.01) drawRail(irl, tintOf('rail','#b9c4cf'), dt);
      const ibk = intensity('bokeh'); if (ibk>0.01) drawBokeh(ibk, tintOf('bokeh','#ffc59a'), now);
      const ifire = intensity('fire'); if (ifire>0.01) drawFire(ifire, tintOf('fire','#ff9a5a'), now, dt);
      drawRipplesBase(intensity('ripple'), tintOf('ripple','#e6d3a0'), now, dt);

      // 鸟鸣连续画法：金色羽尘缓升 + 灵动闪烁（D12，与密度联动）；事件火花在其上迸发
      const ibd = intensity('birds'); if (ibd>0.01) drawBirds(ibd, tintOf('birds','#ffd48a'), now, dt);
      // 鸟鸣火花
      for (let i=sparks.length-1;i>=0;i--){ const s=sparks[i]; s.age+=dt; const k=s.age/s.life; if (k>=1){ sparks.splice(i,1); continue; }
        const [r,gg,bb]=hexToRgb(s.color); const a=(1-k); g.globalAlpha=a*0.9; g.fillStyle=`rgba(${r},${gg},${bb},1)`;
        const y = s.y - k*38; g.beginPath(); g.arc(s.x, y, 2.4*(1-k*0.4), 0, 6.283); g.fill();
        g.globalAlpha=a*0.35; g.beginPath(); g.arc(s.x, y, 7*(1-k*0.3), 0, 6.283); g.fill(); g.globalAlpha=1; }

      // 噪点颗粒
      const ig = intensity('grain'); if (ig>0.01) drawGrain(ig, tintOf('grain','#cfe3ff'));

      // 闪电
      for (let i=flashes.length-1;i>=0;i--){ const f=flashes[i]; f.age+=dt; const k=f.age/f.life; if (k>=1){ flashes.splice(i,1); continue; }
        const a = (1-k)*(1-k)*0.5; g.globalAlpha=a; g.fillStyle = dark?'#eaf4ff':'#ffffff'; g.fillRect(0,0,W,H); g.globalAlpha=1; }

      // 暗角
      const vg = g.createRadialGradient(W/2,H*0.42,Math.min(W,H)*0.2, W/2,H*0.5,Math.max(W,H)*0.75);
      vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1, dark?'rgba(0,0,0,0.42)':'rgba(20,40,36,0.10)');
      g.fillStyle=vg; g.fillRect(0,0,W,H);

      frameReq = requestAnimationFrame(draw);
    }

    function drawAurora(now, alpha){
      const t = reduce?0:now/9000;
      for (let k=0;k<2;k++){
        const col = k===0 ? themeVar('--aurora') : themeVar('--aurora-2');
        const [r,gg,bb]=hexToRgb(col);
        const cx = W*(0.3+0.4*Math.sin(t+k*2)), cy = H*(0.28+0.1*Math.cos(t*0.8+k));
        const rg = g.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*0.6);
        rg.addColorStop(0,`rgba(${r},${gg},${bb},${alpha*0.5})`); rg.addColorStop(1,`rgba(${r},${gg},${bb},0)`);
        g.fillStyle=rg; g.fillRect(0,0,W,H);
      }
    }
    function drawOcean(I, col, dt, dark){
      oceanPhase += dt*(0.5); const [r,gg,bb]=hexToRgb(col);
      const baseY = H*(0.72 - 0.05*I); const bands=5;
      for (let b=0;b<bands;b++){
        const yy = baseY + b*(H-baseY)/bands;
        const amp = (8+b*4)*I, ph = oceanPhase + b*0.7;
        g.beginPath(); g.moveTo(0, yy);
        for (let x=0;x<=W;x+=14){ const y = yy + Math.sin(x/120 + ph)*amp + Math.sin(x/47 - ph*1.3)*amp*0.4; g.lineTo(x,y); }
        g.lineTo(W,H); g.lineTo(0,H); g.closePath();
        g.fillStyle = `rgba(${r},${gg},${bb},${0.06*I + b*0.02*I})`; g.fill();
      }
    }
    function drawMotesLike(I, col, sizeK, now, rising){
      const [r,gg,bb]=hexToRgb(col); const count = Math.floor(motes.length*I);
      for (let i=0;i<count;i++){ const m=motes[i];
        if (!reduce){ m.x += m.dx; m.y += (rising?m.dy:m.dy*0.4); if (m.y<-5){ m.y=H+5; m.x=rand()*W; } if (m.x<-5) m.x=W+5; if (m.x>W+5) m.x=-5; }
        const tw = 0.5+0.5*Math.sin(now/700+m.ph); g.globalAlpha = I*0.5*tw;
        g.fillStyle=`rgba(${r},${gg},${bb},1)`; g.beginPath(); g.arc(m.x, m.y, m.r*sizeK, 0, 6.283); g.fill();
      }
      g.globalAlpha=1;
    }
    function drawWind(I, col, dt, dark){
      const [r,gg,bb]=hexToRgb(col); const count=Math.floor(windP.length*I);
      for (let i=0;i<count;i++){ const p=windP[i]; if (!reduce){ p.x += p.sp*(0.6+I)* (dt*60); if (p.x>W+p.len){ p.x=-p.len; p.y=rand()*H*0.9; } }
        g.strokeStyle=`rgba(${r},${gg},${bb},${p.o*I*0.5})`; g.lineWidth=1; g.beginPath(); g.moveTo(p.x,p.y); g.lineTo(p.x+p.len,p.y - p.len*0.12); g.stroke(); }
    }
    function drawSnow(I, col, now, dt){
      const [r,gg,bb]=hexToRgb(col); const count=Math.floor(snowP.length*I);
      for (let i=0;i<count;i++){ const p=snowP[i];
        if (!reduce){ p.y += p.sp*(0.4+0.6*I)*(dt*60); p.x += (p.drift + Math.sin(now/1400+p.ph)*0.4)*(dt*60);
          if (p.y>H+4){ p.y=-4; p.x=rand()*W; } if (p.x<-6) p.x=W+6; if (p.x>W+6) p.x=-6; }
        g.globalAlpha=I*0.7*p.a; g.fillStyle=`rgba(${r},${gg},${bb},1)`;
        g.beginPath(); g.arc(p.x,p.y,p.r,0,6.283); g.fill(); }
      g.globalAlpha=1;
    }
    // 鸟鸣：金色羽尘缓缓上升 + 横向轻漂 + 比浮尘更灵动的闪烁（画面是鸟鸣的镜像，D12）
    function drawBirds(I, col, now, dt){
      const [r,gg,bb]=hexToRgb(col); const count=Math.floor(birdsP.length*I);
      for (let i=0;i<count;i++){ const p=birdsP[i];
        if (!reduce){ p.y -= p.sp*(0.4+I)*(dt*60); p.x += (p.dx + Math.sin(now/1800+p.ph)*0.35)*(dt*60);
          if (p.y<-6){ p.y=H*0.72+rand()*H*0.28; p.x=rand()*W; } if (p.x<-6) p.x=W+6; if (p.x>W+6) p.x=-6; }
        const tw=0.4+0.6*Math.sin(now/460+p.ph*2);            // 快而不匀的闪烁 = 鸟鸣的灵动
        g.globalAlpha=I*0.6*Math.max(0,tw); g.fillStyle=`rgba(${r},${gg},${bb},1)`;
        g.beginPath(); g.arc(p.x,p.y,p.r,0,6.283); g.fill();
        g.globalAlpha=I*0.16*Math.max(0,tw); g.beginPath(); g.arc(p.x,p.y,p.r*3.4,0,6.283); g.fill();   // 柔光晕
      }
      g.globalAlpha=1;
    }
    function drawRain(I, col, dt, dark){
      const [r,gg,bb]=hexToRgb(col); const count=Math.floor(rainP.length*I);
      g.lineWidth=1.1;
      for (let i=0;i<count;i++){ const p=rainP[i]; if (!reduce){ p.y += p.sp*(0.8+I)*(dt*60); p.x += p.sp*0.18*(dt*60); if (p.y>H){ p.y=-p.len; p.x=rand()*W; } }
        g.strokeStyle=`rgba(${r},${gg},${bb},${0.28*I})`; g.beginPath(); g.moveTo(p.x,p.y); g.lineTo(p.x - 2, p.y+p.len); g.stroke(); }
    }
    let grainTile=null;
    function drawGrain(I, col){
      if (!grainTile){ grainTile=document.createElement('canvas'); grainTile.width=128; grainTile.height=128; const tg=grainTile.getContext('2d'); const img=tg.createImageData(128,128); for (let i=0;i<img.data.length;i+=4){ const v=Math.floor(rand()*255); img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=255; } tg.putImageData(img,0,0); }
      const [r,gg,bb]=hexToRgb(col);
      g.save(); g.globalAlpha = I*0.06; g.globalCompositeOperation='overlay';
      const ox = reduce?0:Math.floor(rand()*128), oy = reduce?0:Math.floor(rand()*128);
      for (let x=-ox;x<W;x+=128) for (let y=-oy;y<H;y+=128) g.drawImage(grainTile,x,y);
      g.globalCompositeOperation='source-over'; g.globalAlpha=I*0.05; g.fillStyle=`rgb(${r},${gg},${bb})`; g.fillRect(0,0,W,H); g.restore();
    }

    function drawFire(I, col, now, dt){
      const [r,gg,bb]=hexToRgb(col);
      const flick = 0.72 + 0.28*Math.sin(now/120)*Math.sin(now/57);
      const rg=g.createRadialGradient(W/2,H,0,W/2,H,Math.max(W,H)*0.55*(0.7+0.3*I));
      rg.addColorStop(0,`rgba(${r},${gg},${bb},${0.22*I*flick})`); rg.addColorStop(1,`rgba(${r},${gg},${bb},0)`);
      g.fillStyle=rg; g.fillRect(0,0,W,H);
      const count=Math.floor(emberP.length*I);
      for (let i=0;i<count;i++){ const p=emberP[i];
        if (!reduce){ p.y-=p.sp*(0.5+I)*(dt*60); p.x+=p.dx+Math.sin(now/500+p.ph)*0.3; if (p.y<H*0.32){ p.y=H*(0.9+rand()*0.1); p.x=W*(0.3+rand()*0.4); } }
        const tw=0.5+0.5*Math.sin(now/200+p.ph); g.globalAlpha=I*0.8*tw; g.fillStyle=`rgba(${r},${gg},${bb},1)`;
        g.beginPath(); g.arc(p.x,p.y,p.r,0,6.283); g.fill(); }
      g.globalAlpha=1;
    }
    function drawBokeh(I, col, now){
      const [r,gg,bb]=hexToRgb(col); const count=Math.min(bokehP.length, Math.floor(bokehP.length*I)+2);
      for (let i=0;i<count;i++){ const p=bokehP[i];
        if (!reduce){ p.x+=p.dx; p.y+=p.dy; if (p.x<-90) p.x=W+90; if (p.x>W+90) p.x=-90; if (p.y<-90) p.y=H+90; if (p.y>H+90) p.y=-90; }
        const tw=0.6+0.4*Math.sin(now/1500+p.ph); const rg=g.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
        rg.addColorStop(0,`rgba(${r},${gg},${bb},${0.10*I*tw})`); rg.addColorStop(0.7,`rgba(${r},${gg},${bb},${0.04*I*tw})`); rg.addColorStop(1,`rgba(${r},${gg},${bb},0)`);
        g.fillStyle=rg; g.beginPath(); g.arc(p.x,p.y,p.r,0,6.283); g.fill(); }
    }
    function drawRail(I, col, dt){
      const [r,gg,bb]=hexToRgb(col); const count=Math.floor(railP.length*I); g.lineWidth=1.4;
      for (let i=0;i<count;i++){ const p=railP[i];
        if (!reduce){ p.x-=p.sp*(0.8+I)*(dt*60); if (p.x<-p.len){ p.x=W+p.len; p.y=rand()*H*0.85; } }
        g.strokeStyle=`rgba(${r},${gg},${bb},${p.o*I*0.5})`; g.beginPath(); g.moveTo(p.x,p.y); g.lineTo(p.x+p.len,p.y); g.stroke(); }
    }
    function drawRipplesBase(I, col, now, dt){
      const [r,gg,bb]=hexToRgb(col);
      if (I>0.01){ const p=0.5+0.5*Math.sin(now/2400); const rg=g.createRadialGradient(W/2,H*0.44,0,W/2,H*0.44,Math.max(W,H)*0.5);
        rg.addColorStop(0,`rgba(${r},${gg},${bb},${0.12*I*(0.6+0.4*p)})`); rg.addColorStop(1,`rgba(${r},${gg},${bb},0)`); g.fillStyle=rg; g.fillRect(0,0,W,H); }
      for (let i=ripples.length-1;i>=0;i--){ const rp=ripples[i]; rp.age+=dt; const k=rp.age/rp.life; if (k>=1){ ripples.splice(i,1); continue; }
        const rad=40+k*Math.max(W,H)*0.5, a=(1-k)*0.4, c2=hexToRgb(rp.color);
        g.globalAlpha=a; g.strokeStyle=`rgba(${c2[0]},${c2[1]},${c2[2]},1)`; g.lineWidth=2*(1-k); g.beginPath(); g.arc(W/2,H*0.44,rad,0,6.283); g.stroke(); }
      g.globalAlpha=1;
    }

    function clearFX(){ sparks.length=0; flashes.length=0; ripples.length=0; }
    function pause(){ running=false; if (frameReq) cancelAnimationFrame(frameReq); frameReq=0; clearFX(); }
    function resume(){ if (running) return; running=true; lastT=performance.now(); lastFrame=0; frameReq=requestAnimationFrame(draw); }

    addEventListener('resize', resize); resize(); frameReq=requestAnimationFrame(draw);
    return {
      pause, resume, clear:clearFX,
      spark(color){ if (!running||document.hidden) return; sparks.push({x: W*(0.2+rand()*0.6), y: H*(0.25+rand()*0.35), age:0, life:1.1+rand()*0.5, color}); },
      lightning(){ if (!running||document.hidden) return; flashes.push({age:0, life:0.55}); },
      ember(color){ if (!running||document.hidden) return; sparks.push({x: W*(0.34+rand()*0.32), y: H*(0.80+rand()*0.1), age:0, life:0.8+rand()*0.5, color}); },
      ripple(color){ if (!running||document.hidden) return; ripples.push({age:0, life:5.5, color}); },
    };
  })();

  // ---------- 沉浸挂机模式（F-9）：Wake Lock · 自动隐藏 UI · 全屏 · 入睡调光 ----------
  // 屏幕常亮：仅「播放且页面可见」时持有；不支持则一次性降级提示
  let wakeLock=null, wakeNoticed=false;
  async function requestWakeLock(){
    if (!('wakeLock' in navigator)){ if (!wakeNoticed){ wakeNoticed=true; toast('本机不支持屏幕常亮 · 挂机请手动保持亮屏'); } return; }
    if (wakeLock || document.hidden || !masterPlaying) return;
    try{ wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', ()=>{ wakeLock=null; }); }catch(e){ wakeLock=null; }
  }
  function releaseWakeLock(){ if (wakeLock){ try{ wakeLock.release(); }catch(e){} wakeLock=null; } }

  // 沉浸态：播放中 8s 无交互 → 隐藏控制台与光标、时钟放大；任意输入立即恢复
  let idleT=0;
  function scheduleImmersive(){ clearTimeout(idleT); if (masterPlaying && !document.hidden) idleT=setTimeout(enterImmersive, 8000); }
  function enterImmersive(){ if (!masterPlaying) return; document.body.classList.remove('waking'); document.body.classList.add('immersive'); }
  function exitImmersive(){ if (document.body.classList.contains('immersive')){ document.body.classList.add('waking'); document.body.classList.remove('immersive'); } }
  function wake(){ exitImmersive(); scheduleImmersive(); }
  function reflectImmersive(){
    if (masterPlaying){ requestWakeLock(); scheduleImmersive(); }
    else { releaseWakeLock(); exitImmersive(); clearTimeout(idleT); }
  }
  ['pointermove','pointerdown','wheel','touchstart'].forEach(ev => addEventListener(ev, wake, {passive:true}));

  // 全屏
  function toggleFullscreen(){
    const el=document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement){
      const r=el.requestFullscreen||el.webkitRequestFullscreen;
      if (r){ const p=r.call(el); if (p&&p.catch) p.catch(()=>{}); } else toast('此浏览器不支持全屏');
    } else { (document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document); }
  }
  function reflectFs(){
    const on=!!(document.fullscreenElement||document.webkitFullscreenElement);
    $('fs-ico').innerHTML = on
      ? '<path d="M9 4v3a2 2 0 0 1-2 2H4M20 9h-3a2 2 0 0 1-2-2V4M4 15h3a2 2 0 0 1 2 2v3M15 20v-3a2 2 0 0 1 2-2h3"/>'
      : '<path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/>';
    $('fullscreen').setAttribute('aria-label', on?'退出全屏（F）':'全屏（F）');
  }
  document.addEventListener('fullscreenchange', reflectFs);
  document.addEventListener('webkitfullscreenchange', reflectFs);

  // 入睡调光：定时器启动后画面/UI 亮度数分钟内渐降至约 30%（reduced-motion 直接到位）
  function startDim(mins){
    const veil=$('dim-veil'), reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ramp=Math.min(mins*60*0.6, 240);
    veil.style.transition = reduce ? 'none' : ('opacity '+ramp+'s linear');
    void veil.offsetWidth; veil.style.opacity='0.7';
  }
  function stopDim(){ const veil=$('dim-veil'); veil.style.transition='opacity 1.6s ease'; void veil.offsetWidth; veil.style.opacity='0'; }

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
    else if (e.key>='1'&&e.key<='6'){ if (guarded) return; const p=BUILTIN_PRESETS[+e.key-1]; if (p){ tuneTo(p, true); toast('已调到「'+p.name+'」· '+p.fm.toFixed(1)); } }
  });

  // ---------- 事件 & 初始化 ----------
  $('play').addEventListener('click', toggleMaster);
  $('fullscreen').addEventListener('click', toggleFullscreen);
  $('clock').addEventListener('click', toggleSeconds);
  $('clock').addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); toggleSeconds(); } });
  $('clear').addEventListener('click', clearAll);
  $('share').addEventListener('click', shareMix);
  $('save-preset').addEventListener('click', saveCurrentAsPreset);
  $('resume').addEventListener('click', () => { if (pendingMix){ const m=pendingMix; pendingMix=null; loadMix(m, true); } });
  const volEl = $('vol'); volEl.value = masterVol; volEl.addEventListener('input', e => setMasterVol(parseInt(e.target.value,10)));

  // 可见性：后台省电（停画/停钟 + 释放 Wake Lock），回前台恢复音频/画面/常亮（F-2 / F-5 / F-9）
  document.addEventListener('visibilitychange', () => {
    if (document.hidden){ scene.pause(); stopClock(); releaseWakeLock(); clearTimeout(idleT); }
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
})();

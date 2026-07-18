// 事件型合成：雷/鸟/虫/篝火/咖啡/火车/滴答/翻书/颂钵的调度器与音节合成。
// 加一个声音的「声部」：写它的 schedule*/phrase，在 wireSynthEvents 里按 cfg 标志挂上。
import { ctx, buffers, masterPlaying } from './state.js';
import { rand } from './util.js';
import { scene } from './scene.js';
import { selForSound, selectedBirds, FOREST_BIRDS } from './data.js';

// 文件层的场景视觉（录音已含雷声/鸟鸣，这里只驱动画面、不再叠加合成事件）
export function wireSceneEmitters(layer, cfg){
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

export function wireSynthEvents(layer, cfg){
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
export function buildBowl(layer, cfg){
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

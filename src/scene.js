// 生成式场景：整屏 canvas 按当前混音 + 音量聚合「气象强度」逐帧作画。
// 加一种画法：写一个 drawXxx，在 draw() 里按 intensity('paint') 调用即可。
import { $, rand, root, curTheme } from './util.js';
import { byId, currentRainSurface } from './data.js';
import { layers, volOf, masterVol, masterPlaying } from './state.js';

export const scene = (() => {
  const cv = $('scene'), g = cv.getContext('2d');
  let W=0, H=0, dpr=1, lastT=performance.now();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stars=[], rainP=[], windP=[], motes=[], sparks=[], flashes=[], emberP=[], bokehP=[], railP=[], snowP=[], ripples=[], birdsP=[], blooms=[], metroP=[], paperP=[];
  const iCur = Object.create(null);   // paint -> 平滑后的强度：画面对混音的迟滞镜像（气象般晕开/消散，且随漂移呼吸）
  let oceanPhase=0;
  let dayK=1, isDark=true;   // 每帧由 draw() 刷新：浅色主题（白天）气象对比增强（深色/夜晚 = 1，不动）
  // 帧率自适应 + 后台停画（F-2 / F-5）
  let running=true, frameReq=0, lastFrame=0;
  const FAST = new Set(['rain','fire','birds','grain','wind','rail','ocean','snow','metro']);   // snow 是连续粒子系统，应保持满帧（D11③）；metro 灯柱横扫需满帧
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
    motes.length=0; for (let i=0;i<N(80,2.4);i++) motes.push({x:rand()*W, y:rand()*H, r:rand()*2.2+0.7, ph:rand()*6.28, dx:(rand()-0.5)*0.3, dy:-(0.1+rand()*0.35)});   // 浮尘：加密加大，森林/雾看得见（原 N(55) 太稀）
    emberP.length=0; for (let i=0;i<N(60);i++) emberP.push({x:W*(0.3+rand()*0.4), y:H*(0.7+rand()*0.3), r:rand()*1.6+0.6, sp:0.3+rand()*0.9, ph:rand()*6.28, dx:(rand()-0.5)*0.3});
    bokehP.length=0; for (let i=0;i<N(24,1.8);i++) bokehP.push({x:rand()*W, y:rand()*H, r:20+rand()*60, ph:rand()*6.28, dx:(rand()-0.5)*0.15, dy:(rand()-0.5)*0.1});
    railP.length=0; for (let i=0;i<N(40);i++) railP.push({x:rand()*W, y:rand()*H*0.85, len:40+rand()*80, sp:10+rand()*10, o:0.15+rand()*0.4});
    snowP.length=0; for (let i=0;i<N(90,2.6);i++) snowP.push({x:rand()*W, y:rand()*H, r:rand()*1.8+0.7, sp:0.5+rand()*1.1, drift:(rand()-0.5)*0.6, ph:rand()*6.28, a:0.5+rand()*0.5});
    birdsP.length=0; for (let i=0;i<N(46,1.8);i++) birdsP.push({x:rand()*W, y:rand()*H*0.72, r:rand()*1.5+0.5, sp:0.12+rand()*0.5, dx:(rand()-0.5)*0.5, ph:rand()*6.28});   // 鸟鸣：金色羽尘/光点漂移（D12）
    metroP.length=0; for (let i=0;i<N(11);i++) metroP.push({x:rand()*W, y:rand()*H*0.8, w:26+rand()*70, h:H*(0.4+rand()*0.5), sp:6+rand()*8, o:0.16+rand()*0.3});   // 地铁：隧道灯柱横扫
    paperP.length=0; for (let i=0;i<N(34);i++) paperP.push({x:rand()*W, y:rand()*H, s:3+rand()*4, sp:0.7+rand()*1.1, ph:rand()*6.28});   // 翻书：暖色纸屑翻飞
  }

  // 各气象强度：读活层的**实时增益**（含渐入/漂移/音量斜坡），而非静态目标 → 画面是混音真正活的镜像。
  // sqrt 把 perc 后的增益还原回 volOf 量级，静止态与旧版一致；缓动交给 stepIntensities。
  const liveGain = l => l.gain ? Math.max(0, l.gain.gain.value) : 0;
  // 画面强度信号：实时增益（含渐入/漂移/音量斜坡的「呼吸」）与存储音量 volOf 取大兜底。
  // iOS Safari 下 AudioParam.value 常不反映已排程的 linearRamp 自动化（读回 ~0），只靠 liveGain
  // 会让真机上「声音专属气象」画不出来（只剩环境极光/星空）；volOf 始终可靠且量级一致
  // （sqrt(perc(v))≈v）→ 桌面照常随增益呼吸、移动端保证一定出画。
  const amt = (l, id) => Math.max(Math.sqrt(liveGain(l)), volOf(id));
  function rawTargets(){
    const t = Object.create(null), mv = masterVol/100, play = masterPlaying?1:0.35;
    layers.forEach((l, id) => { const p=byId(id).paint; if (!p) return; t[p] = (t[p]||0) + amt(l, id) * mv * play; });
    return t;
  }
  // 逐帧把 iCur 向目标缓动（~0.55s 时间常数）；reduced-motion 直接吸附。目标为 0 且已淡尽则回收。
  function stepIntensities(dt){
    const t = rawTargets(), k = reduce ? 1 : (1 - Math.exp(-dt/0.55));
    const keys = new Set(); for (const p in iCur) keys.add(p); for (const p in t) keys.add(p);
    keys.forEach(p => { const cur=iCur[p]||0, tg=t[p]||0, nv=cur+(tg-cur)*k; if (nv<0.0008 && tg===0) delete iCur[p]; else iCur[p]=nv; });
  }
  function intensity(paint){ return Math.min(1, (iCur[paint]||0) * dayK); }   // 浅色主题按 dayK 提亮（clamp≤1）
  // 时段染色：地平线暖光随真实时间在「黄昏琥珀 / 深夜近无 / 黎明玫瑰」间极缓移动，让电台知道现在几点。
  // 高斯按 24h 环绕加权两个暖调；深夜衰减到近无，守夜·玻璃护栏（很淡、不 kitsch）。
  function gaussWrap(x, mu, sig){ const d=Math.min(Math.abs(x-mu), 24-Math.abs(x-mu)); return Math.exp(-(d*d)/(2*sig*sig)); }
  function timeGlow(){
    const t=new Date(), h=t.getHours()+t.getMinutes()/60;
    const dusk=gaussWrap(h,18.7,2.3), dawn=gaussWrap(h,6.0,1.9), w=dusk+dawn;
    if (w<0.02) return null;
    const dc=[255,150,86], wc=[255,170,150];   // 黄昏琥珀 / 黎明玫瑰
    return { r:(dc[0]*dusk+wc[0]*dawn)/w|0, g:(dc[1]*dusk+wc[1]*dawn)/w|0, b:(dc[2]*dusk+wc[2]*dawn)/w|0, a:0.11*Math.max(dusk,dawn) };
  }
  // 同一 paint 下多个声音按实时响度加权混色（回传 hex，兼容下游 hexToRgb）→ 画面颜色 = 真实混音的颜色。
  function deepen(hex, k){ const [r,g2,b]=hexToRgb(hex); const h=n=>Math.max(0,Math.min(255,Math.round(n*k))).toString(16).padStart(2,'0'); return '#'+h(r)+h(g2)+h(b); }
  function tintOf(paint, fallback){
    let r=0, gg=0, bb=0, w=0;
    layers.forEach((l,id)=>{ const c=byId(id); if (c.paint!==paint) return; const wt=amt(l, id); if (wt<=0) return; const [cr,cg,cb]=hexToRgb(c.color); r+=cr*wt; gg+=cg*wt; bb+=cb*wt; w+=wt; });
    const h = n => Math.max(0,Math.min(255,Math.round(n/w))).toString(16).padStart(2,'0');
    const col = w<=0 ? fallback : '#'+h(r)+h(gg)+h(bb);
    return isDark ? col : deepen(col, 0.6);   // 浅色主题：气象色显著加深加饱和（墨色落纸），在浅底上立住对比（白天增强）
  }

  function draw(now){
    if (!running || document.hidden){ running=false; frameReq=0; return; }        // 后台：停画（音频调度继续）
    const minInt = hasFast() ? 0 : 33;                                              // 无高频动效 → 降至 ~30fps
    if (now - lastFrame < minInt){ frameReq=requestAnimationFrame(draw); return; }
    lastFrame = now;
    const dt = Math.min(0.05, (now-lastT)/1000); lastT = now;
    stepIntensities(dt);                                                            // 迟滞镜像：每帧把画面强度朝当前混音缓动
    const dark = curTheme()==='dark';
    isDark = dark; dayK = dark ? 1 : 1.6;                                          // 浅色主题（白天）气象对比增强
    // 背景
    const top = themeVar('--scene-top'), bot = themeVar('--scene-bot');
    const bg = g.createLinearGradient(0,0,0,H); bg.addColorStop(0,top); bg.addColorStop(1,bot);
    g.fillStyle = bg; g.fillRect(0,0,W,H);

    // 时段染色：地平线暖光（黄昏/黎明缓现，深夜近无；浅色主题减半以免发浑）
    const tg=timeGlow(); if (tg){ const a=tg.a*(dark?1:0.5); const gr=g.createLinearGradient(0,H,0,H*0.34);
      gr.addColorStop(0,`rgba(${tg.r},${tg.g},${tg.b},${a})`); gr.addColorStop(1,`rgba(${tg.r},${tg.g},${tg.b},0)`); g.fillStyle=gr; g.fillRect(0,0,W,H); }

    // 极光辉带（环境）
    const auroraI = 0.5 + 0.5*intensity('forest') + 0.4*intensity('ocean');
    drawAurora(now, dark?0.5:0.28);

    // 星空（夜）
    if (dark){ const sa = 0.5 - 0.35*intensity('grain'); for (const st of stars){ const tw = reduce?0.6:(0.5+0.5*Math.sin(now/900+st.ph)); g.globalAlpha = sa*tw*0.8; g.fillStyle='#dfe8ff'; g.beginPath(); g.arc(st.x,st.y,st.r,0,6.283); g.fill(); } g.globalAlpha=1; }

    // 待机电台：仅空状态（没选声音）——低地平线 + 微弱频谱线，让首屏不空（冷紫=静默）
    if (layers.size===0) drawStandby(now, dark);

    // 海浪
    const io = intensity('ocean'); if (io>0.01) drawOcean(io, tintOf('ocean','#5fd0c0'), dt, dark);
    // 雾（溪流/瀑布）
    const im = intensity('mist'); if (im>0.01) drawMotesLike(im, tintOf('mist','#a8e0ff'), 0.5, now, true);
    // 森林浮尘
    const ifo = intensity('forest'); if (ifo>0.01) drawMotesLike(ifo, tintOf('forest','#7fd08a'), 1, now, false);
    // 风
    const iw = intensity('wind'); if (iw>0.01) drawWind(iw, tintOf('wind','#bfe6cf'), dt, dark);
    // 雨（含「打在什么上」的画面微差：屋檐檐影 / 窗玻璃水痕 / 树叶染绿散落 / 水面涟漪）
    const ir = intensity('rain'); if (ir>0.01) drawRain(ir, tintOf('rain','#9cc2ff'), dt, dark, currentRainSurface(), now);
    // 落雪
    const isn = intensity('snow'); if (isn>0.01) drawSnow(isn, tintOf('snow','#dbe7ff'), now, dt);
    // 室内薄雾（呼吸）
    const ih = intensity('haze'); if (ih>0.01){ const p=0.5+0.5*Math.sin(now/2600); g.globalAlpha=ih*0.12*(0.6+0.4*p); const rg=g.createRadialGradient(W/2,H*0.55,0,W/2,H*0.55,Math.max(W,H)*0.7); const [r,gg,bb]=hexToRgb(tintOf('haze','#b6c4d0')); rg.addColorStop(0,`rgba(${r},${gg},${bb},1)`); rg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=rg; g.fillRect(0,0,W,H); g.globalAlpha=1; }

    // 火车轨迹 / 咖啡馆光斑 / 篝火 / 颂钵涟漪
    const irl = intensity('rail'); if (irl>0.01) drawRail(irl, tintOf('rail','#b9c4cf'), dt);
    const ime = intensity('metro'); if (ime>0.01) drawMetro(ime, tintOf('metro','#9fb0c0'), dt);
    const ipp = intensity('paper'); if (ipp>0.01) drawPaper(ipp, tintOf('paper','#e8dcc0'), now, dt);
    const icl = intensity('clock'); if (icl>0.01) drawClock(icl, tintOf('clock','#c9d2dc'), now);
    const ipr = intensity('purr'); if (ipr>0.01) drawPurr(ipr, tintOf('purr','#f0b58a'), now);
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

    // 点选微光：手动选一个声音时，画面在它的颜色里轻轻晕开一下（点击→画面的回应）
    for (let i=blooms.length-1;i>=0;i--){ const b=blooms[i]; b.age+=dt; const k=b.age/b.life; if (k>=1){ blooms.splice(i,1); continue; }
      const [r,gg,bb]=hexToRgb(b.color); const rad=Math.max(W,H)*(0.05+k*0.32), a=(1-k)*(1-k)*0.5;
      const rg=g.createRadialGradient(b.x,b.y,0,b.x,b.y,rad);
      rg.addColorStop(0,`rgba(${r},${gg},${bb},${a})`); rg.addColorStop(1,`rgba(${r},${gg},${bb},0)`);
      g.fillStyle=rg; g.beginPath(); g.arc(b.x,b.y,rad,0,6.283); g.fill(); }

    // 暗角
    const vg = g.createRadialGradient(W/2,H*0.42,Math.min(W,H)*0.2, W/2,H*0.5,Math.max(W,H)*0.75);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1, dark?'rgba(0,0,0,0.42)':'rgba(20,40,36,0.10)');
    g.fillStyle=vg; g.fillRect(0,0,W,H);

    frameReq = requestAnimationFrame(draw);
  }

  // 待机电台视觉（静默态）：低地平线暖冷渐层 + 底部缓慢起伏的微弱频谱线；很淡、不抢时钟
  function drawStandby(now, dark){
    const [r,gg,bb]=hexToRgb(themeVar('--aurora-2'));   // 冷紫 = 夜/静默
    // 慢速暗波：两团极淡冷色辉光缓缓漂移，给空状态一点「待机」呼吸（hero 可见、不抢时钟）
    for (let k=0;k<2;k++){
      const t=reduce?k*3:now/11000+k*3.2;
      const cx=W*(0.5+0.42*Math.sin(t)), cy=H*(0.46+0.3*Math.cos(t*0.7+k)), rad=Math.max(W,H)*0.55;
      const rg=g.createRadialGradient(cx,cy,0,cx,cy,rad), a=dark?0.05:0.028;
      rg.addColorStop(0,`rgba(${r},${gg},${bb},${a})`); rg.addColorStop(1,`rgba(${r},${gg},${bb},0)`);
      g.fillStyle=rg; g.fillRect(0,0,W,H);
    }
    // 低地平线：底部一条极淡辉光，给首屏一个「地平」
    const hy=H*0.88, hg=g.createLinearGradient(0,H,0,hy);
    hg.addColorStop(0,`rgba(${r},${gg},${bb},${dark?0.09:0.05})`); hg.addColorStop(1,`rgba(${r},${gg},${bb},0)`);
    g.fillStyle=hg; g.fillRect(0,hy,W,H-hy);
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
      const tw = 0.5+0.5*Math.sin(now/700+m.ph); g.globalAlpha = I*0.6*tw;
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
  function drawRain(I, col, dt, dark, surf, now){
    let [r,gg,bb]=hexToRgb(col);
    const sid = surf ? surf.id : 'leaves';
    if (sid==='leaves'){ gg=Math.min(255,gg+20); r=Math.max(0,r-8); }             // 树叶：整体微染绿、更柔
    if (sid==='eaves'){ const bd=g.createLinearGradient(0,0,0,H*0.15);            // 屋檐：顶部一条柔和暗带（檐影感），雨从其下落
      bd.addColorStop(0,`rgba(0,0,0,${(dark?0.30:0.16)*Math.min(1,I+0.3)})`); bd.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=bd; g.fillRect(0,0,W,H*0.15); }
    // 基础雨丝（加粗提亮——小雨也看得见）
    const count=Math.floor(rainP.length*I), a=(sid==='glass'?0.26:0.42)*I;
    g.lineWidth=1.3;
    for (let i=0;i<count;i++){ const p=rainP[i];
      if (!reduce){ p.y += p.sp*(0.8+I)*(dt*60); p.x += p.sp*0.18*(dt*60); if (p.y>H){ p.y=-p.len; p.x=rand()*W; } }
      const jx = sid==='leaves' ? Math.sin(p.y/26+p.x*0.05)*1.4 : 0;              // 树叶：落点微散
      g.strokeStyle=`rgba(${r},${gg},${bb},${a})`; g.beginPath(); g.moveTo(p.x,p.y); g.lineTo(p.x-2+jx, p.y+p.len); g.stroke(); }
    if (sid==='glass' && !reduce){                                               // 窗玻璃：几道缓缓下淌的水痕（附着感）
      g.lineWidth=2;
      for (let k=0;k<8;k++){ const x=((k*163)%100)/100*W, t=(now/1500+k*0.61)%1, y0=t*H, len=44+70*I;
        g.strokeStyle=`rgba(${r},${gg},${bb},${0.30*I})`; g.beginPath(); g.moveTo(x,y0); g.lineTo(x+Math.sin(now/650+k)*3, y0+len); g.stroke(); } }
    if (sid==='water'){                                                          // 水面：底部落点一圈圈涟漪
      g.lineWidth=1.4;
      for (let k=0;k<6;k++){ const ph=(now/950+k*0.31)%1, cx=((k*61+20)%100)/100*W, cy=H*(0.80+(k%3)*0.05), rad=8+ph*64*(0.5+0.5*I), aa=(1-ph)*(1-ph)*0.34*I;
        g.strokeStyle=`rgba(${r},${gg},${bb},${aa})`; g.beginPath(); g.arc(cx,cy,rad,0,6.283); g.stroke(); } }
    g.globalAlpha=1;
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
  // 地铁：隧道灯柱自右向左横扫（比火车更"地下"、更快的光柱），soft glow 竖条
  function drawMetro(I, col, dt){
    const [r,gg,bb]=hexToRgb(col); const count=Math.floor(metroP.length*I);
    for (let i=0;i<count;i++){ const p=metroP[i];
      if (!reduce){ p.x -= p.sp*(0.8+1.4*I)*(dt*60); if (p.x < -p.w){ p.x=W+p.w; p.y=rand()*H*0.8; p.h=H*(0.4+rand()*0.5); } }
      const gr=g.createLinearGradient(p.x-p.w/2,0,p.x+p.w/2,0);
      gr.addColorStop(0,`rgba(${r},${gg},${bb},0)`); gr.addColorStop(0.5,`rgba(${r},${gg},${bb},${p.o*I*0.5})`); gr.addColorStop(1,`rgba(${r},${gg},${bb},0)`);
      g.fillStyle=gr; g.fillRect(p.x-p.w/2, p.y, p.w, p.h); }
  }
  // 翻书：暖色纸屑在阅读光里缓缓飘落 + 轻摆 + 微旋
  function drawPaper(I, col, now, dt){
    const [r,gg,bb]=hexToRgb(col); const count=Math.floor(paperP.length*I);
    for (let i=0;i<count;i++){ const p=paperP[i];
      if (!reduce){ p.y += p.sp*(0.4+0.5*I)*(dt*60); p.x += Math.sin(now/1300+p.ph)*0.5*(dt*60); if (p.y>H+6){ p.y=-6; p.x=rand()*W; } if (p.x<-6) p.x=W+6; if (p.x>W+6) p.x=-6; }
      const tw=0.5+0.5*Math.sin(now/900+p.ph);
      g.save(); g.globalAlpha=I*0.4*Math.max(0,tw); g.translate(p.x,p.y); g.rotate(reduce?0:Math.sin(now/1600+p.ph)*0.5);
      g.fillStyle=`rgba(${r},${gg},${bb},1)`; g.fillRect(-p.s, -p.s*0.35, p.s*2, p.s*0.7); g.restore(); }
    g.globalAlpha=1;
  }
  // 滴答：极淡的"时间在走"呼吸光（约 4s 一呼吸，绝不做刺眼的跳动 —— 助眠优先）
  function drawClock(I, col, now){
    const [r,gg,bb]=hexToRgb(col); const p=reduce?0.6:(0.5+0.5*Math.sin(now/640));
    const a=I*0.08*(0.5+0.5*p), rg=g.createRadialGradient(W/2,H*0.5,0,W/2,H*0.5,Math.max(W,H)*(0.3+0.05*p));
    rg.addColorStop(0,`rgba(${r},${gg},${bb},${a})`); rg.addColorStop(1,`rgba(${r},${gg},${bb},0)`); g.fillStyle=rg; g.fillRect(0,0,W,H);
  }
  // 猫呼噜：底部一团随睡眠呼吸缓胀缓落的暖光（约 2s 一呼吸，蜷卧感）
  function drawPurr(I, col, now){
    const [r,gg,bb]=hexToRgb(col); const b=reduce?0.6:(0.5+0.5*Math.sin(now/340));
    const cx=W/2, cy=H*0.82, rad=Math.max(W,H)*(0.26+0.06*b), a=I*0.14*(0.55+0.45*b);
    const rg=g.createRadialGradient(cx,cy,0,cx,cy,rad);
    rg.addColorStop(0,`rgba(${r},${gg},${bb},${a})`); rg.addColorStop(1,`rgba(${r},${gg},${bb},0)`); g.fillStyle=rg; g.fillRect(0,0,W,H);
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

  function clearFX(){ sparks.length=0; flashes.length=0; ripples.length=0; blooms.length=0; }
  function pause(){ running=false; if (frameReq) cancelAnimationFrame(frameReq); frameReq=0; clearFX(); }
  function resume(){ if (running) return; running=true; lastT=performance.now(); lastFrame=0; frameReq=requestAnimationFrame(draw); }

  addEventListener('resize', resize); resize(); frameReq=requestAnimationFrame(draw);
  return {
    pause, resume, clear:clearFX,
    spark(color){ if (!running||document.hidden) return; sparks.push({x: W*(0.2+rand()*0.6), y: H*(0.25+rand()*0.35), age:0, life:1.1+rand()*0.5, color}); },
    lightning(){ if (!running||document.hidden) return; flashes.push({age:0, life:0.55}); },
    ember(color){ if (!running||document.hidden) return; sparks.push({x: W*(0.34+rand()*0.32), y: H*(0.80+rand()*0.1), age:0, life:0.8+rand()*0.5, color}); },
    ripple(color){ if (!running||document.hidden) return; ripples.push({age:0, life:5.5, color}); },
    bloom(color){ if (!running||document.hidden||reduce) return; blooms.push({x:W*(0.3+rand()*0.4), y:H*(0.32+rand()*0.3), age:0, life:1.7, color}); },
  };
})();

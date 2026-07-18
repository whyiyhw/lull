// 生成式场景：整屏 canvas 按当前混音 + 音量聚合「气象强度」逐帧作画。
// 加一种画法：写一个 drawXxx，在 draw() 里按 intensity('paint') 调用即可。
import { $, rand, root, curTheme } from './util.js';
import { byId } from './data.js';
import { layers, volOf, masterVol, masterPlaying } from './state.js';

export const scene = (() => {
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

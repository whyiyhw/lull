// 静态配置与「数据侧」纯函数：声音库、细分子选择器、频道预设、诗行。
// 加一个声音 / 加一个子选择器 / 加一个频道，改这里即可（无副作用、不碰音频图）。

// ---------- 音色库 ----------
export const CATS = [
  { id:'noise', name:'噪音' }, { id:'rain', name:'雨' }, { id:'water', name:'水' },
  { id:'forest', name:'林' }, { id:'wind', name:'风' }, { id:'room', name:'室内' },
  { id:'warm', name:'暖' }, { id:'calm', name:'冥想' },
];
export const SOUNDS = [
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
export const byId = id => SOUNDS.find(s => s.id === id);

// ---------- 细分「子选择器」：某个声音再拆成可勾选的成员（合成，纯本地）----------
// 鸟种（森林 · 鸟鸣，多选合唱）
export const BIRD_SPECIES = [
  { id:'sparrow',     name:'麻雀', desc:'清脆短啾 · 晨间活泼' },
  { id:'thrush',      name:'画眉', desc:'婉转多音 · 旋律流转' },
  { id:'dove',        name:'斑鸠', desc:'低沉咕咕 · 安神' },
  { id:'cuckoo',      name:'杜鹃', desc:'布谷两声 · 悠远' },
  { id:'nightingale', name:'夜莺', desc:'华丽颤鸣 · 夜之歌手' },
];
export const FOREST_BIRDS = ['sparrow', 'thrush', 'dove'];   // 「森林」底噪里随机点缀的鸟
// 虫种（森林 · 虫鸣，多选合唱）
export const INSECT_SPECIES = [
  { id:'cricket', name:'蟋蟀',   desc:'高频颤鸣 · 秋夜' },
  { id:'cicada',  name:'蝉',     desc:'绵长鼓噪 · 盛夏' },
  { id:'frog',    name:'蛙',     desc:'低沉蛙鸣 · 塘边' },
  { id:'katydid', name:'纺织娘', desc:'沙沙织声 · 草丛' },
];
// 篝火爆裂性格（暖 · 篝火，多选）
export const FIRE_CHARS = [
  { id:'snap',     name:'噼啪', desc:'清脆爆响' },
  { id:'burst',    name:'爆裂', desc:'成串迸溅' },
  { id:'collapse', name:'塌陷', desc:'木柴翻落' },
  { id:'ember',    name:'余烬', desc:'细碎嘶嘶' },
];
// 咖啡馆环境细节（暖 · 咖啡馆，多选，可全关只留底噪录音）
export const CAFE_EVENTS = [
  { id:'clink',   name:'碰杯', desc:'瓷器轻碰' },
  { id:'grinder', name:'磨豆', desc:'研磨咖啡豆' },
  { id:'steam',   name:'咖啡机', desc:'蒸汽嘶响' },
  { id:'spoon',   name:'汤匙', desc:'搅拌叮当' },
];
// 雨的质地：打在什么上（雨 · 单选，所有雨层通用）
export const RAIN_SURFACES = [
  { id:'eaves',  name:'屋檐',   desc:'低沉滴落 · 屋檐下', type:'lowpass',  freq:2600, q:0.8 },
  { id:'glass',  name:'窗玻璃', desc:'清脆点击 · 打在窗上', type:'highpass', freq:1800, q:0.7 },
  { id:'leaves', name:'树叶',   desc:'柔和沙沙 · 落在叶间', type:'bandpass', freq:2200, q:0.6 },
  { id:'water',  name:'水面',   desc:'饱满深沉 · 落在水上', type:'lowpass',  freq:1400, q:1.0 },
];
export const RAIN_SURFACE_BY_ID = Object.fromEntries(RAIN_SURFACES.map(s => [s.id, s]));

// 声明式：每个子选择器挂在某个分类下，可绑定某个声音（选中即开）。
// 注：雨的质地选中后需实时重调滤波——由 ui.toggleVariant 对 sound==='__rain' 特判调用 engine.applyRainSurface()。
export const VARIANT_PICKERS = [
  { cat:'rain',   sound:'__rain', autoEnable:false, key:'lull.rainsurf', mode:'single', label:'雨 · 打在什么上（所有雨通用）', dot:'#9cc2ff', members:RAIN_SURFACES, default:'leaves' },
  { cat:'forest', sound:'birds',   key:'lull.birds',   mode:'multi', min:1, label:'鸟鸣 · 选择鸟种（可多选）',   dot:'#ffd48a', members:BIRD_SPECIES,   default:['sparrow','thrush'] },
  { cat:'forest', sound:'insects', key:'lull.insects', mode:'multi', min:1, label:'虫鸣 · 选择虫种（可多选）',   dot:'#c3e08a', members:INSECT_SPECIES, default:['cricket','frog'] },
  { cat:'warm',   sound:'fire',    key:'lull.fire',    mode:'multi', min:1, label:'篝火 · 爆裂性格（可多选）',   dot:'#ff9a5a', members:FIRE_CHARS,     default:['snap','collapse'] },
  { cat:'warm',   sound:'cafe',    key:'lull.cafe',    mode:'multi', min:0, label:'咖啡馆 · 环境细节（可全关）', dot:'#ffc59a', members:CAFE_EVENTS,    default:['clink','grinder'] },
];
export function pickerById(id){ return VARIANT_PICKERS.find(p => p.sound === id); }
export function variantGet(p){
  try{ const a = JSON.parse(localStorage.getItem(p.key) || 'null');
    if (p.mode==='single'){ if (typeof a==='string' && p.members.some(m=>m.id===a)) return a; }
    else if (Array.isArray(a)){ const f=a.filter(id=>p.members.some(m=>m.id===id)); if (f.length >= (p.min||0)) return f; }
  }catch(e){}
  return p.mode==='single' ? p.default : p.default.slice();
}
export function variantSet(p, val){ localStorage.setItem(p.key, JSON.stringify(val)); }
export function selForSound(id, fb){ const p=pickerById(id); return p ? variantGet(p) : (fb||[]); }
export function selectedBirds(){ return selForSound('birds', ['sparrow','thrush']); }   // 鸟鸣 high 密度用户选中的鸟
export function currentRainSurface(){ const p=VARIANT_PICKERS.find(x=>x.sound==='__rain'); return RAIN_SURFACE_BY_ID[variantGet(p)] || RAIN_SURFACES[2]; }

// ---------- 预设（F-4）----------
export const BUILTIN_PRESETS = [
  { id:'rainynight',    name:'雨夜', fm:88.1,  mix:{ hrain:62, storm:34, wind:22 } },
  { id:'morningforest', name:'晨林', fm:90.4,  mix:{ forest:60, birds:48, breeze:30 } },
  { id:'seaside',       name:'海边', fm:92.9,  mix:{ ocean:72, breeze:32, birds:18 } },
  { id:'fireside',      name:'炉边', fm:95.6,  mix:{ fire:70, wind:24, lrain:24 } },
  { id:'traincabin',    name:'车厢', fm:98.3,  mix:{ train:60, hrain:30, hum:22 } },
  { id:'deepspace',     name:'深空', fm:100.9, mix:{ brown:60, hum:34 } },
  { id:'sleeprain',     name:'雨眠', fm:103.1, mix:{ lrain:52, brown:42, hum:28 } },   // 助眠：无雷无鸟、纯连续音
];

// ---------- 诗行 ----------
export const POEMS = { 'storm':'雷雨将至','hrain':'雨落如帘','lrain':'檐下细雨','ocean':'潮汐往复','forest':'林间有风','birds':'晨鸟啁啾','insects':'虫鸣阵阵','fall':'水声轰鸣','stream':'溪流潺潺','wind':'风过旷野','breeze':'微风拂面','snow':'落雪无声','white':'一片纯净','pink':'柔和绵长','brown':'低沉温厚','fan':'室内静谧','ac':'凉夜微鸣','hum':'低鸣入眠','fire':'篝火噼啪','cafe':'咖啡馆微响','train':'夜行列车','subway':'地下轰隆','pages':'书页翻动','tick':'滴答入夜','purr':'猫眠呼噜','bowl':'钵音绵长' };
export function stationLine(st){ let best=null, bv=-1; Object.keys(st.mix).forEach(id=>{ if (st.mix[id]>bv){ bv=st.mix[id]; best=id; } }); return (best && POEMS[best]) || st.name; }

// ---------- 睡眠定时档位 ----------
export const TIMERS = [['off','关'],['15','15'],['30','30'],['45','45'],['60','60'],['90','90']];

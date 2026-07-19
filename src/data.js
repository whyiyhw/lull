// 静态配置与「数据侧」纯函数：声音库、细分子选择器、频道预设、诗行。
// 加一个声音 / 加一个子选择器 / 加一个频道，改这里即可（无副作用、不碰音频图）。
// i18n：name/desc/label/频道名/诗行 用 {zh,en}，文件末尾统一装 getter → 所有读取点（.name/.desc/.label）
// 零改动即随当前语言解析（见 i18n.js 的 L）。加新条目照 {zh,en} 写即可。
import { L } from './i18n.js';

// ---------- 音色库 ----------
export const CATS = [
  { id:'noise', name:{zh:'噪音',en:'Noise'} }, { id:'rain', name:{zh:'雨',en:'Rain'} }, { id:'water', name:{zh:'水',en:'Water'} },
  { id:'forest', name:{zh:'林',en:'Forest'} }, { id:'wind', name:{zh:'风',en:'Wind'} }, { id:'room', name:{zh:'室内',en:'Indoor'} },
  { id:'warm', name:{zh:'暖',en:'Warm'} }, { id:'calm', name:{zh:'冥想',en:'Calm'} },
];
export const SOUNDS = [
  { id:'white', name:{zh:'白噪音',en:'White'}, cat:'noise', base:'white', color:'#cfe3ff', paint:'grain' },
  { id:'pink',  name:{zh:'粉噪音',en:'Pink'}, cat:'noise', base:'pink',  color:'#ffc9de', paint:'grain' },
  { id:'brown', name:{zh:'褐噪音',en:'Brown'}, cat:'noise', base:'brown', color:'#e6b98a', paint:'grain' },

  { id:'lrain', name:{zh:'小雨',en:'Drizzle'}, cat:'rain', base:'white', color:'#9cc2ff', paint:'rain', surface:true, filters:[{type:'highpass',freq:900,q:0.6},{type:'lowpass',freq:6800,q:0.6}] },
  { id:'hrain', name:{zh:'大雨',en:'Heavy rain'}, cat:'rain', base:'white', color:'#7aa4ff', paint:'rain', file:'hrain.mp3', surface:true, filters:[{type:'lowpass',freq:4200,q:0.5}] },
  { id:'storm', name:{zh:'雷雨',en:'Thunder'}, cat:'rain', base:'white', color:'#6f8cf0', paint:'rain', surface:true, thunder:true, filters:[{type:'lowpass',freq:3800,q:0.5}] },

  { id:'ocean',  name:{zh:'海浪',en:'Ocean'}, cat:'water', base:'brown', color:'#5fd0c0', paint:'ocean', file:'ocean.mp3', filters:[{type:'lowpass',freq:520,q:0.6}], lfo:{rate:0.09,depth:0.36,target:'gain'} },
  { id:'stream', name:{zh:'溪流',en:'Stream'}, cat:'water', base:'pink',  color:'#7fd8e6', paint:'mist',  file:'stream.mp3', filters:[{type:'bandpass',freq:2300,q:1.1}], lfo:{rate:4.5,depth:600,target:'freq'}, reverb:0.25 },
  { id:'fall',   name:{zh:'瀑布',en:'Waterfall'}, cat:'water', base:'white', color:'#a8e0ff', paint:'mist',  filters:[{type:'lowpass',freq:3200,q:0.4}] },

  { id:'forest', name:{zh:'森林',en:'Forest'}, cat:'forest', base:'pink',  color:'#7fd08a', paint:'forest', file:'forest.mp3', filters:[{type:'bandpass',freq:2100,q:0.8}], lfo:{rate:0.15,depth:700,target:'freq'}, birds:'low',  reverb:0.4 },
  { id:'birds',  name:{zh:'鸟鸣',en:'Birdsong'}, cat:'forest', base:null,    color:'#ffd48a', paint:'birds',  birds:'high', reverb:0.5 },
  { id:'insects',name:{zh:'虫鸣',en:'Insects'}, cat:'forest', base:null,    color:'#c3e08a', paint:'bokeh',  insects:true, reverb:0.35 },

  { id:'breeze', name:{zh:'微风',en:'Breeze'}, cat:'wind', base:'pink', color:'#bfe6cf', paint:'wind', file:'breeze.mp3', filters:[{type:'lowpass',freq:520,q:0.5}], lfo:{rate:0.06,depth:300,target:'freq'} },
  { id:'wind',   name:{zh:'大风',en:'Wind'}, cat:'wind', base:'pink', color:'#9fd0b8', paint:'wind', filters:[{type:'lowpass',freq:840,q:0.6}], lfo:{rate:0.13,depth:520,target:'freq'} },
  { id:'snow',   name:{zh:'落雪',en:'Snowfall'}, cat:'wind', base:'pink', color:'#dbe7ff', paint:'snow', filters:[{type:'lowpass',freq:1100,q:0.5}], lfo:{rate:0.05,depth:260,target:'freq'} },

  { id:'fan', name:{zh:'风扇',en:'Fan'}, cat:'room', base:'brown', color:'#c2ccd8', paint:'haze', filters:[{type:'lowpass',freq:240,q:0.7}] },
  { id:'ac',  name:{zh:'空调',en:'AC'}, cat:'room', base:'brown', color:'#b6c4d0', paint:'haze', filters:[{type:'lowpass',freq:170,q:0.7}], tone:{freq:120,type:'sine',gain:0.05} },
  { id:'train', name:{zh:'火车',en:'Train'}, cat:'room', base:'brown', color:'#b9c4cf', paint:'rail', file:'train.mp3', filters:[{type:'lowpass',freq:160,q:0.7}], clack:true },
  { id:'subway', name:{zh:'地铁',en:'Subway'}, cat:'room', base:'brown', color:'#9fb0c0', paint:'metro', filters:[{type:'lowpass',freq:260,q:0.7}], lfo:{rate:0.2,depth:400,target:'freq'}, clack:true },
  { id:'pages',  name:{zh:'翻书',en:'Pages'}, cat:'room', base:null,    color:'#e8dcc0', paint:'paper', pages:true, reverb:0.2 },
  { id:'tick',   name:{zh:'滴答',en:'Ticking'}, cat:'room', base:null,    color:'#c9d2dc', paint:'clock', tick:true },

  { id:'fire', name:{zh:'篝火',en:'Campfire'}, cat:'warm', base:'brown', color:'#ff9a5a', paint:'fire',  file:'fire.mp3', filters:[{type:'lowpass',freq:380,q:0.7}], lfo:{rate:0.5,depth:120,target:'freq'}, crackle:true, reverb:0.15 },
  { id:'cafe', name:{zh:'咖啡馆',en:'Café'}, cat:'warm', base:'pink',  color:'#ffc59a', paint:'bokeh', file:'cafe.mp3', filters:[{type:'bandpass',freq:750,q:0.9}], lfo:{rate:0.4,depth:0.4,target:'gain'}, clink:true, reverb:0.3 },
  { id:'purr', name:{zh:'猫呼噜',en:'Purr'}, cat:'warm', base:'brown', color:'#f0b58a', paint:'purr', filters:[{type:'lowpass',freq:220,q:0.8}], lfo:{rate:26,depth:0.55,target:'gain'} },

  { id:'bowl', name:{zh:'颂钵',en:'Singing bowl'}, cat:'calm', base:null,    color:'#e6d3a0', paint:'ripple', bowl:{freq:236}, reverb:0.6 },
  { id:'hum',  name:{zh:'低鸣',en:'Drone'}, cat:'calm', base:'brown', color:'#a9bccb', paint:'haze',   filters:[{type:'lowpass',freq:110,q:0.8}] },
];
export const byId = id => SOUNDS.find(s => s.id === id);

// ---------- 细分「子选择器」：某个声音再拆成可勾选的成员（合成，纯本地）----------
// 鸟种（森林 · 鸟鸣，多选合唱）
export const BIRD_SPECIES = [
  { id:'sparrow',     name:{zh:'麻雀',en:'Sparrow'}, desc:{zh:'清脆短啾 · 晨间活泼',en:'Crisp chirps · lively at dawn'} },
  { id:'thrush',      name:{zh:'画眉',en:'Thrush'}, desc:{zh:'婉转多音 · 旋律流转',en:'Warbling notes · flowing melody'} },
  { id:'dove',        name:{zh:'斑鸠',en:'Dove'}, desc:{zh:'低沉咕咕 · 安神',en:'Low coos · soothing'} },
  { id:'cuckoo',      name:{zh:'杜鹃',en:'Cuckoo'}, desc:{zh:'布谷两声 · 悠远',en:'Two-note call · distant'} },
  { id:'nightingale', name:{zh:'夜莺',en:'Nightingale'}, desc:{zh:'华丽颤鸣 · 夜之歌手',en:'Rich trills · singer of the night'} },
];
export const FOREST_BIRDS = ['sparrow', 'thrush', 'dove'];   // 「森林」底噪里随机点缀的鸟
// 虫种（森林 · 虫鸣，多选合唱）
export const INSECT_SPECIES = [
  { id:'cricket', name:{zh:'蟋蟀',en:'Cricket'},   desc:{zh:'高频颤鸣 · 秋夜',en:'High trill · autumn night'} },
  { id:'cicada',  name:{zh:'蝉',en:'Cicada'},     desc:{zh:'绵长鼓噪 · 盛夏',en:'Long drone · midsummer'} },
  { id:'frog',    name:{zh:'蛙',en:'Frog'},     desc:{zh:'低沉蛙鸣 · 塘边',en:'Deep croaks · pondside'} },
  { id:'katydid', name:{zh:'纺织娘',en:'Katydid'}, desc:{zh:'沙沙织声 · 草丛',en:'Rustling weave · in the grass'} },
];
// 篝火爆裂性格（暖 · 篝火，多选）
export const FIRE_CHARS = [
  { id:'snap',     name:{zh:'噼啪',en:'Snap'}, desc:{zh:'清脆爆响',en:'Crisp pops'} },
  { id:'burst',    name:{zh:'爆裂',en:'Burst'}, desc:{zh:'成串迸溅',en:'Bursting sparks'} },
  { id:'collapse', name:{zh:'塌陷',en:'Collapse'}, desc:{zh:'木柴翻落',en:'Shifting logs'} },
  { id:'ember',    name:{zh:'余烬',en:'Embers'}, desc:{zh:'细碎嘶嘶',en:'Fine hiss'} },
];
// 咖啡馆环境细节（暖 · 咖啡馆，多选，可全关只留底噪录音）
export const CAFE_EVENTS = [
  { id:'clink',   name:{zh:'碰杯',en:'Clink'}, desc:{zh:'瓷器轻碰',en:'China clinks'} },
  { id:'grinder', name:{zh:'磨豆',en:'Grinder'}, desc:{zh:'研磨咖啡豆',en:'Grinding beans'} },
  { id:'steam',   name:{zh:'咖啡机',en:'Machine'}, desc:{zh:'蒸汽嘶响',en:'Steam hiss'} },
  { id:'spoon',   name:{zh:'汤匙',en:'Spoon'}, desc:{zh:'搅拌叮当',en:'Stirring'} },
];
// 雨的质地：打在什么上（雨 · 单选，所有雨层通用）
export const RAIN_SURFACES = [
  { id:'eaves',  name:{zh:'屋檐',en:'Eaves'},   desc:{zh:'低沉滴落 · 屋檐下',en:'Low drips · under the eaves'}, type:'lowpass',  freq:2600, q:0.8 },
  { id:'glass',  name:{zh:'窗玻璃',en:'Window'}, desc:{zh:'清脆点击 · 打在窗上',en:'Crisp taps · on the glass'}, type:'highpass', freq:1800, q:0.7 },
  { id:'leaves', name:{zh:'树叶',en:'Leaves'},   desc:{zh:'柔和沙沙 · 落在叶间',en:'Soft patter · on leaves'}, type:'bandpass', freq:2200, q:0.6 },
  { id:'water',  name:{zh:'水面',en:'Water'},   desc:{zh:'饱满深沉 · 落在水上',en:'Full and deep · on water'}, type:'lowpass',  freq:1400, q:1.0 },
];
export const RAIN_SURFACE_BY_ID = Object.fromEntries(RAIN_SURFACES.map(s => [s.id, s]));

// 声明式：每个子选择器挂在某个分类下，可绑定某个声音（选中即开）。
// 注：雨的质地选中后需实时重调滤波——由 ui.toggleVariant 对 sound==='__rain' 特判调用 engine.applyRainSurface()。
export const VARIANT_PICKERS = [
  { cat:'rain',   sound:'__rain', autoEnable:false, key:'lull.rainsurf', mode:'single', label:{zh:'雨 · 打在什么上（所有雨通用）',en:'Rain · what it falls on (all rain)'}, dot:'#9cc2ff', members:RAIN_SURFACES, default:'leaves' },
  { cat:'forest', sound:'birds',   key:'lull.birds',   mode:'multi', min:1, label:{zh:'鸟鸣 · 选择鸟种（可多选）',en:'Birdsong · pick species (multi)'},   dot:'#ffd48a', members:BIRD_SPECIES,   default:['sparrow','thrush'] },
  { cat:'forest', sound:'insects', key:'lull.insects', mode:'multi', min:1, label:{zh:'虫鸣 · 选择虫种（可多选）',en:'Insects · pick species (multi)'},   dot:'#c3e08a', members:INSECT_SPECIES, default:['cricket','frog'] },
  { cat:'warm',   sound:'fire',    key:'lull.fire',    mode:'multi', min:1, label:{zh:'篝火 · 爆裂性格（可多选）',en:'Campfire · crackle character (multi)'},   dot:'#ff9a5a', members:FIRE_CHARS,     default:['snap','collapse'] },
  { cat:'warm',   sound:'cafe',    key:'lull.cafe',    mode:'multi', min:0, label:{zh:'咖啡馆 · 环境细节（可全关）',en:'Café · ambient details (optional)'}, dot:'#ffc59a', members:CAFE_EVENTS,    default:['clink','grinder'] },
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
  { id:'rainynight',    name:{zh:'雨夜',en:'Rainy Night'}, fm:88.1,  mix:{ hrain:62, storm:34, wind:22 } },
  { id:'morningforest', name:{zh:'晨林',en:'Morning Forest'}, fm:90.4,  mix:{ forest:60, birds:48, breeze:30 } },
  { id:'seaside',       name:{zh:'海边',en:'Seaside'}, fm:92.9,  mix:{ ocean:72, breeze:32, birds:18 } },
  { id:'fireside',      name:{zh:'炉边',en:'Fireside'}, fm:95.6,  mix:{ fire:70, wind:24, lrain:24 } },
  { id:'traincabin',    name:{zh:'车厢',en:'Train Car'}, fm:98.3,  mix:{ train:60, hrain:30, hum:22 } },
  { id:'deepspace',     name:{zh:'深空',en:'Deep Space'}, fm:100.9, mix:{ brown:60, hum:34 } },
  { id:'sleeprain',     name:{zh:'雨眠',en:'Rain Sleep'}, fm:103.1, mix:{ lrain:52, brown:42, hum:28 } },   // 助眠：无雷无鸟、纯连续音
];

// ---------- 诗行 ----------
export const POEMS = {
  storm:{zh:'雷雨将至',en:'A storm draws near'}, hrain:{zh:'雨落如帘',en:'Rain like a curtain'}, lrain:{zh:'檐下细雨',en:'Soft rain on the eaves'},
  ocean:{zh:'潮汐往复',en:'Tides ebb and flow'}, forest:{zh:'林间有风',en:'Wind through the trees'}, birds:{zh:'晨鸟啁啾',en:'Morning birds chatter'},
  insects:{zh:'虫鸣阵阵',en:'Waves of insect song'}, fall:{zh:'水声轰鸣',en:'Roaring water'}, stream:{zh:'溪流潺潺',en:'A babbling stream'},
  wind:{zh:'风过旷野',en:'Wind over open fields'}, breeze:{zh:'微风拂面',en:'A breeze on your face'}, snow:{zh:'落雪无声',en:'Snow falls in silence'},
  white:{zh:'一片纯净',en:'Pure and clear'}, pink:{zh:'柔和绵长',en:'Soft and endless'}, brown:{zh:'低沉温厚',en:'Low and warm'},
  fan:{zh:'室内静谧',en:'Quiet indoors'}, ac:{zh:'凉夜微鸣',en:"A cool night's hum"}, hum:{zh:'低鸣入眠',en:'A drone into sleep'},
  fire:{zh:'篝火噼啪',en:'The campfire crackles'}, cafe:{zh:'咖啡馆微响',en:'Café murmurs'}, train:{zh:'夜行列车',en:'A night train'},
  subway:{zh:'地下轰隆',en:'Underground rumble'}, pages:{zh:'书页翻动',en:'Turning pages'}, tick:{zh:'滴答入夜',en:'Ticking into night'},
  purr:{zh:'猫眠呼噜',en:'A cat purrs in sleep'}, bowl:{zh:'钵音绵长',en:"The bowl's long tone"},
};
export function stationLine(st){ let best=null, bv=-1; Object.keys(st.mix).forEach(id=>{ if (st.mix[id]>bv){ bv=st.mix[id]; best=id; } }); return (best && L(POEMS[best])) || st.name; }

// ---------- 睡眠定时档位（off 的标签走 i18n，其余是数字）----------
export const TIMERS = [['off','off'],['15','15'],['30','30'],['45','45'],['60','60'],['90','90']];

// ---------- i18n：把上面 {zh,en} 的 name/desc/label 就地转成按当前语言解析的 getter ----------
// 这样各处 .name/.desc/.label 读取点零改动即随语言切换；对象展开（{...preset}）会在展开时取值，
// 由于 stations()/renderDial 等在渲染时才展开，切换语言后重渲染即拿到当前语言。
function localize(arr, keys){
  for (const o of arr) for (const k of keys){
    const raw = o[k];
    if (raw && typeof raw === 'object' && 'zh' in raw){
      Object.defineProperty(o, k, { get:()=>L(raw), enumerable:true, configurable:true });
    }
  }
  return arr;
}
localize(CATS, ['name']);
localize(SOUNDS, ['name']);
localize(BIRD_SPECIES, ['name','desc']);
localize(INSECT_SPECIES, ['name','desc']);
localize(FIRE_CHARS, ['name','desc']);
localize(CAFE_EVENTS, ['name','desc']);
localize(RAIN_SURFACES, ['name','desc']);
localize(VARIANT_PICKERS, ['label']);
localize(BUILTIN_PRESETS, ['name']);

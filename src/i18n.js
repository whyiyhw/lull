// 国际化（中英）：{zh,en} 解析器 L + UI 字符串表 t + 静态标签刷新 + 语言切换。
// locale 存在 state.js（live binding），L/t 在读取时按当前语言解析——data.js 的
// name/desc/label/诗行装 getter 即可零改动读取点；散落的 UI 文案走 t()。
import { locale, setLocaleState } from './state.js';
import { $ } from './util.js';

// {zh,en} 值 → 当前语言字符串；非该形状的值（自定义频道名等）原样透传。
export const L = v => (v && typeof v === 'object' && 'zh' in v) ? (v[locale] ?? v.zh) : v;

// UI 字符串表：每项 {zh,en}，值可为字符串或 (…args)=>string。
const M = {
  // 顶栏 / 静态
  tagline:      { zh:'声音电台 · Night FM', en:'Sound Radio · Night FM' },
  langBtn:      { zh:'EN', en:'中' },              // 显示「切到的目标语言」
  langLabel:    { zh:'切换语言 / English', en:'Switch language / 中文' },
  fsTitle:      { zh:'全屏 · F', en:'Fullscreen · F' },
  fsEnter:      { zh:'全屏（F）', en:'Fullscreen (F)' },
  fsExit:       { zh:'退出全屏（F）', en:'Exit fullscreen (F)' },
  themeLabel:   { zh:'切换深浅主题', en:'Toggle light / dark' },
  themeTitle:   { zh:'切换主题', en:'Toggle theme' },
  clockLabel:   { zh:'当前时间 · 点击切换秒针显示', en:'Current time · tap to toggle seconds' },
  clockTitle:   { zh:'点击切换秒针', en:'Tap to toggle seconds' },
  consoleLabel: { zh:'控制台', en:'Console' },
  volLabel:     { zh:'总音量', en:'Master volume' },
  soundsLabel:  { zh:'声音', en:'Sounds' },
  dialLabel:    { zh:'调频 · 频道选择', en:'Tune · station select' },
  mixEyebrow:   { zh:'Mix · 混音台', en:'Mix' },
  qsLabel:      { zh:'快速开始', en:'Quick start' },
  // 页脚：开源 / 反馈（图标，文案仅作 aria/title）+ 署名
  crStarLabel:  { zh:'在 GitHub 上给 Lull 点 Star', en:'Star Lull on GitHub' },
  crFbLabel:    { zh:'提反馈 / 报问题（GitHub Issues）', en:'Send feedback / report an issue' },
  crBy:         { zh:'由 whyiyhw 创造', en:'created by whyiyhw' },

  // 播放 / 混音状态（ui.js）
  play:         { zh:'播放', en:'Play' },
  pause:        { zh:'暂停', en:'Pause' },
  silent:       { zh:'静默', en:'Silent' },
  mixDefault:   { zh:'挑选声音，编织今晚的氛围', en:"Pick sounds, weave tonight's mood" },
  nowLayers:    { zh:(n)=>`<b>${n}</b> 层`, en:(n)=>`<b>${n}</b> layer${n>1?'s':''}` },
  pickSoundFirst:{ zh:'先从下面挑一种声音', en:'Pick a sound below first' },
  volSuffix:    { zh:(n)=>`${n} 音量`, en:(n)=>`${n} volume` },
  removeSuffix: { zh:(n)=>`移除 ${n}`, en:(n)=>`Remove ${n}` },
  variantSelected:  { zh:(n)=>`已选「${n}」`, en:(n)=>`Selected: ${n}` },
  variantKeepOne:   { zh:'至少留一种', en:'Keep at least one' },
  variantCollapsed: { zh:(n)=>`已收起「${n}」`, en:(n)=>`Collapsed: ${n}` },
  variantAdded:     { zh:(n)=>`已加入「${n}」`, en:(n)=>`Added: ${n}` },

  // 调频拨盘（tuner.js）
  silentUntuned:  { zh:'静默 · 未调频', en:'Silent · not tuned' },
  untuned:        { zh:'未调频', en:'not tuned' },
  manualTune:     { zh:'手动', en:'Manual' },
  removeStation:  { zh:'移除此频道', en:'Remove station' },
  saveStation:    { zh:'+ 存为频道', en:'+ Save as station' },
  stationDragTitle:{ zh:' MHz · 拖动改频率 · 长按删除', en:' MHz · drag to move · long-press to delete' },
  tunedTo:        { zh:(n,f)=>`已调到「${n}」· ${f}`, en:(n,f)=>`Tuned to ${n} · ${f}` },
  movedTo:        { zh:(n,f)=>`「${n}」移到 ${f}`, en:(n,f)=>`${n} moved to ${f}` },
  tunedLongPress: { zh:(n)=>`已调到「${n}」· 长按此频道可删除`, en:(n)=>`Tuned to ${n} · long-press to delete` },
  stationDeleted: { zh:(n)=>`已删除频道「${n}」`, en:(n)=>`Station deleted: ${n}` },
  tuningAt:       { zh:(f)=>`调频中 · ${f}`, en:(f)=>`Tuning · ${f}` },
  pickSomeFirst:  { zh:'先挑一些声音', en:'Pick some sounds first' },
  stationsFull:   { zh:'自定义频道已满（上限 8）', en:'Custom stations full (max 8)' },
  stationDefaultName:{ zh:(i)=>`频道 ${i}`, en:(i)=>`Station ${i}` },
  namePrompt:     { zh:'给这个频道起个名字', en:'Name this station' },
  savedAs:        { zh:(n,f)=>`已存为频道「${n}」· ${f} · 可拖动改位`, en:(n,f)=>`Saved as ${n} · ${f} · drag to reposition` },

  // 引擎（engine.js）
  fallbackNotice: { zh:'本地直开模式 · 部分声音改用合成', en:'Local file mode · some sounds use synthesis' },
  resumePrefix:   { zh:(names)=>`继续上次 · ${names}`, en:(names)=>`Resume · ${names}` },
  pickSomeToShare:{ zh:'先挑一些声音再分享', en:'Pick some sounds first to share' },
  linkCopied:     { zh:'混音链接已复制', en:'Mix link copied' },
  copyFail:       { zh:'复制失败 · 可手动复制地址栏', en:'Copy failed · copy the URL manually' },
  shareHint:      { zh:'可复制地址栏链接分享', en:'Share by copying the URL' },

  // 挂机 / 全屏（immersive.js）
  noWakeLock:     { zh:'本机不支持屏幕常亮 · 挂机请手动保持亮屏', en:'Screen wake lock unsupported · keep the screen on manually' },
  noFullscreen:   { zh:'此浏览器不支持全屏', en:'Fullscreen not supported in this browser' },

  // 锁屏卡片（lockscreen.js）
  appTitle:       { zh:'Lull · 声音电台', en:'Lull · Sound Radio' },

  // 睡眠定时 / 时钟（timer.js）
  timerOff:       { zh:'关', en:'Off' },
  weekday:        { zh:(i)=>['周日','周一','周二','周三','周四','周五','周六'][i], en:(i)=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i] },
  dateMeta:       { zh:(mo,day,wd)=>`${mo}月${day}日 · ${wd}`, en:(mo,day,wd)=>`${wd}, ${mo}/${day}` },
};

export function t(key, ...args){
  const e = M[key];
  if (!e) return key;
  const v = e[locale] ?? e.zh;
  return typeof v === 'function' ? v(...args) : v;
}

// 刷新 index.html 里的静态标签（切换语言或启动时调用）；动态文案由各 reflect* 重跑。
export function applyStaticStrings(){
  document.documentElement.setAttribute('lang', locale === 'zh' ? 'zh-CN' : 'en');   // <html lang> 跟随当前语言（屏幕阅读器/语义一致）
  const A = (id, attr, key) => { const el = $(id); if (el) el.setAttribute(attr, t(key)); };
  const T = (id, key) => { const el = $(id); if (el) el.textContent = t(key); };
  T('tagline', 'tagline');
  A('fullscreen', 'title', 'fsTitle');   A('fullscreen', 'aria-label', 'fsEnter');
  A('theme', 'aria-label', 'themeLabel'); A('theme', 'title', 'themeTitle');
  A('clock', 'aria-label', 'clockLabel'); A('clock', 'title', 'clockTitle');
  A('console', 'aria-label', 'consoleLabel');
  A('vol', 'aria-label', 'volLabel');
  A('sounds', 'aria-label', 'soundsLabel');
  A('dial', 'aria-label', 'dialLabel');
  T('del-station', 'removeStation');
  T('save-preset', 'saveStation');
  T('mix-eyebrow', 'mixEyebrow');
  T('qs-label', 'qsLabel');
  T('lang-txt', 'langBtn');
  A('lang', 'aria-label', 'langLabel'); A('lang', 'title', 'langLabel');
  A('cr-star', 'aria-label', 'crStarLabel'); A('cr-star', 'title', 'crStarLabel');
  A('cr-feedback', 'aria-label', 'crFbLabel'); A('cr-feedback', 'title', 'crFbLabel');
  T('cr-by', 'crBy');
}

// 语言切换 + 重渲染钩子（由 app.js 注册跨模块的重渲染）
let _onChange = () => {};
export function onLocaleChange(fn){ _onChange = fn; }
export function getLocale(){ return locale; }
export function setLocale(l){
  if (l === locale) return;
  setLocaleState(l);
  try { localStorage.setItem('lull.lang', l); } catch (e) {}
  applyStaticStrings();
  _onChange();
}
export function toggleLocale(){ setLocale(locale === 'zh' ? 'en' : 'zh'); }

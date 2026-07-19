# Lull · 执行路线（sprint board）

> 战略分两层：**收口**（在飞的先落地）与**新方向**。核心判断：功能已很满，瓶颈不在缺功能，而在**零次真机验收**。详细产品规格见 [PRD.md](PRD.md)，真机门禁清单见 [ACCEPTANCE.md](ACCEPTANCE.md)。
>
> 状态图例：✅ 完成 · 🔵 进行中 · ⬜ 未开始 · 🔒 被外部依赖阻塞

---

## 一、收口

### 收口-1 · 真机验收（v0.2 唯一硬门禁）🔒
- **阻塞于**：需要真 iPhone/Android + http(s)/PWA（非 file://）。这是我（AI）做不到的一步。
- **怎么做**：`pnpm dev --host` → 手机同网访问，或直接用已上线的 `https://lull.whyiyhw.com`，照 `ACCEPTANCE.md` §1–§6 逐项跑并回填。
- **判定**：§1 F-1 + §2 F-2/D7 + §3 F-3 全绿 = MLP 成立。任一「循环接缝惊醒 / 锁屏断播 / 音量失控」= P0，阻塞发布。
- **为什么第一**：不过这关，所有「代码 done」都是纸面 done。

### 收口-2 · D8 停播熄火 ✅（2026-07-18）
暂停 `freezeSchedulers()` 冻结事件调度器、恢复 `wakeSchedulers()` 重启；headless 验证 setTimeout churn 14→2→13。**真机整机功耗数值**随收口-1 一并测（ACCEPTANCE §4）。

### 收口-3 · D11 四项小修 ✅（2026-07-18）
快捷键 BUTTON 守卫 / 手动暂停取消定时 / snow 入 FAST / 沉浸态 datemeta 隐藏。

### 收口-4 · D12 鸟鸣连续画法 ✅（2026-07-18）
`drawBirds` 金色羽尘，与 `intensity('birds')` 密度联动。

### 收口-5 · 部署上线（Cloudflare Workers 静态资源）✅（2026-07-18）
- **已完成**：远端 `github.com/whyiyhw/lull.git` 已建并 push；线上 **https://lull.whyiyhw.com** 已上线（Cloudflare Workers 静态资源 + 自定义域，配置见 `wrangler.jsonc`）。部署改为手动 `pnpm build && npx wrangler deploy`（原 GitHub Pages 工作流已弃用）。
- **后续可选**：在 Cloudflare 后台接 GitHub 仓库做 push 自动构建（构建 `pnpm build` / 部署 `npx wrangler deploy`），或加 GitHub Actions 调 wrangler，让 push 即上线。当前不影响功能与离线使用。
- **产出已达成**：真实 URL → 可装主屏离线用 → 可收 issue 反馈（PRD 成功度量）。

### 收口-6 · D10 拆 ES modules ✅（2026-07-18）
- **已完成**：1276 行单 IIFE → 12 个扁平模块（产物仍是自包含单文件，`pnpm build` 内联 16 modules）。共享可变态用 `state.js` 的「live binding + setter」模式解循环依赖：各模块 import 读到的永远是最新值，仅 ctx/master/reverb/reverbBus/masterPlaying/masterVol 的重新赋值走 setter。
- **实际模块边界**：
  | 模块 | 行 | 内容 |
  |---|---|---|
  | `util.js` | 5 | $ / rand / root / curTheme |
  | `state.js` | 24 | 共享态：ctx/master/reverb/buffers/layers/masterPlaying/masterVol + setter + 音量助手 |
  | `data.js` | 125 | CATS/SOUNDS/byId、*_SPECIES、VARIANT_PICKERS、变体助手、BUILTIN_PRESETS、POEMS、TIMERS、stationLine |
  | `scene.js` | 236 | 生成式场景（自成一体单例，import 即起 rAF） |
  | `synth.js` | 285 | 事件调度器 + 音节合成 + buildBowl + wireSceneEmitters |
  | `lockscreen.js` | 59 | keepAlive + mediaSession + 中断自愈 |
  | `engine.js` | 249 | 音频图、层生命周期、播放控制（含 D8 freeze/wake）、混音持久化/分享 |
  | `tuner.js` | 148 | 拨盘/频道/预设 CRUD/扫台嘶声 |
  | `ui.js` | 106 | toast/reflect*/render 混音台+格子+子选择器 |
  | `timer.js` | 52 | 睡眠定时 + 时钟 + 入睡调光 |
  | `immersive.js` | 63 | Wake Lock + 沉浸态 + 全屏 + 快捷键 |
  | `app.js` | 53 | 入口：主题、监听装配、初始化、SW |
- **加东西现在改哪**：加声音 → `data.js`(+`synth.js` 若需声部)；加画法 → `scene.js`；加频道 → `data.js` 的 BUILTIN_PRESETS。
- **验证门（全绿）**：`pnpm build` ✓；开发期 headless 综合回归（puppeteer-core + 系统 Chrome）——boot 8 tab/6 定时/7 频道/3 格子；D8 churn 12→2→10；深链路（频道加载 3 层 + lit、鸟种 5 chip、雨质地、定时倒计时、主题/分享/存频道/清空）全过；**0 控制台报错**。等价性确立。（注：这些是一次性临时脚本，未入仓；若需回归可复现，考虑沉淀进 `test/` + CI。）

---

## 二、新方向（收口-1 通过后启动，★=最贴品牌）

### 方向 A ★ 整夜生成式漂移（电台×生成式双内核的独家玩法）
把定时后的静态 mix 变成一整夜的声音旅程——别家白噪音 App 做不到。
- [x] A1 `src/audio/drift.js` ✅（2026-07-18）：定时启动后对各活跃层的 gain 施加极缓慢、有界的调制（每层两条 11–27 min 慢正弦叠加、幅度 ±26%），相位播种使 t0 偏移为 0 → 从用户设定值悄然滑出、绝不突变（睡眠优先）。时钟用 `ctx.currentTime`（暂停即冻结、恢复续算）。只乘 `layerTarget`，不写 `soundVol` → 停止即温柔归位（`stopDrift` 6s 斜坡）。接线：`timer.js` setTimer 起 / cancelTimer 收。**调参旋钮=drift.js 顶部常量**。
- [ ] A2 可选「换台」：每 ~45–90 min 向相邻「夜间频道」极缓交叉淡化（定义一条 night-journey 频道序列）。
- [ ] A3 开关 + 持久化：**当前实现=「设定时即开」（无开关）**，是否要显式开关 + 持久化 + Media Session 标题联动待用户拍板。
- [x] A4 接入 freeze/wake ✅（2026-07-18）：`freezeDrift()`/`wakeDrift()` 挂进 `engine.js` 的 `freezeSchedulers`/`wakeSchedulers`；headless 验证暂停后 12s 内 0 漂移斜坡、活跃定时器回落，D8 熄火不回归。
- [ ] A5 真机听感终审（不刺醒、无接缝）——**下一步只有用户能做**：设个短定时挂一整夜/快进听，确认摆幅（±26%）、周期（11–27min）、归位是否舒服；不满意直接调 drift.js 顶部常量。
- 画面自动跟随（canvas 本就是 mix 的镜像），无需额外视觉。
- 验证门（全绿 2026-07-18）：`pnpm build` ✓ 17 modules 内联；开发期 headless 回归（puppeteer-core + 系统 Chrome、http 起服）12/12 通过——漂移有界 [0.266,0.454]、在动且平滑无突变、tap off 归位仍在播、暂停即停拍、**0 控制台报错**。（注：一次性脚本未入仓，见下方「回归脚本」。）

### 方向 B ★ 真实 CC0 录音补齐（填素材 > 写代码，工具链已就绪）
- [ ] B1 采集 CC0 循环：大雨/海浪/溪流/篝火/微风（+ 可选雷雨/瀑布/大风）。来源 Pixabay / Freesound(CC0)。
- [ ] B2 逐个过 `pnpm prep-audio`（单声道→首尾交叉淡化→loudnorm→mp3）。
- [ ] B3 给对应 SOUNDS 加 `file:'xxx.mp3'`；同步进 `public/sw.js` 的 AUDIO 列表（离线缓存）。
- [ ] B4 逐文件登记 `AUDIO_CREDITS.md`。
- [ ] B5 真机 A/B 响度 + 接缝终审。

### 方向 C ★ 画面 = 混音的活镜像（2026-07-18 首批落地）
让生成式画面与「选择/漂移」的联动做到美学极致——别家白噪音 App 的可视化都是死的。
- [x] C1 实时增益驱动 + 迟滞缓动 ✅：`scene.js` 的 `intensity` 改读层实时 gain（含渐入/漂移/音量斜坡）并逐帧向目标缓动（~0.55s）→ 选/取消气象般晕开/消散、**画面随整夜漂移一起呼吸**（补上 A「画面自动跟随」此前对漂移的落空）。sqrt 还原 perc 量级，静止态与旧版一致；reduced-motion 直接吸附。
- [x] C2 加权混色 tint ✅：同一 paint 多色按实时响度加权混合（回传 hex）→ 画面颜色=真实混音的颜色（白/粉/褐、四色 haze 等不再只显最响一色）。
- [x] C3 点选微光 bloom ✅：手动选一个声音，画面在其颜色里轻轻晕开（点击→画面的回应）；reduced-motion 跳过。
- [x] C4 时段染色 ✅：地平线暖光随真实时间在黄昏琥珀/深夜近无/黎明玫瑰间极缓移动（浅色主题减半）。headless 确证黄昏 R=28.5 vs 深夜 10.8、暖度差 13.7。
- 验证门（全绿 2026-07-18）：`pnpm build` ✓；开发期 headless 回归（scene 6/6 + 时段染色）——8 分类多 paint/多色同桶选中、画布逐帧未冻结（draw 无异常）、调频/音量/暂停恢复/清空全过、时段染色确证、**0 报错**。
- [x] C5 地铁/翻书/滴答/猫呼噜专属画法 ✅（2026-07-18）：四者从复用通用 paint 分出独立 paint（metro/paper/clock/purr）+ 各自 drawX——地铁隧道灯柱横扫（FAST）、翻书暖色纸屑翻飞、滴答极淡"时间在走"呼吸光（无跳动、助眠优先）、猫呼噜底部随睡眠呼吸缓胀的暖光。reduced-motion 全部降级为静态。headless 26 声音全选覆盖、0 报错。「画面=混音活镜像」联动至此每个声音都有贴切视觉。
- 温柔唤醒：定时到点可选「日出式」——画面渐亮 + 鸟鸣渐入当闹钟，闭环「入睡→起床」。
- 日部时段台：按真实时间自动推荐频道（清晨→晨林、深夜→雨眠）。
- 双耳节拍 / 空间感：冥想类 binaural beats，或雨/海轻微左右声像漂移。
- 更多变体选择器：海浪「离岸远近」、风「穿过什么」（VARIANT_PICKERS 加一条配置即可）。
- 英文 i18n：受众扩到全球，拉新划算。

> **回归脚本**：方向 A/C 的「headless 12/12」「6/6」证据来自开发期临时跑的 puppeteer-core 脚本（`drift-test` / `scene-test` / `timeglow-test` 等），**未入仓**——属一次性验证，非可持续回归。若要把这些证据变成长期门禁，需沉淀进 `test/` 目录并接 CI（GitHub Actions 起 Vite preview + 跑 puppeteer）。当前判据仍是收口-1 的真机验收。

---

## 建议顺序
1. **收口-1 真机验收**（+ 收口-2 的 D8 真机功耗）——否则一切 done 不作数。直接用已上线的 `https://lull.whyiyhw.com` 跑 `ACCEPTANCE.md` 即可，无需再起本地服务。
2. **挑一个放大差异化的新方向**——首选 A 整夜生成式漂移 的 A5 真机听感终审（代码已就绪，只欠耳朵），或 B 真实录音补齐（工具链已就绪，只欠素材）。
3. **可选**：把开发期 headless 脚本沉淀成 `test/` + CI，让回归可复现；push 即上线（Cloudflare 接 Git 或 GitHub Actions 调 wrangler）。

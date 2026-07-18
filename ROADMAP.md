# Lull · 执行路线（sprint board）

> 战略分两层：**收口**（在飞的先落地）与**新方向**。核心判断：功能已很满，瓶颈不在缺功能，而在**零次真机验收**。详细产品规格见 [PRD.md](PRD.md)，真机门禁清单见 [ACCEPTANCE.md](ACCEPTANCE.md)。
>
> 状态图例：✅ 完成 · 🔵 进行中 · ⬜ 未开始 · 🔒 被外部依赖阻塞

---

## 一、收口

### 收口-1 · 真机验收（v0.2 唯一硬门禁）🔒
- **阻塞于**：需要真 iPhone/Android + http(s)/PWA（非 file://）。这是我（AI）做不到的一步。
- **怎么做**：`pnpm dev --host` → 手机同网访问，照 `ACCEPTANCE.md` §1–§6 逐项跑并回填。
- **判定**：§1 F-1 + §2 F-2/D7 + §3 F-3 全绿 = MLP 成立。任一「循环接缝惊醒 / 锁屏断播 / 音量失控」= P0，阻塞发布。
- **为什么第一**：不过这关，所有「代码 done」都是纸面 done。

### 收口-2 · D8 停播熄火 ✅（2026-07-18）
暂停 `freezeSchedulers()` 冻结事件调度器、恢复 `wakeSchedulers()` 重启；headless 验证 setTimeout churn 14→2→13。**真机整机功耗数值**随收口-1 一并测（ACCEPTANCE §4）。

### 收口-3 · D11 四项小修 ✅（2026-07-18）
快捷键 BUTTON 守卫 / 手动暂停取消定时 / snow 入 FAST / 沉浸态 datemeta 隐藏。

### 收口-4 · D12 鸟鸣连续画法 ✅（2026-07-18）
`drawBirds` 金色羽尘，与 `intensity('birds')` 密度联动。

### 收口-5 · 部署上线（GitHub Pages）🔒
- **已备**：`.github/workflows/deploy.yml`（pnpm→build→Pages，`base:'./'` 已适配项目站点）。
- **阻塞于**：仓库当前**无 git 远端**。需 ① 建 GitHub 远端并 push；② Settings→Pages→Source 选「GitHub Actions」。
- **产出**：真实 URL → 可装主屏离线用 → 才能收 issue 反馈（PRD 成功度量靠这个）。

### 收口-6 · D10 拆 ES modules ⬜（**建议在收口-1 通过后再动**）
- **为什么不现在做**：这是碰全量代码（含 sleep-critical 音频路径）的大重构。在**未经真机验证的基线**上叠大重构，只会把验收面撑大、把「过夜才暴露」的回归引进来。正确顺序：先用当前 D8-fixed 的干净构建过真机 → 基线可信 → 再重构。
- **已就绪**：Vite ESM 管线 + 单文件产物（`index.html` 已 `<script type="module" src="/src/app.js">`）。拆分是纯源码组织，产物仍自包含。
- **建议模块边界**（app.js 1300+ 行 → 约 10 个模块）：
  | 模块 | 内容 | 依赖 |
  |---|---|---|
  | `data.js` | CATS/SOUNDS/byId、*_SPECIES、VARIANT_PICKERS、BUILTIN_PRESETS、POEMS、TIMERS（纯数据） | 无 |
  | `audio/state.js` | 共享可变态：ctx/master/reverb/buffers/layers/masterPlaying 的 get/set（打破循环依赖的关键） | 无 |
  | `audio/engine.js` | ensureCtx、makeNoise/Impulse、buildLayer、wireSynth、setPlaying、freeze/wake、removeLayer、toggleSound/Master、clearAll、音量 | state, data, scene, synth-events |
  | `audio/synth-events.js` | 所有 schedule*/trigger*（雷/鸟/虫/篝火/咖啡/火车/滴答/翻书/颂钵） | state, scene |
  | `audio/lockscreen.js` | keepAlive、mediaSession、attemptRecover、silentWav | state |
  | `tuner.js` | 拨盘/频道/预设 CRUD | engine, mix, data |
  | `mix.js` | 持久化/会话恢复/URL 分享 | engine, data |
  | `scene.js` | 生成式场景（现 IIFE → 导出 scene 对象 + init） | state, data |
  | `immersive.js` | Wake Lock、沉浸态、全屏、入睡调光、快捷键 | engine, tuner |
  | `ui.js` | reflect*/render*、子选择器 UI、toast、时钟、定时 | engine, tuner, mix, data |
  | `main.js` | 组装 + 初始化（现入口） | all |
- **迁移策略**：先抽纯数据（`data.js`，零风险）→ 抽 `scene.js`（自成一体）→ 抽 `audio/*`（用 `state.js` 解循环）→ 最后 `ui/tuner/immersive/main`。每抽一块跑一次验证门。
- **验证门（回归保护）**：`pnpm build` 通过 + headless boot（8 tab 等渲染）+ D8 setTimeout churn 测试（14→2→13）+ 鸟鸣截图无报错。全绿才算等价。测试脚手架见 `scratchpad/d8-test.mjs`（可移入 repo）。

---

## 二、新方向（收口-1 通过后启动，★=最贴品牌）

### 方向 A ★ 整夜生成式漂移（电台×生成式双内核的独家玩法）
把定时后的静态 mix 变成一整夜的声音旅程——别家白噪音 App 做不到。
- [ ] A1 `audio/drift.js`：定时启动后，对各层目标音量施加极缓慢、有界的调制（周期 ~10–30 min、幅度 ±X%），绝不突变（睡眠优先）。
- [ ] A2 可选「换台」：每 ~45–90 min 向相邻「夜间频道」极缓交叉淡化（定义一条 night-journey 频道序列）。
- [ ] A3 开关 + 持久化（默认：设定时即开？待定）；文案与 Media Session 标题联动。
- [ ] A4 **必须接入 freeze/wake**：漂移调度器暂停即冻结、恢复即重启，不破坏 D8 熄火。
- [ ] A5 真机听感终审（不刺醒、无接缝）。
- 画面自动跟随（canvas 本就是 mix 的镜像），无需额外视觉。

### 方向 B ★ 真实 CC0 录音补齐（填素材 > 写代码，工具链已就绪）
- [ ] B1 采集 CC0 循环：大雨/海浪/溪流/篝火/微风（+ 可选雷雨/瀑布/大风）。来源 Pixabay / Freesound(CC0)。
- [ ] B2 逐个过 `pnpm prep-audio`（单声道→首尾交叉淡化→loudnorm→mp3）。
- [ ] B3 给对应 SOUNDS 加 `file:'xxx.mp3'`；同步进 `public/sw.js` 的 AUDIO 列表（离线缓存）。
- [ ] B4 逐文件登记 `AUDIO_CREDITS.md`。
- [ ] B5 真机 A/B 响度 + 接缝终审。

### backlog（按需拉起）
- 地铁/翻书/滴答/猫呼噜专属「气象画法」（现复用通用画法，弱化「画面是混音的镜像」）。
- 时段染色：画布主色随真实时间黄昏→深夜→黎明缓移。
- 温柔唤醒：定时到点可选「日出式」——画面渐亮 + 鸟鸣渐入当闹钟，闭环「入睡→起床」。
- 日部时段台：按真实时间自动推荐频道（清晨→晨林、深夜→雨眠）。
- 双耳节拍 / 空间感：冥想类 binaural beats，或雨/海轻微左右声像漂移。
- 更多变体选择器：海浪「离岸远近」、风「穿过什么」（VARIANT_PICKERS 加一条配置即可）。
- 英文 i18n：受众扩到全球，拉新划算。

---

## 建议顺序
1. **收口-1 真机验收**（+ 收口-2 的 D8 真机功耗）——否则一切 done 不作数。
2. **收口-5 部署 → 收口-6 拆模块**——拿到真实 URL 和反馈回路；在可信基线上重构。
3. **挑一个放大差异化的新方向**——首选 A 整夜生成式漂移 或 B 真实录音补齐。

# Lull · 声音气象台

白噪音 + 生成式场景的**混音助眠/专注**网页应用。所有控制浮在一块随混音生长的画布上——你叠什么声音，画面就长出对应的气象（雨丝、林间浮尘、海浪、鸟鸣的金色火花、雷雨闪电、噪点颗粒…）。

**本地优先、运行时零依赖、无账号、无埋点、无第三方请求**。可双击 `index.html` 运行，也可装到主屏离线使用。

---

## 运行

- **双击** `index.html` —— 直接用浏览器打开。合成声音全部可用；真实录音在 `file://` 下会因 `fetch` 受限**自动回退为合成音**（右下角有一次提示）。
- **本地服务器 / PWA**（推荐，能听真实录音、能离线、能锁屏播放）：
  ```bash
  pnpm install
  pnpm dev        # → http://localhost:5173
  ```
  或把构建产物 `dist/` 部署到任意静态服务器（本项目走 **Cloudflare Workers 静态资源**，见下方「部署」）。浏览器地址栏会出现「安装」入口，装到主屏后可离线冷启动。

## 部署（Cloudflare）

线上：**https://lull.whyiyhw.com** —— Cloudflare Workers 静态资源托管。

纯静态站，产物即 `dist/`（`vite build` 把全部 JS/CSS 内联进单个 `index.html` + `public/` 运行时资源）。部署配置见 `wrangler.jsonc`：`assets.directory` 指向 `dist/`，`routes` 绑自定义域 `lull.whyiyhw.com`。

```bash
pnpm build            # 生成 dist/
npx wrangler deploy   # 上传资源 + 更新边缘；首次自动建自定义域 DNS 记录
```

- 首次需 `npx wrangler login` 登录 Cloudflare 账号。
- 自定义域要求该域名 zone 已托管在同一 Cloudflare 账号（DNS 记录由 `wrangler deploy` 自动创建）。
- 也可在 Cloudflare 后台给这个 `lull` Worker 接 GitHub 仓库做自动构建：构建命令 `pnpm build`、部署命令 `npx wrangler deploy`。

## 功能

- **叠加混音台** · 26 种声音 / 8 类：任意叠加，每层独立音量 + 淡入淡出。
- **调频拨盘 · 电台频道**：复古 FM 拨盘在夜间频道间穿梭（雨夜 / 晨林 / 炉边 / 深空 / 雨眠…），一键交叉淡化；可把当前混音「存为频道」。
- **生成式场景 · 混音的活镜像**：整屏 canvas 随混音实时作画——选/取消气象般晕开消散、随整夜漂移一起呼吸、地平线暖光随真实时段（黄昏 / 深夜 / 黎明）缓移。
- **整夜生成式漂移**：睡眠定时后各层音量极缓潮汐（有界、绝不突变），把静态混音变成一整夜的旅程。
- **锁屏存活**：Media Session（锁屏显频道名与播放态）+ 保活元素；来电/闹钟中断结束后自动重拉播放。
- **沉浸挂机**：8s 无操作淡出 UI + 放大时钟 + Wake Lock + 入睡调光 + 防烧屏；快捷键 `Space` / `F` / `Esc` / `1–6`。
- **细分子选择器**：鸟种 / 虫种 / 篝火性格 / 咖啡细节多选合唱，雨可选「打在什么上」实时换质地。
- **睡眠定时** 15–90 分（结束前缓缓淡出）· **会话恢复**「继续上次」· **URL hash 分享**。
- **PWA**：可装主屏、完全离线（含音频缓存）；本地优先、零第三方请求、无账号、无埋点。

## 声音清单

| 类 | 声音 | 来源 |
|---|---|---|
| 噪音 | 白 / 粉 / 褐 | 合成 |
| 雨 | 小雨 / 大雨✓ / 雷雨 | 合成 |
| 水 | 海浪✓ / 溪流✓ / 瀑布 | 合成 |
| 林 | 森林✓ / 鸟鸣 / 虫鸣 | 合成 |
| 风 | 微风✓ / 大风 / 落雪 | 合成 |
| 室内 | 风扇 / 空调 / 火车✓ / 地铁 / 翻书 / 滴答 | 合成 |
| 暖 | 篝火✓ / 咖啡馆✓ / 猫呼噜 | 合成 |
| 冥想 | 颂钵 / 低鸣 | 合成 |

✓ = 用真实录音（**8 个**，均 CC0 / 公有领域，见下方版权说明）：`forest`/`train`/`cafe`（Wikimedia Commons）+ `hrain`/`ocean`/`stream`/`fire`/`breeze`（Freesound，2026-07-18 补齐）；其余为 CC0 程序合成（F-3 后原 5 个 CC BY-SA 录音已移除改用合成）。

## 换 / 加音频（零改代码或一行）

1. 把音频文件（`.mp3`）放进 `public/audio/`，命名为对应 id：`lrain.mp3`、`storm.mp3`、`ocean.mp3`…
2. 在 `src/data.js` 的 `SOUNDS` 配置里给该声音加一个字段 `file:'xxx.mp3'` 即可（当前 8 个已挂真实录音：`forest`/`train`/`cafe` + `hrain`/`ocean`/`stream`/`fire`/`breeze`）。
3. 没有 `file` 的声音自动用合成。
4. 若新增了文件，记得把文件名同步进 `public/sw.js` 的 `AUDIO` 列表，离线才会缓存到。

> ⚠️ 引擎用 `AudioBufferSourceNode` 采样级循环，**素材必须首尾可循环**（首尾能量/相位接近），否则循环点会跳变。
>
> **一步到位的预处理**：把原始录音丢进 `public/audio/raw/`，运行 `pnpm prep-audio`（依赖系统 `ffmpeg`）——脚本自动**转单声道 → 首尾交叉淡化消接缝 → loudnorm 响度归一 → 转码 mp3**，产出直接落到 `public/audio/`。单文件也可：`node scripts/prep-audio.mjs 下载.wav lrain`。
>
> **推荐源**：[Pixabay](https://pixabay.com/sound-effects/)、[Freesound（CC0 过滤）](https://freesound.org/) —— 免版税、可商用、无需署名。
>
> ✅ **当前发布集全部可商用**：8 个 CC0/公有领域录音（`forest`/`train`/`cafe` + `hrain`/`ocean`/`stream`/`fire`/`breeze`）+ 其余 CC0 程序合成；原 5 个 CC BY-SA 素材已移除改用合成（F-3 合规）。详见 [AUDIO_CREDITS.md](AUDIO_CREDITS.md)。

## 技术

纯前端、无后端、无第三方请求。`src/` 下 12 个扁平 ES modules，Vite + `vite-plugin-singlefile` 把全部 JS/CSS 内联进单个自包含 `index.html`（gzip ~28KB），系统字体、零外链。音频走 **Web Audio 统一图**——真实录音（`decodeAudioData` → `AudioBufferSourceNode`）与程序合成层共用 gain / 混响 / 主总线，采样级无缝循环；停播即冻结调度器 + `ctx.suspend()` 熄火，引擎不空转。场景是单 `<canvas>` 按各层实时增益逐帧作画；锁屏走 Media Session + 保活元素；离线靠 `sw.js` + `manifest.webmanifest`。

> 加声音改 `data.js`(+`synth.js`)、加画法改 `scene.js`。架构细节、技术债台账与执行路线见 [docs/ROADMAP.md](docs/ROADMAP.md)。

## Roadmap

- [x] 音频引擎统一进 Web Audio 图（消灭 iOS 音量失效、循环接缝、双份逻辑）
- [x] 锁屏/后台存活（Media Session + 保活 + 中断自愈）
- [x] 调频拨盘 · 电台频道（雨夜 / 晨林 / 炉边…）+ 自定义频道
- [x] 会话恢复「继续上次」+ URL hash 分享
- [x] PWA（加到主屏、离线用）+ 已部署上线 [lull.whyiyhw.com](https://lull.whyiyhw.com)
- [x] 后台省电 · 停播熄火（停画停钟、自适应帧率、暂停即冻结调度器 + `ctx.suspend()`）
- [x] 拆 ES modules（12 个扁平模块，产物仍自包含单文件）
- [x] 整夜生成式漂移（定时后各层音量极缓潮汐，别家白噪音 App 做不到）
- [x] 画面 = 混音的活镜像（实时增益驱动 + 加权混色 + 时段染色 + 每声音专属画法）
- [ ] 真机验收（v0.2 唯一硬门禁，见 [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md)）——只有真人能跑
- [x] 补齐真实 CC0 录音（大雨/海浪/溪流/篝火/微风 · Freesound CC0，2026-07-18）

> 📖 深入文档：产品规格 [docs/PRD.md](docs/PRD.md) · 执行路线与技术债 [docs/ROADMAP.md](docs/ROADMAP.md) · 真机验收清单 [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) · 音频版权 [AUDIO_CREDITS.md](AUDIO_CREDITS.md)。

## License

代码：MIT，见 [LICENSE](LICENSE)。音频：各素材独立许可，见 [AUDIO_CREDITS.md](AUDIO_CREDITS.md)。

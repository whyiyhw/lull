# 音频版权 / Audio Credits

`audio/` 目录现仅保留 **3 个 CC0 / 公有领域**录音（均来自 [Wikimedia Commons](https://commons.wikimedia.org)，
裁剪为 60 秒、转码单声道 MP3，许可证经 Commons `extmetadata` 核验）。**全表可商用、无 copyleft**——
原先 5 个 CC BY-SA 素材（小雨/雷雨/瀑布/鸟鸣/大风）已移除，改用引擎内置的 **CC0 程序合成**（F-3 版权合规，
沿用 PRD §8「合成回退兜底」）。

> 引擎说明（v0.2 起）：真实录音走 `fetch` + `decodeAudioData` 解码进 `AudioBufferSourceNode`（`loop=true`），
> 与合成层共用同一套 gain / 混响 / 主总线。`AudioBufferSourceNode` 循环是采样级无缝的——**素材必须首尾可循环**
> （首尾能量/相位接近），否则循环点会跳变。无 `file` 的声音自动用合成（无限不循环、体积为零、天然 CC0）。
>
> 代码许可证：MIT（见 [LICENSE](LICENSE)）。以下音频许可证与代码彼此独立。

| 文件 | 声音 | 许可证 | 商用 | 原始来源（Commons File:） |
|---|---|---|---|---|
| `cafe.mp3`   | 咖啡馆 | Public domain | ✅ | Restaurant ambience.ogg |
| `forest.mp3` | 森林   | Public domain | ✅ | 20090610 0 ambience.ogg |
| `train.mp3`  | 火车   | CC0           | ✅ | Taiwan railways EP727 train cars sounds.ogg |

**其余声音全部为 CC0 程序合成**（无音频文件）：白/粉/褐噪音、小雨、大雨、雷雨、海浪、溪流、瀑布、鸟鸣、
微风、大风、落雪、风扇、空调、地铁、翻书、滴答、篝火、猫呼噜、颂钵、低鸣。

## 素材流水线（F-3 · 消 D3）

若日后想把某个合成声音升级为真实录音，所有替换 / 新增素材都必须过 [`scripts/prep-audio.mjs`](scripts/prep-audio.mjs)——
它把「首尾可循环 + 响度均衡」从主观校对固化为可重复工序（基于系统 ffmpeg）：
**转单声道 → 首尾交叉淡化消循环接缝 → loudnorm 响度归一 → 转码 mp3**。

```sh
brew install ffmpeg                      # 依赖（一次）
# 批处理：把原始录音丢进 audio/raw/，产出落到 audio/<同名>.mp3；再到 index.html 的 SOUNDS 给该声音加 file:'xx.mp3'
node scripts/prep-audio.mjs
# 或单文件：node scripts/prep-audio.mjs 下载.wav lrain --xfade 3 --lufs -18
pnpm prep-audio                          # 等价快捷命令
```

交叉淡化把原本 `尾→头` 的硬切重叠抹平（输出时长 = 原时长 − 交叉长度），配合引擎的采样级循环即可无缝。
loudnorm 统一到 −18 LUFS。已用真实素材验证：流水线把首尾能量比从 1.19 拉到 1.01（消除循环「泵感」）、响度归一到 −18 LUFS。

### 找素材（`scripts/fetch-cc0.mjs`，可选）

[`scripts/fetch-cc0.mjs`](scripts/fetch-cc0.mjs) 从 Wikimedia Commons **按许可证机器核验**检索可商用候选
（CC0 / 公有领域 / 纯 CC-BY，拒一切 ShareAlike）：`node scripts/fetch-cc0.mjs` 干跑列候选，`--apply` 下载到 `audio/raw/`。

> ⚠️ **许可证可信，内容需人工试听**：Commons 检索按关键字匹配元数据，不保证音频真是那个声音
> （实测「heavy rain」命中一段蟋蟀、「rain」命中一首同名音乐）。这是**版权洁癖 + 听感把关**的交叉点——
> `--apply` 前务必逐个试听确认，别直接把脚本产物发布。**当前发布集选择合成而非盲选录音**，正是为了不牺牲这两条。

# 音频版权 / Audio Credits

`audio/` 目录当前为**探路占位素材**，全部来自 [Wikimedia Commons](https://commons.wikimedia.org)，
经裁剪为 60 秒、转码为单声道 MP3。**部分为 CC BY-SA，不适合商用闭源产品**——
正式发布前请替换为 CC0 / 可商用素材（Pixabay、Freesound-CC0 等）。

> 引擎说明（v0.2 起）：这些文件不再走 `<audio>` 元素，而是 `fetch` + `decodeAudioData`
> 解码进 `AudioBufferSourceNode`（`loop=true`），与合成层共用同一套 gain / 混响 / 主总线。
> `AudioBufferSourceNode` 的循环是采样级无缝的——**因此素材本身必须首尾可循环**（首尾能量、
> 相位尽量接近），否则会在循环点听到跳变。建议替换素材时用编辑器做首尾交叉淡化预处理。
>
> 代码许可证：MIT（见 [LICENSE](LICENSE)）。以下音频许可证与代码彼此独立。

| 文件 | 声音 | 许可证 | 商用 | 原始来源（Commons File:） |
|---|---|---|---|---|
| `cafe.mp3`   | 咖啡馆 | Public domain | ✅ | Restaurant ambience.ogg |
| `forest.mp3` | 森林   | Public domain | ✅ | 20090610 0 ambience.ogg |
| `train.mp3`  | 火车   | CC0           | ✅ | Taiwan railways EP727 train cars sounds.ogg |
| `lrain.mp3`  | 小雨   | CC BY-SA 4.0  | ⚠️ 需署名 + copyleft | Sound of light rainfall.ogg |
| `storm.mp3`  | 雷雨   | CC BY-SA 4.0  | ⚠️ 需署名 + copyleft | Good thunderstorm Sept 8 2022.ogg |
| `fall.mp3`   | 瀑布   | CC BY-SA 3.0  | ⚠️ 需署名 + copyleft | Waterfall Gully, South Australia.ogg |
| `birds.mp3`  | 鸟鸣   | CC BY-SA 3.0 (nl) | ⚠️ 需署名 + copyleft | Early morning Birdsong Leersum.wav |
| `wind.mp3`   | 大风   | CC BY-SA 4.0  | ⚠️ 需署名 + copyleft | Wind in Swedish pine forest at 25 mps.ogg |

## 待替换（需 CC0/可商用真实录音）

- ⚠️ 上表 5 个 CC BY-SA 文件（小雨、雷雨、瀑布、鸟鸣、大风）
- ➕ 尚缺真实录音、目前用合成的自然声：大雨(`hrain`)、海浪(`ocean`)、溪流(`stream`)、篝火(`fire`)、微风(`breeze`)

替换方法见 [README.md](README.md) 的「换 / 加音频」。

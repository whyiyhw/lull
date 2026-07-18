// 整夜生成式漂移（方向 A / A1）：睡眠定时启动后，把静态混音变成一整夜的潮汐——
// 对各活跃层的目标音量施加极缓慢、有界的调制，绝不突变（睡眠优先）。别家白噪音 App 做不到。
//
// 设计要点：
// · 只围绕 layerTarget(id) 做乘性摆动，绝不写 soundVol —— 用户设定的音量不被污染，停止即原样归位。
// · 时钟用 ctx.currentTime：暂停挂起时它一并冻结，恢复后从原处续算 → 换台般的相位无接缝续航。
// · 每层两条不同周期的慢正弦叠加（有机、不明显循环），相位播种使 t0 处偏移恰为 0 → 从设定值悄然滑出，起步无跳变。
// · 与 D8 同呼吸：freezeDrift 暂停即停拍、wakeDrift 恢复即续航（见 engine.js 的 freeze/wakeSchedulers）。
//
// A5 调参旋钮就是下面这几个常量（真机听感终审时按耳朵微调）。
import { ctx, layers, layerTarget, masterPlaying } from '../state.js';
import { rand } from '../util.js';

const AMP = 0.26;              // 目标音量围绕用户设定值的有界摆幅（±26%）——两条正弦归一化后总偏移不超过它
const TICK = 9;                // 采样/重排间隔（秒）：ticks 之间线性滑行 → 连续无接缝；相对周期极小，听感全程平滑
const MIN_PERIOD = 11 * 60;    // 单层慢摆最短周期（秒）
const MAX_PERIOD = 27 * 60;    // 最长周期
const RESTORE = 6;             // 停止时归位到用户设定值的渐变时长（秒）

let driftOn = false;           // 漂移是否开启（由睡眠定时开/关；跨 freeze/wake 保留）
let driftTimer = 0;            // 采样循环的 setTimeout 句柄（暂停即清、恢复即重排 —— D8）
const phase = new Map();       // id -> {w1,p1,w2,p2}，惰性播种

function seed(id){
  const t0 = ctx.currentTime;
  const per1 = MIN_PERIOD + rand() * (MAX_PERIOD - MIN_PERIOD);
  const per2 = MIN_PERIOD + rand() * (MAX_PERIOD - MIN_PERIOD);
  const w1 = 2 * Math.PI / per1, w2 = 2 * Math.PI / per2;
  // 让两条正弦在 t0 恰过零点（随机取上行/下行）：起步偏移为 0，从用户设定值缓缓漂开，随两周期渐渐错开而有机
  const p1 = -w1 * t0 + (rand() < 0.5 ? 0 : Math.PI);
  const p2 = -w2 * t0 + (rand() < 0.5 ? 0 : Math.PI);
  const s = { w1, p1, w2, p2 };
  phase.set(id, s);
  return s;
}
function factor(id, t){
  const s = phase.get(id) || seed(id);
  return 1 + AMP * (0.62 * Math.sin(s.w1 * t + s.p1) + 0.38 * Math.sin(s.w2 * t + s.p2));  // ∈ [1-AMP, 1+AMP]
}

// 一次采样：把每个活跃层的 gain 线性滑向 layerTarget*factor（跨 TICK 秒），再排下一拍。
function tick(){
  if (!driftOn || !ctx || !masterPlaying) return;
  const now = ctx.currentTime;
  layers.forEach((l, id) => {
    if (!l.active || !l.gain) return;
    const target = Math.max(0, layerTarget(id) * factor(id, now));
    const g = l.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(g.value, 0.0001), now);
    g.linearRampToValueAtTime(target, now + TICK);
  });
  driftTimer = setTimeout(tick, TICK * 1000);
}

export function isDrifting(){ return driftOn; }

// 睡眠定时启动 → 开启漂移（A1）。幂等；播放态下立即播种起步，暂停态待 wakeDrift 唤醒。
export function startDrift(){
  if (driftOn) return;
  driftOn = true;
  phase.clear();
  if (masterPlaying) tick();
}
// 定时取消/结束/tap「off」→ 关闭漂移；仍在播则把各层温柔归位到用户设定值（tap off 不停播，这步尤为要紧）。
export function stopDrift(){
  if (!driftOn) return;
  driftOn = false;
  if (driftTimer){ clearTimeout(driftTimer); driftTimer = 0; }
  if (ctx && masterPlaying){
    const now = ctx.currentTime;
    layers.forEach((l, id) => {
      if (!l.active || !l.gain) return;
      const g = l.gain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(Math.max(g.value, 0.0001), now);
      g.linearRampToValueAtTime(layerTarget(id), now + RESTORE);
    });
  }
  phase.clear();
}
// D8 挂钩：暂停即冻结采样循环（driftOn 保留，相位随 ctx 冻结）。
export function freezeDrift(){ if (driftTimer){ clearTimeout(driftTimer); driftTimer = 0; } }
// D8 挂钩：恢复播放 → 若漂移仍开启则续航（相位从 ctx.currentTime 自然接续，无接缝）。
export function wakeDrift(){ if (driftOn && masterPlaying){ if (driftTimer){ clearTimeout(driftTimer); driftTimer = 0; } tick(); } }

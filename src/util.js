// 通用小工具：DOM 取元素、随机、根元素、当前主题。全局共享，无副作用。
export const $ = id => document.getElementById(id);
export const rand = () => Math.random();
export const root = document.documentElement;
export const curTheme = () => root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 产物：把 JS/CSS 全部内联进单个 index.html（保留「本地优先·自包含」哲学）；
// public/ 下的运行时资源（sw.js / manifest / audio / icons）原样拷到 dist 根。
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { target: 'es2020', cssCodeSplit: false, assetsInlineLimit: 100000000, chunkSizeWarningLimit: 4096 },
});

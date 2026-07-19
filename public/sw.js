// Lull Service Worker —— 离线优先（F-6）
// 核心壳 network-first（保证更新），音频/图标 cache-first（体积大、极少变）。
// 改版时提升 VERSION 即可让旧缓存失效。
const VERSION = 'lull-v4';
const CORE = [
  './', 'index.html', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];
const AUDIO = ['forest', 'train', 'cafe', 'hrain', 'ocean', 'stream', 'fire', 'breeze'].map(n => 'audio/' + n + '.mp3');   // 8 个 CC0/公有领域录音（Freesound）；小雨/雷雨/瀑布/大风/鸟鸣等仍用 CC0 合成

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE);                                   // 核心壳必须成功
    await Promise.allSettled(AUDIO.map((u) => cache.add(u)));   // 音频容错预缓存（缺文件不致失败）
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                  // 只处理同源
  // 开发期 Vite 内部资源与 sourcemap 一律放行，避免干扰 HMR
  if (/\/(@vite|@fs|@id|@react-refresh|node_modules|src)\//.test(url.pathname) || url.pathname.endsWith('.map')) return;

  if (req.mode === 'navigate') {                               // 导航：先网络，断网回退缓存壳
    e.respondWith((async () => {
      try { return await fetch(req); }
      catch (_) { return (await caches.match('index.html')) || (await caches.match('./')) || Response.error(); }
    })());
    return;
  }

  // 静态资源：cache-first，miss 时取网络并回填（音频/图标/清单）
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const net = await fetch(req);
      const p = url.pathname;
      if (net && net.ok && (p.includes('/audio/') || p.includes('/icons/') || p.endsWith('.webmanifest'))) {
        const cache = await caches.open(VERSION); cache.put(req, net.clone());
      }
      return net;
    } catch (_) { return cached || Response.error(); }
  })());
});

// @ts-check
// 重要不變量：新增任何 .js/.json/.css 模組後，務必同步加入下方快取清單，
// 否則離線模式會壞掉（見 SPEC.md §5）。

const CACHE_VERSION = 'v3';
const CACHE_NAME = `mobile-snake-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './styles/main.css',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',

  './src/main.js',
  './src/core/config.js',
  './src/core/grid.js',
  './src/core/snake.js',
  './src/core/food-manager.js',
  './src/core/state-machine.js',
  './src/core/game-loop.js',
  './src/core/game.js',
  './src/render/renderer.js',
  './src/input/input-manager.js',
  './src/audio/audio-engine.js',
  './src/utils/haptic-manager.js',
  './src/utils/stats-manager.js',
  './src/i18n/i18n.js',

  './i18n/index.json',
  './i18n/zh-TW.json',
  './i18n/en-US.json',
  './i18n/ar-SA.json',
  './i18n/bn-BD.json',
  './i18n/de-DE.json',
  './i18n/es-ES.json',
  './i18n/fa-IR.json',
  './i18n/fr-FR.json',
  './i18n/hi-IN.json',
  './i18n/id-ID.json',
  './i18n/it-IT.json',
  './i18n/ja-JP.json',
  './i18n/ko-KR.json',
  './i18n/nl-NL.json',
  './i18n/pl-PL.json',
  './i18n/pt-BR.json',
  './i18n/ru-RU.json',
  './i18n/th-TH.json',
  './i18n/tr-TR.json',
  './i18n/ur-PK.json',
  './i18n/vi-VN.json',
  './i18n/zh-CN.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => cached);
    })
  );
});

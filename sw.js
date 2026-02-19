const CACHE_NAME = 'gymapp-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './treino.json',
  './manifest.json',
  './icon.png',
];

// Instala e faz o cache dos arquivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
});

// Responde com o cache quando estiver offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

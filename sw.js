// 청춘 7x7 가로세로 낱말 퍼즐 100 - Cache-First Service Worker
const CACHE_NAME = 'senior-crossword-100-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// 서비스 워커 설치: 정적 자원 사전 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 활성화: 구버전 캐시 정리 및 즉각 클라이언트 제어
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 네트워크 요청 가로채기: Cache-First 전략 (오프라인 완벽 지원)
self.addEventListener('fetch', (event) => {
  // GET 요청만 캐싱 처리
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // 캐시 히트 시 즉시 반환하고, 백그라운드에서 최신 버전 캐시 갱신 (Stale-While-Revalidate 유사)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {
          // 네트워크 실패 시 무시 (오프라인 상태)
        });
        return cachedResponse;
      }

      // 캐시에 없으면 네트워크로 요청 후 캐시에 저장
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // 네트워크 실패 시 index.html 폴백
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// 청춘 10x10 가로세로 낱말 퍼즐 100 - Cache-First Service Worker (v12)
const CACHE_NAME = 'senior-crossword-100-v12';
const AUDIO_CACHE = 'senior-crossword-audio-v1'; // 문제 음성 MP3 전용 (버전 업데이트와 무관하게 유지)
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
          if (key !== CACHE_NAME && key !== AUDIO_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 오디오 Range 요청(모바일 미디어 재생기 필수)에 206 부분 응답 생성
async function toRangeResponse(request, response) {
  const range = request.headers.get('range');
  if (!range) return response;
  const buf = await response.arrayBuffer();
  const total = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : total - 1;
  if (m && !m[1] && m[2]) { // bytes=-N (마지막 N바이트)
    start = Math.max(0, total - parseInt(m[2], 10));
    end = total - 1;
  }
  end = Math.min(end, total - 1);
  if (start >= total || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
  }
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}

// 문제 음성 MP3: 캐시 우선 → 없으면 전체 파일을 받아 캐시 후 응답 (오프라인 재생 지원)
async function handleAudio(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const url = request.url;
  let response = await cache.match(url);
  if (!response) {
    try {
      const full = await fetch(url); // Range 없이 전체 파일 요청
      if (full && full.status === 200) {
        await cache.put(url, full.clone());
      }
      response = full;
    } catch (e) {
      return Response.error();
    }
  }
  if (response.status !== 200) return response;
  return toRangeResponse(request, response);
}

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // 외부 도메인 요청은 서비스 워커가 관여하지 않음
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  if (url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3')) {
    event.respondWith(handleAudio(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

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
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

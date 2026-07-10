// NEXUS CHAT — service worker
// เป้าหมายหลักคือทำให้เว็บ "ติดตั้งเป็นแอปได้" (PWA installability)
// แคชแค่หน้าเปลือกแอป (app shell) ส่วนข้อมูลแชท/เสียง/ไฟล์ทั้งหมดยังคงดึงสดจาก Supabase เสมอ ไม่ใช้แคช
const CACHE_NAME = 'nexuschat-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// กลยุทธ์: network-first สำหรับทุกอย่าง แล้วค่อย fallback ไปแคชตอนออฟไลน์
// (ไม่แคชคำขอไปยัง Supabase เพื่อไม่ให้ข้อความ/เสียง/ไฟล์ค้างเป็นข้อมูลเก่า)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // ปล่อยผ่านคำขอไป Supabase/CDN ตามปกติ

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(()=>{});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

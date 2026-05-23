const CACHE_NAME = "spendfence-v3";
const APP_SHELL = [
  "/",
  "/dashboard",
  "/categories",
  "/add-purchase",
  "/receipt-scanner",
  "/reports",
  "/notifications",
  "/settings",
  "/manifest.json",
  "/brand/spendfence-logo-dark.png",
  "/brand/spendfence-logo-light.png",
  "/brand/spendfence-logo-light-transparent.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon-light-16x16.png",
  "/favicon-light-32x32.png",
  "/favicon-dark-16x16.png",
  "/favicon-dark-32x32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/"))));
});

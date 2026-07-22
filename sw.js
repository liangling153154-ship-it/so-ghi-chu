// Service worker: cache app shell để mở nhanh; dữ liệu Supabase luôn lấy từ mạng
var CACHE = "kho-ghi-chu-v6";
var SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/config.js",
  "/vendor/supabase.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", function (ev) {
  ev.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (ev) {
  var url = new URL(ev.request.url);
  if (ev.request.method !== "GET") return;
  // Không cache API/Storage của Supabase — luôn cần dữ liệu mới
  if (url.origin !== location.origin) return;

  // Điều hướng (/k/<token>...) → trả index.html, ưu tiên mạng
  if (ev.request.mode === "navigate") {
    ev.respondWith(
      fetch(ev.request).catch(function () {
        return caches.match("/index.html");
      })
    );
    return;
  }

  // File tĩnh: ưu tiên mạng, rớt mạng thì dùng cache
  ev.respondWith(
    fetch(ev.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(ev.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(ev.request);
    })
  );
});

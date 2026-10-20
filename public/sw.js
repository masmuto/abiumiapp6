// ============================================================================
// Service Worker - Aplikasi Keuangan Keluarga
// ============================================================================
// Strategi caching:
// - Precache: aset inti (manifest, ikon, halaman utama) saat install
// - Static assets (_next/static, icons, gambar): cache-first, fallback network
// - API GET: network-first, fallback ke cache (data terbaru bila online,
//   data terakhir bila offline)
// - API mutasi (POST/PATCH/DELETE): network-only, tidak di-cache
// - Navigasi: network-first (HTML selalu segar), fallback ke cache halaman
// ============================================================================

const SW_VERSION = "keuangan-v1.0.0";
const STATIC_CACHE = `${SW_VERSION}-static`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;
const API_CACHE = `${SW_VERSION}-api`;

// Aset inti yang di-precache saat install
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32.png",
];

// === INSTALL: precache aset inti ===
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...", SW_VERSION);
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        // Toleransi: kalau ada 1 URL gagal, jangan abort seluruh install
        return Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            fetch(url, { cache: "no-cache" })
              .then((res) => (res.ok ? cache.put(url, res.clone()) : null))
              .catch(() => null)
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// === ACTIVATE: hapus cache lama ===
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...", SW_VERSION);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(SW_VERSION))
            .map((k) => {
              console.log("[SW] Deleting old cache:", k);
              return caches.delete(k);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// === FETCH: strategi per-kategori ===
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Hanya handle GET. Mutasi (POST/PATCH/DELETE) langsung ke network.
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Skip cross-origin requests (mis. Google Fonts, CDN eksternal)
  if (url.origin !== self.location.origin) return;

  // --- API requests: network-first ---
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstForAPI(req));
    return;
  }

  // --- Navigasi (HTML page): network-first ---
  if (req.mode === "navigate") {
    event.respondWith(networkFirstForNavigation(req));
    return;
  }

  // --- Static assets: cache-first ---
  // _next/static/, icons/, gambar, font, dll.
  event.respondWith(cacheFirstForStatic(req));
});

// === NETWORK-FIRST untuk API ===
// Online: ambil dari network, simpan ke cache
// Offline: kembalikan cache terakhir (atau pesan error JSON)
async function networkFirstForAPI(req) {
  const cache = await caches.open(API_CACHE);
  try {
    const networkRes = await fetch(req);
    if (networkRes.ok) {
      cache.put(req, networkRes.clone());
    }
    return networkRes;
  } catch (err) {
    // Offline: ambil dari cache
    const cached = await cache.match(req);
    if (cached) {
      console.log("[SW] API (offline, from cache):", req.url);
      return cached;
    }
    // Tidak ada cache: kembalikan JSON error
    return new Response(
      JSON.stringify({
        error: "Anda sedang offline. Data tidak tersedia.",
        offline: true,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// === NETWORK-FIRST untuk navigasi (HTML) ===
async function networkFirstForNavigation(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const networkRes = await fetch(req);
    if (networkRes.ok) {
      cache.put(req, networkRes.clone());
    }
    return networkRes;
  } catch (err) {
    // Offline: kembalikan halaman dari cache (atau fallback ke /)
    const cached = (await cache.match(req)) || (await caches.match("/"));
    if (cached) {
      console.log("[SW] Page (offline, from cache):", req.url);
      return cached;
    }
    // Fallback halaman offline bila tidak ada cache
    return new Response(
      `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Offline - Keuangan Keluarga</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:system-ui,-apple-system,sans-serif;background:#ecfdf5;color:#065f46;margin:0;padding:2rem;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}
.box{max-width:400px}
h1{margin:0 0 0.5rem;color:#047857}
p{color:#10b981;margin:0 0 1rem}
.btn{display:inline-block;background:#10b981;color:white;padding:0.75rem 1.5rem;border-radius:0.5rem;text-decoration:none;font-weight:600}
</style>
</head>
<body>
<div class="box">
<h1>Anda sedang offline</h1>
<p>Aplikasi keuangan keluarga tidak bisa dimuat tanpa koneksi. Periksa koneksi internet lalu coba lagi.</p>
<a href="/" class="btn">Coba lagi</a>
</div>
</body>
</html>`,
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}

// === CACHE-FIRST untuk aset statis ===
// Cache ada? Pakai. Tidak ada? Fetch network, simpan ke cache.
async function cacheFirstForStatic(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  if (cached) {
    // Update di background (stale-while-revalidate)
    fetch(req)
      .then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
      })
      .catch(() => {});
    return cached;
  }
  // Tidak ada di cache: fetch network, cache jika OK
  try {
    const networkRes = await fetch(req);
    if (networkRes.ok && networkRes.type === "basic") {
      cache.put(req, networkRes.clone());
    }
    return networkRes;
  } catch (err) {
    // Tidak bisa apa-apakan
    return new Response("", { status: 504 });
  }
}

// === MESSAGE: handle skip waiting dari UI ===
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// === PUSH NOTIFICATIONS (siap untuk fitur lanjutan) ===
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Keuangan Keluarga";
  const options = {
    body: data.body || "Pemberitahuan baru",
    icon: "/icons/icon-192.png",
    badge: "/icons/favicon-32.png",
    vibrate: [100, 50, 100],
    data: data.url || "/",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// === Click notification: buka app ===
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Fokus ke window yang ada, atau buka baru
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data || "/");
      }
    })
  );
});

console.log("[SW] Service worker loaded:", SW_VERSION);

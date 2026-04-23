/**
 * Going Ecuador — Service Worker
 *
 * Estrategia:
 *  - Shell de la app (HTML, JS, CSS, íconos) → Cache First
 *  - Fuentes de Google → Cache First (stale-while-revalidate)
 *  - Llamadas a la API → Network First (sin caché, siempre datos frescos)
 *  - Todo lo demás → Network First con fallback a caché
 */

const CACHE_NAME = "going-v1";

const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/going-logo-h.png",
  "/going-logo-white-h.png",
  "/favicon.ico",
];

// ── Install: pre-cachear assets del shell ──────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: limpiar caches antiguas ─────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: estrategia por tipo de recurso ─────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar requests de extensiones o de otros orígenes (excepto fonts)
  if (
    url.protocol !== "https:" &&
    url.protocol !== "http:" &&
    url.hostname !== "localhost"
  ) {
    return;
  }

  // API calls → Network First, sin cache
  if (
    url.hostname.includes("run.app") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/corporate/") ||
    url.pathname.startsWith("/tracking/") ||
    url.pathname.startsWith("/bookings")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Fuentes de Google → Cache First
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              cache.put(request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // Assets estáticos (imágenes, íconos, logos) → Cache First
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // Todo lo demás (navegación, JS, CSS) → Network First con fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.method === "GET") {
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── Push Notifications (futuro) ───────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "Going Ecuador", {
      body: data.body || "",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-32x32.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/")
  );
});

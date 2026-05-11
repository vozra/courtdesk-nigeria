// CourtDesk Nigeria — Service Worker
// Handles offline caching so the app works without internet at court registries

const CACHE_NAME = "courtdesk-ng-v1";
const OFFLINE_PAGE = "/offline.html";

// Assets to cache immediately on install (App Shell)
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log("[CourtDesk SW] Installing service worker…");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[CourtDesk SW] Pre-caching app shell");
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("[CourtDesk SW] Activating…");
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[CourtDesk SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH STRATEGY ───────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST, PUT, DELETE — API calls)
  if (request.method !== "GET") return;

  // Skip Supabase / Twilio API calls — always need network
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("twilio.com") ||
    url.hostname.includes("api.anthropic.com")
  ) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "You are offline. This action requires internet." }), {
          headers: { "Content-Type": "application/json" },
          status: 503,
        })
      )
    );
    return;
  }

  // For HTML navigation: Network first, fall back to cache, then offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_PAGE);
        })
    );
    return;
  }

  // For static assets (JS, CSS, images): Cache first, then network
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Default: Network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ─── BACKGROUND SYNC ──────────────────────────────────────────────────────────
// Queue runner updates when offline — sync when back online
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-runner-updates") {
    console.log("[CourtDesk SW] Background sync: runner updates");
    event.waitUntil(syncRunnerUpdates());
  }
  if (event.tag === "sync-proof-uploads") {
    console.log("[CourtDesk SW] Background sync: proof uploads");
    event.waitUntil(syncProofUploads());
  }
});

async function syncRunnerUpdates() {
  try {
    // In production: read queued updates from IndexedDB and POST to Supabase
    console.log("[CourtDesk SW] Syncing queued runner updates…");
    // const db = await openDB("courtdesk-offline", 1);
    // const updates = await db.getAll("pending-runner-updates");
    // for (const update of updates) {
    //   await fetch("/api/runner-update", { method: "POST", body: JSON.stringify(update) });
    //   await db.delete("pending-runner-updates", update.id);
    // }
  } catch (err) {
    console.error("[CourtDesk SW] Sync failed:", err);
  }
}

async function syncProofUploads() {
  try {
    console.log("[CourtDesk SW] Syncing queued proof uploads…");
    // Similar pattern for file uploads queued while offline
  } catch (err) {
    console.error("[CourtDesk SW] Proof sync failed:", err);
  }
}

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "You have a new update from CourtDesk.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Open App" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "CourtDesk Nigeria", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});

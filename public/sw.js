/**
 * VAMORT Service Worker
 * Estratégia: Cache First para assets estáticos, Network First para API/data
 * Background Sync para ações offline
 * Versão: incrementar a cada deploy para forçar atualização
 */
const CACHE_VERSION = 'v1.1.0';
const CACHE_NAME = `vamort-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const OFFLINE_QUEUE_DB = 'vamort-offline-queue';
const OFFLINE_QUEUE_STORE = 'actions';

// Assets para cache imediato (install)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Padrões para cache dinâmico (runtime)
const CACHE_PATTERNS = [
  /\.(js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/,
  /\/assets\//,
];

// Padrões para NÃO cachear (sempre network)
const NETWORK_ONLY = [
  /\/api\//,
  /supabase/,
  /realtime/,
  /auth/,
];

// IndexedDB helpers para fila offline
async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_QUEUE_DB, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
        const store = db.createObjectStore(OFFLINE_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function queueOfflineAction(action) {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(OFFLINE_QUEUE_STORE);
    const request = store.add({
      ...action,
      timestamp: Date.now(),
      retries: 0,
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getOfflineActions() {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readonly');
    const store = tx.objectStore(OFFLINE_QUEUE_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeOfflineAction(id) {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(OFFLINE_QUEUE_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function incrementRetry(id) {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(OFFLINE_QUEUE_STORE);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const action = getRequest.result;
      if (action) {
        action.retries = (action.retries || 0) + 1;
        const putRequest = store.put(action);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Sync queue com o servidor
async function syncOfflineQueue() {
  const actions = await getOfflineActions();
  if (actions.length === 0) return;

  console.log('[SW] Background sync: processing', actions.length, 'offline actions');

  for (const action of actions) {
    try {
      const success = await processOfflineAction(action);
      if (success) {
        await removeOfflineAction(action.id);
        console.log('[SW] Synced action:', action.type, action.id);
      } else {
        await incrementRetry(action.id);
        // Max 3 retries
        if ((action.retries || 0) >= 3) {
          console.error('[SW] Max retries exceeded for action:', action.id);
          await removeOfflineAction(action.id);
        }
      }
    } catch (error) {
      console.error('[SW] Failed to sync action:', action.id, error);
      await incrementRetry(action.id);
    }
  }
}

// Processar ação específica
async function processOfflineAction(action) {
  const { type, payload } = action;

  try {
    switch (type) {
      case 'PLAY_CARD':
      case 'END_TURN':
      case 'CONCEDE':
      case 'EMOTE':
        // Game actions - send to match WebSocket or REST endpoint
        const response = await fetch('/api/match/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, offline: true }),
        });
        return response.ok;

      case 'CRAFT_CARD':
      case 'DISENCHANT_CARD':
        // Crafting actions
        const craftResponse = await fetch('/api/craft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return craftResponse.ok;

      case 'OPEN_PACK':
        // Pack opening
        const packResponse = await fetch('/api/packs/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return packResponse.ok;

      case 'CLAIM_REWARD':
        // Daily/weekly rewards
        const rewardResponse = await fetch('/api/rewards/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return rewardResponse.ok;

      case 'JOIN_MATCH':
      case 'CREATE_PRIVATE_MATCH':
        // Matchmaking
        const matchResponse = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return matchResponse.ok;

      default:
        console.warn('[SW] Unknown action type:', type);
        return false;
    }
  } catch (error) {
    console.error('[SW] Error processing action:', type, error);
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('vamort-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== 'GET') return;

  // Ignore chrome-extension, data:, etc.
  if (!url.protocol.startsWith('http')) return;

  // Network-only patterns (API, auth, realtime)
  if (NETWORK_ONLY.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets: Cache First
  if (CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests: Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default: Network First
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    // Background update (stale-while-revalidate)
    fetch(request).then((response) => {
      if (response.ok) cache.put(request, response.clone());
    }).catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirstWithOfflineFallback(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Try cache
    const cached = await cache.match(request);
    if (cached) return cached;

    // Fallback to index.html for SPA routing
    const indexCache = await caches.open(STATIC_CACHE);
    const index = await indexCache.match('/index.html');
    if (index) return index;

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Background Sync API
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
  if (event.tag === 'sync-matches') {
    event.waitUntil(syncMatches());
  }
});

async function syncMatches() {
  // Implementar sincronização de partidas offline quando necessário
  console.log('[SW] Background sync: matches');
}

// Periodic background sync (se suportado)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-sync-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'vamort-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  const url = data.url || '/';

  if (action === 'close' || action === '') {
    // Just close, user dismissed
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate within the app
          client.postMessage({ type: 'NOTIFICATION_CLICK', action, data });
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Analytics: track notification dismissal
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'QUEUE_OFFLINE_ACTION':
      event.waitUntil(queueOfflineAction(payload).then((id) => {
        // Register background sync
        return self.registration.sync.register('sync-offline-queue').then(() => id);
      }).then((id) => {
        event.ports[0]?.postMessage({ success: true, id });
      }).catch((error) => {
        event.ports[0]?.postMessage({ success: false, error: error.message });
      }));
      break;

    case 'GET_OFFLINE_QUEUE':
      event.waitUntil(getOfflineActions().then((actions) => {
        event.ports[0]?.postMessage({ actions });
      }));
      break;

    case 'CLEAR_OFFLINE_QUEUE':
      event.waitUntil(
        getOfflineActions().then((actions) => {
          return Promise.all(actions.map(a => removeOfflineAction(a.id)));
        }).then(() => {
          event.ports[0]?.postMessage({ success: true });
        })
      );
      break;

    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Notify clients when SW updates
self.addEventListener('controllerchange', () => {
  // Handled by client-side logic
});
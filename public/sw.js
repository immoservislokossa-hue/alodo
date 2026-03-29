const CACHE_NAME = 'alodo-v1'
const urlsToCache = [
  '/',
  '/offline.html',
]

// Install event: cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Silently fail if some resources aren't available yet
        console.log('Cache init partial success')
      })
    })
  )
  self.skipWaiting()
})

// Activate event: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip non-http(s) protocols
  if (!event.request.url.startsWith('http')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request)
          .then((response) => {
            // Don't cache if not a success
            if (!response || response.status !== 200 || response.type === 'error') {
              return response
            }

            // Clone the response
            const responseToCache = response.clone()

            // Cache successful responses
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })

            return response
          })
          .catch(() => {
            // Return offline page if available
            return caches.match('/offline.html')
          })
      )
    })
  )
})

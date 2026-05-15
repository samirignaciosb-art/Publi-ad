// ═══════════════════════════════════════════════════════
// UbiPet — Service Worker (VAPID puro, sin Firebase)
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'ubipet-v4'
const CACHE_URLS = [
  '/index.html',
  '/perfil.html',
  '/rescate.html',
  '/css/styles.css',
  '/js/supabase.js',
  '/img/logo.png',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        CACHE_URLS.map(url =>
          fetch(url, { redirect: 'follow' })
            .then(res => { if (res.ok) cache.put(url, res) })
            .catch(() => {})
        )
      )
    )
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return
  // No cachear navegación — siempre ir a la red para evitar páginas viejas
  if (event.request.mode === 'navigate') return

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => caches.match('/index.html'))
  )
})

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data?.json() } catch {
    data = { title: '🐾 UbiPet', body: event.data?.text() || 'Nueva notificación' }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '🐾 UbiPet', {
      body:               data.body  || 'Tienes una notificación nueva',
      icon:               '/icon-192.png',
      badge:              '/icon-192.png',
      tag:                'ubipet-push',
      renotify:           true,
      requireInteraction: true,
      vibrate:            [200, 100, 200],
      data:               { url: data.url || '/perfil.html' }
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target  = event.notification.data?.url || '/perfil.html'
  const fullUrl = target.startsWith('http') ? target : 'https://app.ubipet.shop' + target

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const existing = list.find(c => c.url === fullUrl)
        if (existing) return existing.focus()
        return clients.openWindow(fullUrl)
      })
  )
})

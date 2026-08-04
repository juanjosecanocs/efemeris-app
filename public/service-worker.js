const CACHE_NAME = 'efemeris-cache-v1'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Instala y precachea el app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

// Limpia caches de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// datos-365dias.json no es un asset con hash en el nombre: se sobrescribe en
// cada deploy cuando corremos precalculate.js / update-urls.js, así que
// necesita red primero (con fallback a cache solo si no hay conexión) —
// cache-first lo dejaría pegado para siempre a la primera copia que se bajó.
function esDatoVivo(url) {
  return new URL(url).pathname === '/datos-365dias.json'
}

// Estrategia: network-first para navegación y datos vivos, cache-first para
// el resto (assets con hash en el nombre, seguros de cachear agresivamente)
self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  if (request.mode === 'navigate' || esDatoVivo(request.url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          return response
        })
        .catch(() => caches.match(request.mode === 'navigate' ? '/index.html' : request))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
        return response
      })
    })
  )
})

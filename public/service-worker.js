// IMPORTANTE: subir este número en cada deploy que cambie algo cacheable
// (JS/CSS con hash, o la lista de esDatoVivo). Los navegadores (sobre todo
// iOS en modo standalone/"Agregar a inicio") solo revisan si hay un service
// worker nuevo comparando el contenido de este archivo byte a byte — si no
// cambia ni un carácter, no hay forma de que detecten la actualización,
// sin importar cuánto haya cambiado el resto de la app.
const CACHE_NAME = 'efemeris-cache-v2'
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

// Estos JSON no son assets con hash en el nombre: se sobrescriben en cada
// deploy (precalculate.js, precalculate-cronoteca.js, generate-histoku-365.js,
// los scripts de update-urls/add-wikipedia-*), así que necesitan red primero
// (con fallback a cache solo si no hay conexión) — cache-first los dejaría
// pegados para siempre a la primera copia que se bajó. Antes de este fix,
// cronoteca-365dias.json e histoku-365dias.json NO estaban en esta lista y
// quedaban cacheados para siempre tras la primera visita.
const DATOS_VIVOS = ['/datos-365dias.json', '/cronoteca-365dias.json', '/histoku-365dias.json']

function esDatoVivo(url) {
  return DATOS_VIVOS.includes(new URL(url).pathname)
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

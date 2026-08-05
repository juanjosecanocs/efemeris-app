import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Solo se registra en producción: en dev, el cache-first del service worker
// interfiere con el HMR de Vite y termina sirviendo módulos JS desactualizados.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((error) => console.error('Error registrando el service worker:', error))
  })

  // Cuando un service worker nuevo termina de activarse (skipWaiting +
  // clients.claim en service-worker.js ya fuerzan que tome control), esta
  // pestaña sigue corriendo con el JS viejo hasta que se recarga — sin este
  // listener, "actualizar" requeriría cerrar y reabrir la app a mano. Guard
  // con `recargando` porque controllerchange puede disparar más de una vez.
  let recargando = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return
    recargando = true
    window.location.reload()
  })
}

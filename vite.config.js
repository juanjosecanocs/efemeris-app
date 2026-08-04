import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configuración pensada para servir como PWA:
// - base '/' para rutas absolutas del manifest y el service worker
// - outDir 'dist' (lo que espera netlify.toml)
// - los archivos de public/ (manifest.json, service-worker.js, iconos) se copian tal cual al build
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: true,
  },
  preview: {
    port: 4173,
  },
})

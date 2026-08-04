// Genera favicon.ico + PNGs de distintos tamaños a partir de la imagen base
// del ícono (public/images/efemeris-base.png), para favicon y PWA.
//
// Uso: node src/scripts/generate-favicon.js  (o `npm run generate-favicon`)
//
// Nota: sharp NO soporta escribir .ico (no está en su lista de formatos de
// salida) — solo puede redimensionar y exportar PNG/JPEG/WebP/etc. Por eso
// para el favicon.ico real se usa `png-to-ico`, que arma el contenedor ICO
// a partir de los PNGs que genera sharp.

import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const raizProyecto = path.join(__dirname, '../..')
const publicDir = path.join(raizProyecto, 'public')
const iconsDir = path.join(publicDir, 'icons')
const imagenOrigen = path.join(publicDir, 'images', 'efemeris-base.png')

async function generarFavicon() {
  console.log('Generando favicon e íconos PWA...\n')

  if (!existsSync(imagenOrigen)) {
    console.error(`No se encontró la imagen base en: ${imagenOrigen}`)
    process.exit(1)
  }

  await mkdir(iconsDir, { recursive: true })

  // PNGs para el .ico (16 y 32px: tamaños estándar de favicon) y para PWA.
  const png16 = await sharp(imagenOrigen).resize(16, 16, { fit: 'cover' }).png().toBuffer()
  const png32 = await sharp(imagenOrigen).resize(32, 32, { fit: 'cover' }).png().toBuffer()

  console.log('Generando favicon.ico (16x16 + 32x32)...')
  const icoBuffer = await pngToIco([png16, png32])
  await writeFile(path.join(publicDir, 'favicon.ico'), icoBuffer)
  console.log('favicon.ico creado')

  console.log('Generando favicon.png (32x32, formato moderno)...')
  await writeFile(path.join(publicDir, 'favicon.png'), png32)
  console.log('favicon.png creado')

  console.log('Generando icons/icon-192.png...')
  await sharp(imagenOrigen).resize(192, 192, { fit: 'cover' }).png().toFile(path.join(iconsDir, 'icon-192.png'))
  console.log('icons/icon-192.png creado')

  console.log('Generando icons/icon-512.png...')
  await sharp(imagenOrigen).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(iconsDir, 'icon-512.png'))
  console.log('icons/icon-512.png creado')

  console.log('\nListo. Archivos generados en public/.')
}

generarFavicon().catch((error) => {
  console.error('Error generando íconos:', error)
  process.exit(1)
})

// Agrega `wikidataUrl` a personaje/efeméride/hito científico (el primero) de
// public/datos-365dias.json SIN regenerar todo el archivo.
//
// Uso: node update-urls.js
//
// Por qué busca por NOMBRE en vez de por fecha exacta: precalculate.js no
// guardó el QID original de cada personaje/efeméride/hito (solo nombre y
// descripción), así que no hay forma de "volver" al mismo registro exacto de
// Wikidata sin buscarlo de nuevo. Buscar por fecha exacta con año (como
// proponía la versión original de este script) tampoco serviría: nuestras
// claves son "MM-DD" sin año, y aunque lo tuvieran, no se relaciona con cómo
// precalculate.js eligió ese personaje/evento (por notoriedad entre TODOS
// los años, no por una fecha puntual). Buscar por el nombre/título que ya
// tenemos guardado es lo único confiable disponible.
//
// Riesgo real de este enfoque: nombres ambiguos. Ej. "Tratado de Madrid"
// devuelve 5 tratados distintos (1526, 1630, 1670, 1750, 1801) en Wikidata.
// Por eso se desambigua comparando años mencionados en la descripción propia
// contra la de cada candidato antes de elegir uno.

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'

const DATA_FILE = 'public/datos-365dias.json'
const USER_AGENT = 'Efemeris-UpdateUrls/1.0 (script de mantenimiento del proyecto Efemeris)'
const DELAY_MS = 1000
const MAX_REINTENTOS = 3

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function buscarEntidad(texto, reintentosRestantes = MAX_REINTENTOS) {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(texto)}&language=es&format=json&limit=5`

  try {
    const respuesta = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': USER_AGENT } })
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)
    const datos = await respuesta.json()
    return (datos.search ?? []).map((s) => ({ id: s.id, label: s.label, description: s.description ?? '' }))
  } catch (error) {
    if (reintentosRestantes > 0) {
      await sleep(DELAY_MS * 2)
      return buscarEntidad(texto, reintentosRestantes - 1)
    }
    console.error(`  ! Fallo buscando "${texto}": ${error.message}`)
    return []
  }
}

function extraerAnios(texto) {
  if (!texto) return []
  return [...texto.matchAll(/\b(1[0-9]{3}|20[0-2][0-9])\b/g)].map((m) => m[0])
}

// Preferí el candidato cuyo año coincida con el de nuestra descripción (para
// casos como "Tratado de Madrid"); si no hay señal de año, uso solapamiento
// de palabras; si sigue empatado, el primer resultado (más relevante según
// el buscador de Wikidata).
function elegirMejorCandidato(candidatos, descripcionPropia) {
  if (candidatos.length <= 1) return candidatos[0] ?? null

  const aniosPropios = extraerAnios(descripcionPropia)
  if (aniosPropios.length > 0) {
    const conMismoAnio = candidatos.find((c) => extraerAnios(c.description).some((a) => aniosPropios.includes(a)))
    if (conMismoAnio) return conMismoAnio
  }

  const palabrasPropias = new Set(
    (descripcionPropia ?? '').toLowerCase().split(/\W+/).filter((p) => p.length > 3)
  )
  let mejor = candidatos[0]
  let mejorPuntaje = -1
  for (const candidato of candidatos) {
    const puntaje = candidato.description
      .toLowerCase()
      .split(/\W+/)
      .filter((p) => palabrasPropias.has(p)).length
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje
      mejor = candidato
    }
  }
  return mejor
}

async function resolverUrl(texto, descripcionPropia) {
  if (!texto) return null
  const candidatos = await buscarEntidad(texto)
  if (candidatos.length === 0) return null
  const elegido = elegirMejorCandidato(candidatos, descripcionPropia)
  return elegido ? `https://www.wikidata.org/wiki/${elegido.id}` : null
}

async function procesarDia(datoDia) {
  let actualizado = false

  if (datoDia.personaje?.nombre && !datoDia.personaje.wikidataUrl) {
    const url = await resolverUrl(datoDia.personaje.nombre, datoDia.personaje.descripcion)
    if (url) {
      datoDia.personaje.wikidataUrl = url
      actualizado = true
      console.log(`  Personaje: ${url}`)
    }
    await sleep(DELAY_MS)
  }

  if (datoDia.efemeride?.titulo && !datoDia.efemeride.wikidataUrl) {
    const url = await resolverUrl(datoDia.efemeride.titulo, datoDia.efemeride.descripcion)
    if (url) {
      datoDia.efemeride.wikidataUrl = url
      actualizado = true
      console.log(`  Efeméride: ${url}`)
    }
    await sleep(DELAY_MS)
  }

  // Solo el primer hito: es el único que la app muestra actualmente: enriquecer
  // los otros 4 (que hoy no se ven en ningún lado) triplicaría el tiempo de
  // corrida sin beneficio visible.
  const hito = datoDia.hitosCientificos?.[0]
  if (hito?.titulo && !hito.wikidataUrl) {
    const url = await resolverUrl(hito.titulo, hito.descripcion)
    if (url) {
      hito.wikidataUrl = url
      actualizado = true
      console.log(`  Hito científico: ${url}`)
    }
    await sleep(DELAY_MS)
  }

  return actualizado
}

function guardar(datos) {
  writeFileSync(DATA_FILE, JSON.stringify(datos, null, 2), 'utf-8')
}

async function actualizarUrls() {
  console.log('Actualizando URLs de Wikidata\n')
  console.log(`Leyendo: ${DATA_FILE}\n`)

  if (!existsSync(DATA_FILE)) {
    console.error(`Archivo no encontrado: ${DATA_FILE}`)
    process.exit(1)
  }

  const datos = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  const claves = Object.keys(datos)
  console.log(`Total de días a procesar: ${claves.length}\n`)

  let procesados = 0
  let actualizados = 0

  for (const clave of claves) {
    procesados++
    const porcentaje = Math.round((procesados / claves.length) * 100)
    process.stdout.write(`[${porcentaje}%] ${clave}... `)

    const actualizado = await procesarDia(datos[clave])
    if (actualizado) {
      actualizados++
      guardar(datos) // guardado incremental: seguro de interrumpir
    } else {
      console.log('sin cambios (ya tenía URLs, o no se encontró nada)')
    }
  }

  datos._wikidataUrlsActualizadoEn = new Date().toISOString()
  datos._wikidataUrlsAgregadas = actualizados
  guardar(datos)

  console.log(`\nCompletado: ${actualizados}/${claves.length} días con URLs nuevas agregadas.`)
  console.log(`Archivo: ${DATA_FILE} (${(statSync(DATA_FILE).size / 1024).toFixed(2)} KB)`)
}

actualizarUrls().catch((error) => {
  console.error('Error fatal:', error)
  process.exit(1)
})

// Precalcula recomendaciones artísticas (película, libro, canción) para Cronoteca
// consultando Wikidata via SPARQL, y guarda el resultado en
// public/cronoteca-365dias.json
//
// Uso:
//   node scripts/precalculate-cronoteca.js [--full | --mes=MM] [--no-cache]
//
// Independiente de precalculate.js: no toca datos-365dias.json ni ningún otro
// módulo, tiene su propio archivo de salida y su propio caché.
//
// Nota de diseño (mismo motivo que precalculate.js): filtrar por MONTH()/DAY()
// directamente sobre TODO Wikidata para una clase amplia (películas, obras
// literarias...) Y unir en la misma consulta datos de ranking (sitelinks,
// etiquetas) supera el timeout del endpoint público. Por eso cada día/tipo se
// resuelve en DOS consultas baratas:
//   1) candidatos: solo QIDs que cumplen el filtro de fecha (barato, sin joins).
//   2) ranking: de ese pool acotado (VALUES), se obtiene sitelinks/etiqueta/
//      descripción y se ordena por notoriedad. Se verificó en vivo contra el
//      endpoint real: la consulta de un solo paso (como venía en la versión
//      original de este script) efectivamente da timeout; la de dos pasos no.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, '../public/cronoteca-365dias.json')
const CACHE_DIR = path.join(__dirname, '.cache-cronoteca')
const LOG_FILE = path.join(__dirname, 'cronoteca.log')

const CONFIG = {
  WIKIDATA_ENDPOINT: 'https://query.wikidata.org/sparql',
  USER_AGENT: 'Efemeris-CronotecaScript/1.0 (script de precalculo para app Efemeris)',
  DELAY_MS: 1000,
  MAX_RETRIES: 3,
  POOL_SIZE: 30, // candidatos por dia y tipo antes de rankear por notoriedad
}

// Tipos de obra y su clase Wikidata (P31)
const OBRA_TYPES = {
  película: 'Q11424',
  libro: 'Q571',
  canción: 'Q134556',
  álbum: 'Q482994',
}

// Curación manual para días donde se prefiere una obra concreta por encima
// del resultado algorítmico (override explícito, no error). Cada entrada
// fue verificada a mano contra Wikidata (wbgetentities) antes de agregarse.
const CURACIÓN_MANUAL = {
  '01-01': {
    tipo: 'película',
    titulo: '2001: A Space Odyssey',
    artista: 'Stanley Kubrick',
    descripcion:
      'Obra maestra de ciencia ficción que revolucionó el cine. Estrenada el 2 de abril de 1968, pero asociada al cambio de año en la cultura pop.',
    fechaEstreno: '1968-04-02',
    wikidataId: 'Q103474',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q103474',
    impacto: 'Definió el género de ciencia ficción cinematográfica moderna',
  },
}

// ==================== LOGGER ====================
class Logger {
  constructor(filePath) {
    this.filePath = filePath
    this.logs = []
  }

  log(level, msg, data = '') {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] [${level}] ${msg} ${data}`
    this.logs.push(logEntry)
    console.log(logEntry)
  }

  info(msg, data = '') { this.log('INFO', msg, data) }
  warn(msg, data = '') { this.log('WARN', msg, data) }
  error(msg, data = '') { this.log('ERROR', msg, data) }

  save() {
    fs.writeFileSync(this.filePath, this.logs.join('\n'))
  }
}

const logger = new Logger(LOG_FILE)

// ==================== UTILIDADES ====================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const pad = (n) => String(n).padStart(2, '0')

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function getCachePath(mes, dia) {
  return path.join(CACHE_DIR, `${pad(mes)}-${pad(dia)}.json`)
}

function saveCache(mes, dia, data) {
  try {
    fs.writeFileSync(getCachePath(mes, dia), JSON.stringify(data, null, 2))
  } catch (err) {
    logger.error(`Fallo al guardar caché ${pad(mes)}-${pad(dia)}:`, err.message)
  }
}

function loadCache(mes, dia) {
  try {
    const cachePath = getCachePath(mes, dia)
    if (fs.existsSync(cachePath)) return JSON.parse(fs.readFileSync(cachePath, 'utf8'))
  } catch {
    // sin caché disponible, se recalcula
  }
  return null
}

function daysInMonth(month) {
  return new Date(2024, month, 0).getDate()
}

function qidDeUri(uri) {
  return uri.split('/').pop()
}

function valor(binding, campo) {
  return binding?.[campo]?.value ?? ''
}

function descripcion(binding) {
  return valor(binding, 'descripcionEs') || valor(binding, 'descripcionEn') || ''
}

// ==================== WIKIDATA (patrón de dos pasos) ====================

async function sparqlQuery(query, retriesLeft = CONFIG.MAX_RETRIES) {
  const url = `${CONFIG.WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': CONFIG.USER_AGENT },
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

    const json = await response.json()
    return json.results.bindings
  } catch (error) {
    if (retriesLeft > 0) {
      logger.warn(`  ! Error en consulta (${error.message}), reintentando (${retriesLeft} intentos restantes)...`)
      await sleep(CONFIG.DELAY_MS * 2)
      return sparqlQuery(query, retriesLeft - 1)
    }
    logger.error(`  x Fallo definitivo en consulta: ${error.message}`)
    return []
  }
}

function buildCandidatosQuery(tipoId, mes, dia) {
  return `
    SELECT DISTINCT ?item WHERE {
      ?item wdt:P31 wd:${tipoId} .
      ?item wdt:P577 ?fecha.
      FILTER(MONTH(?fecha) = ${mes} && DAY(?fecha) = ${dia})
    }
    LIMIT ${CONFIG.POOL_SIZE}
  `
}

async function obtenerCandidatos(tipoId, mes, dia) {
  const bindings = await sparqlQuery(buildCandidatosQuery(tipoId, mes, dia))
  return bindings.map((b) => qidDeUri(valor(b, 'item')))
}

function buildRankingQuery(qids) {
  const values = qids.map((qid) => `wd:${qid}`).join(' ')

  return `
    SELECT ?item ?itemLabel ?descripcionEs ?descripcionEn ?pubDate ?sitelinks WHERE {
      VALUES ?item { ${values} }
      ?item wikibase:sitelinks ?sitelinks.
      ?item wdt:P577 ?pubDate.
      OPTIONAL { ?item schema:description ?descripcionEs. FILTER(LANG(?descripcionEs) = "es") }
      OPTIONAL { ?item schema:description ?descripcionEn. FILTER(LANG(?descripcionEn) = "en") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY DESC(?sitelinks)
    LIMIT 15
  `
}

async function obtenerRankeados(qids) {
  if (qids.length === 0) return []

  const bindings = await sparqlQuery(buildRankingQuery(qids))

  // El pool puede traer varias filas por item (varias fechas de estreno por
  // país); nos quedamos con la primera aparición de cada item.
  const vistos = new Set()
  const unicos = []
  for (const binding of bindings) {
    const qid = qidDeUri(valor(binding, 'item'))
    if (vistos.has(qid)) continue
    vistos.add(qid)
    unicos.push(binding)
  }
  return unicos
}

async function buscarPorTipo(tipoNombre, tipoId, mes, dia) {
  const candidatos = await obtenerCandidatos(tipoId, mes, dia)
  await sleep(CONFIG.DELAY_MS)
  if (candidatos.length === 0) return null

  const rankeados = await obtenerRankeados(candidatos)
  await sleep(CONFIG.DELAY_MS)
  const mejor = rankeados[0]
  if (!mejor) return null

  const wikidataId = qidDeUri(valor(mejor, 'item'))
  return {
    tipo: tipoNombre,
    titulo: valor(mejor, 'itemLabel'),
    artista: '', // P170/P50/P86 varían según tipo; se completa manualmente si hace falta
    descripcion: descripcion(mejor) || 'Obra notable de este día',
    fechaEstreno: valor(mejor, 'pubDate').split('T')[0],
    wikidataId,
    wikidataUrl: `https://www.wikidata.org/wiki/${wikidataId}`,
    // Sin frase editorial de "impacto" para resultados algorítmicos (a
    // diferencia de las obras curadas a mano): no hay forma automática de
    // resumir por qué importa una obra, y repetir el conteo de sitelinks
    // como si fuera esa frase quedaba como ruido ("37 idiomas en Wikipedia").
    impacto: '',
    // Campo interno, no se persiste (ver buscarRecomendacion): sirve para
    // competir por sitelinks entre tipos sin volver a consultar Wikidata.
    _sitelinks: parseInt(valor(mejor, 'sitelinks'), 10) || 0,
  }
}

// ==================== LÓGICA PRINCIPAL ====================

async function buscarRecomendacion(mes, dia, useCache) {
  const dateKey = `${pad(mes)}-${pad(dia)}`

  if (CURACIÓN_MANUAL[dateKey]) {
    logger.info(`✓ ${dateKey} (curación manual)`)
    return { recomendacion: CURACIÓN_MANUAL[dateKey], fuente: 'manual' }
  }

  if (useCache) {
    const cached = loadCache(mes, dia)
    if (cached) {
      logger.info(`✓ ${dateKey} (desde caché)`)
      return { recomendacion: cached, fuente: 'cache' }
    }
  }

  logger.info(`Buscando recomendación para ${dateKey}...`)
  const obras = []

  for (const [tipoNombre, tipoId] of Object.entries(OBRA_TYPES)) {
    try {
      const obra = await buscarPorTipo(tipoNombre, tipoId, mes, dia)
      if (obra) obras.push(obra)
    } catch (err) {
      logger.warn(`Error buscando ${tipoNombre} para ${dateKey}:`, err.message)
    }
  }

  if (obras.length === 0) {
    logger.warn(`⚠ ${dateKey} - Sin obras encontradas`)
    return { recomendacion: null, fuente: 'ninguna' }
  }

  // Prioriza libro/canción/álbum sobre película: casi siempre hay una
  // película con fecha exacta disponible, así que priorizarla por tipo (como
  // se hacía antes) terminaba eligiéndola prácticamente todos los días. Se
  // usa película solo cuando no hay ningún otro tipo disponible ese día;
  // entre las obras no-película se compite por sitelinks.
  const noPelicula = obras.filter((o) => o.tipo !== 'película')
  const candidatas = noPelicula.length > 0 ? noPelicula : obras
  candidatas.sort((a, b) => b._sitelinks - a._sitelinks)
  const seleccionada = { ...candidatas[0] }
  delete seleccionada._sitelinks
  logger.info(`✓ ${dateKey} (${seleccionada.tipo}: ${seleccionada.titulo})`)

  saveCache(mes, dia, seleccionada)
  return { recomendacion: seleccionada, fuente: 'wikidata' }
}

async function procesarMeses(mesInicio, mesFin, useCache) {
  const recomendaciones = {}
  const stats = { éxito: 0, manual: 0, fallos: 0 }

  for (let mes = mesInicio; mes <= mesFin; mes++) {
    const diasEnMes = daysInMonth(mes)
    logger.info(`\n📅 Procesando mes ${pad(mes)} (${diasEnMes} días)...`)

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const dateKey = `${pad(mes)}-${pad(dia)}`
      try {
        const { recomendacion, fuente } = await buscarRecomendacion(mes, dia, useCache)
        if (recomendacion) {
          recomendaciones[dateKey] = recomendacion
          if (fuente === 'manual') stats.manual++
          else stats.éxito++
        } else {
          stats.fallos++
        }
      } catch (err) {
        logger.error(`Error procesando ${dateKey}:`, err.message)
        stats.fallos++
      }
    }
  }

  return { recomendaciones, stats }
}

function guardarJSON(nuevasRecomendaciones) {
  const dirPath = path.dirname(DATA_FILE)
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })

  // Merge con lo que ya exista: correr para un solo mes no debe borrar los
  // demás días ya generados en corridas anteriores.
  let existentes = {}
  if (fs.existsSync(DATA_FILE)) {
    try {
      existentes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    } catch {
      logger.warn('No se pudo leer el archivo existente, se sobreescribe desde cero.')
    }
  }

  const combinado = { ...existentes, ...nuevasRecomendaciones }
  fs.writeFileSync(DATA_FILE, JSON.stringify(combinado, null, 2))
  logger.info(`\n✅ Datos guardados en: ${DATA_FILE}`)
  logger.info(`   Total de entradas: ${Object.keys(combinado).length}`)
}

async function main() {
  logger.info('🎬 Iniciando precalculate-cronoteca.js\n')

  try {
    ensureCacheDir()

    const args = process.argv.slice(2)
    let mesInicio = new Date().getMonth() + 1
    let mesFin = mesInicio
    let useCache = true

    args.forEach((arg) => {
      if (arg === '--full') {
        mesInicio = 1
        mesFin = 12
      } else if (arg.startsWith('--mes=')) {
        const mes = parseInt(arg.split('=')[1], 10)
        if (mes >= 1 && mes <= 12) {
          mesInicio = mes
          mesFin = mes
        }
      } else if (arg.startsWith('--desde=')) {
        const mes = parseInt(arg.split('=')[1], 10)
        if (mes >= 1 && mes <= 12) mesInicio = mes
      } else if (arg.startsWith('--hasta=')) {
        const mes = parseInt(arg.split('=')[1], 10)
        if (mes >= 1 && mes <= 12) mesFin = mes
      } else if (arg === '--no-cache') {
        useCache = false
      }
    })

    const modo =
      mesInicio === mesFin ? `MES ${pad(mesInicio)}` : `MESES ${pad(mesInicio)} a ${pad(mesFin)}`
    logger.info(`📋 Modo: ${modo}`)
    logger.info(`⏱️  Rate limit: ${CONFIG.DELAY_MS}ms entre requests\n`)

    const startTime = Date.now()
    const { recomendaciones, stats } = await procesarMeses(mesInicio, mesFin, useCache)
    const endTime = Date.now()

    guardarJSON(recomendaciones)

    logger.info(`\n📊 Resumen:`)
    logger.info(`   ✅ Éxito (Wikidata): ${stats.éxito}`)
    logger.info(`   📌 Manual: ${stats.manual}`)
    logger.info(`   ❌ Sin resultado: ${stats.fallos}`)
    logger.info(`   ⏱️  Tiempo: ${((endTime - startTime) / 1000).toFixed(1)}s`)
    logger.info(`\n✨ ¡Proceso completado!`)
    logger.save()
  } catch (error) {
    logger.error('Error fatal:', error.message)
    logger.error('Stack:', error.stack)
    logger.save()
    process.exit(1)
  }
}

main()

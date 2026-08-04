// Precalcula efemérides, personajes, hitos científicos y santoral para los 365 días
// del año consultando Wikidata via SPARQL, y guarda el resultado en
// public/datos-365dias.json
//
// Uso: node precalculate.js
//
// Nota de diseño: filtrar por MONTH()/DAY() directamente sobre TODO Wikidata (p.ej.
// los ~10M items humanos con fecha de nacimiento) supera el timeout de 60s del
// endpoint publico y dispara rate-limit (429). Por eso cada dia se resuelve en DOS
// consultas baratas en vez de una sola consulta pesada:
//   1) candidatos: solo QIDs que cumplen el filtro de fecha (barato, sin joins).
//   2) ranking: de ese pool acotado (VALUES), se obtienen sitelinks/etiqueta/
//      descripcion y se ordena por notoriedad (sitelinks). Un join sobre un puñado
//      de QIDs es casi instantaneo, aunque el mismo join sobre todo Wikidata no lo es.

import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DIA_QID } from './dias-qid.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, 'public', 'datos-365dias.json')

const ENDPOINT = 'https://query.wikidata.org/sparql'
const USER_AGENT = 'Efemeris-PrecalculateScript/1.0 (script de precalculo para app Efemeris)'
const DELAY_MS = 1000
const MAX_RETRIES = 3
const POOL_SIZE = 50 // candidatos por dia y categoria antes de rankear por notoriedad

const MESES = [
  { mes: 1, dias: 31 },
  { mes: 2, dias: 28 },
  { mes: 3, dias: 31 },
  { mes: 4, dias: 30 },
  { mes: 5, dias: 31 },
  { mes: 6, dias: 30 },
  { mes: 7, dias: 31 },
  { mes: 8, dias: 31 },
  { mes: 9, dias: 30 },
  { mes: 10, dias: 31 },
  { mes: 11, dias: 30 },
  { mes: 12, dias: 31 },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const pad = (n) => String(n).padStart(2, '0')

async function sparqlQuery(query, retriesLeft = MAX_RETRIES) {
  const url = `${ENDPOINT}?query=${encodeURIComponent(query)}&format=json`

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent': USER_AGENT,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const json = await response.json()
    return json.results.bindings
  } catch (error) {
    if (retriesLeft > 0) {
      console.warn(`  ! Error en consulta (${error.message}), reintentando (${retriesLeft} intentos restantes)...`)
      await sleep(DELAY_MS * 2)
      return sparqlQuery(query, retriesLeft - 1)
    }
    console.error(`  x Fallo definitivo en consulta: ${error.message}`)
    return []
  }
}

function qidDeUri(uri) {
  return uri.split('/').pop()
}

function valor(binding, campo) {
  return binding?.[campo]?.value ?? ''
}

function descripcion(binding) {
  return valor(binding, 'descriptionEs') || valor(binding, 'descriptionEn') || ''
}

// --- Paso 1: pool de candidatos (barato, sin sitelinks ni etiquetas) ---

function buildCandidatosQuery({ predicado, restriccionTipo, mes, dia }) {
  return `
    SELECT DISTINCT ?item WHERE {
      ?item ${predicado} ?fecha.
      ${restriccionTipo ?? ''}
      FILTER(MONTH(?fecha) = ${mes} && DAY(?fecha) = ${dia})
    }
    LIMIT ${POOL_SIZE}
  `
}

// El santoral no necesita filtrar por MONTH()/DAY(): Wikidata modela cada dia del
// calendario como una entidad propia (ver dias-qid.js) y P841 ("dia de la festividad")
// enlaza cada santo a esa entidad. Es una busqueda inversa directa, no un escaneo.
function buildCandidatosSantoralQuery(diaQid) {
  return `
    SELECT DISTINCT ?item WHERE {
      ?item wdt:P841 wd:${diaQid}.
    }
    LIMIT ${POOL_SIZE}
  `
}

async function ejecutarCandidatos(query) {
  const bindings = await sparqlQuery(query)
  return bindings.map((b) => qidDeUri(valor(b, 'item')))
}

async function obtenerCandidatos(opciones) {
  return ejecutarCandidatos(buildCandidatosQuery(opciones))
}

// --- Paso 2: ranking por notoriedad (sitelinks) dentro del pool acotado ---

function buildRankingQuery({ qids, incluirDescubridor }) {
  const values = qids.map((qid) => `wd:${qid}`).join(' ')
  const optionalDescubridor = incluirDescubridor ? 'OPTIONAL { ?item wdt:P61 ?discoverer. }' : ''

  return `
    SELECT ?item ?itemLabel ?descriptionEs ?descriptionEn ?discovererLabel ?sitelinks WHERE {
      VALUES ?item { ${values} }
      ?item wikibase:sitelinks ?sitelinks.
      ${optionalDescubridor}
      OPTIONAL { ?item schema:description ?descriptionEs. FILTER(LANG(?descriptionEs) = "es") }
      OPTIONAL { ?item schema:description ?descriptionEn. FILTER(LANG(?descriptionEn) = "en") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY DESC(?sitelinks)
    LIMIT 20
  `
}

async function obtenerRankeados(qids, { incluirDescubridor = false } = {}) {
  if (qids.length === 0) return []

  const bindings = await sparqlQuery(buildRankingQuery({ qids, incluirDescubridor }))

  // El pool puede traer varias filas por item (p.ej. varios descubridores);
  // nos quedamos con la primera aparicion de cada item (ya viene ordenado por sitelinks).
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

// --- Resolución de cada categoría para un día ---

async function resolverPersonaje(mes, dia) {
  const candidatos = await obtenerCandidatos({
    predicado: 'wdt:P569',
    restriccionTipo: '?item wdt:P31 wd:Q5.',
    mes,
    dia,
  })
  await sleep(DELAY_MS)

  const rankeados = await obtenerRankeados(candidatos)
  await sleep(DELAY_MS)

  const mejor = rankeados[0]
  return {
    nombre: valor(mejor, 'itemLabel'),
    descripcion: descripcion(mejor),
  }
}

async function resolverEfemeride(mes, dia) {
  const candidatos = await obtenerCandidatos({
    predicado: 'wdt:P585',
    restriccionTipo: null,
    mes,
    dia,
  })
  await sleep(DELAY_MS)

  const rankeados = await obtenerRankeados(candidatos)
  await sleep(DELAY_MS)

  const mejor = rankeados[0]
  return {
    titulo: valor(mejor, 'itemLabel'),
    descripcion: descripcion(mejor),
  }
}

async function resolverHitosCientificos(mes, dia) {
  const candidatos = await obtenerCandidatos({
    predicado: 'wdt:P575',
    restriccionTipo: null,
    mes,
    dia,
  })
  await sleep(DELAY_MS)

  const rankeados = await obtenerRankeados(candidatos, { incluirDescubridor: true })
  await sleep(DELAY_MS)

  return rankeados.slice(0, 5).map((b) => ({
    titulo: valor(b, 'itemLabel'),
    descripcion: descripcion(b),
    autor: valor(b, 'discovererLabel'),
  }))
}

async function resolverSantoral(mes, dia) {
  const fecha = `${pad(mes)}-${pad(dia)}`
  const diaQid = DIA_QID[fecha]
  if (!diaQid) return { nombres: [] }

  const candidatos = await ejecutarCandidatos(buildCandidatosSantoralQuery(diaQid))
  await sleep(DELAY_MS)

  const rankeados = await obtenerRankeados(candidatos)
  await sleep(DELAY_MS)

  return {
    nombres: rankeados.slice(0, 3).map((b) => valor(b, 'itemLabel')).filter(Boolean),
  }
}

async function procesarDia(mes, dia) {
  const fecha = `${pad(mes)}-${pad(dia)}`

  const personaje = await resolverPersonaje(mes, dia)
  const efemeride = await resolverEfemeride(mes, dia)
  const hitosCientificos = await resolverHitosCientificos(mes, dia)
  const santoral = await resolverSantoral(mes, dia)

  return { fecha, personaje, efemeride, hitosCientificos, santoral }
}

function guardar(datos) {
  const dir = dirname(OUTPUT_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(OUTPUT_PATH, JSON.stringify(datos, null, 2), 'utf-8')
}

async function main() {
  const datos = {}
  const totalDias = MESES.reduce((acc, m) => acc + m.dias, 0)
  let procesados = 0
  const inicio = Date.now()

  console.log(`Iniciando precalculo de ${totalDias} dias desde Wikidata...\n`)

  for (const { mes, dias } of MESES) {
    for (let dia = 1; dia <= dias; dia++) {
      procesados++
      const fecha = `${pad(mes)}-${pad(dia)}`
      process.stdout.write(`[${procesados}/${totalDias}] Procesando ${fecha}... `)

      try {
        const resultado = await procesarDia(mes, dia)
        datos[fecha] = resultado
        console.log(
          `OK (personaje: ${resultado.personaje.nombre || '-'}, ` +
            `efemeride: ${resultado.efemeride.titulo || '-'}, ` +
            `hitos: ${resultado.hitosCientificos.length}, ` +
            `santoral: ${resultado.santoral.nombres.length})`
        )
      } catch (error) {
        console.log(`ERROR (${error.message})`)
        datos[fecha] = {
          fecha,
          personaje: { nombre: '', descripcion: '' },
          efemeride: { titulo: '', descripcion: '' },
          hitosCientificos: [],
          santoral: { nombres: [] },
        }
      }

      // Guardado incremental: si el proceso se interrumpe no se pierde el progreso ya obtenido
      guardar(datos)
    }
  }

  const minutos = ((Date.now() - inicio) / 60000).toFixed(1)
  console.log(`\nCompletado: ${procesados}/${totalDias} dias en ${minutos} minutos.`)
  console.log(`Archivo guardado en: ${OUTPUT_PATH}`)
}

main().catch((error) => {
  console.error('Error fatal:', error)
  process.exitCode = 1
})

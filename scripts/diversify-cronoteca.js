// Reintenta un 50% aleatorio de los días de Cronoteca generados
// algorítmicamente (hoy todos "película") buscando si hay una obra de tipo
// libro/canción/álbum con fecha exacta ese mismo día — si la hay, reemplaza
// la película actual; si no, la deja como está (no se inventa nada ni se
// resigna la precisión de día exacto).
//
// Uso: node scripts/diversify-cronoteca.js
//
// No es parte del flujo normal de generación (precalculate-cronoteca.js ya
// aplica el criterio "no-película primero" para corridas nuevas) — este
// script es puntual, para rebalancear datos que ya existían de antes de ese
// cambio de criterio.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, '../public/cronoteca-365dias.json')

const CONFIG = {
  WIKIDATA_ENDPOINT: 'https://query.wikidata.org/sparql',
  USER_AGENT: 'Efemeris-CronotecaScript/1.0 (script de precalculo para app Efemeris)',
  DELAY_MS: 1000,
  MAX_RETRIES: 3,
  POOL_SIZE: 30,
}

const TIPOS_NO_PELICULA = {
  libro: 'Q571',
  canción: 'Q134556',
  álbum: 'Q482994',
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const pad = (n) => String(n).padStart(2, '0')

async function sparqlQuery(query, retriesLeft = CONFIG.MAX_RETRIES) {
  const url = `${CONFIG.WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': CONFIG.USER_AGENT },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const json = await response.json()
    return json.results.bindings
  } catch (error) {
    if (retriesLeft > 0) {
      await sleep(CONFIG.DELAY_MS * 2)
      return sparqlQuery(query, retriesLeft - 1)
    }
    console.error(`  x Fallo definitivo en consulta: ${error.message}`)
    return []
  }
}

const qidDeUri = (uri) => uri.split('/').pop()
const valor = (b, campo) => b?.[campo]?.value ?? ''
const descripcion = (b) => valor(b, 'descripcionEs') || valor(b, 'descripcionEn') || ''

async function obtenerCandidatos(tipoId, mes, dia) {
  const query = `
    SELECT DISTINCT ?item WHERE {
      ?item wdt:P31 wd:${tipoId} .
      ?item wdt:P577 ?fecha.
      FILTER(MONTH(?fecha) = ${mes} && DAY(?fecha) = ${dia})
    }
    LIMIT ${CONFIG.POOL_SIZE}
  `
  const bindings = await sparqlQuery(query)
  return bindings.map((b) => qidDeUri(valor(b, 'item')))
}

async function obtenerRankeados(qids) {
  if (qids.length === 0) return []
  const values = qids.map((qid) => `wd:${qid}`).join(' ')
  const query = `
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
  const bindings = await sparqlQuery(query)
  const vistos = new Set()
  const unicos = []
  for (const b of bindings) {
    const qid = qidDeUri(valor(b, 'item'))
    if (vistos.has(qid)) continue
    vistos.add(qid)
    unicos.push(b)
  }
  return unicos
}

// Busca, entre libro/canción/álbum, la mejor alternativa a la película actual
// para ese día exacto (compitiendo por sitelinks entre los tipos que sí
// tengan candidato). Devuelve null si ninguno tiene obra ese día ("duda" ->
// se deja la película actual, no se reemplaza).
async function buscarAlternativaNoFilm(mes, dia) {
  let mejor = null
  let mejorTipo = null
  let mejorSitelinks = -1

  for (const [tipoNombre, tipoId] of Object.entries(TIPOS_NO_PELICULA)) {
    const candidatos = await obtenerCandidatos(tipoId, mes, dia)
    await sleep(CONFIG.DELAY_MS)
    if (candidatos.length === 0) continue

    const rankeados = await obtenerRankeados(candidatos)
    await sleep(CONFIG.DELAY_MS)
    const top = rankeados[0]
    if (!top) continue

    const sitelinks = parseInt(valor(top, 'sitelinks'), 10) || 0
    if (sitelinks > mejorSitelinks) {
      mejorSitelinks = sitelinks
      mejor = top
      mejorTipo = tipoNombre
    }
  }

  if (!mejor) return null

  const wikidataId = qidDeUri(valor(mejor, 'item'))
  return {
    tipo: mejorTipo,
    titulo: valor(mejor, 'itemLabel'),
    artista: '',
    descripcion: descripcion(mejor) || 'Obra notable de este día',
    fechaEstreno: valor(mejor, 'pubDate').split('T')[0],
    wikidataId,
    wikidataUrl: `https://www.wikidata.org/wiki/${wikidataId}`,
    impacto: '',
  }
}

function guardar(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))

  // Solo días generados algorítmicamente (fuera de enero) que hoy son
  // película: son los únicos candidatos a diversificar.
  const candidatos = Object.keys(data).filter((k) => !k.startsWith('01-') && data[k].tipo === 'película')

  // Muestra aleatoria del 50%, orden de procesamiento también aleatorio.
  const barajados = [...candidatos].sort(() => Math.random() - 0.5)
  const mitad = barajados.slice(0, Math.floor(barajados.length / 2))

  console.log(`Días película elegibles: ${candidatos.length}`)
  console.log(`Reintentando ${mitad.length} al azar (50%) con prioridad libro/canción/álbum...\n`)

  let cambiados = 0
  let mantenidos = 0

  for (let i = 0; i < mitad.length; i++) {
    const key = mitad[i]
    const [mesStr, diaStr] = key.split('-')
    const mes = parseInt(mesStr, 10)
    const dia = parseInt(diaStr, 10)
    const tituloAnterior = data[key].titulo

    process.stdout.write(`[${i + 1}/${mitad.length}] ${key} (hoy: película "${tituloAnterior}")... `)

    try {
      const alternativa = await buscarAlternativaNoFilm(mes, dia)
      if (alternativa) {
        data[key] = alternativa
        cambiados++
        console.log(`-> CAMBIADO a ${alternativa.tipo}: "${alternativa.titulo}"`)
      } else {
        mantenidos++
        console.log('-> sin alternativa día-exacta, se mantiene la película')
      }
    } catch (err) {
      mantenidos++
      console.log(`-> ERROR (${err.message}), se mantiene la película`)
    }

    // Guardado incremental: si se interrumpe, no se pierde lo ya hecho.
    guardar(data)
  }

  const conteoFinal = {}
  for (const entry of Object.values(data)) {
    conteoFinal[entry.tipo] = (conteoFinal[entry.tipo] || 0) + 1
  }

  console.log(`\n📊 Resumen:`)
  console.log(`   Cambiados a libro/canción/álbum: ${cambiados}`)
  console.log(`   Mantenidos como película: ${mantenidos}`)
  console.log(`   Conteo final por tipo:`, conteoFinal)
  console.log(`\n✨ Proceso completado`)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exitCode = 1
})

// Agrega wikipediaUrl (artículo en Wikipedia en español) a cada entrada de
// public/cronoteca-365dias.json, tomado del sitelink "eswiki" real de cada
// QID en Wikidata (no se reconstruye la URL a mano: el título de la página
// en Wikipedia puede diferir del título/label del ítem en Wikidata).
//
// Si un QID no tiene sitelink en eswiki, la entrada queda sin wikipediaUrl y
// la app cae al enlace de Wikidata existente (ver App.jsx).
//
// Uso: node scripts/add-wikipedia-cronoteca.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, '../public/cronoteca-365dias.json')

const API = 'https://www.wikidata.org/w/api.php'
const USER_AGENT = 'Efemeris-CronotecaScript/1.0 (script de precalculo para app Efemeris)'
const BATCH_SIZE = 40
const DELAY_MS = 1200

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function obtenerSitelinks(ids, retriesLeft = 3) {
  const url = `${API}?action=wbgetentities&ids=${ids.join('|')}&props=sitelinks&format=json`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    const text = await res.text()
    return JSON.parse(text)
  } catch (error) {
    if (retriesLeft > 0) {
      await sleep(DELAY_MS * 2)
      return obtenerSitelinks(ids, retriesLeft - 1)
    }
    console.error(`Fallo definitivo consultando ${ids.join(',')}: ${error.message}`)
    return { entities: {} }
  }
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))

  const qids = [...new Set(Object.values(data).map((e) => e.wikidataId).filter(Boolean))]
  console.log(`QIDs únicos a resolver: ${qids.length}`)

  const eswikiPorQid = {}
  const lotes = chunk(qids, BATCH_SIZE)

  for (let i = 0; i < lotes.length; i++) {
    const lote = lotes[i]
    process.stdout.write(`Lote ${i + 1}/${lotes.length} (${lote.length} QIDs)... `)
    const json = await obtenerSitelinks(lote)
    let encontrados = 0
    for (const [qid, entity] of Object.entries(json.entities || {})) {
      const titulo = entity?.sitelinks?.eswiki?.title
      if (titulo) {
        eswikiPorQid[qid] = `https://es.wikipedia.org/wiki/${encodeURIComponent(titulo.replace(/ /g, '_'))}`
        encontrados++
      }
    }
    console.log(`${encontrados}/${lote.length} con artículo en es.wikipedia`)
    if (i < lotes.length - 1) await sleep(DELAY_MS)
  }

  let actualizadas = 0
  let sinArticulo = 0
  for (const entry of Object.values(data)) {
    if (!entry.wikidataId) continue
    const url = eswikiPorQid[entry.wikidataId]
    if (url) {
      entry.wikipediaUrl = url
      actualizadas++
    } else {
      sinArticulo++
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  console.log(`\n✅ Entradas con wikipediaUrl agregado: ${actualizadas}`)
  console.log(`⚠️  Entradas sin artículo en es.wikipedia (se mantiene el enlace a Wikidata): ${sinArticulo}`)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exitCode = 1
})

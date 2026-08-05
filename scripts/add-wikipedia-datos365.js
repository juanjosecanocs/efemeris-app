// Agrega wikipediaUrl (artículo real en Wikipedia en español, sitelink
// "eswiki") a personaje, efemeride y cada hito de hitosCientificos en
// public/datos-365dias.json — mismo enfoque que
// scripts/add-wikipedia-cronoteca.js, pero para el archivo principal.
//
// No hace falta volver a correr precalculate.js: los QIDs ya están en
// wikidataUrl, solo se resuelve su sitelink de Wikipedia.
//
// Si un QID no tiene sitelink en eswiki, el campo queda sin wikipediaUrl y
// la app cae al enlace de Wikidata (ver App.jsx).
//
// Uso: node scripts/add-wikipedia-datos365.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, '../public/datos-365dias.json')

const API = 'https://www.wikidata.org/w/api.php'
const USER_AGENT = 'Efemeris-PrecalculateScript/1.0 (script de precalculo para app Efemeris)'
const BATCH_SIZE = 30
const DELAY_MS = 3000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const qidDeUrl = (url) => url?.split('/').pop()

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

  // Solo se consultan QIDs de campos que todavía no tengan wikipediaUrl:
  // permite reintentar después de un fallo de rate limit sin re-pedir todo.
  const qids = new Set()
  const agregar = (obj) => {
    if (!obj?.wikidataUrl || obj.wikipediaUrl) return
    const qid = qidDeUrl(obj.wikidataUrl)
    if (qid) qids.add(qid)
  }
  for (const dia of Object.values(data)) {
    agregar(dia.personaje)
    agregar(dia.efemeride)
    for (const h of dia.hitosCientificos || []) agregar(h)
  }
  const listaQids = [...qids]
  console.log(`QIDs pendientes de resolver: ${listaQids.length}`)

  const eswikiPorQid = {}
  const lotes = chunk(listaQids, BATCH_SIZE)

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

  const aplicar = (obj) => {
    if (!obj?.wikidataUrl || obj.wikipediaUrl) return
    const qid = qidDeUrl(obj.wikidataUrl)
    const url = eswikiPorQid[qid]
    if (url) {
      obj.wikipediaUrl = url
      actualizadas++
    } else {
      sinArticulo++
    }
  }

  for (const dia of Object.values(data)) {
    aplicar(dia.personaje)
    aplicar(dia.efemeride)
    for (const h of dia.hitosCientificos || []) aplicar(h)
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  console.log(`\n✅ Campos con wikipediaUrl agregado: ${actualizadas}`)
  console.log(`⚠️  Campos sin artículo en es.wikipedia (se mantiene el enlace a Wikidata): ${sinArticulo}`)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exitCode = 1
})

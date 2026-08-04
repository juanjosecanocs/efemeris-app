// Enriquece el santoral de public/datos-365dias.json con datos del
// Martirologio Romano (uploads/Santoral_Completo_Ano.xlsx): festividad
// principal, tipo (Solemnidad/Fiesta/Conmemoración) y otros santos del día.
// No reemplaza `santoral.nombres` (lo que ya genera precalculate.js vía
// Wikidata) — solo agrega campos nuevos al lado.
//
// Uso: node merge-santoral.js
//
// Por qué se deriva la fecha de Día+Mes y no de la columna "Fecha (DD/MM)":
// esa columna tiene al menos un error real en el Excel fuente (la fila del
// 7 de junio dice "07/07", chocando con el 7 de julio) — Día+Mes es el dato
// más confiable.

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import XLSX from 'xlsx'

const EXCEL_PATH = 'uploads/Santoral_Completo_Ano.xlsx'
const JSON_PATH = 'public/datos-365dias.json'

const MESES = {
  Enero: '01', Febrero: '02', Marzo: '03', Abril: '04', Mayo: '05', Junio: '06',
  Julio: '07', Agosto: '08', Septiembre: '09', Octubre: '10', Noviembre: '11', Diciembre: '12',
}

// El paréntesis final no siempre es un rango litúrgico: a veces es un apodo
// del santo ("San Juan María Vianney (Santo Cura de Ars)") o un patronazgo
// ("(Patrona de Europa)"). Solo se toma como `tipo` si matchea el rango
// litúrgico real; si no, se deja el nombre completo tal cual y el tipo cae
// al default 'Conmemoración'.
const RANGOS_LITURGICOS = /^(Solemnidad|Fiesta|Solemnidad\/Fiesta)$/i

function extraerTipoYNombre(texto) {
  const match = texto.match(/\s*\(([^)]+)\)\s*$/)
  if (match && RANGOS_LITURGICOS.test(match[1])) {
    return { tipo: match[1], nombrePrincipal: texto.slice(0, match.index).trim() }
  }
  return { tipo: 'Conmemoración', nombrePrincipal: texto.trim() }
}

function parsearSantos(texto) {
  if (!texto) return []
  return texto.split(',').map((s) => s.trim()).filter(Boolean)
}

function fusionarSantoral() {
  console.log('Fusionando santoral con el Martirologio Romano\n')

  if (!existsSync(EXCEL_PATH)) {
    console.error(`Excel no encontrado: ${EXCEL_PATH}`)
    process.exit(1)
  }
  if (!existsSync(JSON_PATH)) {
    console.error(`JSON no encontrado: ${JSON_PATH}`)
    process.exit(1)
  }

  const workbook = XLSX.readFile(EXCEL_PATH)
  const hoja = workbook.Sheets[workbook.SheetNames[0]]
  const filas = XLSX.utils.sheet_to_json(hoja)
  console.log(`Filas leídas del Excel: ${filas.length}`)

  const mapaExcel = {}
  for (const fila of filas) {
    const mes = MESES[fila['Mes']]
    const dia = String(fila['Día']).padStart(2, '0')
    if (!mes) {
      console.warn(`  ! Mes desconocido, fila salteada: ${JSON.stringify(fila)}`)
      continue
    }
    const clave = `${mes}-${dia}`
    mapaExcel[clave] = {
      ...extraerTipoYNombre(fila['Santo / Festividad Principal']),
      otros: parsearSantos(fila['Otros Santos y Beatos Conmemorados']),
    }
  }
  console.log(`Fechas mapeadas: ${Object.keys(mapaExcel).length}\n`)

  const datos = JSON.parse(readFileSync(JSON_PATH, 'utf-8'))
  const claves = Object.keys(datos).filter((k) => !k.startsWith('_'))

  let enriquecidos = 0
  let sinMatchEnExcel = 0

  for (const clave of claves) {
    const enExcel = mapaExcel[clave]
    if (!enExcel) {
      sinMatchEnExcel++
      continue
    }
    if (!datos[clave].santoral) datos[clave].santoral = {}
    datos[clave].santoral.nombrePrincipal = enExcel.nombrePrincipal
    datos[clave].santoral.tipo = enExcel.tipo
    datos[clave].santoral.otros = enExcel.otros
    enriquecidos++
  }

  // 29 de febrero: no existe como clave (precalculate.js usa un año de
  // referencia no bisiesto), pero el santoral del Martirologio sí lo tiene,
  // así que se agrega un día nuevo solo con santoral para que años bisiestos
  // tengan algo que mostrar en esa pestaña.
  if (mapaExcel['02-29'] && !datos['02-29']) {
    datos['02-29'] = { fecha: '02-29', santoral: { ...mapaExcel['02-29'] } }
    console.log(`Agregado día nuevo 02-29 (año bisiesto): ${mapaExcel['02-29'].nombrePrincipal}`)
  }

  datos._santoralFusionadoEn = new Date().toISOString()
  datos._santoralFuente = 'Martirologio Romano (Santoral_Completo_Ano.xlsx)'

  writeFileSync(JSON_PATH, JSON.stringify(datos, null, 2), 'utf-8')

  console.log(`\nDías enriquecidos: ${enriquecidos}`)
  console.log(`Días sin match en el Excel: ${sinMatchEnExcel}`)
  console.log(`Archivo: ${JSON_PATH} (${(statSync(JSON_PATH).size / 1024).toFixed(2)} KB)`)

  console.log('\nEjemplos:')
  for (const clave of ['01-01', '06-07', '12-31']) {
    if (datos[clave]?.santoral) {
      const s = datos[clave].santoral
      console.log(`  ${clave}: ${s.nombrePrincipal} [${s.tipo}] — otros: ${s.otros.slice(0, 2).join(', ')}${s.otros.length > 2 ? '…' : ''}`)
    }
  }
}

fusionarSantoral()

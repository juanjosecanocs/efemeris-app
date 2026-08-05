#!/usr/bin/env node
// Update Cronoteca URLs
// Script independiente para actualizar/verificar URLs de Wikidata en
// public/cronoteca-365dias.json.
//
// Problemas que resuelve:
// - Convierte HTTP -> HTTPS
// - Convierte /entity/Q -> /wiki/Q
// - Añade URLs a entradas que tienen wikidataId pero no wikidataUrl
// - Valida formato de URLs
//
// Uso:
//   node scripts/update-cronoteca-urls.js [--input=path] [--output=path] [--validate]

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_INPUT = path.join(__dirname, '../public/cronoteca-365dias.json')
const DEFAULT_OUTPUT = path.join(__dirname, '../public/cronoteca-365dias.json')

const CONFIG = {
  WIKIDATA_BASE: 'https://www.wikidata.org/wiki/',
  LOG_FILE: path.join(__dirname, 'update-cronoteca-urls.log'),
}

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

const logger = new Logger(CONFIG.LOG_FILE)

function extractWikidataId(url) {
  if (!url) return null
  const match = url.match(/Q\d+/)
  return match ? match[0] : null
}

function buildWikidataUrl(wikidataId) {
  if (!wikidataId || !/^Q\d+$/.test(wikidataId)) return null
  return `${CONFIG.WIKIDATA_BASE}${wikidataId}`
}

function isValidWikidataUrl(url) {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return (
      urlObj.protocol === 'https:' &&
      urlObj.hostname === 'www.wikidata.org' &&
      urlObj.pathname.startsWith('/wiki/Q')
    )
  } catch {
    return false
  }
}

function updateEntrada(entrada) {
  const issues = []
  const fixed = { ...entrada }

  if (fixed.wikidataId && !fixed.wikidataUrl) {
    const newUrl = buildWikidataUrl(fixed.wikidataId)
    if (newUrl) {
      fixed.wikidataUrl = newUrl
      issues.push('URL generada desde wikidataId')
    }
  }

  if (fixed.wikidataUrl && !fixed.wikidataId) {
    const id = extractWikidataId(fixed.wikidataUrl)
    if (id) {
      fixed.wikidataId = id
      issues.push('wikidataId extraído desde URL')
    }
  }

  if (fixed.wikidataUrl && !isValidWikidataUrl(fixed.wikidataUrl)) {
    const id = extractWikidataId(fixed.wikidataUrl)
    if (id) {
      fixed.wikidataUrl = buildWikidataUrl(id)
      issues.push('URL corregida (formato inválido)')
    } else {
      issues.push('ERROR: URL inválida y no se puede extraer ID')
    }
  }

  if (!fixed.wikidataId || !fixed.wikidataUrl) {
    issues.push('ADVERTENCIA: Entrada incompleta')
  }

  return { fixed, issues }
}

function processRecomendaciones(recomendaciones) {
  const stats = { total: 0, actualizadas: 0, errores: 0, advertencias: 0 }
  const actualizado = {}
  const reportes = []

  Object.entries(recomendaciones).forEach(([dateKey, entrada]) => {
    stats.total++
    const { fixed, issues } = updateEntrada(entrada)
    actualizado[dateKey] = fixed

    if (issues.length > 0) {
      stats.actualizadas++
      reportes.push({ fecha: dateKey, titulo: fixed.titulo, issues })
      issues.forEach((issue) => {
        if (issue.startsWith('ERROR')) stats.errores++
        else if (issue.startsWith('ADVERTENCIA')) stats.advertencias++
      })
    }
  })

  return { actualizado, stats, reportes }
}

function generateReport(stats, reportes) {
  logger.info(`\n📊 Reporte de Actualización de URLs`)
  logger.info(`=====================================`)
  logger.info(`Total de entradas: ${stats.total}`)
  logger.info(`Actualizadas: ${stats.actualizadas}`)
  logger.info(`Advertencias: ${stats.advertencias}`)
  logger.info(`Errores: ${stats.errores}`)

  if (reportes.length > 0) {
    logger.info(`\n📝 Detalles de cambios:`)
    reportes.forEach((reporte) => {
      logger.info(`\n  ${reporte.fecha} - ${reporte.titulo}`)
      reporte.issues.forEach((issue) => {
        const prefix = issue.startsWith('ERROR') ? '❌' : issue.startsWith('ADVERTENCIA') ? '⚠️' : '✓'
        logger.info(`    ${prefix} ${issue}`)
      })
    })
  } else {
    logger.info(`\n✓ Todas las URLs están correctas`)
  }
}

async function main() {
  logger.info('🔗 Update Cronoteca URLs\n')

  try {
    const args = process.argv.slice(2)
    let inputPath = DEFAULT_INPUT
    let outputPath = DEFAULT_OUTPUT
    let validateOnly = false

    args.forEach((arg) => {
      if (arg.startsWith('--input=')) inputPath = arg.split('=')[1]
      else if (arg.startsWith('--output=')) outputPath = arg.split('=')[1]
      else if (arg === '--validate') validateOnly = true
    })

    logger.info(`📂 Entrada: ${inputPath}`)
    if (!validateOnly) logger.info(`📂 Salida: ${outputPath}`)
    else logger.info(`🔍 Modo: Solo validar (sin guardar)`)

    if (!fs.existsSync(inputPath)) throw new Error(`Archivo no encontrado: ${inputPath}`)

    const recomendaciones = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
    logger.info(`\n🔄 Procesando ${Object.keys(recomendaciones).length} entradas...\n`)

    const { actualizado, stats, reportes } = processRecomendaciones(recomendaciones)
    generateReport(stats, reportes)

    if (!validateOnly) {
      const outputDir = path.dirname(outputPath)
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
      fs.writeFileSync(outputPath, JSON.stringify(actualizado, null, 2))
      logger.info(`\n✅ Datos guardados en: ${outputPath}`)
    } else {
      logger.info(`\n✓ Validación completada (sin guardar cambios)`)
    }

    logger.info(`\n✨ Proceso completado`)
    logger.save()
  } catch (error) {
    logger.error('Error fatal:', error.message)
    logger.error('Stack:', error.stack)
    logger.save()
    process.exit(1)
  }
}

main()

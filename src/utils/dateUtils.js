import {
  addDays,
  format,
  getDayOfYear,
  isSameDay,
  isAfter,
  startOfWeek,
  endOfWeek,
  startOfDay,
  eachDayOfInterval,
  isWithinInterval,
} from 'date-fns'
import { es } from 'date-fns/locale'

// Semana del año según la fórmula pedida (no ISO week): ceil(díaDelAño / 7),
// acotada a 52 para que el rótulo "Semana X de 52" nunca muestre 53.
export function getWeekOfYear(date) {
  const dia = getDayOfYear(date)
  return Math.min(52, Math.ceil(dia / 7))
}

// "Lun 3 ago"
export function formatDateShort(date) {
  const texto = format(date, 'EEE d MMM', { locale: es })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Disponibilidad de PREDICCIÓN climática: pasado y hoy siempre "disponibles"
// (hoy es tiempo real; el pasado no tiene predicción pero no lo bloqueamos acá),
// futuro solo dentro de la ventana que soporta la API (por defecto 5 días).
export function isDateAvailable(date, hoy = new Date(), diasFuturosDisponibles = 5) {
  if (!isAfter(date, hoy) || isSameDay(date, hoy)) return true
  const limite = addDays(hoy, diasFuturosDisponibles)
  return !isAfter(date, limite)
}

// Arma la matriz de semanas (7 columnas, lunes a domingo) que cubre por
// completo un rango de fechas (p.ej. todos los días de un mes), para
// dibujarla como una grilla de calendario real en vez de una lista plana.
// Las celdas de relleno (fuera del rango pedido, pero necesarias para
// completar la semana) van marcadas con `fueraDeRango: true`.
export function getCalendarMatrix(dias) {
  if (dias.length === 0) return []

  // eachDayOfInterval devuelve cada día normalizado a medianoche; si no
  // normalizamos también estos dos límites, un `fechaActual` con hora
  // (p.ej. "hoy" recién creado con new Date()) corre el rango y deja afuera
  // por error el primer día válido (comparación de timestamp, no de día).
  const primero = startOfDay(dias[0])
  const ultimo = startOfDay(dias[dias.length - 1])
  const inicioGrid = startOfWeek(primero, { weekStartsOn: 1 })
  const finGrid = endOfWeek(ultimo, { weekStartsOn: 1 })

  const celdas = eachDayOfInterval({ start: inicioGrid, end: finGrid }).map((fecha) => ({
    fecha,
    fueraDeRango: !isWithinInterval(fecha, { start: primero, end: ultimo }),
  }))

  const semanas = []
  for (let i = 0; i < celdas.length; i += 7) {
    semanas.push(celdas.slice(i, i + 7))
  }
  return semanas
}

export { isSameDay }

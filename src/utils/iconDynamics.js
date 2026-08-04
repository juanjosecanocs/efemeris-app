// Cálculos para DynamicAppIcon: color/posición del sol, y cuándo mostrar la luna.

// `icono` es la clave simplificada que ya devuelve apiService.obtenerClima
// (sun/luna/cloud/rain/storm/snow/fog) — evita reinventar el parseo de la
// descripción en texto libre de OpenWeatherMap, que ya se resuelve ahí.
const COLOR_POR_ICONO = {
  sun: '#FFD700', // amarillo brillante
  cloud: '#A0A0A0', // gris
  rain: '#4A90E2', // azul lluvia
  storm: '#1a1a2e', // gris oscuro tormenta
  snow: '#E8E8E8', // blanco
  fog: '#A0A0A0',
  luna: '#E8E8E8',
}

export function determinarColorSol(icono) {
  return COLOR_POR_ICONO[icono] ?? COLOR_POR_ICONO.sun
}

/**
 * Posición del sol en un arco entre las 6:00 y las 18:00, en coordenadas
 * del viewBox 0-200 del ícono.
 */
export function calcularPosicionSol(hora) {
  const minHora = 6
  const maxHora = 18
  const horaClip = Math.max(minHora, Math.min(maxHora, hora))
  const progreso = (horaClip - minHora) / (maxHora - minHora)

  const x = 50 + progreso * 100
  const arcHeight = Math.sin(progreso * Math.PI) * 70
  const y = 120 - arcHeight

  return { x, y }
}

// Más opaco cerca del mediodía, más tenue en los extremos (amanecer/atardecer).
export function calcularOpacidadSol(hora) {
  const minHora = 6
  const maxHora = 18
  const horaClip = Math.max(minHora, Math.min(maxHora, hora))
  const progreso = (horaClip - minHora) / (maxHora - minHora)

  return 0.3 + progreso * 0.7 - Math.abs(progreso - 0.5) * 0.4
}

export function debeMostrarLuna(hora) {
  return hora < 6 || hora >= 18
}

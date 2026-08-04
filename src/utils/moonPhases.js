// Mapeo de fase lunar (0-1, como la devuelve suncalc's getMoonIllumination) a
// nombre en español. Rangos tal como fueron especificados.
const RANGOS_FASE = [
  { hasta: 0.125, nombre: 'Luna nueva' },
  { hasta: 0.25, nombre: 'Cuarto creciente' },
  { hasta: 0.375, nombre: 'Gibosa creciente' },
  { hasta: 0.5, nombre: 'Luna llena' },
  { hasta: 0.625, nombre: 'Gibosa menguante' },
  { hasta: 0.75, nombre: 'Cuarto menguante' },
  { hasta: 1.0, nombre: 'Luna nueva (próxima)' },
]

export function getFaseName(fase) {
  const encontrado = RANGOS_FASE.find((rango) => fase < rango.hasta)
  return (encontrado ?? RANGOS_FASE[RANGOS_FASE.length - 1]).nombre
}

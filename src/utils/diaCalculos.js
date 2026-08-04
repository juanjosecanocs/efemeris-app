const NOMBRES_MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const NOMBRES_DIA_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export function claveFecha(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${mes}-${dia}`
}

export function formatoFechaLarga(fecha) {
  const diaSemana = NOMBRES_DIA_SEMANA[fecha.getDay()]
  const mes = NOMBRES_MES[fecha.getMonth()]
  return `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${fecha.getDate()} de ${mes}`
}

export function formatoMesAnio(fecha) {
  const mes = NOMBRES_MES[fecha.getMonth()]
  return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${fecha.getFullYear()}`
}

// Día del año (1-365) usando un año de referencia no bisiesto, para que la
// posición en el calendario no dependa del año real ni de si es bisiesto.
export function diaDelAnio(fecha) {
  const inicio = new Date(2023, 0, 1)
  const actual = new Date(2023, fecha.getMonth(), fecha.getDate())
  return Math.round((actual - inicio) / 86400000) + 1
}

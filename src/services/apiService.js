// Servicio de datos externos: temperatura (OpenWeatherMap), sol/luna (suncalc,
// cálculo local sin red) y curiosidad matemática del día del año.
//
// La API key de OpenWeatherMap se lee de una variable de entorno de Vite
// (VITE_OPENWEATHER_API_KEY). Al ser una PWA sin backend, esa key queda visible
// en el bundle del navegador — es la limitación inherente de pedirle datos a una
// API de terceros directamente desde el cliente; usar solo una key gratuita/de
// bajo privilegio, nunca una key con permisos sensibles.

import { getTimes, getMoonIllumination, getMoonTimes } from 'suncalc'
import { differenceInCalendarDays, format } from 'date-fns'
import { getFaseName } from '../utils/moonPhases'

const BASE_URL_CLIMA = import.meta.env.VITE_API_URL || 'https://api.openweathermap.org'
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || ''

// Ubicación por defecto configurable por .env (VITE_LATITUDE/VITE_LONGITUDE);
// si no están seteadas, cae en Almería (mismo valor que antes, hardcodeado).
const LAT_DEFECTO = Number(import.meta.env.VITE_LATITUDE) || 36.8
const LON_DEFECTO = Number(import.meta.env.VITE_LONGITUDE) || -2.4
export const COORDENADAS_DEFECTO = { lat: LAT_DEFECTO, lon: LON_DEFECTO }

// Icono simplificado (el que consumen IconoClima/CardClima) + gradiente sugerido,
// según la condición de OpenWeatherMap (`weather[0].main`) y si es de día o de noche.
const ICONO_POR_CONDICION = {
  Clear: 'sun',
  Clouds: 'cloud',
  Rain: 'rain',
  Drizzle: 'rain',
  Thunderstorm: 'storm',
  Snow: 'snow',
  Mist: 'fog',
  Fog: 'fog',
  Haze: 'fog',
  Smoke: 'fog',
}

const GRADIENTE_POR_ICONO = {
  sun: 'linear-gradient(to bottom right, #38bdf8, #f97316)', // soleado: azul claro → naranja
  luna: 'linear-gradient(to bottom right, #1e1b4b, #4c1d95)',
  cloud: 'linear-gradient(to bottom right, #9ca3af, #3b82f6)', // nublado: gris → azul
  rain: 'linear-gradient(to bottom right, #1e3a5f, #9ca3af)', // lluvia: azul oscuro → gris
  storm: 'linear-gradient(to bottom right, #18181b, #3f3f46)',
  snow: 'linear-gradient(to bottom right, #3b5169, #93c5fd)',
  fog: 'linear-gradient(to bottom right, #374151, #9ca3af)',
}

function resolverIcono(condicionOwm, esDia) {
  const base = ICONO_POR_CONDICION[condicionOwm] ?? 'sun'
  return base === 'sun' && !esDia ? 'luna' : base
}

const FALLBACK_CLIMA = {
  temperatura: null,
  sensacion: null,
  clima: 'No disponible',
  viento: null,
  precipitacion: null,
  humedad: null,
  icono: 'sun',
  gradiente: GRADIENTE_POR_ICONO.sun,
  esDia: true,
  fuente: 'fallback',
}

const FALLBACK_SOL_LUNA = {
  amanece: '—',
  atardece: '—',
  faseLunar: { nombre: 'Desconocida', porcentaje: 50, fase: 0.5, creciente: false, orto: '—', ocaso: '—' },
  fuente: 'fallback',
}

function formatoHora(fecha) {
  if (!fecha || Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// --- Clima (OpenWeatherMap) ---
//
// El plan gratuito de OpenWeatherMap NO tiene clima histórico ni % de probabilidad
// de lluvia en el endpoint de "clima actual" — eso solo está en el pronóstico de
// 5 días / 3 horas (`/forecast`, con el campo `pop`). Por eso:
//   - Fechas pasadas: no hay forma de obtener datos reales sin una API paga -> fallback.
//   - Hoy / próximos 5 días: se usa `/forecast` y se toma la franja horaria más
//     cercana a "ahora" (hoy) o al mediodía (días futuros) de ese día.
//   - Más de 5 días a futuro: fuera de rango del plan gratuito -> fallback.
//
// El pronóstico se cachea en memoria por coordenadas para no repetir la consulta
// en cada click de navegación dentro de la misma ventana de 5 días.

let cachePronostico = null
const TTL_CACHE_MS = 10 * 60 * 1000

async function obtenerListaPronostico(coordenadas) {
  const clave = `${coordenadas.lat},${coordenadas.lon}`
  const ahora = Date.now()

  if (cachePronostico && cachePronostico.clave === clave && ahora - cachePronostico.timestamp < TTL_CACHE_MS) {
    return cachePronostico.lista
  }

  const { lat, lon } = coordenadas
  const url = `${BASE_URL_CLIMA}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`

  const respuesta = await fetch(url)
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)

  const datos = await respuesta.json()
  const lista = datos.list ?? []
  cachePronostico = { clave, lista, timestamp: ahora }
  return lista
}

export async function obtenerClima(fecha = new Date(), coordenadas = COORDENADAS_DEFECTO) {
  if (!API_KEY) {
    console.warn('VITE_OPENWEATHER_API_KEY no configurada; usando datos de fallback.')
    return { ...FALLBACK_CLIMA }
  }

  const hoy = new Date()
  const diffDias = differenceInCalendarDays(fecha, hoy)

  if (diffDias < 0) {
    return { ...FALLBACK_CLIMA, clima: 'Sin datos climáticos históricos disponibles' }
  }
  if (diffDias > 5) {
    return { ...FALLBACK_CLIMA, clima: 'Predicción no disponible (máximo 5 días)' }
  }

  try {
    const lista = await obtenerListaPronostico(coordenadas)
    const objetivo = format(fecha, 'yyyy-MM-dd')
    const entradasDelDia = lista.filter((item) => item.dt_txt?.startsWith(objetivo))

    if (entradasDelDia.length === 0) {
      return { ...FALLBACK_CLIMA, clima: 'Predicción no disponible para ese día' }
    }

    const horaObjetivo = diffDias === 0 ? hoy.getHours() : 12
    const entradaPrincipal = entradasDelDia.reduce((mejor, actual) => {
      const horaActual = new Date(actual.dt * 1000).getHours()
      const horaMejor = new Date(mejor.dt * 1000).getHours()
      return Math.abs(horaActual - horaObjetivo) < Math.abs(horaMejor - horaObjetivo) ? actual : mejor
    })

    const probabilidadMaxima = Math.max(...entradasDelDia.map((item) => item.pop ?? 0))
    const codigoIcono = entradaPrincipal.weather?.[0]?.icon ?? ''
    const esDia = codigoIcono ? codigoIcono.endsWith('d') : true
    const condicionOwm = entradaPrincipal.weather?.[0]?.main ?? 'Clear'
    const icono = resolverIcono(condicionOwm, esDia)
    const vientoMs = entradaPrincipal.wind?.speed

    return {
      temperatura: entradaPrincipal.main?.temp ?? null,
      sensacion: entradaPrincipal.main?.feels_like ?? null,
      clima: entradaPrincipal.weather?.[0]?.description ?? '',
      viento: vientoMs != null ? Math.round(vientoMs * 3.6 * 10) / 10 : null,
      precipitacion: Math.round(probabilidadMaxima * 100),
      humedad: entradaPrincipal.main?.humidity ?? null,
      icono,
      gradiente: GRADIENTE_POR_ICONO[icono] ?? GRADIENTE_POR_ICONO.sun,
      esDia,
      fuente: 'openweathermap',
    }
  } catch (error) {
    console.error('Error obteniendo clima de OpenWeatherMap:', error.message)
    return { ...FALLBACK_CLIMA, error: error.message }
  }
}

// --- Sol y luna (suncalc, cálculo local sin red) ---

export function obtenerSolYLuna(fecha = new Date(), coordenadas = COORDENADAS_DEFECTO) {
  try {
    const { lat, lon } = coordenadas
    const tiempos = getTimes(fecha, lat, lon)
    const iluminacion = getMoonIllumination(fecha)
    // rise/set vienen undefined si la Luna no sale o no se pone ese día
    // calendario en esa ubicación (alwaysUp/alwaysDown) — formatoHora ya
    // devuelve '—' en ese caso.
    const tiemposLuna = getMoonTimes(fecha, lat, lon)

    return {
      amanece: formatoHora(tiempos.sunrise),
      atardece: formatoHora(tiempos.sunset),
      faseLunar: {
        nombre: getFaseName(iluminacion.phase),
        porcentaje: Math.round(iluminacion.fraction * 100),
        fase: iluminacion.phase,
        creciente: iluminacion.phase < 0.5,
        orto: formatoHora(tiemposLuna.rise),
        ocaso: formatoHora(tiemposLuna.set),
      },
      fuente: 'suncalc',
    }
  } catch (error) {
    console.error('Error calculando sol/luna:', error.message)
    return { ...FALLBACK_SOL_LUNA, error: error.message }
  }
}

// --- Curiosidad matemática del día del año ---

function factorizar(n) {
  const factores = []
  let resto = n
  for (let i = 2; i * i <= resto; i++) {
    while (resto % i === 0) {
      factores.push(i)
      resto /= i
    }
  }
  if (resto > 1) factores.push(resto)
  return factores
}

function esPrimo(n) {
  if (n < 2) return false
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false
  }
  return true
}

function divisoresPropios(n) {
  const resultado = []
  for (let i = 1; i < n; i++) {
    if (n % i === 0) resultado.push(i)
  }
  return resultado
}

function esNumeroPerfecto(n) {
  const divisores = divisoresPropios(n)
  return divisores.length > 0 && divisores.reduce((a, b) => a + b, 0) === n
}

function esFibonacci(n) {
  const esCuadradoPerfecto = (x) => Number.isInteger(Math.sqrt(x))
  return esCuadradoPerfecto(5 * n * n + 4) || esCuadradoPerfecto(5 * n * n - 4)
}

export function generarCuriosidadMatematica(diaDelAnio) {
  const n = diaDelAnio
  const factores = factorizar(n)
  const primo = esPrimo(n)
  const cuadradoPerfecto = Number.isInteger(Math.sqrt(n))
  const perfecto = esNumeroPerfecto(n)
  const fibonacci = esFibonacci(n)

  let mensaje
  if (perfecto) {
    mensaje = `El ${n}º día del año es un número perfecto: la suma de sus divisores propios (${divisoresPropios(n).join(' + ')}) da ${n}.`
  } else if (primo) {
    mensaje = `El ${n}º día del año es un número primo: solo es divisible por 1 y por sí mismo.`
  } else if (cuadradoPerfecto) {
    mensaje = `El ${n}º día del año es un cuadrado perfecto: ${Math.sqrt(n)} × ${Math.sqrt(n)}.`
  } else if (fibonacci) {
    mensaje = `El ${n}º día del año pertenece a la sucesión de Fibonacci.`
  } else {
    mensaje = `El ${n}º día del año se factoriza como ${factores.join(' × ')}.`
  }

  return {
    dia: n,
    esPrimo: primo,
    esPerfecto: perfecto,
    esCuadradoPerfecto: cuadradoPerfecto,
    esFibonacci: fibonacci,
    factores,
    mensaje,
  }
}

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './styles/theme.css'
import { claveFecha, diaDelAnio } from './utils/diaCalculos'
import { CITAS_MOTIVACIONALES, REFRANES, elegirPorDia } from './data/contenidoLocal'
import { obtenerClima, obtenerSolYLuna, generarCuriosidadMatematica } from './services/apiService'
import { transicionDia } from './utils/animaciones'
import { ITEMS_MENU, ITEM_POR_DEFECTO } from './utils/layoutConstants'
import Navegacion from './components/Navegacion'
import DynamicAppIcon from './components/DynamicAppIcon'
import CardClima from './components/cards/CardClima'
import CardAstros from './components/cards/CardAstros'
import Menu from './components/Menu'
import CardDinamica from './components/CardDinamica'

const DATOS_URL = '/datos-365dias.json'
const UMBRAL_SWIPE = 80
const DIAS_PREDICCION_CLIMA = 5

function useDatosPrecalculados() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelado = false

    fetch(DATOS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!cancelado) setDatos(json)
      })
      .catch((err) => {
        if (!cancelado) setError(err.message)
      })

    return () => {
      cancelado = true
    }
  }, [])

  return { datos, error }
}

// Intenta geolocalizar al usuario; si no hay permiso/soporte, queda en null y
// apiService usa sus coordenadas por defecto (Almería).
function useCoordenadas() {
  const [coordenadas, setCoordenadas] = useState(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) return

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setCoordenadas({ lat: coords.latitude, lon: coords.longitude }),
      () => {},
      { timeout: 8000 }
    )
  }, [])

  return coordenadas
}

// El clima depende de la fecha vista: hoy = tiempo real, hasta 5 días a futuro =
// pronóstico de OpenWeatherMap, fuera de esa ventana = sin llamada a la API
// (apiService corta antes de hacer fetch; ver obtenerClima).
function useClima(fecha, coordenadas) {
  const [clima, setClima] = useState({ estado: 'cargando' })

  useEffect(() => {
    let cancelado = false
    setClima({ estado: 'cargando' })

    obtenerClima(fecha, coordenadas ?? undefined).then((resultado) => {
      if (!cancelado) setClima({ estado: 'listo', ...resultado })
    })

    return () => {
      cancelado = true
    }
  }, [fecha, coordenadas])

  return clima
}

// Reloj propio para DynamicAppIcon: representa "ahora" de verdad (día real +
// hora real), independiente de `fecha` (que el usuario puede navegar a otro
// día). Si usáramos `fecha` acá, cada tick del intervalo pisaría la
// navegación del usuario de vuelta a hoy.
function useRelojEnVivo() {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  return ahora
}

function esMismoDiaCalendario(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function App() {
  const [fecha, setFecha] = useState(() => new Date())
  const [direccion, setDireccion] = useState(0)
  // Vive acá (no dentro del bloque que remonta por día) para que se mantenga
  // en el mismo item al cambiar de fecha, como pide el spec.
  const [itemSeleccionado, setItemSeleccionado] = useState(ITEM_POR_DEFECTO)
  // Posición/alto real del botón de menú activo (medido por Menu.jsx), para
  // dibujar el puente de color que une visualmente el item con CardDinamica.
  const [rectSeleccionado, setRectSeleccionado] = useState({ top: 0, alto: 0 })
  const { datos, error } = useDatosPrecalculados()
  const coordenadas = useCoordenadas()
  const clima = useClima(fecha, coordenadas)
  const ahora = useRelojEnVivo()

  // Navegacion (y el swipe de abajo) llaman a esto con la nueva fecha; acá se
  // decide la dirección del slide y se dispara el refetch de clima/contenido.
  const cambiarFecha = useCallback(
    (nuevaFecha) => {
      setDireccion(nuevaFecha > fecha ? 1 : -1)
      setFecha(nuevaFecha)
    },
    [fecha]
  )

  const clave = claveFecha(fecha)
  const numeroDiaAnio = diaDelAnio(fecha)
  const hoy = new Date()
  const esFuturo = fecha > hoy && !esMismoDiaCalendario(fecha, hoy)

  // Nuestros datos precalculados son por MM-DD (año-agnóstico): el 29 de febrero
  // es el único día que el script realmente no genera, así que ese caso puntual
  // cae al 28 de febrero. Cualquier otro día faltante es porque la precalculación
  // sigue en curso (o, para fechas futuras, porque Wikidata no "predice" nada).
  const infoDia = datos?.[clave] ?? (clave === '02-29' ? datos?.['02-28'] : undefined)

  const solLuna = useMemo(
    () => obtenerSolYLuna(fecha, coordenadas ?? undefined),
    [fecha, coordenadas]
  )
  const curiosidad = useMemo(() => generarCuriosidadMatematica(numeroDiaAnio), [numeroDiaAnio])
  const cita = useMemo(() => elegirPorDia(CITAS_MOTIVACIONALES, numeroDiaAnio), [numeroDiaAnio])
  const refran = useMemo(() => elegirPorDia(REFRANES, numeroDiaAnio), [numeroDiaAnio])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo p-6 text-center text-texto-secundario">
        No se pudieron cargar los datos ({error}). Verificá que exista public/datos-365dias.json.
      </div>
    )
  }

  if (!datos) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo text-texto-secundario">
        Cargando…
      </div>
    )
  }

  // "Sin datos" según sea pasado (no hay registro) o futuro (Wikidata no tiene
  // nada que "predecir" para una fecha que todavía no pasó).
  const mensajeSinDatos = esFuturo ? 'Información próximamente' : 'Sin registros'
  const personaje = infoDia?.personaje
  const efemeride = infoDia?.efemeride
  const hito = infoDia?.hitosCientificos?.[0]
  const santoralInfo = infoDia?.santoral
  const santoralNombres = santoralInfo?.nombres ?? []

  // Normalizado a { titulo, contenido, autor? } para que CardDinamica no
  // necesite un caso especial por cada uno de los 7 items. `tipo`/`otros` son
  // opcionales (vienen del Martirologio Romano vía merge-santoral.js) y solo
  // los usa la card de santoral.
  const datosPorItem = {
    personaje: { titulo: personaje?.nombre, contenido: personaje?.descripcion, wikidataUrl: personaje?.wikidataUrl },
    efemeride: { titulo: efemeride?.titulo, contenido: efemeride?.descripcion, wikidataUrl: efemeride?.wikidataUrl },
    cita: { titulo: cita, contenido: null },
    santoral: {
      titulo: santoralInfo?.nombrePrincipal || (santoralNombres.length > 0 ? santoralNombres.join(', ') : null),
      contenido: null,
      tipo: santoralInfo?.tipo,
      otros: santoralInfo?.otros,
    },
    refran: { titulo: refran, contenido: null },
    hito: { titulo: hito?.titulo, contenido: hito?.descripcion, autor: hito?.autor, wikidataUrl: hito?.wikidataUrl },
    curiosidad: { titulo: curiosidad.mensaje, contenido: null },
  }

  const colorSeleccionado = ITEMS_MENU.find((item) => item.id === itemSeleccionado)?.color

  return (
    <div className="min-h-screen bg-fondo">
      <div className="mx-auto max-w-[600px] px-4 py-6 sm:px-6">
        <div className="mb-4 flex justify-center">
          <DynamicAppIcon fecha={ahora} clima={clima} tamano={96} />
        </div>

        <Navegacion
          fechaActual={fecha}
          onFechaChange={cambiarFecha}
          datosDisponibles={{ pasadas: true, futuras: DIAS_PREDICCION_CLIMA }}
        />

        <AnimatePresence mode="wait" custom={direccion}>
          <motion.div
            key={clave}
            custom={direccion}
            variants={transicionDia}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_evento, info) => {
              if (info.offset.x < -UMBRAL_SWIPE) cambiarFecha(new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1))
              else if (info.offset.x > UMBRAL_SWIPE) cambiarFecha(new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - 1))
            }}
            className="space-y-6"
          >
            <CardClima clima={clima} />

            <CardAstros solLuna={solLuna} clima={clima} indice={1} />

            {/* Sin gap-0: ahora hay una franja fija de 12px entre menú y card
                (bridge) donde se dibuja la "zona de nexo" — un rectángulo
                blanco con borde SOLO arriba y abajo (nunca a los costados),
                a la altura exacta del item seleccionado. Así no queda una
                barra de color sólida (bloque) sino un canal abierto blanco
                que continúa el borde del item hacia la card. */}
            <div className="flex items-start">
              <div className="relative w-[32%] shrink-0 md:w-1/4">
                <Menu
                  itemSeleccionado={itemSeleccionado}
                  onSelectItem={setItemSeleccionado}
                  coloresItems={ITEMS_MENU}
                  onMedirSeleccionado={setRectSeleccionado}
                />
              </div>

              <div className="relative w-3 shrink-0 self-stretch">
                <motion.div
                  className="pointer-events-none absolute inset-x-0 bg-tarjeta"
                  style={{
                    borderTop: `2px solid ${colorSeleccionado}`,
                    borderBottom: `2px solid ${colorSeleccionado}`,
                  }}
                  animate={{ top: rectSeleccionado.top, height: rectSeleccionado.alto }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              <div className="relative min-w-0 flex-1">
                <CardDinamica
                  itemSeleccionado={itemSeleccionado}
                  datos={datosPorItem}
                  color={colorSeleccionado}
                  mensajeSinDatos={mensajeSinDatos}
                  alturaMinima={rectSeleccionado.alturaColumna}
                />

                {/* CardDinamica ahora tiene borde izquierdo normal (coloreado)
                    en toda su altura, cerrando el contorno donde NO hay nexo.
                    Este parche blanco "abre" ese borde únicamente en el tramo
                    exacto del item seleccionado, para que se una en blanco
                    con el canal del nexo en vez de dejarlo cortado. */}
                <motion.div
                  className="pointer-events-none absolute left-0 z-20 w-1 bg-tarjeta"
                  animate={{ top: rectSeleccionado.top, height: rectSeleccionado.alto }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App

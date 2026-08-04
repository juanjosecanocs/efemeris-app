import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { addDays, subDays } from 'date-fns'
import { IoChevronBack, IoChevronForward, IoCalendar } from 'react-icons/io5'
import { getWeekOfYear, isDateAvailable, isSameDay } from '../utils/dateUtils'
import { formatoFechaLarga } from '../utils/diaCalculos'
import CalendarGrid from './CalendarGrid'

function BotonIcono({ onClick, disabled, ariaLabel, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex items-center justify-center rounded-lg p-2 text-[#6b7280] transition-colors duration-200 hover:bg-[#f3f4f6] hover:text-[#1f2937] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#6b7280]"
    >
      {children}
    </button>
  )
}

export default function Navegacion({ fechaActual, onFechaChange, datosDisponibles = { pasadas: true, futuras: 5 } }) {
  const [calendarioAnteriorAbierto, setCalendarioAnteriorAbierto] = useState(false)
  const [calendarioProximoAbierto, setCalendarioProximoAbierto] = useState(false)

  const anioActual = fechaActual.getFullYear()
  const inicioAnio = useMemo(() => new Date(anioActual, 0, 1), [anioActual])
  const finAnio = useMemo(() => new Date(anioActual, 11, 31), [anioActual])

  const weekNumber = useMemo(() => getWeekOfYear(fechaActual), [fechaActual])

  const puedeIrAnterior = fechaActual > inicioAnio
  const puedeIrProximo = fechaActual < finAnio

  const seleccionar = useCallback(
    (nuevaFecha) => {
      if (nuevaFecha < inicioAnio || nuevaFecha > finAnio) return
      onFechaChange(nuevaFecha)
    },
    [inicioAnio, finAnio, onFechaChange]
  )

  const handleDiaAnterior = useCallback(() => {
    if (puedeIrAnterior) seleccionar(subDays(fechaActual, 1))
  }, [puedeIrAnterior, fechaActual, seleccionar])

  const handleDiaProximo = useCallback(() => {
    if (puedeIrProximo) seleccionar(addDays(fechaActual, 1))
  }, [puedeIrProximo, fechaActual, seleccionar])

  const handleSelectFecha = useCallback(
    (fecha) => {
      seleccionar(fecha)
      setCalendarioAnteriorAbierto(false)
      setCalendarioProximoAbierto(false)
    },
    [seleccionar]
  )

  const handleVolverAHoy = useCallback(() => seleccionar(new Date()), [seleccionar])

  // La disponibilidad de PREDICCIÓN climática es lo único que Navegación puede
  // afirmar con certeza (viene de props); el contenido de Wikidata para fechas
  // futuras lejanas lo valida cada card con los datos reales, no acá.
  const climaDisponibleEn = useCallback(
    (fecha) => isDateAvailable(fecha, new Date(), datosDisponibles.futuras),
    [datosDisponibles.futuras]
  )

  // Solo se deshabilita el botón entero en el borde real del año (1 ene / 31
  // dic no tienen "mes anterior"/"próximo" con datos dentro del año); dentro
  // de ese rango, las flechas ← mes → del panel ya acotan la navegación.
  const calendarioAnteriorDeshabilitado = !datosDisponibles.pasadas || isSameDay(fechaActual, inicioAnio)
  const calendarioProximoDeshabilitado = isSameDay(fechaActual, finAnio)

  return (
    <div className="mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="relative flex items-center gap-1">
          <BotonIcono onClick={handleDiaAnterior} disabled={!puedeIrAnterior} ariaLabel="Día anterior">
            <IoChevronBack size={24} />
          </BotonIcono>

          <BotonIcono
            onClick={() => setCalendarioAnteriorAbierto((v) => !v)}
            disabled={calendarioAnteriorDeshabilitado}
            ariaLabel="Calendario de fechas anteriores"
          >
            <IoCalendar size={24} />
          </BotonIcono>

          <AnimatePresence>
            {calendarioAnteriorAbierto && !calendarioAnteriorDeshabilitado && (
              <CalendarGrid
                titulo="Fechas anteriores"
                mesInicial={fechaActual}
                fechaActual={fechaActual}
                onSelectFecha={handleSelectFecha}
                onCerrar={() => setCalendarioAnteriorAbierto(false)}
                disponibleFn={() => true}
                limiteInferior={inicioAnio}
                limiteSuperior={finAnio}
                alineacion="izquierda"
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-1 flex-col items-center">
          <h2 className="text-[20px] font-semibold text-[#1f2937]">{formatoFechaLarga(fechaActual)}</h2>
          <p className="text-xs text-[#9ca3af]">Semana {weekNumber} de 52</p>
          {!isSameDay(fechaActual, new Date()) && (
            <button
              onClick={handleVolverAHoy}
              className="mt-1 text-xs text-[#6366f1] underline transition-colors hover:text-[#4c1d95]"
            >
              Volver a hoy
            </button>
          )}
        </div>

        <div className="relative flex items-center gap-1">
          <AnimatePresence>
            {calendarioProximoAbierto && !calendarioProximoDeshabilitado && (
              <CalendarGrid
                titulo="Fechas próximas"
                mesInicial={fechaActual}
                fechaActual={fechaActual}
                onSelectFecha={handleSelectFecha}
                onCerrar={() => setCalendarioProximoAbierto(false)}
                disponibleFn={climaDisponibleEn}
                limiteInferior={inicioAnio}
                limiteSuperior={finAnio}
                alineacion="derecha"
              />
            )}
          </AnimatePresence>

          <BotonIcono
            onClick={() => setCalendarioProximoAbierto((v) => !v)}
            disabled={calendarioProximoDeshabilitado}
            ariaLabel="Calendario de fechas próximas"
          >
            <IoCalendar size={24} />
          </BotonIcono>

          <BotonIcono onClick={handleDiaProximo} disabled={!puedeIrProximo} ariaLabel="Día siguiente">
            <IoChevronForward size={24} />
          </BotonIcono>
        </div>
      </div>
    </div>
  )
}

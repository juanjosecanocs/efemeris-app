import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isAfter } from 'date-fns'
import { IoClose, IoChevronBack, IoChevronForward } from 'react-icons/io5'
import { getCalendarMatrix, isSameDay } from '../utils/dateUtils'
import { formatoMesAnio } from '../utils/diaCalculos'
import DateCell from './DateCell'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Panel de calendario con vista de mes completo navegable (flechas ← mes →),
// acotado a [limiteInferior, limiteSuperior] (el año con datos precalculados)
// — no una lista fija de ±30 días. El mes visible es estado local: como el
// panel se desmonta al cerrarse (ver AnimatePresence en Navegacion), cada
// apertura arranca limpia en `mesInicial` sin necesidad de sincronizarlo.
export default function CalendarGrid({
  titulo,
  mesInicial,
  fechaActual,
  onSelectFecha,
  onCerrar,
  disponibleFn,
  limiteInferior,
  limiteSuperior,
  alineacion = 'izquierda',
}) {
  const ref = useRef(null)
  const [mesVisible, setMesVisible] = useState(() => startOfMonth(mesInicial))

  useEffect(() => {
    function alClickearFuera(evento) {
      if (ref.current && !ref.current.contains(evento.target)) onCerrar()
    }
    document.addEventListener('mousedown', alClickearFuera)
    return () => document.removeEventListener('mousedown', alClickearFuera)
  }, [onCerrar])

  const semanas = useMemo(() => {
    const diasDelMes = eachDayOfInterval({ start: startOfMonth(mesVisible), end: endOfMonth(mesVisible) })
    return getCalendarMatrix(diasDelMes)
  }, [mesVisible])

  const puedeMesAnterior = !isBefore(endOfMonth(subMonths(mesVisible, 1)), limiteInferior)
  const puedeMesProximo = !isAfter(startOfMonth(addMonths(mesVisible, 1)), limiteSuperior)

  const handleMesAnterior = useCallback(() => {
    if (puedeMesAnterior) setMesVisible((m) => subMonths(m, 1))
  }, [puedeMesAnterior])

  const handleMesProximo = useCallback(() => {
    if (puedeMesProximo) setMesVisible((m) => addMonths(m, 1))
  }, [puedeMesProximo])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute top-full z-50 mt-2 w-[280px] rounded-2xl bg-tarjeta p-4 shadow-tarjeta-hover ${
        alineacion === 'izquierda' ? 'left-0' : 'right-0'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-texto-secundario">{titulo}</p>
        <button
          onClick={onCerrar}
          aria-label="Cerrar calendario"
          className="text-texto-secundario transition-colors hover:text-[#6366f1]"
        >
          <IoClose size={18} />
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={handleMesAnterior}
          disabled={!puedeMesAnterior}
          aria-label="Mes anterior"
          className="flex items-center justify-center rounded-lg p-1 text-texto-secundario transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <IoChevronBack size={16} />
        </button>
        <p className="text-sm font-semibold capitalize text-texto">{formatoMesAnio(mesVisible)}</p>
        <button
          onClick={handleMesProximo}
          disabled={!puedeMesProximo}
          aria-label="Mes siguiente"
          className="flex items-center justify-center rounded-lg p-1 text-texto-secundario transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <IoChevronForward size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="text-center text-[11px] font-semibold uppercase text-texto-secundario">
            {dia}
          </div>
        ))}
      </div>

      <div className="mt-1 max-h-[280px] space-y-1 overflow-y-auto">
        {semanas.map((semana, i) => (
          <div key={i} className="grid grid-cols-7 gap-1">
            {semana.map(({ fecha, fueraDeRango }) => {
              const fueraDeLimite = isBefore(fecha, limiteInferior) || isAfter(fecha, limiteSuperior)
              return (
                <DateCell
                  key={fecha.toISOString()}
                  fecha={fecha}
                  isSelected={!fueraDeRango && isSameDay(fecha, fechaActual)}
                  isDisabled={fueraDeRango || fueraDeLimite}
                  atenuado={!fueraDeRango && !fueraDeLimite && disponibleFn && !disponibleFn(fecha)}
                  onClick={() => onSelectFecha(fecha)}
                />
              )
            })}
          </div>
        ))}
      </div>

      <button
        onClick={onCerrar}
        className="mt-3 w-full rounded-lg bg-fondo py-1.5 text-sm font-medium text-texto-secundario transition-colors hover:text-[#6366f1]"
      >
        Cerrar
      </button>
    </motion.div>
  )
}

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { IoClose } from 'react-icons/io5'
import { getCalendarMatrix, isSameDay } from '../utils/dateUtils'
import DateCell from './DateCell'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Grilla visual de calendario (7 columnas) para un rango de fechas — no una
// lista de texto. `alineacion` decide si el modal cuelga desde el borde
// izquierdo o derecho de su botón ancla, para no desbordar el contenedor.
export default function CalendarGrid({
  titulo,
  dias,
  fechaActual,
  onSelectFecha,
  onCerrar,
  disponibleFn,
  alineacion = 'izquierda',
}) {
  const ref = useRef(null)

  useEffect(() => {
    function alClickearFuera(evento) {
      if (ref.current && !ref.current.contains(evento.target)) onCerrar()
    }
    document.addEventListener('mousedown', alClickearFuera)
    return () => document.removeEventListener('mousedown', alClickearFuera)
  }, [onCerrar])

  const semanas = getCalendarMatrix(dias)

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
        <p className="text-sm font-semibold text-texto">{titulo}</p>
        <button
          onClick={onCerrar}
          aria-label="Cerrar calendario"
          className="text-texto-secundario transition-colors hover:text-[#6366f1]"
        >
          <IoClose size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="text-center text-[11px] font-semibold uppercase text-texto-secundario">
            {dia}
          </div>
        ))}
      </div>

      <div className="mt-1 max-h-[250px] space-y-1 overflow-y-auto">
        {semanas.map((semana, i) => (
          <div key={i} className="grid grid-cols-7 gap-1">
            {semana.map(({ fecha, fueraDeRango }) => (
              <DateCell
                key={fecha.toISOString()}
                fecha={fecha}
                isSelected={!fueraDeRango && isSameDay(fecha, fechaActual)}
                isDisabled={fueraDeRango}
                atenuado={!fueraDeRango && disponibleFn && !disponibleFn(fecha)}
                onClick={() => onSelectFecha(fecha)}
              />
            ))}
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

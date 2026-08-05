import { motion } from 'framer-motion'
import IconoClima from '../icons/IconoClima'
import { entradaEscala, elevarEnHover, pulsoIcono } from '../../utils/animaciones'

export default function CardClima({ clima, ubicacion }) {
  const listo = clima.estado === 'listo'
  const tieneDatos = listo && clima.temperatura != null
  const textoUbicacion = ubicacion && [ubicacion.municipio, ubicacion.provincia].filter(Boolean).join(', ')

  return (
    <motion.section
      variants={entradaEscala}
      initial="hidden"
      animate="visible"
      whileHover={{ ...elevarEnHover.whileHover, boxShadow: 'var(--shadow-tarjeta-hover)' }}
      className="relative overflow-hidden rounded-3xl p-6 text-white shadow-tarjeta transition-shadow sm:p-8"
      style={{ background: clima.gradiente }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-white/70">Clima ahora</p>
        {textoUbicacion && (
          <p
            className="flex items-center gap-1 truncate text-xs text-white/80"
            title="Ubicación aproximada según tu GPS · Datos de ubicación © OpenStreetMap contributors"
          >
            <span aria-hidden="true">📍</span> {textoUbicacion}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p
            className="text-[56px] font-bold leading-none sm:text-[60px]"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.25)' }}
          >
            {tieneDatos ? `${Math.round(clima.temperatura)}°` : '—'}
          </p>
          {tieneDatos && clima.sensacion != null && (
            <p className="mt-2 text-sm text-white/80">Sensación {Math.round(clima.sensacion)}°C</p>
          )}
          <p className="mt-1 truncate text-base capitalize text-white/90">
            {listo ? clima.clima : 'Obteniendo clima…'}
          </p>

          {tieneDatos && (
            <div className="mt-4 flex gap-2 text-[14px] text-white/90">
              {clima.viento != null && (
                <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                  💨 {clima.viento} km/h
                </span>
              )}
              {clima.precipitacion != null && (
                <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                  💧 {clima.precipitacion}%
                </span>
              )}
            </div>
          )}
        </div>

        <motion.div className="shrink-0" animate={pulsoIcono.animate} style={{ transformOrigin: 'center' }}>
          <IconoClima tipo={clima.icono ?? 'sun'} size={112} />
        </motion.div>
      </div>
    </motion.section>
  )
}

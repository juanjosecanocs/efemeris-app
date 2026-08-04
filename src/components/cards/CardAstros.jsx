import { motion } from 'framer-motion'
import IconoClima from '../icons/IconoClima'
import IconoLuna from '../icons/IconoLuna'
import { entradaCard, elevarEnHover } from '../../utils/animaciones'

export default function CardAstros({ solLuna, clima, indice = 1 }) {
  const { faseLunar } = solLuna
  const descripcionClima = clima?.estado === 'listo' ? clima.clima : 'Cargando…'

  return (
    <motion.section
      variants={entradaCard}
      custom={indice}
      initial="hidden"
      animate="visible"
      whileHover={elevarEnHover.whileHover}
      className="grid grid-cols-2 gap-4 rounded-3xl bg-tarjeta p-6 shadow-tarjeta"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <IconoClima tipo="sun" size={28} />
          <span className="text-sm font-semibold text-texto">{solLuna.amanece}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconoClima tipo="sun" size={28} />
          <span className="text-sm font-semibold text-texto">{solLuna.atardece}</span>
        </div>
        <p className="mt-1 truncate text-xs capitalize text-texto-secundario">{descripcionClima}</p>
      </div>

      <div className="flex flex-col items-center gap-2 border-l border-black/5 text-center">
        <div className="flex items-center gap-2">
          <IconoLuna porcentaje={faseLunar.porcentaje ?? 0} creciente={faseLunar.creciente} size={28} />
          <span className="text-sm font-semibold text-texto">{faseLunar.orto ?? '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconoLuna porcentaje={faseLunar.porcentaje ?? 0} creciente={faseLunar.creciente} size={28} />
          <span className="text-sm font-semibold text-texto">{faseLunar.ocaso ?? '—'}</span>
        </div>
        <p className="mt-1 text-xs text-texto-secundario">
          {faseLunar.nombre}
          {faseLunar.porcentaje != null ? ` · ${faseLunar.porcentaje}%` : ''}
        </p>
      </div>
    </motion.section>
  )
}

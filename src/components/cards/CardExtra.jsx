import { motion } from 'framer-motion'
import { entradaCard, elevarEnHover } from '../../utils/animaciones'

export default function CardExtra({ icono, etiqueta, contenido, indice = 0 }) {
  return (
    <motion.section
      variants={entradaCard}
      custom={indice}
      initial="hidden"
      animate="visible"
      whileHover={elevarEnHover.whileHover}
      className="rounded-2xl bg-tarjeta p-5 shadow-tarjeta"
    >
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-texto-secundario">
        <span className="text-base leading-none">{icono}</span> {etiqueta}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-texto-descripcion">{contenido || 'Sin datos'}</p>
    </motion.section>
  )
}

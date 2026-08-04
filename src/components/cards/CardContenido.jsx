import { motion, AnimatePresence } from 'framer-motion'
import { entradaCard, elevarEnHover } from '../../utils/animaciones'

const ESTILOS = {
  personaje: {
    gradiente: 'from-[#a18cd1] to-[#fbc2eb]',
    texto: 'text-white',
    borde: 'border-[#7c3aed]/30',
  },
  efemeride: {
    gradiente: 'from-[#f6d365] to-[#fda085]',
    texto: 'text-[#2c3e50]',
    borde: 'border-[#ea580c]/30',
  },
  cita: {
    gradiente: 'from-[#667eea] to-[#764ba2]',
    texto: 'text-white',
    borde: 'border-[#4338ca]/30',
  },
}

// Fondo ilustrado (SVG, no fotos) sutil detrás del contenido, distinto por tipo.
function FondoIlustrado({ tipo }) {
  if (tipo === 'personaje') {
    return (
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-20" viewBox="0 0 300 200">
        <circle cx="250" cy="30" r="90" fill="white" />
        <circle cx="250" cy="30" r="55" fill="none" stroke="white" strokeWidth="2" />
      </svg>
    )
  }

  if (tipo === 'efemeride') {
    return (
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-25" viewBox="0 0 300 200">
        <circle cx="255" cy="35" r="38" fill="none" stroke="#2c3e50" strokeWidth="3" />
        <line x1="255" y1="35" x2="255" y2="14" stroke="#2c3e50" strokeWidth="3" strokeLinecap="round" />
        <line x1="255" y1="35" x2="270" y2="35" stroke="#2c3e50" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }

  // cita
  return (
    <svg className="pointer-events-none absolute -right-2 -top-4 h-32 w-32 opacity-15" viewBox="0 0 100 100">
      <text x="0" y="80" fontSize="120" fontFamily="Georgia, serif" fill="white">
        “
      </text>
    </svg>
  )
}

export default function CardContenido({ tipo = 'personaje', icono, etiqueta, titulo, descripcion, indice = 0 }) {
  const { gradiente, texto, borde } = ESTILOS[tipo] ?? ESTILOS.personaje
  const clasesBase = `relative overflow-hidden rounded-3xl border bg-gradient-to-br ${gradiente} ${borde} p-6 ${texto} shadow-tarjeta sm:p-8`

  if (tipo === 'cita') {
    return (
      <motion.section
        variants={entradaCard}
        custom={indice}
        initial="hidden"
        animate="visible"
        whileHover={elevarEnHover.whileHover}
        className={clasesBase}
      >
        <FondoIlustrado tipo={tipo} />
        <p className="relative text-xs font-medium uppercase tracking-wider opacity-80">
          {icono} {etiqueta}
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={titulo}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-3 text-2xl font-semibold leading-snug sm:text-3xl"
          >
            “{titulo}”
          </motion.p>
        </AnimatePresence>
      </motion.section>
    )
  }

  return (
    <motion.section
      variants={entradaCard}
      custom={indice}
      initial="hidden"
      animate="visible"
      whileHover={elevarEnHover.whileHover}
      className={clasesBase}
    >
      <FondoIlustrado tipo={tipo} />

      <p className="relative text-xs font-medium uppercase tracking-wider opacity-80">
        {icono} {etiqueta}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={titulo}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <h2 className="mt-2 text-[26px] font-bold leading-tight sm:text-[28px]">
            {titulo || 'Sin datos'}
          </h2>
          {descripcion && <p className="mt-3 text-base leading-relaxed opacity-90">{descripcion}</p>}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  )
}

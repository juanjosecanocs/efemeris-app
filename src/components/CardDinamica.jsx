import { motion, AnimatePresence } from 'framer-motion'
import { ITEMS_MENU } from '../utils/layoutConstants'

// `datos` es el objeto completo con los 7 items del día (uno por cada entrada
// de ITEMS_MENU), cada uno normalizado a { titulo, contenido, autor? }.
// `mensajeSinDatos` es el fallback ("Información próximamente" / "Sin
// registros") que ya usa el resto de la app cuando no hay contenido real.
export default function CardDinamica({ itemSeleccionado, datos, color, mensajeSinDatos, alturaMinima }) {
  const config = ITEMS_MENU.find((item) => item.id === itemSeleccionado)
  const entrada = datos?.[itemSeleccionado] ?? {}
  const titulo = entrada.titulo || mensajeSinDatos

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={itemSeleccionado}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-l-lg rounded-r-3xl border-2 bg-tarjeta p-6 shadow-tarjeta sm:p-8"
        style={{ borderColor: color, minHeight: alturaMinima || undefined }}
      >
        <p
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
          style={{ color }}
        >
          <span aria-hidden="true">{config?.icono}</span> {config?.etiqueta}
        </p>

        <h2 className="mt-3 text-[26px] font-bold leading-tight sm:text-[28px]" style={{ color }}>
          {titulo}
        </h2>

        {entrada.contenido && (
          <p className="mt-3 text-base leading-relaxed text-texto-descripcion">{entrada.contenido}</p>
        )}

        {entrada.autor && <p className="mt-2 text-sm text-texto-secundario">— {entrada.autor}</p>}

        {entrada.wikidataUrl && (
          <a
            href={entrada.wikidataUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Abre el artículo en Wikidata (nueva pestaña)"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-all duration-200 hover:translate-x-0.5 hover:shadow-md sm:w-auto"
            style={{ borderColor: color, color }}
          >
            <span aria-hidden="true">📖</span> Ver en Wikidata →
          </a>
        )}
      </motion.section>
    </AnimatePresence>
  )
}

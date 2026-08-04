// Definiciones de movimiento (Framer Motion) reutilizadas por las cards de Efeméris.

export const entradaCard = {
  hidden: { opacity: 0, y: 28 },
  visible: (indice = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: indice * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
}

// Fade + scale (usada por CardClima en lugar del fade + slide-up genérico).
export const entradaEscala = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

export const elevarEnHover = {
  whileHover: { y: -4, transition: { duration: 0.2, ease: 'easeOut' } },
  whileTap: { y: -1, transition: { duration: 0.1 } },
}

export const pulsoIcono = {
  animate: {
    scale: [1, 1.02, 1],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
}

// Slide horizontal al cambiar de día. `direccion` es +1 (próximo) o -1 (anterior).
export const transicionDia = {
  enter: (direccion) => ({ x: direccion >= 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: (direccion) => ({
    x: direccion >= 0 ? -48 : 48,
    opacity: 0,
    transition: { duration: 0.25, ease: 'easeIn' },
  }),
}

import { motion } from 'framer-motion'

// Silueta de luna con la fracción iluminada aproximada (curva del terminador),
// dibujada como path SVG — no es una imagen, se calcula a partir del % de fase.
export default function IconoLuna({ porcentaje = 50, creciente = true, size = 64 }) {
  const R = 30
  const cx = 50
  const cy = 50
  const fraccion = Math.min(Math.max(porcentaje / 100, 0), 1)
  const rx = R * Math.abs(1 - 2 * fraccion)
  const sweepExterior = creciente ? 1 : 0
  const sweepInterior = fraccion < 0.5 ? (creciente ? 0 : 1) : (creciente ? 1 : 0)

  const d = `M ${cx},${cy - R} A ${R},${R} 0 1 ${sweepExterior} ${cx},${cy + R} A ${rx},${R} 0 1 ${sweepInterior} ${cx},${cy - R}`

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={R} fill="#1e2126" opacity={0.85} />
      <motion.path
        d={d}
        fill="#f8fafc"
        animate={{ opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#94a3b8" strokeWidth="1" opacity={0.3} />
    </svg>
  )
}

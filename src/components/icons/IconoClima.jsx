import { motion } from 'framer-motion'

// Iconos de clima en SVG animado. `condicion` es el campo `weather[0].main` de
// OpenWeatherMap (Clear, Clouds, Rain, Drizzle, Thunderstorm, Snow, Mist/Fog/Haze).
// No se usan imágenes/fotos externas: todo se dibuja con formas + gradientes.

function Sol({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <motion.g
        style={{ transformOrigin: '50px 50px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x="47" y="4" width="6" height="16" rx="3"
            fill="#ffd66b"
            transform={`rotate(${i * 45} 50 50)`}
          />
        ))}
      </motion.g>
      <motion.circle
        cx="50" cy="50" r="24"
        fill="#ffb703"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '50px 50px' }}
      />
    </svg>
  )
}

function LunaClara({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <motion.circle
        cx="42" cy="8" r="1.6" fill="#e2e8f0"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: 0.2 }}
      />
      <motion.circle
        cx="70" cy="22" r="1.2" fill="#e2e8f0"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 2.8, repeat: Infinity, delay: 0.8 }}
      />
      <motion.circle
        cx="20" cy="30" r="1" fill="#e2e8f0"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      />
      <motion.path
        d="M62 20 A28 28 0 1 0 62 80 A22 22 0 1 1 62 20 Z"
        fill="#f1f5f9"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '50px 50px' }}
      />
    </svg>
  )
}

function Nube({ size, animarLluvia, animarNieve, animarRayo }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <motion.g
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ellipse cx="38" cy="42" rx="22" ry="16" fill="#cbd5e1" />
        <ellipse cx="60" cy="38" rx="26" ry="20" fill="#e2e8f0" />
        <ellipse cx="50" cy="52" rx="32" ry="14" fill="#f1f5f9" />
      </motion.g>

      {animarLluvia &&
        Array.from({ length: 4 }).map((_, i) => (
          <motion.line
            key={i}
            x1={30 + i * 12} y1="66" x2={26 + i * 12} y2="78"
            stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"
            animate={{ y: [0, 10], opacity: [1, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2, ease: 'easeIn' }}
          />
        ))}

      {animarNieve &&
        Array.from({ length: 4 }).map((_, i) => (
          <motion.circle
            key={i}
            cx={30 + i * 12} cy="66" r="2.5" fill="#e0f2fe"
            animate={{ y: [0, 14], opacity: [1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25, ease: 'easeIn' }}
          />
        ))}

      {animarRayo && (
        <motion.path
          d="M54 60 L44 78 L52 78 L46 94 L64 72 L55 72 Z"
          fill="#fbbf24"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
    </svg>
  )
}

function Niebla({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {[32, 46, 60, 74].map((y, i) => (
        <motion.rect
          key={y}
          x="16" y={y} width="68" height="7" rx="3.5"
          fill="#cbd5e1"
          animate={{ x: [0, i % 2 === 0 ? 6 : -6, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  )
}

// `tipo` es la clave simplificada que devuelve apiService: sun/luna/cloud/rain/storm/snow/fog
export default function IconoClima({ tipo = 'sun', size = 96 }) {
  switch (tipo) {
    case 'sun':
      return <Sol size={size} />
    case 'luna':
      return <LunaClara size={size} />
    case 'cloud':
      return <Nube size={size} />
    case 'rain':
      return <Nube size={size} animarLluvia />
    case 'storm':
      return <Nube size={size} animarLluvia animarRayo />
    case 'snow':
      return <Nube size={size} animarNieve />
    case 'fog':
      return <Niebla size={size} />
    default:
      return <Sol size={size} />
  }
}

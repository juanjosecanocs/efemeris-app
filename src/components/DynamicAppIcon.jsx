import { motion } from 'framer-motion'
import {
  determinarColorSol,
  calcularPosicionSol,
  calcularOpacidadSol,
  debeMostrarLuna,
} from '../utils/iconDynamics'

// Destello de 4 puntas (como en la imagen de referencia), no un círculo simple.
function Sparkle({ cx, cy, size, opacity = 0.9 }) {
  const escala = size / 10
  return (
    <path
      d="M0,-10 C1,-3 3,-1 10,0 C3,1 1,3 0,10 C-1,3 -3,1 -10,0 C-3,-1 -1,-3 0,-10 Z"
      fill="#FFD700"
      opacity={opacity}
      transform={`translate(${cx}, ${cy}) scale(${escala})`}
    />
  )
}

// Ícono SVG dinámico estilo "Calendar de iOS": el día cambia según la fecha,
// el sol cambia de color según el clima y se mueve en arco según la hora.
// `fecha` y `hora` representan deliberadamente "ahora" (reloj real), no la
// fecha que el usuario esté navegando en el resto de la app — ver App.jsx.
export default function DynamicAppIcon({
  fecha = new Date(),
  clima = { icono: 'sun' },
  tamano = 180,
  mostrarCirculoFondo = true,
}) {
  const dia = fecha.getDate()
  const hora = fecha.getHours()

  const colorSol = determinarColorSol(clima?.icono)
  const posicionSol = calcularPosicionSol(hora)
  const opacidadSol = calcularOpacidadSol(hora)
  const mostrarLuna = debeMostrarLuna(hora)

  return (
    <motion.svg
      width={tamano}
      height={tamano}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
    >
      <defs>
        <linearGradient id="bgGradientDay" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e90ff" />
          <stop offset="100%" stopColor="#87ceeb" />
        </linearGradient>

        <linearGradient id="bgGradientNight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a1a3a" />
          <stop offset="100%" stopColor="#1a3a5a" />
        </linearGradient>

        <radialGradient id="solGradient" cx="35%" cy="35%">
          <stop offset="0%" stopColor={colorSol} stopOpacity="1" />
          <stop offset="70%" stopColor={colorSol} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colorSol} stopOpacity="0.6" />
        </radialGradient>

        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>

      {mostrarCirculoFondo && (
        <rect
          width="200"
          height="200"
          fill={mostrarLuna ? 'url(#bgGradientNight)' : 'url(#bgGradientDay)'}
          rx="50"
          ry="50"
        />
      )}

      {/* Sol */}
      {!mostrarLuna && (
        <g opacity={opacidadSol}>
          <circle cx={posicionSol.x} cy={posicionSol.y} r="48" fill={colorSol} opacity="0.15" />
          <circle cx={posicionSol.x} cy={posicionSol.y} r="35" fill="url(#solGradient)" />
          <g stroke={colorSol} strokeWidth="3" strokeLinecap="round" opacity="0.6">
            <line x1={posicionSol.x} y1={posicionSol.y - 50} x2={posicionSol.x} y2={posicionSol.y - 65} />
            <line x1={posicionSol.x} y1={posicionSol.y + 50} x2={posicionSol.x} y2={posicionSol.y + 65} />
            <line x1={posicionSol.x - 50} y1={posicionSol.y} x2={posicionSol.x - 65} y2={posicionSol.y} />
            <line x1={posicionSol.x + 50} y1={posicionSol.y} x2={posicionSol.x + 65} y2={posicionSol.y} />
            <line
              x1={posicionSol.x - 35} y1={posicionSol.y - 35}
              x2={posicionSol.x - 46} y2={posicionSol.y - 46}
            />
            <line
              x1={posicionSol.x + 35} y1={posicionSol.y - 35}
              x2={posicionSol.x + 46} y2={posicionSol.y - 46}
            />
            <line
              x1={posicionSol.x - 35} y1={posicionSol.y + 35}
              x2={posicionSol.x - 46} y2={posicionSol.y + 46}
            />
            <line
              x1={posicionSol.x + 35} y1={posicionSol.y + 35}
              x2={posicionSol.x + 46} y2={posicionSol.y + 46}
            />
          </g>
        </g>
      )}

      {/* Luna */}
      {mostrarLuna && (
        <g>
          <circle cx="80" cy="55" r="30" fill="#E8E8E8" opacity="0.9" />
          <circle cx="90" cy="50" r="26" fill={mostrarLuna ? 'url(#bgGradientNight)' : '#0a1a3a'} opacity="0.55" />
        </g>
      )}

      {/* Destellos (fijos) */}
      <g>
        <Sparkle cx="158" cy="85" size="20" opacity="0.9" />
        <Sparkle cx="40" cy="150" size="13" opacity="0.85" />
        <Sparkle cx="172" cy="112" size="10" opacity="0.75" />
      </g>

      {/* Marco del calendario (fijo) */}
      <rect x="40" y="95" width="120" height="25" fill="#1e3a8a" rx="6" />
      <ellipse cx="55" cy="95" rx="8" ry="12" fill="#f5f5f5" />
      <ellipse cx="145" cy="95" rx="8" ry="12" fill="#f5f5f5" />

      {/* Pila de páginas detrás (efecto de bloque de calendario) */}
      <rect x="43" y="122" width="114" height="58" fill="#d6d9de" rx="4" />

      {/* Página blanca */}
      <rect x="40" y="118" width="120" height="60" fill="white" rx="4" filter="url(#shadow)" />

      {/* Esquina doblada abajo a la derecha, como en la referencia */}
      <polygon points="148,178 160,178 160,164" fill="#e2e5ea" />

      {/* Número del día (dinámico) */}
      <text
        x="100"
        y="163"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="50"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
        fill="#001a4d"
        letterSpacing="-2"
      >
        {dia}
      </text>
    </motion.svg>
  )
}

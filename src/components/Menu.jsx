import { useRef, useLayoutEffect } from 'react'
import { motion } from 'framer-motion'

// Unión visual "L-shape" con CardDinamica: el item seleccionado abre su borde
// derecho (esquinas cuadradas de ese lado) y reporta su posición/alto exacto
// al padre (`onMedirSeleccionado`), que dibuja un puente de color en el
// espacio entre columnas a esa misma altura — así el contorno se "completa"
// entre el menú y la card sin importar cuál de los 7 items esté activo.
export default function Menu({ itemSeleccionado, onSelectItem, coloresItems, onMedirSeleccionado }) {
  const refsBotones = useRef({})
  const refNav = useRef(null)

  useLayoutEffect(() => {
    const boton = refsBotones.current[itemSeleccionado]
    if (boton && refNav.current && onMedirSeleccionado) {
      // getBoundingClientRect (no offsetTop): da una distancia exacta e
      // inequívoca respecto al propio <nav>, sin depender de cuál sea su
      // offsetParent — la franja de nexo (columna hermana) usa este mismo
      // valor como `top`, y al alinearse ambas contra el tope real del
      // menú, quedan sincronizadas sin importar el item seleccionado.
      const rectNav = refNav.current.getBoundingClientRect()
      const rectBoton = boton.getBoundingClientRect()

      // También reportamos el alto total de la columna: la card necesita ser
      // al menos así de alta para que el puente siempre llegue a tocarla, sin
      // importar si el item seleccionado es el primero o el último de los 7.
      onMedirSeleccionado({
        top: rectBoton.top - rectNav.top,
        alto: rectBoton.height,
        alturaColumna: refNav.current.scrollHeight,
      })
    }
  }, [itemSeleccionado, onMedirSeleccionado, coloresItems])

  return (
    // py-2: deja un margen antes del primer item y después del último, para
    // que las esquinas redondeadas de CardDinamica tengan lugar de "curvar"
    // antes de llegar a la conexión recta con el nexo (si no, en los items
    // extremos el nexo recto choca justo con el arranque de la curva).
    <nav ref={refNav} className="flex flex-col gap-1.5 py-2">
      {coloresItems.map((item) => {
        const activo = item.id === itemSeleccionado

        return (
          <motion.button
            key={item.id}
            ref={(el) => {
              refsBotones.current[item.id] = el
            }}
            onClick={() => onSelectItem(item.id)}
            // Nada de whileHover/transform: un click ocurre con el mouse
            // encima, así que si el hover mueve el botón (aunque sea solo en
            // el estado no-activo), justo al pasar a activo puede quedar a
            // mitad de la animación de "volver a su lugar" cuando se mide su
            // posición — y esa medición desalineada queda pegada hasta el
            // próximo cambio de item. El feedback de hover ahora es solo
            // color (vía CSS), que no mueve nada y no puede desalinear nada.
            className={`relative flex items-center gap-2 overflow-hidden border px-2.5 py-2 text-left text-[13px] font-medium leading-tight transition-colors duration-300 sm:px-3 ${
              activo ? 'rounded-l-xl rounded-r-none border-r-0' : 'rounded-xl hover:bg-black/[0.03]'
            }`}
            style={
              activo
                ? { backgroundColor: `${item.color}1a`, borderColor: item.color, color: item.color }
                : { backgroundColor: 'transparent', borderColor: 'transparent', color: 'var(--color-texto-secundario)' }
            }
          >
            <span aria-hidden="true" className="shrink-0">{item.icono}</span>
            <span>{item.etiqueta}</span>
          </motion.button>
        )
      })}
    </nav>
  )
}

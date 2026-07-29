"use client"

import { useEffect, useState } from "react"

const DEFAULT_EXIT_DURATION = 200

/**
 * Mantiene un nodo montado durante su animación de salida.
 *
 * Un simple `{active && <div className="animate-in">}` solo anima la
 * entrada: al pasar `active` a `false`, React desmonta el nodo en el
 * mismo render, así que la animación de salida nunca llega a correr.
 *
 * Este hook expone `shouldRender` (si el nodo debe seguir en el DOM)
 * y `isClosing` (si está en su fase de salida), para poder aplicar
 * la clase de animación correspondiente y desmontar recién cuando
 * termina.
 *
 * @param active - si el contenido debería estar visible/expandido
 * @param exitDuration - debe coincidir con la duración real de la
 *   animación CSS de salida (ms)
 */
export function useAnimatedPresence(
  active: boolean,
  exitDuration = DEFAULT_EXIT_DURATION,
) {

  const [shouldRender, setShouldRender] = useState(active)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {

    if (active) {

      setShouldRender(true)
      setIsClosing(false)

      return

    }

    if (!shouldRender) {
      return
    }

    setIsClosing(true)

    const timeout = setTimeout(() => {

      setShouldRender(false)
      setIsClosing(false)

    }, exitDuration)

    return () => clearTimeout(timeout)

    // shouldRender no va en las deps: solo nos interesa reaccionar a
    // cambios de `active`, no reiniciar el timeout por su propio set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, exitDuration])

  return {
    shouldRender,
    isClosing,
  }

}
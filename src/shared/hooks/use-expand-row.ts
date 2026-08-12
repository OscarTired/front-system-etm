"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { clearEntityFocusParams } from "./clear-entity-focus-params"

type Props = {
  /** Id que la URL pide enfocar (taskId / projectId). */
  focusedId?: string
  setExpandedRowId: (id: string | null) => void
}

/**
 * Toggle/expand de usuario.
 * Si hay deep-link activo y el usuario abre otro row o cierra el enfocado,
 * se limpia la URL para que useFocusedRow deje de mandar.
 */
export function useExpandRow({
  focusedId,
  setExpandedRowId,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return useCallback(
    (nextId: string | null) => {
      // Local primero, SIEMPRE — setExpandedRowId es sincrónico
      // dentro de este mismo handler; el router no lo es. Si
      // limpiamos la URL antes, puede haber un render intermedio
      // donde focusedId ya se fue pero expandedRowId todavía apunta
      // al row viejo — ahí useFocusedRow lo ve como "se cerró" y lo
      // colapsa a la fuerza, produciendo el rebote al abrir otro
      // row mientras hay un deep-link activo.
      setExpandedRowId(nextId)

      if (focusedId && nextId !== focusedId) {
        clearEntityFocusParams(router, pathname, searchParams)
      }
    },
    [focusedId, setExpandedRowId, router, pathname, searchParams],
  )
}
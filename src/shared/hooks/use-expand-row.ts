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
 * Con deep-link activo, cualquier acción manual (abrir otro, cerrar el
 * enfocado, o volver a tocar el enfocado para colapsar) consume la ruta
 * para que useFocusedRow deje de mandar.
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
      setExpandedRowId(nextId)

      // Usuario toma el control: limpia taskId/projectId/focus.
      // - nextId !== focusedId → otro row o null (cerrar)
      // - nextId === focusedId no debería pasar (toggle manda null al cerrar)
      if (focusedId && nextId !== focusedId) {
        clearEntityFocusParams(router, pathname, searchParams)
      }
    },
    [focusedId, setExpandedRowId, router, pathname, searchParams],
  )
}

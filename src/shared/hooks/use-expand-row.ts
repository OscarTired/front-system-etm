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
      if (focusedId && nextId !== focusedId) {
        clearEntityFocusParams(router, pathname, searchParams)
      }
      setExpandedRowId(nextId)
    },
    [focusedId, setExpandedRowId, router, pathname, searchParams],
  )
}

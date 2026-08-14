"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { clearEntityFocusParams } from "./clear-entity-focus-params"

/**
 * Consume deep-link al cambiar de ruta (sidebar / nav).
 * No corre en el primer mount (F5 con ?taskId debe poder expandir).
 */
export function useClearFocusOnNav() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    if (prevPath.current == null) {
      prevPath.current = pathname
      return
    }
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    const has =
      searchParams.has("taskId") ||
      searchParams.has("projectId") ||
      searchParams.has("focus")
    if (has) {
      clearEntityFocusParams(router, pathname, searchParams)
    }
  }, [pathname, router, searchParams])
}

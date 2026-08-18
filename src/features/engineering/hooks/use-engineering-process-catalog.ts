"use client"

import { useMemo } from "react"

import { useStages } from "@/features/stages/hooks/use-stages"
import type { EntityIcon } from "@/shared/constants/entity-icons"
import type { EngineeringProcessCode } from "../constants/engineering-process-definitions"

export type EngineeringProcessView = {
  code: EngineeringProcessCode
  /** Nombre del stage (backend) */
  label: string
  color: string
  icon?: EntityIcon
}

/**
 * Resuelve columnas de ingeniería contra el catálogo Stage del backend.
 * Sin fallback de color: si el stage no existe, retorna null.
 */
export function useEngineeringProcessCatalog() {
  const { stages, loading } = useStages()

  const byCode = useMemo(() => {
    const map = new Map<string, EngineeringProcessView>()
    for (const s of stages) {
      if (!s.code) continue
      map.set(s.code, {
        code: s.code as EngineeringProcessCode,
        label: s.name,
        color: s.color,
        icon: s.icon,
      })
    }
    return map
  }, [stages])

  function resolve(code: EngineeringProcessCode): EngineeringProcessView | null {
    return byCode.get(code) ?? null
  }

  return { resolve, byCode, loading }
}

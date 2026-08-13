"use client"

import { useMemo } from "react"

import { useThemeStore } from "@/shared/theme"
import {
  getBadgeColors,
  type BadgeVariant,
} from "@/shared/utils/badge-colors"

/**
 * Igual que getBadgeColors, pero se re-calcula al cambiar light/dark.
 * Los estilos inline de chips no quedan "congelados" al toggle de tema.
 */
export function useBadgeColors(
  hex: string,
  variant: BadgeVariant = "subtle",
) {
  const resolved = useThemeStore(s => s.resolved)
  return useMemo(
    () => getBadgeColors(hex, variant),
    // resolved fuerza recompute cuando el tema cambia
    [hex, variant, resolved],
  )
}

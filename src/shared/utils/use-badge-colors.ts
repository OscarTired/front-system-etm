"use client"

import { useMemo } from "react"

import { useThemeStore } from "@/shared/theme"
import {
  getBadgeColors,
  type BadgeVariant,
} from "@/shared/utils/badge-colors"

/**
 * Recalcula colores al cambiar light/dark.
 * Pasa `resolved` a getBadgeColors para NO depender del DOM
 * (evita race classList vs re-render y estilos "congelados").
 */
export function useBadgeColors(
  hex: string,
  variant: BadgeVariant = "subtle",
) {
  const resolved = useThemeStore(s => s.resolved)
  return useMemo(
    () => getBadgeColors(hex, variant, resolved),
    [hex, variant, resolved],
  )
}

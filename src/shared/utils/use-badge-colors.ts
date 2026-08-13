"use client"

import { useMemo } from "react"

import { useThemeStore } from "@/shared/theme"
import {
  getBadgeColors,
  type BadgeVariant,
} from "@/shared/utils/badge-colors"

/**
 * Recompute when theme changes so getComputedStyle picks up
 * :root / .dark token values (--chip-*, --process-card-end).
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

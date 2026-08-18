"use client"

import { useBadgeColors } from "@/shared/utils/use-badge-colors"
import { cn } from "@/shared/utils/utils"
import { displayProjectCode } from "@/features/projects/utils/display-project-code"

type Props = {
  code: string
  /** Color de dominio (cliente). Nunca usar `${hex}15` a mano. */
  color?: string | null
  className?: string
  title?: string
}

/**
 * Chip de código de proyecto — un solo contrato:
 * useBadgeColors("subtle") = mismo motor que EntityChip / DynamicBadge.
 */
export function ProjectCodeChip({ code, color, className, title }: Props) {
  const badge = useBadgeColors(color || "#64748B", "subtle")

  return (
    <span
      title={title ?? code}
      className={cn(
        "shrink-0 select-none rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide",
        className,
      )}
      style={{
        backgroundColor: badge.background,
        color: badge.text,
      }}
    >
      {displayProjectCode(code)}
    </span>
  )
}

"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { useThemeStore } from "@/shared/theme"
import { getGlassSurface } from "@/shared/utils/badge-colors"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

type Row = {
  label: string
  value: ReactNode
  secondary?: string
  editable?: boolean
}

type CardProps = {
  label: string
  icon: LucideIcon
  /** Hex de dominio (proceso o color de pintura de catálogo). */
  color: string
  rows: Row[]
  size?: "default" | "large"
}

export function ProcessMiniCard({
  label,
  icon: Icon,
  color,
  rows,
  size = "default",
}: CardProps) {
  const { isMobile } = useResponsive()
  const resolved = useThemeStore(s => s.resolved)

  const glass = getGlassSurface(color, resolved)
  const titleColor = glass.text
  const labelColor = glass.textMuted
  const valueColor = glass.text
  const isLarge = size === "large"

  return (
    <div
      className={cn(
        "flex h-full select-none flex-col overflow-hidden rounded-xl",
        isLarge
          ? "justify-center gap-4 p-4"
          : isMobile
            ? "gap-2.5 p-3"
            : "min-h-36 p-3",
      )}
      style={{ background: glass.background }}
    >
      <div
        className={cn(
          "flex min-w-0 items-center justify-between gap-2",
          !isLarge && !isMobile && "mb-1.5",
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate font-bold uppercase tracking-[0.14em]",
            isLarge ? "text-xs" : "text-[10px]",
          )}
          style={{ color: titleColor }}
        >
          {label}
        </span>
        <Icon
          size={isLarge ? 20 : 15}
          className="shrink-0"
          style={{ color: titleColor }}
        />
      </div>

      {isLarge ? (
        <div className="flex min-w-0 flex-col gap-2.5">
          {rows.map(row => (
            <div
              key={row.label}
              className="flex min-w-0 items-baseline justify-between gap-2"
            >
              <p
                className="min-w-0 shrink truncate text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: labelColor }}
              >
                {row.label}
              </p>
              <div
                className="min-w-0 truncate text-right text-sm font-semibold leading-tight"
                style={{ color: valueColor }}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>
      ) : isMobile ? (
        <div className="flex min-w-0 flex-col gap-2">
          {rows.map(row => (
            <div
              key={row.label}
              className="flex min-w-0 items-baseline justify-between gap-2"
            >
              <p
                className="min-w-0 shrink truncate text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: labelColor }}
              >
                {row.label}
              </p>
              <div
                className="min-w-0 truncate text-right text-xs font-semibold leading-tight"
                style={{ color: valueColor }}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid min-w-0 flex-1 content-center gap-x-3 gap-y-1.5"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(5rem, 1fr))",
          }}
        >
          {rows.map(row => (
            <div key={row.label} className="min-w-0">
              <p
                className="truncate text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: labelColor }}
              >
                {row.label}
              </p>
              <div
                className={cn(
                  "mt-0.5 min-w-0 truncate text-sm leading-tight",
                  row.editable === false ? "font-semibold" : "font-bold",
                )}
                style={{ color: valueColor }}
              >
                {row.value}
              </div>
              {row.secondary && (
                <p
                  className="mt-0.5 truncate text-[10px] leading-tight"
                  style={{ color: labelColor }}
                >
                  {row.secondary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

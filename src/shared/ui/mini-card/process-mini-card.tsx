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
          ? "justify-center gap-5 p-6"
          : isMobile
            ? "gap-3 p-4"
            : "min-h-43.5 p-5",
      )}
      style={{ background: glass.background }}
    >
      <div
        className={cn(
          "flex min-w-0 items-center justify-between gap-2",
          !isLarge && !isMobile && "mb-3",
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate font-bold uppercase tracking-[0.18em]",
            isLarge ? "text-sm" : "text-xs",
          )}
          style={{ color: titleColor }}
        >
          {label}
        </span>
        <Icon
          size={isLarge ? 26 : 20}
          className="shrink-0"
          style={{ color: titleColor }}
        />
      </div>

      {isLarge ? (
        <div className="flex min-w-0 flex-col gap-4">
          {rows.map(row => (
            <div
              key={row.label}
              className="flex min-w-0 items-baseline justify-between gap-2"
            >
              <p
                className="min-w-0 shrink truncate text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: labelColor }}
              >
                {row.label}
              </p>
              <div
                className="min-w-0 truncate text-right text-base font-semibold leading-tight"
                style={{ color: valueColor }}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>
      ) : isMobile ? (
        <div className="flex min-w-0 flex-col gap-2.5">
          {rows.map(row => (
            <div
              key={row.label}
              className="flex min-w-0 items-baseline justify-between gap-2"
            >
              <p
                className="min-w-0 shrink truncate text-[11px] font-bold uppercase tracking-[0.14em]"
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
      ) : (
        <div
          className="grid min-w-0 flex-1 content-center gap-x-4 gap-y-2.5"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(6.5rem, 1fr))",
          }}
        >
          {rows.map(row => (
            <div key={row.label} className="min-w-0">
              <p
                className="truncate text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: labelColor }}
              >
                {row.label}
              </p>
              <div
                className={cn(
                  "mt-1.5 min-w-0 truncate text-lg leading-tight",
                  row.editable === false ? "font-semibold" : "font-bold",
                )}
                style={{ color: valueColor }}
              >
                {row.value}
              </div>
              {row.secondary && (
                <p
                  className="mt-1 truncate text-xs leading-tight"
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
